# Cheatsheet: STRIDE

## 6 категорий угроз

```
S — Spoofing        → "Можно ли выдать себя за другого?"
T — Tampering       → "Можно ли изменить данные?"
R — Repudiation     → "Можно ли отказаться от своих действий?"
I — Information Dis.→ "Можно ли увидеть лишнюю информацию?"
D — Denial of Service → "Можно ли сделать сервис недоступным?"
E — Elevation of Privilege → "Можно ли получить больше прав?"
```

## STRIDE по элементам DFD

| Элемент | S | T | R | I | D | E |
|---------|---|---|---|---|---|---|
| External Entity | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Process | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Store | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Data Flow | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |

## S — Spoofing

| Защита | Описание |
|--------|----------|
| MFA | Многофакторная аутентификация |
| Короткие Access Token | Минимизация окна атаки |
| HttpOnly + Secure Cookie | Защита от XSS + перехвата |
| Device Binding | Привязка к устройству |

## T — Tampering

| Защита | Описание |
|--------|----------|
| Never Trust the Client | Сервер сам определяет критичные поля |
| DTO | Маппинг в DTO, исключение лишних полей |
| Цифровые подписи | HMAC, JWT signature |
| Валидация бизнес-логики | Проверка на сервере |

## R — Repudiation

```
Audit Log обязательные поля:
- User ID
- Timestamp
- IP Address
- Session ID
- Action
- Result
- MFA Status
```

| Защита | Описание |
|--------|----------|
| Append-only logs | Запрет на удаление/изменение |
| Immutable storage | S3 Object Lock, blockchain |
| Цифровые подписи логов | Проверка целостности |

## I — Information Disclosure

```
❌ Entity → API (danger!)
❌ Stack trace в ответе
❌ Password hash/null в JSON
❌ Внутренние поля (salary, notes)

✅ DTO — только то, что нужно UI
✅ Минимизация ответа
✅ @JsonIgnore / @JsonProperty(access = WRITE_ONLY)
```

## D — Denial of Service

| Защита | Описание |
|--------|----------|
| Rate Limiting | N req/min |
| CAPTCHA | После N попыток |
| Backoff | Увеличивающаяся задержка |
| WAF | Фильтрация на Gateway |
| Cooldown | Пауза между запросами |

## E — Elevation of Privilege

```
Вертикальное:  User → Admin
Горизонтальное: User A → User B
```

| Защита | Описание |
|--------|----------|
| RBAC | Role-Based Access Control |
| ABAC | Attribute-Based Access Control |
| Least Privilege | Минимально необходимые права |
| Проверка каждой операции | На уровне сервиса |

## STRIDE → OWASP mapping

| STRIDE | OWASP |
|--------|-------|
| Spoofing | A07 Authentication Failures |
| Tampering | A04 Insecure Design, Mass Assignment |
| Repudiation | A09 Logging & Monitoring |
| Information Disclosure | A02 Crypto Failures, IDOR, Excessive Data |
| Denial of Service | A04 Insecure Design, Rate Limiting |
| Elevation of Privilege | A01 Broken Access Control, IDOR, BOLA |

## Чек-лист для новой функции

```
[ ] S — Можно ли подделать пользователя? (MFA, JWT, сессии)
[ ] T — Можно ли изменить данные? (серверная валидация, DTO)
[ ] R — Есть ли audit log? (кто, когда, что)
[ ] I — Не утекают ли данные? (DTO, ошибки, ответы)
[ ] D — Есть ли rate limiting? (лимиты, backoff, WAF)
[ ] E — Проверяется ли авторизация? (RBAC, проверка каждой операции)
```

## Формат записи угрозы

```markdown
| ID | STRIDE | Threat | Risk | Control | Status |
|----|--------|--------|------|---------|--------|
| TM-001 | S | Spoofing | High | MFA + JWT | Mitigated |
| TM-005 | D | No rate limit | Medium | Add limiter | In progress |
```

## CWE Mapping

| CWE | Описание | STRIDE |
|-----|----------|--------|
| CWE-287 | Improper Authentication | S |
| CWE-306 | Missing Authentication | S |
| CWE-345 | Insufficient Verification of Data Authenticity | T |
| CWE-349 | Acceptance of Extraneous Untrusted Data | T |
| CWE-778 | Insufficient Logging | R |
| CWE-200 | Exposure of Sensitive Information | I |
| CWE-400 | Uncontrolled Resource Consumption | D |
| CWE-269 | Improper Privilege Management | E |
