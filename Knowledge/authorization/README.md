# Authorization

> Broken Access Control — одна из самых распространённых уязвимостей. Включает IDOR, BOLA, Privilege Escalation, Mass Assignment, Tenant Isolation.

---

## Содержание раздела

| Файл | Описание | Статус |
|------|----------|--------|
| `broken-access-control.md` | BAC — главный конспект: IDOR, BOLA, PE, Tenant Isolation, RBAC vs ABAC, централизованная авторизация, Mass Assignment | [OK] 100% |
| `idor.md` | IDOR — root cause, примеры, SAST vs IDOR, защита | [OK] 100% |
| `privilege-escalation.md` | Horizontal vs Vertical PE — схемы, примеры, классификация | [OK] 100% |
| `bola.md` | BOLA — Broken Object Level Authorization, API-контекст | [OK] 100% |

---

## Broken Access Control

Ключевые тезисы:

- **Authentication ≠ Authorization** — наличие JWT/сессии не даёт права на любое действие
- **IDOR / BOLA** — проверяй не только существование объекта, но и право доступа к нему
- **Horizontal PE** — доступ к данным того же уровня; **Vertical PE** — доступ к функциям высшей роли
- **Tenant Isolation** — в SaaS критична изоляция данных между компаниями
- **RBAC** — просто, но Role Explosion; **ABAC** — гибко, но сложнее
- **Централизованная авторизация** — AuthorizationService, OPA, Cedar, Zanzibar
- **Mass Assignment** — DTO с только разрешёнными полями; критичные поля только от сервера

 [Читать конспект →](broken-access-control.md)

---

## IDOR (Insecure Direct Object Reference)

Ключевые тезисы:

- **IDOR — частный случай BAC**: проблема не в формате ID, а в отсутствии Object Authorization
- **Root cause**: сервер доверяет ID от клиента
- **SAST vs IDOR**: SAST может заподозрить, но не доказать — нужна ручная проверка
- **Лучшая защита**: `findByIdAndOwnerId(id, currentUser.id)` вместо `findById(id)`

 [Читать конспект →](idor.md)

---

## Privilege Escalation

Ключевые тезисы:

- **Horizontal PE** — доступ к чужим объектам, уровень привилегий не меняется
- **Vertical PE** — получение возможностей более высокой роли
- **IDOR → Horizontal PE** (но не каждая Horizontal PE — IDOR)
- **Как классифицировать**: BAC → IDOR? → Horizontal? → Vertical?

 [Читать конспект →](privilege-escalation.md)

---

## BOLA (Broken Object Level Authorization)

Ключевые тезисы:

- **API-аналог IDOR**, категория #1 в OWASP API Security Top 10
- **JWT недостаточно** — нужна отдельная проверка Object Authorization
- Object ID может быть где угодно (URL, body, headers, cookie) — важно только наличие проверки на backend
- **Лучшая защита**: `findByIdAndOwnerId(id, currentUser.id)`

 [Читать конспект →](bola.md)

---

## План

- [x] Broken Access Control (IDOR, BOLA, Horizontal/Vertical PE, Mass Assignment, Tenant Isolation, RBAC vs ABAC, централизованная авторизация)
- [ ] Практика Code Review — реальные примеры
- [ ] Практический кейс — уязвимость → фикс
