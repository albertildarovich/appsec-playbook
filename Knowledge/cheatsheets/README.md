# Cheatsheets

> Быстрые справки по уязвимостям для Code Review и тестирования.

---

## Доступные cheatsheets

| Файл | Описание | Статус |
|------|----------|--------|
| `sqli.md` | SQL Injection — payload, code review, безопасные паттерны | [OK] |
| `xss.md` | XSS — payload, обход фильтров, DOM API, CSP | [OK] |
| `authorization.md` | BAC / IDOR / BOLA / PrivEsc — code review, безопасные паттерны, классификация | [OK] |
| `csrf.md` | CSRF — SameSite, CSRF-токен, Double Submit Cookie, SPA схема | [OK] |
| `ssrf.md` | SSRF — payload, allowlist, DNS resolve, redirects, egress policy | [OK] |
| `xxe.md` | XXE — payload, безопасные конфигурации, blind XXE, DoS | [OK] |
| `command-injection.md` | Command Injection — payload, безопасные паттерны, валидация | [OK] |
| `insecure-deserialization.md` | Insecure Deserialization — поиск, gadget chains, безопасные паттерны | [OK] |
| `security-misconfiguration.md` | Security Misconfiguration — endpoint'ы, заголовки, code review, защита | [OK] |
| `identification-authentication.md` | Identification & Authentication — username enum, timing, session fixation, JWT | [OK] |
| `vulnerable-components.md` | Vulnerable Components — SCA, triage, reachability, SBOM, Trivy, CI/CD | [OK] |
| `cryptographic-failures.md` | Cryptographic Failures — выбор алгоритма, Argon2, TLS, PFS, Salt/Pepper | [OK] |
| `insecure-design.md` | Insecure Design — чек-лист, Never Trust the Client, Abuse Cases | [OK] |
| `stride.md` | STRIDE — 6 категорий угроз, DFD mapping, OWASP mapping, формат записи | [OK] |
| — | Command Injection | ⏳ |

---
## План

- [x] SQL Injection
- [x] XSS
- [x] Authorization (BAC / IDOR / BOLA / PrivEsc)
- [x] CSRF
- [x] SSRF
- [x] XXE
- [x] Insecure Deserialization
- [x] Command Injection
- [x] Security Misconfiguration
- [x] Identification & Authentication Failures
- [x] Vulnerable Components
- [ ] JWT
- [ ] Docker
- [ ] Kubernetes
- [ ] OpenSSL
- [ ] Git

