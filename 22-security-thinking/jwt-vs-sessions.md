# Почему JWT не решает проблему авторизации

## Типичное заблуждение

Разработчик: "Мы используем JWT, поэтому авторизация настроена."

AppSec: "JWT — это аутентификация. Авторизация — это отдельно."

## В чём разница

| | Аутентификация | Авторизация |
|---|---|---|
| Вопрос | "Кто ты?" | "Что тебе можно?" |
| JWT | ✅ Да, JWT подтверждает identity | ❌ Нет, JWT не определяет права |
| Ответ | `sub: "user123"` | `GET /api/orders/123` — имеешь ли ты право? |

## Ошибки, которые я видел

### 1. Вся авторизация — в JWT
```json
{
  "sub": "user123",
  "role": "admin",  // ❌ роль в JWT — не гарантия
  "can_do_anything": true  // ❌
}
```
Проблема: JWT подписан, но кто сказал, что роль admin актуальна? Права могли отозвать.

### 2. Проверка роли только на UI
```tsx
// ❌ ОПАСНО: скрыли кнопку, но API не защищён
{user.role === 'admin' && <DeleteButton />}
```
API endpoint должен сам проверять права.

### 3. Отсутствие проверки ownership
```python
# ❌ УЯЗВИМО: JWT показал, что это user123,
# но endpoint не проверил, что order_id принадлежит user123
@app.get('/api/orders/{order_id}')
def get_order(order_id):
    return db.query(Order).get(order_id)
```

## Как должно быть

### 1. JWT — только для аутентификации
```json
{
  "sub": "user123",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### 2. Авторизация — на каждом endpoint
```python
@app.get('/api/orders/{order_id}')
def get_order(order_id):
    current_user = get_current_user()  # из JWT
    
    # Проверка прав
    order = db.query(Order).get(order_id)
    if not order:
        abort(404)
    
    if order.owner_id != current_user.id and not current_user.is_admin:
        abort(403)
    
    return order
```

### 3. Использовать Policy Engine для сложной логики
```python
# OPA / Casbin / AWS Cedar
allowed = policy.check(
    user=current_user,
    resource=f"order:{order_id}",
    action="read"
)
```

## Вывод

JWT решает ровно одну проблему: "как подтвердить, что запрос пришёл от авторизованного пользователя?"

Всё остальное — про авторизацию — нужно строить отдельно.

Не путай аутентификацию и авторизацию. JWT — первая часть. Вторая — это политики доступа.
