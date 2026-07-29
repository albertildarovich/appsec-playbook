# Модуль 6: Authorization

> **Цель:** Проверить все механизмы авторизации в Juice Shop
> **Формат:** разбираем каждую категорию по очереди

---

## План проверки

- [ ] RBAC — проверка ролей на каждом endpoint
- [ ] BOLA — Broken Object Level Authorization
- [ ] BFLA — Broken Function Level Authorization
- [ ] IDOR — подмена ID в запросах

---

## Что уже сделано

- ✅ Mass Assignment: role (создали админа)
- ✅ Mass Assignment: deluxeToken (подделали премиум)

---

## RBAC — проверка ролей

**Что проверили:**
Сравнили доступ customer vs admin к endpoint'ам:

| Endpoint | Admin | Customer | Результат |
|----------|-------|----------|-----------|
| `/api/Users` | ✅ 200 | ✅ 200 | ❌ RBAC не работает |
| `/administration` | ✅ 200 | ✅ 200 | ❌ RBAC не работает |
| `/api/Feedbacks` | ✅ 200 | ✅ 200 | ❌ RBAC не работает |

**Результат:**
- Роль `customer` может видеть всех пользователей (включая хеши паролей)
- Роль `customer` может заходить в админ-панель
- Роль `customer` может читать фидбеки
- **RBAC отсутствует на уровне сервера** — проверка роли не выполняется

**Риск:** Critical (полное отсутствие авторизации)

---

## BOLA / IDOR — Broken Object Level Authorization

**Что проверили:**
- Customer (bid=7) может прочитать корзину админа (bid=1)
- `/api/BasketItems/1` вернул данные чужой корзины

**Результат:**
- ❌ Customer может читать чужие корзины
- ❌ Нет проверки UserId vs basket ID
- Риск: Critical (IDOR)

---

## BFLA — Broken Function Level Authorization

**Что проверили:**
- Customer DELETE `/api/Feedbacks/1` → **HTTP 200** (удалил!)
- Customer DELETE `/api/Users/1` → **HTTP 401** (защищено)

**Результат:**
- ❌ Customer может удалять фидбеки (BFLA)
- ✅ Удаление пользователей защищено (но защита непоследовательна)
- Риск: High (несанкционированное удаление данных)

---

## Итого по модулю 6

| Категория | Статус | Риск |
|-----------|--------|------|
| RBAC | ❌ Отсутствует | Critical |
| BOLA/IDOR | ❌ Чужие корзины доступны по ID | Critical |
| BFLA | ❌ Customer может удалять фидбеки | High |
| Mass Assignment | ❌ role→admin, deluxeToken | Critical |
