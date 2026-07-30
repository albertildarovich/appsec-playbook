# Authentication

## Содержание раздела

| Файл | Описание | Статус |
|------|----------|--------|
| `identification-authentication-failures.md` | OWASP A07 — Username Enumeration, Timing, Brute Force, Session Fixation, JWT trade-offs, Risk-Based Auth | [OK] 100% |
| `jwt.md` | Структура, алгоритмы, уязвимости (alg:none, confusion, kid injection), отзыв, клиентское хранение | [OK] 100% |
| `oauth2-oidc.md` | OAuth 2.0 grant types (PKCE, Client Credentials), OIDC — ID Token, redirect_uri, state, PKCE, BFF-паттерн | [OK] 100% |

---

## Identification & Authentication Failures

Ключевые тезисы:

- **Username Enumeration** — одинаковые ответы + одинаковое время
- **Timing Attack** — даже время ответа может быть информацией
- **Brute Force** — блокировка аккаунта = DoS, нужен баланс (backoff, rate limit, CAPTCHA)
- **MFA** — наличие ≠ безопасность, SMS — не лучший вариант (SIM Swap, SS7)
- **Session Fixation** — регенерировать Session ID после логина
- **JWT** — stateless, но сложный logout и отзыв доступа
- **Refresh Token** — инвалидировать при logout / disable user
- **Risk-Based Authentication** — оценивать контекст входа (device, geo, IP)

 [Читать конспект →](identification-authentication-failures.md)

---

## План

- [x] Identification & Authentication Failures (OWASP A07)
- [x] JWT
- [x] OAuth 2.0 + OIDC
- [ ] MFA
- [ ] Password Storage
- [ ] Session Management
