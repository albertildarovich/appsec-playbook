# API Security

> **Контекст:** Безопасность REST и GraphQL API — критический навык AppSec-инженера, так как большинство современных атак идут через API.

---

## Содержание

| Тема | Конспект | Статус |
|------|----------|--------|
| REST API Security | See below | [OK] 100% |
| OWASP API Security Top 10 (2023) | See below | [OK] 100% |
| BOLA (IDOR) | [`authorization/bola.md`](../authorization/bola.md) | [OK] See authorization |
| Mass Assignment | See below | [OK] 100% |
| Rate Limiting | See below | [OK] 100% |
| GraphQL Security | See below | [OK] 100% |
| JWT | [`authentication/jwt.md`](../authentication/jwt.md) | [OK] See authentication |

---

## OWASP API Security Top 10 (2023) — краткий обзор

| # | Риск | Суть | Защита |
|---|------|------|--------|
| **API1** | Broken Object Level Authorization | Доступ к объектам другого пользователя через `/users/{id}` | BOLA-проверка: пользователь имеет право на этот объект? |
| **API2** | Broken Authentication | Слабые/отсутствующие JWT-validation, stolen tokens | Short-lived tokens, refresh rotation, JWT allowlist |
| **API3** | Broken Object Property Level Authorization | Mass Assignment: изменение полей, не предназначенных для пользователя | Allowlist полей, DTO, запрет биндинга напрямую к модели |
| **API4** | Unrestricted Resource Consumption | Отсутствие rate limiting → DoS/брутфорс/парсинг | Rate limit на endpoint/user/IP, throttle + ban |
| **API5** | Broken Function Level Authorization | Доступ к админским endpoints через подмену роли | Проверка роли на каждом endpoint, не только в UI |
| **API6** | Unrestricted Access to Sensitive Business Flows | Автоматизация бизнес-процессов (spamming, scalping) | Бизнес-логика: anti-bot, капча, лимиты на операции |
| **API7** | Server-Side Request Forgery (SSRF) | Сервер выполняет запросы к internal ресурсам | Allowlist URL, проверка после DNS resolve |
| **API8** | Security Misconfiguration | Debug endpoints, verbose errors, CORS: * | Hardened defaults, CSP, audit конфигурации |
| **API9** | Improper Inventory Management | Устаревшие/beta API без обновлений | Версионирование + deprecation, инвентаризация |
| **API10** | Unsafe Consumption of APIs | Доверие данным от third-party API → инъекции | Валидировать ответы third-party API так же как пользовательский ввод |

---

## BOLA / IDOR — главная проблема API

**BOLA** (Broken Object Level Authorization) = **IDOR** (Insecure Direct Object Reference).

**Паттерн уязвимости:** Пользователь меняет ID в URL и получает доступ к чужим данным.

```http
[ATTACK] GET /api/orders/12345  # Свой заказ — OK
[ATTACK] GET /api/orders/12346  # Чужой заказ — должен быть 403, но если BOLA — 200
```

**Защита:**

```python
# Правильный паттерн: всегда проверять ownership
def get_order(order_id: int, current_user: User) -> Order:
    order = Order.query.get(order_id)
    if not order:
        raise NotFound()
    if order.user_id != current_user.id:
        raise Forbidden("Access denied")  # <--- BOLA check
    return order
```

Подробнее: [`authorization/bola.md`](../authorization/bola.md).

---

## Mass Assignment — защита через DTO

**Паттерн уязвимости:** Пользователь добавляет `"role": "admin"` в JSON-тело запроса, и ORM автоматически обновляет поле.

```json
// POST /api/users/register
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "Str0ng!Pass",
  "role": "admin"           // <--- Mass Assignment
}
```

