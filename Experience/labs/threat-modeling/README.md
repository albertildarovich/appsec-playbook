# Threat Modeling Lab

> **Цель:** Построить модель угроз для demo-приложения: диаграмма архитектуры, STRIDE-анализ, security requirements, mitigation plan.
> **Методология:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

## Статус

[OK] Модель угроз построена.

## Демо-приложение: интернет-магазин

```
[Browser] ──HTTPS──► [Nginx/LB] ──► [Web App (Node.js)] ──► [PostgreSQL]
                          │                     │
                          │                     ├──► [Redis (session/cache)]
                          │                     │
                          │                     └──► [Payment API (Stripe)]
                          ▼
                    [Monitoring (Grafana)]
```

### Компоненты

| Компонент | Технология | Назначение |
|-----------|------------|------------|
| Browser | Chrome/FF | Клиент |
| Nginx/LB | Nginx | Обратный прокси, TLS, load balancing |
| Web App | Node.js/Express | Бизнес-логика, REST API |
| PostgreSQL | 15 | Основная БД (пользователи, заказы, товары) |
| Redis | 7 | Сессии, кэш, rate limiting |
| Payment API | Stripe | Платёжный провайдер |
| Monitoring | Grafana+Prometheus | Метрики, алерты |

### Trust Boundaries

| ID | Граница | Описание |
|----|---------|----------|
| TB#1 | Internet → Nginx | Внешний трафик, TLS termination |
| TB#2 | Nginx → Web App | Внутренняя сеть |
| TB#3 | Web App → PostgreSQL | Доступ к БД |
| TB#4 | Web App → Redis | Сессии/кэш |
| TB#5 | Web App → Stripe | Исходящий платёжный трафик |
| TB#6 | Web App → Monitoring | Метрики |

---

## STRIDE-анализ

### S — Spoofing (подмена)

| ID | Угроза | Описание | Risk | Mitigation |
|----|--------|----------|------|------------|
| S-01 | Подбор пароля (brute force) | Атакующий перебирает пароли через `/login` | HIGH | Rate limiting, lockout, MFA |
| S-02 | Подделка JWT | Уязвимость в подписи JWT (alg:none, слабый секрет) | HIGH | RS256, короткий TTL, секрет в Vault |
| S-03 | Cookie sid-угадывание | Слабый session id | MEDIUM | Случайный 128-bit sid, HttpOnly, Secure |
| S-04 | Spoofing Stripe webhook | Подделка webhook от «Stripe» | HIGH | Подпись webhook (HMAC), проверка signature |

### T — Tampering (подмена данных)

| ID | Угроза | Описание | Risk | Mitigation |
|----|--------|----------|------|------------|
| T-01 | Mass Assignment | `role`, `price` из тела запроса | HIGH | Allowlist полей, DTO |
| T-02 | SQL Injection | Конкатенация в SQL-запросы | CRITICAL | Параметризация, ORM |
| T-03 | Подмена цены | Изменение `price` в корзине/заказе | HIGH | Серверный расчёт, immutable price |
| T-04 | Prototype Pollution | Уязвимость lodash/deepmerge | MEDIUM | Обновление зависимостей, SCA |

### R — Repudiation (отказ от действий)

| ID | Угроза | Описание | Risk | Mitigation |
|----|--------|----------|------|------------|
| R-01 | Нет audit log для админ-действий | Админ изменил цену без следа | MEDIUM | Audit trail: кто, что, когда |
| R-02 | Нет лога платежей | Нельзя доказать оплату | HIGH | Логирование транзакций, order_id |
| R-03 | Нет лога failed login | Нельзя отследить атаку | MEDIUM | Логировать 401 с IP/User-Agent |

### I — Information Disclosure (раскрытие)

| ID | Угроза | Описание | Risk | Mitigation |
|----|--------|----------|------|------------|
| I-01 | IDOR: чужие заказы | `/api/orders/:id` без проверки владельца | CRITICAL | Проверка ownership, UUID |
| I-02 | Stack trace в ответе | Ошибка 500 раскрывает внутренности | MEDIUM | Generic error в production |
| I-03 | Утечка данных через логи | PII в логах (email, адреса) | MEDIUM | Scrubbing, redaction |
| I-04 | Промышленный шпионаж через `/metrics` | Prometheus endpoint открыт | MEDIUM | Auth + network policy |
| I-05 | TLS downgrade/poor cipher | Слабый cipher suite | MEDIUM | TLS 1.2+, modern ciphers |

### D — Denial of Service

