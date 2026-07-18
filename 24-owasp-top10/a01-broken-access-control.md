# A01 — Broken Access Control

> **Суть:** Приложение не проверяет, имеет ли пользователь право на запрашиваемое действие.
>
> **Ключевое:** Authentication ≠ Authorization. JWT/сессия не даёт права на любое действие.

---

## Быстрый чек-лист

- [ ] Проверяется ли ownership объекта? (`findByIdAndOwnerId` вместо `findById`)
- [ ] Проверяется ли роль на каждом endpoint (не только на UI)?
- [ ] Есть ли централизованная авторизация или проверки размазаны по контроллерам?
- [ ] Защищены ли критические поля от Mass Assignment?
- [ ] Изолированы ли данные разных tenant'ов в SaaS?

---

## Виды BAC

| Тип | Описание | Пример |
|-----|----------|--------|
| **IDOR** | Пользователь меняет ID и получает чужие данные | `GET /orders/155` вместо своего `/154` |
| **BOLA** | IDOR в REST API | `GET /api/v1/users/1002` |
| **Horizontal PE** | Доступ к данным того же уровня | User A → User B |
| **Vertical PE** | Доступ к функциям высшей роли | User → Admin |
| **Mass Assignment** | Пользователь управляет критичными полями | `{"role": "admin"}` |
| **Tenant Isolation** | Утечка между компаниями в SaaS | Company A → Company B |

---

## Защита

| Метод | Описание |
|-------|----------|
| **Централизованная авторизация** | AuthorizationService, OPA, Cedar, Zanzibar |
| **RBAC** | Роль определяет доступ (просто, но Role Explosion) |
| **ABAC** | Атрибуты + контекст определяют доступ (гибко, но сложно) |
| **DTO** | Только разрешённые поля от клиента; критические — только от сервера |
| **Ownership check** | `findByIdAndOwnerId(id, currentUser.id)` |

---

## 🔗 Полная версия

👉 [`07-authorization/broken-access-control.md`](../07-authorization/broken-access-control.md) — RBAC vs ABAC, Privilege Escalation, Mass Assignment, Tenant Isolation, централизованная авторизация, interview questions
