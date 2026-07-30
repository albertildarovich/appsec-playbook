# Playbook: Security Review

## Когда применять

- Новая фича, затрагивающая аутентификацию/авторизацию/платежи/персональные данные
- Новый микросервис или внешняя интеграция
- Перед первым production-деплоем сервиса
- Раз в квартал для критичных сервисов (ротационный review)

**Триггер:** тикет в backlog с лейблом `security-review`, назначенный на AppSec-инженера.

---

## Подготовка (до встречи с командой)

1. **Получить контекст:**
   - Какую проблему решает фича/сервис?
   - Какие данные обрабатываются (PII, платежи, credentials)?
   - Кто пользователи (внешние, внутренние, админы)?
   - Есть ли design doc / RFC / ADR?

2. **Изучить архитектуру:**
   - Диаграмма компонентов и потоков данных
   - Где хранятся данные (БД, кэш, S3)?
   - Как аутентифицируются запросы (JWT, mTLS, API key)?
   - Какие внешние сервисы задействованы?

3. **Подготовить инструменты:**
   - Ручка и бумага / Miro / Excalidraw для рисования flow
   - Шаблон threat model (STRIDE)
   - Чек-лист (см. ниже)

---

## Процесс (пошагово)

### Шаг 1: Data Flow Diagram (15 минут)

Нарисовать, как данные проходят через систему. Каждая стрелка = потенциальный вектор атаки.

```
[Клиент] --HTTPS--> [API Gateway] --gRPC--> [Auth Service] --SQL--> [PostgreSQL]
                         |
                     [Redis Cache]
                         |
                     [Payment API (external)]
```

**Вопросы на этом шаге:**
- Где пользовательский ввод входит в систему?
- Где данные пересекают trust boundary?
- Где хранятся секреты (API keys, JWT secrets)?

### Шаг 2: STRIDE-анализ (30-45 минут)

Для каждого компонента цепочки — пройти по STRIDE:

| Компонент | S (Spoofing) | T (Tampering) | R (Repudiation) | I (Info Disclosure) | D (DoS) | E (Elevation) |
|-----------|-------------|--------------|----------------|--------------------|---------|--------------|
| API Gateway | Поддельный JWT | MITM без TLS | Нет audit trail | Secrets в логах | Rate limit bypass | Bypass auth через хедеры |
| Auth Service | Brute force | SQLi в запросе | login.log на сервере | Timing attack | Connection pool exhaustion | Weak MFA bypass |
| PostgreSQL | Подключение без TLS | Прямой доступ из app network | Нет audit triggers | Незашифрованные бэкапы | Long-running queries | Excessive GRANT |

### Шаг 3: Чек-лист безопасности (20 минут)

#### Authentication
- [ ] Как аутентифицируется пользователь? (password, SSO, OIDC, mTLS)
- [ ] MFA enforced для чувствительных операций?
- [ ] Password policy (длина, complexity, breach check)?
- [ ] Brute force protection (rate limit, account lockout)?
- [ ] Session timeout (idle + absolute)?

#### Authorization
- [ ] Где проверяется доступ? (middleware, per-endpoint, per-service)
- [ ] BOLA: ownership проверяется для каждого объекта по ID?
- [ ] Есть ли функциональные роли (admin, user, auditor)?
- [ ] Что будет, если передать чужой `user_id` в параметре?

#### Input Validation
- [ ] Все входные точки валидированы (query params, body, headers)?
- [ ] Используются ли allowlists (не blacklists)?
- [ ] SQL: prepared statements / ORM с параметризацией?
- [ ] Command execution: shell не используется, ProcessBuilder с раздельными аргументами?
- [ ] File upload: проверка типа (magic bytes), лимит размера, сканирование?

#### Data Protection
- [ ] PII шифруется at rest (KMS)?
- [ ] PII шифруется in transit (TLS >= 1.2)?
- [ ] Логи не содержат паролей/токенов/PII?
- [ ] Кэш (Redis) не хранит чувствительные данные без шифрования?
- [ ] Backups зашифрованы?

#### API Security
- [ ] Rate limiting (per user, per IP, per endpoint)?
- [ ] CORS сконфигурирован (не `*` для credentialed requests)?
- [ ] Security headers: CSP, HSTS, X-Content-Type-Options?
- [ ] API versioning с deprecation policy?
- [ ] Error messages не раскрывают внутреннюю структуру?

#### Secrets Management
- [ ] Секреты не в коде, не в ENV, не в config-файлах?
- [ ] Vault / AWS Secrets Manager / K8s Secrets?
- [ ] CI/CD переменные маскированы?
- [ ] Pre-commit hook на gitleaks?

#### Logging & Monitoring
- [ ] Auth success/failure логируются?
- [ ] Изменения прав доступа логируются?
- [ ] Настроены алерты на anomaly (multiple 403, sudden traffic spike)?
- [ ] Log retention соответствует регуляторным требованиям?

### Шаг 4: Оценка рисков (10 минут)

Для каждой находки:

| Severity | Критерий | SLA fix |
|----------|----------|---------|
| **CRITICAL** | RCE, прямой доступ к prod данным извне, обход аутентификации | 24 часа |
| **HIGH** | SSRF к internal, privilege escalation, data leak | 5 рабочих дней |
| **MEDIUM** | Missing security headers, verbose errors, non-critical misconfiguration | Следующий спринт |
| **LOW** | Best practice не соблюдена, но риска прямого нет | Бэклог |

### Шаг 5: Формирование отчёта (15 минут)

Структура отчёта:

```markdown
# Security Review: [Название сервиса]

**Дата:** YYYY-MM-DD
**Команда:** [Название]
**Участники:** [Имена]
**Версия:** 1.0

## Результаты

| # | Severity | Категория | Описание | Рекомендация |
|---|----------|-----------|----------|--------------|
| 1 | HIGH | Authorization | BOLA: /api/orders/{id} не проверяет владельца | Добавить ownership check |
| 2 | MEDIUM | Logging | Пароли в дебаг-логах | Маскировать перед записью |

## Пропущенные защиты (defense-in-depth gaps)

- Нет WAF перед API Gateway
- Нет rate limiting на /api/login
- S3 bucket с логами без Object Lock (WORM)

## Рекомендации

1. [CRITICAL/HIGH] — описание, срок, ответственный
2. [MEDIUM/LOW] — описание, можно в бэклог

## Follow-up

- [ ] Повторный review через 2 недели (проверить fix)
- [ ] Внести findings в threat model
```

---

## Типичные ошибки

1. **Review без understanding контекста** — «найдите уязвимости» без понимания, что делает система. Результат: surface-level findings.
2. **Фокус только на OWASP Top 10** — бизнес-логика (API6, API7) не менее важна.
3. **Отчёт без severity и сроков** — команда не понимает, что чинить в первую очередь.
4. **Review ради scorecard'а** — «галочка поставлена, можно деплоить» без реального анализа.
5. **Не проверять фикс** — без follow-up review через 2 недели фикс может быть сделан неверно.

---

## Результат

- Отчёт в формате Markdown, ссылка на который — в тикете/Confluence
- Тикеты/задачи на исправление CRITICAL и HIGH (в текущем спринте)
- Обновлённая threat model (если затронута новая trust boundary)
- Follow-up review запланирован через 2 недели

---

## Время выполнения

- **Маленькая фича** (1 endpoint, без новых данных): 1-2 часа
- **Средний сервис** (5-10 endpoints, БД, кэш): 3-4 часа
- **Большой сервис/микросервис** (с платежами/PII): 1-2 дня