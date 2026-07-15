# Authorization

## Содержание раздела

| Файл | Описание | Статус |
|------|----------|--------|
| `broken-access-control.md` | Broken Access Control — теория, root cause, типичный поток проверки, code review вопросы | ✅ Done (~70%) |
| `idor.md` | IDOR — что такое, root cause, уязвимый/безопасный код, SAST vs IDOR | ✅ Done (~80%) |
| `privilege-escalation.md` | Horizontal vs Vertical Privilege Escalation — схемы, примеры, классификация | ✅ Done (~90%) |
| `bola.md` | BOLA — Broken Object Level Authorization в контексте API, JWT vs Object Auth | ✅ Done (~90%) |
| — | RBAC vs ABAC | ⏳ План |

---

## Broken Access Control

Ключевые тезисы:

- **Authentication ≠ Authorization ≠ Object Authorization**
- Проверка роли — не проверка доступа к объекту
- Все проверки — только на backend
- Главная причина BAC: сервер доверяет ID от клиента

👉 [Читать конспект →](broken-access-control.md)

---

## IDOR (Insecure Direct Object Reference)

Ключевые тезисы:

- **IDOR — частный случай BAC**: проблема не в формате ID, а в отсутствии Object Authorization
- **Root cause**: сервер доверяет ID от клиента
- **SAST vs IDOR**: SAST может заподозрить, но не доказать — нужна ручная проверка
- **Лучшая защита**: `findByIdAndOwnerId(id, currentUser.id)` вместо `findById(id)`

👉 [Читать конспект →](idor.md)

---

## Privilege Escalation

Ключевые тезисы:

- **Horizontal PE** — доступ к чужим объектам, уровень привилегий не меняется
- **Vertical PE** — получение возможностей более высокой роли
- **IDOR → Horizontal PE** (но не каждая Horizontal PE — IDOR)
- **Как классифицировать**: BAC → IDOR? → Horizontal? → Vertical?

👉 [Читать конспект →](privilege-escalation.md)

---

## BOLA (Broken Object Level Authorization)

Ключевые тезисы:

- **API-аналог IDOR**, категория #1 в OWASP API Security Top 10
- **JWT недостаточно** — нужна отдельная проверка Object Authorization
- Object ID может быть где угодно (URL, body, headers, cookie) — важно только наличие проверки на backend
- **Лучшая защита**: `findByIdAndOwnerId(id, currentUser.id)`

👉 [Читать конспект →](bola.md)

---

## План

- [x] Broken Access Control — теория, root cause, flow проверки
- [x] IDOR — что такое, root cause, примеры кода, SAST vs IDOR
- [x] Horizontal vs Vertical Privilege Escalation
- [x] BOLA — Broken Object Level Authorization (API)
- [ ] RBAC vs ABAC
- [ ] Практика Code Review — реальные примеры
- [ ] Практический кейс — уязвимость → фикс
