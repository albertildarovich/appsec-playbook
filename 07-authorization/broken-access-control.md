# Broken Access Control

> Уязвимость, возникающая, когда приложение не проверяет, имеет ли пользователь право на выполнение запрашиваемого действия.
>
> **Главная идея:** Authentication отвечает на вопрос «Кто ты?», Authorization — «Что тебе разрешено?»

---

## Authentication ≠ Authorization

Наличие валидного JWT, сессии или OAuth-токена **не означает**, что пользователь имеет право выполнять любое действие.

```java
// ❌ Проверена только аутентификация
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    // Кто ты? — проверили (JWT валиден)
    // Что тебе разрешено? — НЕ проверили
    return orderRepo.findById(id);
}
```

**Правило:** после аутентификации всегда следует авторизация.

---

## IDOR (Insecure Direct Object Reference)

### Суть

Пользователь изменяет идентификатор объекта и получает доступ к чужим данным.

```
GET /orders/154   →  200 OK   (мой заказ)
GET /orders/155   →  200 OK   (чужой заказ — IDOR!)
```

### Причина

Приложение проверило:

- ✅ Пользователь вошёл в систему

Но не проверило:

- ❌ Имеет ли он право читать **именно этот объект**

### Правильная проверка

Проверять нужно **право доступа к объекту**, а не только существование объекта.

```java
// ❌ ОПАСНО — проверяем только существование
Order order = orderRepo.findById(id);
if (order != null) {
    return order;
}

// ✅ БЕЗОПАСНО — проверяем право доступа
Order order = orderRepo.findByIdAndOwnerId(id, currentUserId);
if (order != null) {
    return order;
}

// ✅ ЕЩЁ ЛУЧШЕ — через сервис авторизации
authorizationService.authorize(currentUser, order, Action.READ);
```

### На уровне БД

```sql
-- ❌ ОПАСНО — любой может запросить любой id
SELECT * FROM orders WHERE id = :id;

-- ✅ БЕЗОПАСНО — фильтр по владельцу
SELECT * FROM orders WHERE id = :id AND owner_id = :currentUserId;
```

---

## Horizontal Privilege Escalation

Пользователь получает доступ к данным **другого пользователя того же уровня**.

```
ROLE_USER
    ↓
читает чужой заказ
    ↓
Роль не изменилась (всё ещё ROLE_USER)
```

Это IDOR, где изменяется владелец объекта, но не уровень доступа.

---

## Vertical Privilege Escalation

Пользователь получает функции **более высокой роли**.

```
ROLE_USER
    ↓
ROLE_ADMIN
    ↓
получает доступ к админ-панели
```

### Пример

```http
# Пользователь с ролью USER отправляет:
POST /admin/delete-user
Authorization: Bearer <token>
{"userId": 42}

# Сервер проверяет токен (✅), но не проверяет роль (❌)
```

### Защита

Проверять роль или атрибуты пользователя для каждого действия, требующего повышенных привилегий:

```java
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/admin/delete-user")
public void deleteUser(@RequestBody DeleteUserRequest request) {
    userService.delete(request.getUserId());
}
```

---

## BOLA (Broken Object Level Authorization)

**BOLA** — современное название IDOR в REST API.

Часто используется в **OWASP API Security Top 10** (AP1: Broken Object Level Authorization).

Фактически это тот же IDOR, но:
- Ориентирован на REST API
- Подчёркивает, что объекты часто идентифицируются через URL-параметры (`/api/v1/users/{id}`)
- Является **самой распространённой** уязвимостью в API

```http
# BOLA — злоумышленник перебирает ID
GET /api/v1/users/1001
GET /api/v1/users/1002
GET /api/v1/users/1003
```

---

## Tenant Isolation