| ID | Угроза | Описание | Risk | Mitigation |
|----|--------|----------|------|------------|
| D-01 | No rate limiting | Любой endpoint можно ддоcить | HIGH | Rate limiting (Redis), WAF |
| D-02 | ReDoS | Регулярки на пользовательском вводе | MEDIUM | safe-regex, timeouts |
| D-03 | Slowloris | Медленные запросы, занятые соединения | MEDIUM | Nginx timeout, limit_conn |
| D-04 | Traffic flood | DDoS на уровне сети | HIGH | CDN/WAF, autoscaling |

### E — Elevation of Privilege

| ID | Угроза | Описание | Risk | Mitigation |
|----|--------|----------|------|------------|
| E-01 | Mass Assignment → admin | `role=admin` при регистрации | CRITICAL | Allowlist, серверная роль |
| E-02 | IDOR → чужие данные | Просмотр чужих заказов | CRITICAL | Ownership check |
| E-03 | Admin endpoint без RBAC | `/admin/*` без проверки роли | HIGH | RBAC middleware |
| E-04 | SQLi → RCE | SQLi в PostgreSQL `COPY FROM PROGRAM` | CRITICAL | Параметризация |

---

## Сводка угроз

| STRIDE | CRITICAL | HIGH | MEDIUM | LOW |
|--------|----------|------|--------|-----|
| S Spoofing | 0 | 2 | 2 | 0 |
| T Tampering | 1 | 2 | 1 | 0 |
| R Repudiation | 0 | 1 | 2 | 0 |
| I Info Disclosure | 1 | 0 | 4 | 0 |
| D DoS | 0 | 2 | 2 | 0 |
| E Elevation | 2 | 1 | 0 | 0 |
| **Итого** | **4** | **8** | **11** | **0** |

---

## Top 5 угроз (приоритизация)

| # | ID | Угроза | Risk | Почему |
|---|----|--------|------|--------|
| 1 | T-02 | SQL Injection | CRITICAL | RCE/чтение всей БД, анонимно |
| 2 | E-01 | Mass Assignment → admin | CRITICAL | Полный контроль |
| 3 | E-02 | IDOR → чужие данные | CRITICAL | PII-утечка |
| 4 | E-04 | SQLi → RCE (PostgreSQL) | CRITICAL | Полная компрометация сервера |
| 5 | I-01 | IDOR заказы | CRITICAL | PII + платёжные данные |

---

## Security Requirements

### REQ-AUTH: Аутентификация

| ID | Требование | Угроза |
|----|-----------|--------|
| REQ-AUTH-01 | Пароли хэшируются bcrypt (cost >= 12) или Argon2id | S-01 |
| REQ-AUTH-02 | Rate limiting на /login (5 попыток/15 мин) | S-01, D-01 |
| REQ-AUTH-03 | MFA для admin-аккаунтов | S-01 |
| REQ-AUTH-04 | JWT подписан RS256, секрет в Vault | S-02 |
| REQ-AUTH-05 | Stripe webhook проверяется по HMAC-подписи | S-04 |
| REQ-AUTH-06 | Session cookie: HttpOnly, Secure, SameSite=Strict, 128-bit | S-03 |

### REQ-AUTHZ: Авторизация

| ID | Требование | Угроза |
|----|-----------|--------|
| REQ-AUTHZ-01 | Server-side проверка ownership для всех user-specific ресурсов | I-01, E-02 |
| REQ-AUTHZ-02 | RBAC: admin-эндпоинты только для роли admin | E-03 |
| REQ-AUTHZ-03 | Allowlist полей при создании/обновлении (DTO) | T-01, E-01 |
| REQ-AUTHZ-04 | Default deny для всех новых эндпоинтов | - |

### REQ-CRYPTO: Криптография

| ID | Требование | Угроза |
|----|-----------|--------|
| REQ-CRYPTO-01 | TLS 1.2+ с современными cipher suites | I-05 |
| REQ-CRYPTO-02 | Пароли: bcrypt/Argon2id, не MD5/SHA1 | S-01 |
| REQ-CRYPTO-03 | Платёжные данные не хранятся локально, только в Stripe | I-03 |

### REQ-INPUT: Input Validation

| ID | Требование | Угроза |
|----|-----------|--------|
| REQ-INPUT-01 | Все SQL-запросы через параметризацию/ORM | T-02, E-04 |
| REQ-INPUT-02 | Валидация всех входных данных (joi/zod) | T-02, D-02 |
| REQ-INPUT-03 | Запрет eval/child_process с пользовательским вводом | E-04 |
| REQ-INPUT-04 | Лимиты: размер тела запроса, длина строк | D-01 |

### REQ-LOG: Логирование и Мониторинг

