# Code Review Checklist

Универсальный чек-лист. Используй как базовый набор проверок для любого проекта.

---

## Authentication

- [ ] **Ownership**: проверяется на сервере, ID из JWT/session, не из URL
- [ ] **RBAC**: проверка роли/прав на каждом sensitive endpoint
- [ ] **JWT validation**: проверяется `exp`, `nbf`, `aud`, `iss`, `alg`
- [ ] `alg: none` запрещён
- [ ] **Brute force**: rate limiting на login, account lockout
- [ ] **Session**: invalidation на logout, regenerate на login
- [ ] **MFA**: включена для admin/sensitive действий
- [ ] **Password reset**: требует OTP или старый пароль
- [ ] **Refresh token**: rotation, не бесконечный

---

## Authorization

- [ ] **ID в URL**: проверка owner_id == current_user_id
- [ ] **Vertical access**: user не может стать admin через API
- [ ] **Horizontal access**: user A не видит данные user B
- [ ] **Default deny**: если нет явного разрешения — доступ запрещён
- [ ] **Mass assignment**: DTO/whitelist для изменяемых полей

---

## Input Validation

### SQL Injection
- [ ] **Prepared Statements**: все запросы через параметризацию, нет конкатенации
- [ ] **createNativeQuery / rawQuery**: нет ручной сборки SQL
- [ ] **Dynamic ORDER BY**: защищён (allowlist колонок)
- [ ] **ORM**: нет конкатенации в HQL/JPQL
- [ ] **Stored Procedures**: внутри нет динамической сборки SQL
- [ ] **NoSQLi**: нет `$where`, `$regex` с пользовательским вводом

### Cross-Site Scripting (XSS)
- [ ] **Context-aware encoding**: вывод экранируется по контексту (HTML, атрибут, JS, CSS, URL)
- [ ] **innerHTML / outerHTML**: нет пользовательского ввода в этих sink
- [ ] **dangerouslySetInnerHTML**: не используется (React)
- [ ] **document.write()**: не вызывается с пользовательским вводом
- [ ] **eval()**: не вызывается с пользовательским вводом
- [ ] **Template engines**: autoescaping включён (Jinja2, Handlebars, и т.д.)
- [ ] **DOMPurify**: если HTML необходим, используется санитизация
- [ ] **CSP**: настроен, без `unsafe-inline` / `unsafe-eval`
- [ ] **HttpOnly + Secure + SameSite**: cookie защищены

### Server-Side Template Injection (SSTI)
- [ ] **SSTI**: нет `render_template_string` с пользовательским вводом
- [ ] **SSRF**: allow list для external URLs, запрещены internal IP
- [ ] **XXE**: XML парсер без external entities
- [ ] **Path traversal**: нормализация путей, запрет `..`
- [ ] **File upload**: extension whitelist, size limit, content-type проверка

---

## Cryptography & Secrets

- [ ] **Passwords**: bcrypt/Argon2id, не MD5/SHA1
- [ ] **API keys / tokens**: не в коде, в environment/vault
- [ ] **TLS**: ≥ 1.2, HSTS включён
- [ ] **Secrets in logs**: проверь, что не попадают
- [ ] **Encryption at rest**: для sensitive данных
- [ ] **Key rotation**: предусмотрена

---

## Error Handling & Logging

- [ ] **Stack traces**: не показываются пользователю
- [ ] **Generic errors**: 500 без деталей
- [ ] **Audit log**: sensitive действия логируются
- [ ] **No PII in logs**: пароли, токены, SSN не попадают в логи
- [ ] **Log injection**: пользовательский ввод не в log format string

---

## Configuration

- [ ] **CORS**: не `*`, конкретные origin
- [ ] **CSP**: Content-Security-Policy установлен
- [ ] **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- [ ] **Debug endpoints**: отключены в production
- [ ] **Environment**: `.env` не в репозитории, secrets в Vault

---

## Dependencies

- [ ] **Known vulnerabilities**: SCA scan пройден
- [ ] **Unmaintained packages**: нет abandonware
- [ ] **Lock files**: `package-lock.json`, `go.sum` закоммичены
- [ ] **Overly permissive packages**: нет лишних прав в npm/pip/go modules

---

## Infrastructure (IaC)

- [ ] **Container**: не privileged, readOnlyRootFilesystem
- [ ] **Network**: deny by default, открыты только нужные порты
- [ ] **Secrets**: не в манифестах, через External Secrets / Vault
- [ ] **IAM**: least privilege для service accounts