Для **SaaS-приложений** необходимо изолировать данные разных компаний (tenant'ов).

Одна и та же ошибка может одновременно быть:

- **IDOR** — пользователь читает чужие данные
- **BOLA** — через API
- **Horizontal Privilege Escalation** — тот же уровень, другой пользователь
- **Нарушением Tenant Isolation** — пользователь компании A читает данные компании B

```sql
-- ❌ ОПАСНО — данные не изолированы по tenant
SELECT * FROM invoices WHERE id = :id;

-- ✅ БЕЗОПАСНО — фильтр по tenant
SELECT * FROM invoices WHERE id = :id AND tenant_id = :currentTenantId;
```

---

## RBAC (Role Based Access Control)

Доступ определяется **ролями**.

```
ROLE_USER     →  может читать свои заказы
ROLE_ADMIN    →  может читать все заказы, управлять пользователями
ROLE_SUPPORT  →  может читать заказы, но не управлять пользователями
```

### Преимущества

- Простая модель
- Легко внедрить
- Понятна бизнесу

### Проблема: Role Explosion

При росте системы количество ролей разрастается:

```
ROLE_USER
ROLE_USER_PREMIUM
ROLE_USER_PREMIUM_MANAGER
ROLE_USER_PREMIUM_MANAGER_EUROPE
ROLE_USER_PREMIUM_MANAGER_EUROPE_CAN_REFUND
```

Каждая комбинация прав требует новой роли. Это не масштабируется.

---

## ABAC (Attribute Based Access Control)

Доступ определяется **атрибутами**, а не только ролью.

```python
# Пример: политика ABAC
if (
    user.role == "Manager"
    and user.department == "Finance"
    and resource.type == "Report"
    and resource.region == user.region
    and device.is_corporate == True
    and network == "Office"
):
    grant_access()
```

### Что может быть атрибутами

| Категория | Примеры |
|-----------|---------|
| **Пользователь** | role, department, region, clearance level |
| **Ресурс** | type, classification, owner, tenant_id |
| **Окружение** | time, location, device, network, IP |
| **Действие** | read, write, delete, approve |

### ABAC vs RBAC

| Характеристика | RBAC | ABAC |
|---------------|------|------|
| Простота | ✅ Высокая | ❌ Низкая |
| Масштабируемость | ❌ Role explosion | ✅ Гибкие политики |
| Детализация | ✅ Роль | ✅ Атрибуты + контекст |
| Внедрение | ✅ Простое | ❌ Сложное |
| Поддержка | ❌ Сложно при росте | ✅ Легче при правильной архитектуре |

---

## Централизованная авторизация

**Проблема:** если проверки размазаны по всем контроллерам, их трудно сопровождать и легко ошибиться.

```java
// ❌ Проверки в каждом контроллере — дублирование и риск
@GetMapping("/orders/{id}")
public Order getOrder(...) {
    // проверка
    // проверка
    // проверка
}

@PostMapping("/orders")
public Order createOrder(...) {
    // те же проверки
    // те же проверки
}
```

**Решение:** централизованная авторизация.

| Инструмент | Описание |
|-----------|----------|
| **AuthorizationService** | Собственный сервис в приложении |
| **OPA (Open Policy Agent)** | Декларативные политики на Rego |
| **Cedar** | Политики от AWS (используется в AWS Verified Permissions) |
| **Keycloak Authorization** | Встроенная авторизация Keycloak |
| **Zanzibar** | Система авторизации Google (SpiceDB — open source) |

### Преимущества централизации

- ✅ Единая логика
- ✅ Меньше ошибок (не забыли проверку)
- ✅ Проще сопровождать
- ✅ Defense in Depth
- ✅ Аудит (можно логировать все решения)

---

## Mass Assignment

### Проблема

Ошибка возникает, когда пользователь может массово заполнить поля внутренней сущности.

```java
// ❌ ОПАСНО — пользователь управляет всеми полями
@PostMapping("/users")
public User createUser(@RequestBody User user) {
    return userRepo.save(user);
}
```

Хакер может отправить:

```json
{
    "name": "hacker",
    "email": "hacker@evil.com",
    "role": "ADMIN",
    "balance": 1000000,
    "status": "APPROVED"
}
```

### Защита через DTO

```java
// ✅ БЕЗОПАСНО — DTO содержит только разрешённые поля
public record CreateUserDTO(
    String name,
    String email,
    String password
) {}

@PostMapping("/users")
public User createUser(@RequestBody @Valid CreateUserDTO dto) {
    User user = new User(dto.name(), dto.email(), dto.password());
    user.setRole("USER");           // задаётся сервером
    user.setBalance(0);             // задаётся сервером
    user.setStatus("PENDING");      // задаётся сервером
    return userRepo.save(user);
}
```

### Важно: DTO — не панацея

DTO защищает только если он **содержит только разрешённые поля**. Если DTO повторяет структуру Entity — это не защита.

```java
// ❌ Бесполезный DTO — повторяет Entity
public record CreateUserDTO(
    String name,
    String email,
    String password,
    String role,     // ❌ не должно быть от клиента
    BigDecimal balance,  // ❌ не должно быть от клиента
    String status   // ❌ не должно быть от клиента
) {}
```

Критичные поля должны задаваться **только сервером**:

- `role`
- `balance`
- `status`
- `createdAt`
- `tenantId`
- `isVerified`

---

## Что любят спрашивать на интервью

| Вопрос | Ответ |
|--------|-------|
| **Чем отличается Authentication от Authorization?** | Authentication — «Кто ты?», Authorization — «Что тебе разрешено?» |
| **Почему JWT не защищает от IDOR?** | JWT подтверждает личность, но не проверяет право доступа к конкретному объекту |
| **Что такое Horizontal Privilege Escalation?** | Доступ к данным другого пользователя того же уровня |
| **Что такое Vertical Privilege Escalation?** | Доступ к функциям более высокой роли |
| **Что такое BOLA?** | IDOR для REST API (OWASP API Security Top 10) |
| **Почему проверки в контроллерах недостаточны?** | Дублирование, риск забыть, сложно сопровождать |
| **Зачем нужен Authorization Service?** | Единая логика, меньше ошибок, Defense in Depth, аудит |
| **Чем RBAC отличается от ABAC?** | RBAC — только роль; ABAC — роль + атрибуты + контекст |
| **Что такое Mass Assignment?** | Пользователь заполняет поля, которые не должен контролировать |
| **Почему DTO — не панацея?** | Если DTO повторяет Entity — это не защита |

---

## Что запомнить (коротко)

1. **Authentication ≠ Authorization** — наличие JWT/сессии не даёт права на любое действие
2. **IDOR / BOLA** — проверяй не только существование объекта, но и право доступа к нему
3. **Horizontal PE** — доступ к данным того же уровня; **Vertical PE** — доступ к функциям высшей роли
4. **Tenant Isolation** — в SaaS критична изоляция данных между компаниями
5. **RBAC** — просто, но Role Explosion; **ABAC** — гибко, но сложнее
6. **Централизованная авторизация** — AuthorizationService, OPA, Cedar, Zanzibar
7. **Mass Assignment** — DTO с только разрешёнными полями; критичные поля только от сервера

---

## Связанные темы

| Тема | Связь |
|------|-------|
| **Authentication** | JWT / сессия — необходимы, но недостаточны |
| **API Security** | BOLA — основная уязвимость REST API |
| **SaaS Security** | Tenant Isolation |
| **Policy Engines** | OPA, Cedar, Zanzibar |
| **OWASP Top 10 (A01)** | Broken Access Control |

---

## Что дальше

- [ ] **Cryptographic Failures (A02)** — следующая тема OWASP Top 10
- [ ] **Software & Data Integrity Failures (A08)**
- [ ] **Logging & Monitoring Failures (A09)**
