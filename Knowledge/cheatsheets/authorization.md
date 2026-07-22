# Authorization Cheatsheet (BAC / IDOR / BOLA / Privilege Escalation / Mass Assignment)

> Быстрая справка по Broken Access Control, IDOR, BOLA, Privilege Escalation, Mass Assignment, RBAC/ABAC.

---

## Ключевые вопросы при Code Review

```bash
# 1. Поиск findById без проверки владельца
grep -rn "findById\|findOne\|findBy.*Id" src/ --include="*.java"
grep -rn "getById\|\.get(" src/ --include="*.py"
grep -rn "findById\|\.find\b" src/ --include="*.ts"
grep -rn "find\|first\|findBy" src/ --include="*.go"

# 2. Поиск передачи ID из URL/тела
grep -rn "@PathVariable\|@RequestParam\|@PathParam" src/ --include="*.java"
grep -rn "request.getParameter\|req.params\|req.query" src/ --include="*.js"

# 3. Поиск ID в теле запроса
grep -rn '"id":\|"userId":\|"orderId":' src/ --include="*.json" --include="*.ts"

# 4. Поиск Mass Assignment — приём Entity напрямую
grep -rn "@RequestBody.*User\|@RequestBody.*Order\|\@RequestBody.*Entity" src/ --include="*.java"
grep -rn "request.POST\|request.data\|body_parsers" src/ --include="*.py"

# 5. Поиск проверок ролей в контроллерах (размазанная логика)
grep -rn "hasRole\|hasAuthority\|@PreAuthorize\|@Secured" src/ --include="*.java"
grep -rn "user\.role ==\|user\.role !=" src/ --include="*.py" --include="*.js"

# 6. Tenant Isolation — поиск tenant_id в запросах
grep -rn "tenant_id\|tenantId\|organization_id\|company_id" src/ --include="*.java" --include="*.py"
```

---

## Типичные уязвимые паттерны

```java
// ❌ ОПАСНО — нет проверки владельца
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    return repository.findById(id);
}
```

```python
# ❌ ОПАСНО — нет проверки владельца
@app.get("/users/{user_id}")
def get_user(user_id: int):
    return db.query(User).filter(User.id == user_id).first()
```

```javascript
// ❌ ОПАСНО — нет проверки владельца
app.get('/api/profile/:id', (req, res) => {
    const profile = db.profiles.findById(req.params.id);
    res.json(profile);
});
```

### Mass Assignment

```java
// ❌ ОПАСНО — Entity напрямую от клиента
@PostMapping("/users")
public User createUser(@RequestBody User user) {
    return userRepo.save(user);  // клиент может задать role=ADMIN
}
```

---

## Безопасные паттерны

```java
// ✅ БЕЗОПАСНО — проверка владельца
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    Order order = repository.findById(id);
    if (!order.getOwnerId().equals(currentUser.getId())) {
        throw new ForbiddenException();
    }
    return order;
}

// ✅ ЕЩЁ ЛУЧШЕ — фильтрация в запросе
repository.findByIdAndOwnerId(id, currentUser.getId());

// ✅ БЕЗОПАСНО — централизованная авторизация
@PreAuthorize("hasPermission(#id, 'Order', 'READ')")
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    return repository.findById(id);
}

// ✅ Mass Assignment — DTO с только разрешёнными полями
@PostMapping("/users")
public User createUser(@RequestBody @Valid CreateUserDTO dto) {
    User user = new User(dto.name(), dto.email());
    user.setRole("USER");  // задаётся сервером
    return userRepo.save(user);
}
```

```python
# ✅ БЕЗОПАСНО — проверка владельца
@app.get("/users/{user_id}")
def get_user(user_id: int, current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if user.id != current_user.id:
        raise HTTPException(status_code=403)
    return user

# ✅ ЕЩЁ ЛУЧШЕ — фильтрация в запросе
user = db.query(User).filter(
    User.id == user_id,
    User.owner_id == current_user.id
).first()

# ✅ Mass Assignment — Pydantic схема с только разрешёнными полями
class CreateUserDTO(BaseModel):
    name: str
    email: str

@app.post("/users")
def create_user(dto: CreateUserDTO):
    user = User(name=dto.name, email=dto.email, role="USER")
    return user
```

```javascript
// ✅ БЕЗОПАСНО — проверка владельца
app.get('/api/profile/:id', authenticate, (req, res) => {
    const profile = db.profiles.findById(req.params.id);
    if (profile.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(profile);
});
```

---

## IDOR / BOLA / Privilege Escalation — классификация