| ID | Требование | Угроза |
|----|-----------|--------|
| REQ-LOG-01 | Audit trail: admin-действия, изменения цен | R-01 |
| REQ-LOG-02 | Логирование платежей с order_id | R-02 |
| REQ-LOG-03 | Логирование failed login (IP, UA, время) | R-03 |
| REQ-LOG-04 | Scrubbing PII из логов | I-03 |
| REQ-LOG-05 | Алерты: rate limit exceed, failed login spike, 5xx spike | D-01, R-03 |

### REQ-CONFIG: Конфигурация

| ID | Требование | Угроза |
|----|-----------|--------|
| REQ-CONFIG-01 | Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options | I-02 |
| REQ-CONFIG-02 | Nginx: timeout, limit_conn, лимит тела запроса | D-03, D-01 |
| REQ-CONFIG-03 | /metrics защищён сетевым доступом | I-04 |
| REQ-CONFIG-04 | Generic error message в production | I-02 |

---

## Mitigation Plan

### Фаза 1: Quick wins (неделя 1-2)

| # | Действие | Угроза | Оценка |
|---|----------|--------|--------|
| 1 | Параметризация всех SQL-запросов | T-02, E-04 | 2 дня |
| 2 | Allowlist полей (DTO) для пользовательских данных | T-01, E-01 | 1 день |
| 3 | Ownership check для всех user-specific эндпоинтов | I-01, E-02 | 2 дня |
| 4 | bcrypt/Argon2id вместо текущего хэширования | S-01 | 1 день |
| 5 | Rate limiting на /login и публичные API | S-01, D-01 | 1 день |

### Фаза 2: Authentication hardening (неделя 3-4)

| # | Действие | Угроза | Оценка |
|---|----------|--------|--------|
| 6 | JWT RS256 + секрет в Vault | S-02 | 1 день |
| 7 | MFA для admin | S-01 | 3 дня |
| 8 | Stripe webhook HMAC verification | S-04 | 1 день |
| 9 | Security headers + CSP | I-02 | 1 день |
| 10 | Generic error handler | I-02 | 0.5 дня |

### Фаза 3: Observability (неделя 5-6)

| # | Действие | Угроза | Оценка |
|---|----------|--------|--------|
| 11 | Audit trail для admin-действий | R-01 | 2 дня |
| 12 | Логирование failed login + платежей | R-02, R-03 | 1 день |
| 13 | Scrubbing PII из логов | I-03 | 1 день |
| 14 | Алерты на подозрительную активность | R-03, D-01 | 2 дня |

### Фаза 4: Infrastructure (месяц 2)

| # | Действие | Угроза | Оценка |
|---|----------|--------|--------|
| 15 | WAF/CDN перед Nginx | D-04 | Настройка |
| 16 | Network policy: /metrics закрыт | I-04 | 1 день |
| 17 | Nginx: timeout, limit_conn | D-03 | 1 день |
| 18 | TLS 1.2+ modern ciphers | I-05 | 0.5 дня |

---

## Метрики эффективности

| Метрика | Baseline | Цель через 3 месяца |
|---------|----------|---------------------|
| CRITICAL уязвимости | 4 | 0 |
| HIGH уязвимости | 8 | < 3 |
| Время реакции на CRITICAL | - | < 4 часа |
| Покрытие threat modeling | 0% | 100% новых сервисов |
| Security requirements | 0 | Все P0/P1 покрыты |

---

## Выводы

1. **Топ-3 угрозы для веб-приложения**: SQL Injection, Mass Assignment, IDOR — все три закрываются простыми архитектурными решениями (параметризация, DTO/allowlist, ownership check).
2. **STRIDE систематизирует мышление**: вместо «попробую что-нибудь сломать» ты проходишь по 6 категориям и не пропускаешь классы.
3. **Security requirements должны быть тестируемыми**: «SQLi через параметризацию» проверяется сканером и код-ревью, в отличие от «безопасный код».
4. **Mitigation plan — это sprint-задачи**, а не абстрактные рекомендации. Каждая угроза = задача с оценкой.
5. **Threat modeling — живой документ**: обновлять при изменении архитектуры, добавлении эндпоинтов, новых зависимостей.

---

## Связанные материалы

- [Knowledge: Threat Modeling](../../../Knowledge/threat-modeling/threat-modeling.md) — методология
- [Knowledge: STRIDE](../../../Knowledge/threat-modeling/stride.md) — категории STRIDE
- [Cheatsheet: STRIDE](../../../Knowledge/cheatsheets/stride.md) — таблица угроз
- [Juice Shop Threat Model](../../juice-shop/threat-model.md) — реальный пример
- [Engineering: Threat Modeling Checklist](../../../Engineering/checklists/threat-modeling.md) — чек-лист
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling) — официальное руководство