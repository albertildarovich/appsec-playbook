# Security Review: API Gateway

## Контекст

API Gateway — единая точка входа для всех внешних клиентов (мобильное приложение, веб, партнёрские API). Маршрутизирует запросы к внутренним микросервисам, выполняет аутентификацию, авторизацию, rate limiting, логирование и мониторинг.

**Обрабатываемые данные:**
- Токены доступа (JWT, OAuth 2.0 access/refresh tokens)
- Персональные данные пользователей (ФИО, паспорт, телефон, email)
- Финансовые данные (суммы займов, графики платежей, банковские реквизиты)
- Партнёрские API-ключи

**Поток запроса:**
```
Client → [TLS] → Gateway → [mTLS] → Internal Service
                   │
                   ├── Auth Service (проверка токена)
                   ├── Rate Limiter (Redis)
                   ├── WAF (ModSecurity / Coraza)
                   └── Audit Log
```

**Ключевые свойства безопасности (CIA):**
- **Confidentiality:** все внешние соединения только TLS 1.2+, внутренние — mTLS
- **Integrity:** подпись/валидация JWT, HMAC для внутренних заголовков
- **Availability:** rate limiting, circuit breaker, защита от DDoS

---

## Угрозы (STRIDE)

### Spoofing (Подмена личности)

| Угроза | Описание |
|--------|----------|
| S1 | Подделка JWT (alg:none, HS256 vs RS256 confusion, подмена key ID) |
| S2 | Использование чужого access-токена (токен украден/утек) |
| S3 | Подделка внутренних заголовков (X-User-Id, X-Role) — если gateway доверяет заголовкам без проверки |
| S4 | Spoofing партнёрского API-ключа (слабый ключ, утечка, отсутствие ротации) |

### Tampering (Подмена данных)

| Угроза | Описание |
|--------|----------|
| T1 | Модификация JWT payload после подписи (если не проверяется подпись) |
| T2 | Подмена ID пользователя в URL/query параметрах после аутентификации |
| T3 | Модификация внутренних заголовков между gateway и upstream-сервисами |
| T4 | Replay-атака — повтор идемпотентного запроса (платёж, перевод) |

### Repudiation (Отказ от действия)

| Угроза | Описание |
|--------|----------|
| R1 | Отсутствие audit log для критических операций (создание займа, платёж) |
| R2 | Audit log не защищён от модификации backend-сервисами |
| R3 | Нет связи между access-токеном и конкретным запросом в логах |

### Information Disclosure (Раскрытие информации)

| Угроза | Описание |
|--------|----------|
| I1 | Gateway раскрывает внутреннюю инфраструктуру в заголовках ответа (Server, X-Powered-By, X-Backend) |
| I2 | Детализированные сообщения об ошибках (stack trace, internal IP) |
| I3 | Утечка чувствительных данных в логах (токены, пароли, номера карт) |
| I4 | CORS misconfiguration — слишком широкий Access-Control-Allow-Origin |

### Denial of Service (Отказ в обслуживании)

| Угроза | Описание |
|--------|----------|
| D1 | Отсутствие rate limiting → перебор API, DDoS |
| D2 | Slowloris / Slow Read — медленные клиенты исчерпывают connection pool |
| D3 | Отсутствие circuit breaker → каскадный отказ микросервисов |
| D4 | Большой payload → истощение памяти (отсутствие body size limit) |

### Elevation of Privilege (Повышение привилегий)

| Угроза | Описание |
|--------|----------|
| E1 | Горизонтальное повышение: пользователь A получает доступ к данным пользователя B (BOLA) через манипуляцию ID в запросе |
| E2 | Вертикальное повышение: пользователь с ролью `user` получает доступ к эндпоинтам `admin` |
| E3 | Эксплуатация невалидированных scope в JWT (токен с scope `read` используется для `write`) |
| E4 | Confused deputy: партнёрский API-ключ с избыточными правами |

