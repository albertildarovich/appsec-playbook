# Authorization Cheatsheet (BAC / IDOR / BOLA / Privilege Escalation)

> Быстрая справка по Broken Access Control, IDOR, BOLA и Privilege Escalation.

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

## Проверка после фикса

```bash
# 1. Попробовать изменить ID в URL
curl "https://target.com/api/orders/123"
curl "https://target.com/api/orders/124"

# 2. Попробовать изменить ID в теле
curl -X PUT "https://target.com/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"id": 25, "email": "new@mail.com"}'

# 3. Попробовать admin endpoint от обычного пользователя
curl "https://target.com/admin/users" \
  -H "Cookie: session=user_session"

# 4. Проверить, возвращает ли 403 или пустой результат
# (должен быть 403, не 200 с пустым телом)
```

---

## Алгоритм классификации

```
Нарушение доступа?
  │
  ├→ Нет проверки доступа к конкретному объекту?
  │     ├→ Да → IDOR / BOLA
  │     └→ Нет → дальше
  │
  ├→ Доступ к объектам другого пользователя (тот же уровень)?
  │     ├→ Да → Horizontal Privilege Escalation
  │     └→ Нет → дальше
  │
  └→ Получены возможности более высокой роли?
        ├→ Да → Vertical Privilege Escalation
        └→ Нет → не BAC
```

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-284** | Improper Access Control |
| **CWE-285** | Improper Authorization |
| **CWE-639** | Authorization Bypass Through User-Controlled Key (IDOR) |
| **CWE-862** | Missing Authorization |
| **CWE-1220** | Insufficient Granularity of Access Control |