```
Нарушение доступа?
  │
  ├→ Нет проверки доступа к конкретному объекту?
  │     ├→ Да → IDOR / BOLA (в REST API)
  │     └→ Нет → дальше
  │
  ├→ Доступ к объектам другого пользователя (тот же уровень)?
  │     ├→ Да → Horizontal Privilege Escalation
  │     └→ Нет → дальше
  │
  ├→ Получены возможности более высокой роли?
  │     ├→ Да → Vertical Privilege Escalation
  │     └→ Нет → дальше
  │
  ├→ Пользователь А компании X читает данные компании Y?
  │     ├→ Да → Tenant Isolation violation
  │     └→ Нет → дальше
  │
  └→ Клиент передал поля, которые должен задавать сервер?
        ├→ Да → Mass Assignment
        └→ Нет → не BAC
```

---

## RBAC vs ABAC

| Характеристика | RBAC | ABAC |
|---------------|------|------|
| Модель | Роль пользователя | Атрибуты (пользователь, ресурс, окружение) |
| Простота | ✅ Высокая | ❌ Низкая |
| Масштабируемость | ❌ Role explosion | ✅ Гибкие политики |
| Типичный пример | `hasRole('ADMIN')` | `role=Manager AND dept=Finance AND region=EU` |
| Инструменты | Spring Security, Shiro | OPA, Cedar, AuthzForce |

---

## Централизованная авторизация

```java
// ❌ Размазанные проверки — дублирование, риск забыть
@GetMapping("/orders/{id}")    // проверка
@PostMapping("/orders")         // проверка
@PutMapping("/orders/{id}")     // проверка
@DeleteMapping("/orders/{id}")  // проверка

// ✅ Централизованная авторизация
@Service
public class AuthorizationService {
    public void authorize(User user, Object resource, Action action) {
        // единая логика
        if (!policyEngine.evaluate(user, resource, action)) {
            throw new ForbiddenException();
        }
    }
}
```

---

## Tenant Isolation

```sql
-- ❌ ОПАСНО — нет фильтра по tenant
SELECT * FROM invoices WHERE id = :id;

-- ✅ БЕЗОПАСНО — фильтр по tenant
SELECT * FROM invoices WHERE id = :id AND tenant_id = :tenantId;
```

```java
// ❌ ОПАСНО — tenant_id от клиента
Long tenantId = request.getParameter("tenant_id");

// ✅ БЕЗОПАСНО — tenant_id из контекста аутентификации
Long tenantId = currentUser.getTenantId();
```

---

## Проверка после фикса

```bash
# 1. Попробовать изменить ID в URL (IDOR / BOLA)
curl "https://target.com/api/orders/123"
curl "https://target.com/api/orders/124"

# 2. Попробовать изменить ID в теле
curl -X PUT "https://target.com/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"id": 25, "email": "new@mail.com"}'

# 3. Попробовать admin endpoint от обычного пользователя (Vertical PE)
curl "https://target.com/admin/users" \
  -H "Cookie: session=user_session"

# 4. Mass Assignment — попробовать отправить лишние поля
curl -X POST "https://target.com/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","email":"test@test.com","role":"ADMIN"}'

# 5. Tenant Isolation — попробовать чужой tenant_id
curl "https://target.com/api/invoices/123?tenant_id=other_company"

# 6. Проверить, возвращает ли 403 или пустой результат
# (должен быть 403, не 200 с пустым телом)
```

---

## Типичные ошибки

| Ошибка | Почему плохо |
|--------|-------------|
| `findById()` без проверки владельца | IDOR — любой может читать чужие данные |
| `@RequestBody Entity` | Mass Assignment — клиент задаёт критичные поля |
| Проверки в каждом контроллере | Дублирование, легко забыть в новом endpoint'е |
| Нет tenant_id в запросах | Нарушение Tenant Isolation в SaaS |
| JWT считается авторизацией | JWT подтверждает только аутентификацию |
| DTO повторяет Entity | Бесполезная защита — все поля доступны клиенту |
| Только RBAC при сложной логике | Role Explosion, негибко |

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-284** | Improper Access Control |
| **CWE-285** | Improper Authorization |
| **CWE-639** | Authorization Bypass Through User-Controlled Key (IDOR) |
| **CWE-862** | Missing Authorization |
| **CWE-1220** | Insufficient Granularity of Access Control |
| **CWE-915** | Improperly Controlled Modification of Dynamically-Determined Object Attributes (Mass Assignment) |
| **CWE-269** | Improper Privilege Management |