```python
# [ANTI-PATTERN] Прямой биндинг к модели
@router.post("/users")
def register(user: UserInDB):           # <--- модель БД используется как DTO
    db.add(user)                         # role="admin" сохранится в БД
    db.commit()

# [PATTERN] Явный DTO + allowlist полей
class UserCreateDTO(BaseModel):
    username: str
    email: str
    password: str
    # role НЕ присутствует в DTO → невозможно передать

@router.post("/users")
def register(dto: UserCreateDTO):
    user = User(username=dto.username, email=dto.email, password_hash=hash(dto.password))
    user.role = "user"                   # <--- роль задаётся сервером, не клиентом
    db.add(user)
    db.commit()
```

**Принцип: никогда не биндить пользовательский ввод напрямую к ORM-модели.** Использовать DTO с allowlist.

---

## Rate Limiting

| Алгоритм | Как работает | Когда использовать |
|----------|-------------|-------------------|
| **Fixed Window** | N запросов за окно (минута/час) | Простая защита. Недостаток: burst на границе окна |
| **Sliding Window Log** | Хранить timestamp каждого запроса, считать в окне | Точный, но memory-intensive |
| **Token Bucket** | N токенов в bucket, убывает 1 за запрос, пополняется со скоростью R/sec | Лучший баланс точность/производительность |
| **Leaky Bucket** | Очередь фиксированной длины, запросы «вытекают» с постоянной скоростью | Сглаживание трафика |

**Важно:** Rate limit должен быть на уровне API Gateway (Kong/APISIX/Envoy), а не только в коде приложения.

```yaml
# Концептуальный rate-limit (Kong)
- service: orders-api
  route: /api/orders
  rate_limit:
    second: 5       # 5 req/s
    minute: 100     # 100 req/min
  per: consumer     # per user (JWT sub), per IP, per credential
```

---

## GraphQL Security — дополнительные векторы

GraphQL добавляет специфичные уязвимости поверх REST:

| Вектор | Проблема | Защита |
|--------|----------|--------|
| **Deep query** | `user { posts { comments { user { posts { ... } } } } }` — DoS | Max query depth (5-7 уровней) |
| **Alias-based batching** | 100 алиасов на один запрос → брутфорс | Rate limit + query cost analysis |
| **Introspection** | Раскрывает всю схему API | Отключить в production |
| **Field suggestion** | Ванильные ошибки: `Did you mean 'email'?` → enumeration | Отключить suggestions в production |
| **N+1 problem** | Каждый поле → отдельный запрос к БД | DataLoader (Facebook), batch-запросы |

```graphql
# [ATTACK] DoS через глубокую вложенность
query {
  users {
    orders {
      items {
        product {
          reviews {
            author {
              orders {
                # ... рекурсия
              }
            }
          }
        }
      }
    }
  }
}
```

```python
# Защита: GraphQL query analyzer (пример для graphene-django)
GRAPHENE = {
    "MIDDLEWARE": [
        "graphene_django_query_optimizer.middleware.QueryOptimizerMiddleware",
    ]
}

# Max depth через валидацию
from graphql import validate, parse
from graphql.validation import depth_limit_validator

def validate_query(query_str):
    doc = parse(query_str)
    errors = validate(schema, doc, rules=[depth_limit_validator(7)])
    if errors:
        raise GraphQLError(f"Max depth 7 exceeded: {errors}")
```

---

## Чек-лист безопасности API

- [ ] Все endpoint'ы проверяют authorization (не только аутентификацию)
- [ ] BOLA: ownership проверяется для каждого объекта по ID
- [ ] Mass Assignment: DTO с allowlist, не биндить напрямую к модели
- [ ] Rate limiting: на уровне gateway + per endpoint/user/IP
- [ ] JWT: allowlist алгоритмов, проверка iss/aud/exp, RS256/ES256
- [ ] GraphQL: ограничение depth, запрет интроспекции, query cost analysis
- [ ] OWASP API Top 10: все 10 пунктов проверяются при ревью API
- [ ] Версионирование: `/api/v1/`, `/api/v2/`, deprecation header
- [ ] Pagination: limit + offset или cursor-based, нет `GET /api/orders (all)`

---

## Полезные ссылки

- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [API1:2023 Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)