---

## Чек-лист проверок

### Аутентификация
- [ ] Gateway **не принимает** запросы без аутентификации (кроме явно указанных public-эндпоинтов)
- [ ] Валидация JWT происходит на gateway (не делегируется upstream'у без проверки)
- [ ] Проверяется `alg` в JWT header — разрешены только RS256/ES256 (не HS256, не none)
- [ ] Проверяется `iss`, `aud`, `exp`, `nbf` каждого токена
- [ ] Access-токены имеют короткий TTL (<= 15 минут), refresh-токены — ротируются
- [ ] Партнёрские API-ключи >= 256 бит энтропии, хранятся в хешированном виде

### Авторизация
- [ ] Gateway проверяет scope/role токена **до** проксирования запроса
- [ ] ID пользователя из токена сравнивается с ID в пути запроса (BOLA-защита)
- [ ] Для эндпоинтов `admin` проверяется отдельный claim (role или scope)
- [ ] Внутренние заголовки (X-User-Id, X-Role) **не принимаются** от клиента — gateway их перезаписывает

### Rate Limiting и DoS-защита
- [ ] Rate limiting на уровне пользователя (по user_id) и IP
- [ ] Разные лимиты для разных эндпоинтов: `/auth/login` — жёстче, `/api/static` — мягче
- [ ] Настроен `client_max_body_size` / `max_request_body_size` (например, 10 MB для REST)
- [ ] Connection timeout + read timeout настроены (защита от Slowloris)
- [ ] Circuit breaker на upstream-сервисы (max failures, timeout, half-open state)

### Заголовки безопасности
- [ ] `Server`, `X-Powered-By`, `X-Backend-*` удалены из ответов
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` (или Content-Security-Policy frame-ancestors)
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] CORS: `Access-Control-Allow-Origin` содержит конкретный origin, не `*`

### Логирование и мониторинг
- [ ] Каждый запрос логируется: timestamp, user_id, method, path, status, duration
- [ ] Чувствительные данные маскируются в логах (токены, пароли, PAN)
- [ ] Audit log для критических операций (write-операции) пишется в append-only хранилище
- [ ] Алерты на аномалии: рост 4xx/5xx, превышение rate limit, новые User-Agent

### TLS и сетевая безопасность
- [ ] Внешние соединения: TLS 1.2+, strong ciphers (без CBC, без SHA-1, без 3DES)
- [ ] Внутренние соединения (gateway → upstream): mTLS или service mesh
- [ ] Сертификаты управляются автоматически (cert-manager, ACME) с ротацией до истечения
- [ ] HSTS preload (если домен в списке preload)

---

## Типичные ошибки

1. **Trusting client-supplied headers.** Gateway принимает `X-User-Id` из запроса клиента и передаёт upstream'у без проверки. Любой клиент может представиться любым пользователем.
2. **JWT validation bypass.** Проверяется только подпись, но не `alg`. Злоумышленник отправляет JWT с `"alg": "none"` и payload'ом администратора — gateway принимает.
3. **No rate limiting on auth endpoints.** `/auth/login` и `/auth/refresh` без rate limiting позволяют брутфорс паролей и токенов.
4. **Verbose error responses.** Gateway возвращает stack trace или internal IP при ошибке upstream, раскрывая инфраструктуру.
5. **CORS wildcard with credentials.** `Access-Control-Allow-Origin: *` вместе с `Access-Control-Allow-Credentials: true` — браузер блокирует, разработчик «чинит» через отключение проверки CORS.
6. **Отсутствие BOLA-проверки.** Gateway аутентифицирует, но не проверяет, что `user_id` в пути запроса совпадает с `user_id` в токене.
7. **Партнёрские API-ключи в query string.** Ключ попадает в логи веб-сервера, прокси, CDN.

---

## Безопасный паттерн

### Последовательность обработки запроса

```
1. TLS Termination
   └─ Проверка сертификата клиента (mTLS — опционально для партнёров)

2. WAF (ModSecurity / Coraza)
   └─ Блокировка известных атак (SQLi, XSS, path traversal) на уровне HTTP

3. Rate Limiter
   └─ Ключ: user_id (из токена) + IP + endpoint
   └─ Алгоритм: sliding window (Redis sorted sets) или token bucket
   └─ Возврат: 429 Too Many Requests + Retry-After

4. Authentication
   └─ Извлечение токена из Authorization: Bearer <token>
   └─ Валидация JWT: alg, iss, aud, exp, nbf, signature
   └─ Если токен невалиден → 401 Unauthorized

5. Authorization
   └─ Проверка scope/role для запрашиваемого эндпоинта
   └─ BOLA-проверка: сравнение user_id из токена с ресурсом в пути
   └─ Если нет прав → 403 Forbidden

6. Request Sanitization
   └─ Очистка входящих заголовков (удаление X-Forwarded-*, X-Real-IP от клиента)
   └─ Установка доверенных заголовков: X-User-Id, X-User-Role, X-Request-Id

7. Proxy → Upstream
   └─ mTLS до внутреннего сервиса
   └─ Таймауты: connect <= 5s, read <= 30s
   └─ Circuit breaker: 5 ошибок → разрыв → half-open через 30s

8. Response Sanitization
   └─ Удаление внутренних заголовков (Server, X-Powered-By, X-Backend-*)
   └─ Добавление security-заголовков (HSTS, X-Frame-Options, etc.)

9. Audit Log
   └─ Для write-операций: полный audit entry (who, what, when, result)
```

### Пример конфигурации (Kong / APISIX / Envoy — концептуально)

```yaml
# Концептуальный пример для API Gateway
routes:
  - name: user-profile
    path: /api/v1/users/:user_id
    methods: [GET, PUT]
    auth:
      type: jwt
      validation:
        algorithms: [RS256]
        issuer: auth.webbankir.ru
        audience: api.webbankir.ru
    authorization:
      type: scope
      required: [profile.read]  # для GET
      # required: [profile.write] — для PUT
    rate_limit:
      window: 60s
      max_requests: 100
      key: user_id
    bola_check:
      claim: sub          # user_id из JWT
      param: user_id      # параметр в пути
    upstream:
      host: user-service.internal
      port: 8443
      tls: mtls
    security_headers:
      server: ""          # удалить
      hsts: "max-age=31536000; includeSubDomains"
    body_size_limit: 10MB
```

---

## Вопросы к команде

- [ ] Как происходит ротация ключей подписи JWT? Есть ли механизм отзыва скомпрометированного ключа?
- [ ] Как обрабатывается сценарий «пользователь меняет пароль — все существующие токены должны быть отозваны»?
- [ ] Есть ли механизм обнаружения аномалий (например, пользователь залогинен из Москвы и через минуту из Владивостока)?
- [ ] Как организовано хранение rate-limit-счётчиков? Redis — что при потере данных (fail open / fail closed)?
- [ ] Как происходит деплой правил WAF? Кто ревьюит новые правила перед применением?
- [ ] Есть ли механизм graceful degradation при отказе Auth Service (gateway не может проверить токен)?
- [ ] Партнёрские API-ключи: как часто ротируются, есть ли автоматическая ротация?
- [ ] Логи: где хранятся, кто имеет доступ, как долго хранятся, защищены ли от модификации?
- [ ] Как мониторится здоровье upstream-сервисов (health checks, circuit breaker state)?
- [ ] Проходили ли нагрузочное тестирование (сколько RPS держит gateway, при каком пороге начинает деградировать)?

---

> **Приоритет критичности:** Authentication bypass (S1, S2) > Authorization bypass (E1, E2, E3) > Rate limiting bypass (D1) > Information disclosure (I1, I2, I3) > Replay attacks (T4)