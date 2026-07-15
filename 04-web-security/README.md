# Web Security

> Уязвимости веб-приложений из OWASP Top 10 и не только.

---

## Содержание раздела

| Файл | Описание | Статус |
|------|----------|--------|
| `sqli.md` | SQL Injection — теория, виды, эксплуатация, защита | ✅ 100% |
| `xss.md` | Cross-Site Scripting — Reflected, Stored, DOM-based | ✅ 100% |
| `csrf.md` | CSRF — механизм атаки, CORS vs SOP vs CSRF, хранение токенов | ✅ 100% |
| `ssrf.md` | SSRF — сервер как браузер, внутренняя сеть, metadata, защита | ✅ 100% |
| — | XXE | ⏳ План |
| — | Command Injection | ⏳ План |
| — | Insecure Deserialization | ⏳ План |

---

## SQL Injection

✅ [Читать конспект →](sqli.md)

---

## XSS (Cross-Site Scripting)

✅ [Читать конспект →](xss.md)

---

## CSRF (Cross-Site Request Forgery)

Ключевые тезисы:

- **CSRF** — браузер жертвы отправляет доверенный запрос, сервер доверяет Cookie
- **CORS защищает чтение, не отправку** — CSRF работает без чтения ответа
- **JWT в localStorage** устраняет классический CSRF (HTML-форма не добавит `Authorization`)
- Современный подход: **Access Token в Memory + Refresh Token в HttpOnly Cookie**

👉 [Читать конспект →](csrf.md)

---

## SSRF (Server-Side Request Forgery)

Ключевые тезисы:

- **SSRF** — злоумышленник заставляет сервер выполнять HTTP-запросы к произвольным адресам
- **Главная опасность** — доступ к внутренней сети, `localhost`, облачным metadata (`169.254.169.254`)
- **Первый вопрос AppSec**: зачем пользователю указывать произвольный URL?
- **Allowlist > Blacklist**, проверка после DNS Resolve + каждого редиректа

👉 [Читать конспект →](ssrf.md)

---

## План

- [x] SQL Injection
- [x] XSS
- [x] CSRF
- [x] SSRF
- [ ] XXE
- [ ] Command Injection
- [ ] Insecure Deserialization

