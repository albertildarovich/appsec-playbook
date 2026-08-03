# CWE Top 25 — Check-List

> Краткий чек-лист по CWE Top 25 (2023) с привязкой к реальным находкам в OWASP Juice Shop.
> Каждая CWE сопоставлена с находками инструментов (Semgrep, ZAP, Nuclei) и результатами ручного Code Review.

---

## Легенда

| Маркер | Значение |
|--------|----------|
| [OK] | Найдено в Juice Shop, есть привязка к реальному коду |
| [NO] | Не найдено / не представлено в Juice Shop |
| [*] | Частично покрыто (косвенная связь) |

---

## Чек-лист CWE Top 25

### Memory Safety (C/C++)

| # | CWE | Название | Статус | Находка в Juice Shop | Инструмент |
|---|-----|----------|:------:|----------------------|------------|
| 1 | [CWE-787](cheatsheets/security-misconfiguration.md) | Out-of-bounds Write | [NO] | Не применимо (TypeScript) | — |
| 4 | [CWE-416](https://cwe.mitre.org/data/definitions/416.html) | Use After Free | [NO] | Не применимо (TypeScript) | — |
| 7 | [CWE-125](https://cwe.mitre.org/data/definitions/125.html) | Out-of-bounds Read | [NO] | Не применимо (TypeScript) | — |
| 12 | [CWE-476](https://cwe.mitre.org/data/definitions/476.html) | NULL Pointer Dereference | [NO] | Не применимо (TypeScript) | — |
| 14 | [CWE-190](https://cwe.mitre.org/data/definitions/190.html) | Integer Overflow | [NO] | Не найдено | — |
| 17 | [CWE-119](https://cwe.mitre.org/data/definitions/119.html) | Buffer Overflow | [NO] | Не применимо (TypeScript) | — |
| 21 | [CWE-362](https://cwe.mitre.org/data/definitions/362.html) | Race Condition | [NO] | Не найдено | — |

### Injection (Web/API)

| # | CWE | Название | Статус | Находка в Juice Shop | Инструмент |
|---|-----|----------|:------:|----------------------|------------|
| 2 | [CWE-79](cheatsheets/xss.md) | Cross-site Scripting (XSS) | [*] | CSP Not Set (ZAP), `template-explicit-unescape`, `unknown-value-with-script-tag` (Semgrep) | ZAP, Semgrep |
| 3 | [CWE-89](cheatsheets/sqli.md) | SQL Injection | [OK] | SR-01: `routes/login.ts:34`, `routes/search.ts:23` — конкатенация email/criteria в SQL | Semgrep: `express-sequelize-injection` (6), свои правила `sqli-concat.yaml`, `sqli-taint.yaml` |
| 5 | [CWE-78](cheatsheets/command-injection.md) | OS Command Injection | [OK] | SR-04: `.github/workflows/update-challenges-*.yml` — `${{ github.ref_name }}` в shell | Semgrep: `run-shell-injection` (5), taint-правило `command-injection-taint-exec` |
| 15 | [CWE-502](cheatsheets/insecure-deserialization.md) | Deserialization of Untrusted Data | [NO] | Не найдено (JSON/Express) | — |
| 16 | [CWE-77](https://cwe.mitre.org/data/definitions/77.html) | Command Injection | [OK] | SR-04 (дублирует CWE-78 — CI/CD) | Semgrep: `run-shell-injection` (5) |
| 23 | [CWE-94](cheatsheets/command-injection.md) | Code Injection | [OK] | SR-03: `routes/captcha.ts`, `routes/userProfile.ts` — `eval()` с пользовательским вводом | Semgrep: `eval-detected` (2), `code-string-concat` (1) |

### Input Validation

| # | CWE | Название | Статус | Находка в Juice Shop | Инструмент |
|---|-----|----------|:------:|----------------------|------------|
| 6 | [CWE-20](https://cwe.mitre.org/data/definitions/20.html) | Improper Input Validation | [OK] | SR-09: `routes/order.ts:144` — отрицательный totalPrice; SR-10: `lib/insecurity.ts:133` — open redirect через `includes`; SR-15: null byte | Code Review |
| 8 | [CWE-22](cheatsheets/command-injection.md) | Path Traversal | [OK] | SR-20: `routes/fileServer.ts` — directory listing; SR-15: null byte обход | Semgrep: `express-res-sendfile` (4), `express-check-directory-listing` (4), taint-правило `path-traversal-taint-fs` |
| 10 | [CWE-434](https://cwe.mitre.org/data/definitions/434.html) | Unrestricted Upload of Dangerous File | [*] | `res.sendfile()` с пользовательским путём (Semgrep: 4 находки) — вектор file read, upload не тестировался | Semgrep |

### Authentication / Authorization

| # | CWE | Название | Статус | Находка в Juice Shop | Инструмент |
|---|-----|----------|:------:|----------------------|------------|
| 9 | [CWE-352](cheatsheets/csrf.md) | Cross-Site Request Forgery (CSRF) | [OK] | SR-16: отсутствие CSRF-токенов во всех state-changing endpoints | Semgrep: `cookies-default-express` (2) |
| 11 | [CWE-862](cheatsheets/authorization.md) | Missing Authorization | [OK] | SR-07: `routes/currentUser.ts:22-33` — чтение любого поля (password) через `fields`; SR-11: `bid` в JWT | Semgrep: `remote-property-injection` (1), Code Review |
| 13 | [CWE-287](cheatsheets/identification-authentication.md) | Improper Authentication | [OK] | SR-02: подделка JWT через хардкодный RSA-ключ; SR-06: HMAC-secret; SR-14: session fixation | Semgrep + Code Review |
| 18 | [CWE-798](cheatsheets/security-misconfiguration.md) | Use of Hard-coded Credentials | [OK] | SR-02: `lib/insecurity.ts:21` — приватный RSA-ключ; SR-06: `lib/insecurity.ts:42` — HMAC-секрет | Semgrep: `detected-private-key` (1), `hardcoded-jwt-secret` (1), `hardcoded-hmac-key` (2), `detected-generic-secret` (1) |
| 19 | [CWE-918](cheatsheets/ssrf.md) | Server-Side Request Forgery (SSRF) | [NO] | Не найдено (нет исходящих запросов к URL из ввода) | — |
| 20 | [CWE-306](https://cwe.mitre.org/data/definitions/306.html) | Missing Authentication for Critical Function | [OK] | SR-12: `routes/login.ts` — нет rate limiting (bruteforce); SR-07: `/rest/user/whoami` без проверки прав | Code Review |
| 22 | [CWE-269](https://cwe.mitre.org/data/definitions/269.html) | Improper Privilege Management | [OK] | SR-02: подделка `role` в JWT; SR-07: mass assignment на `role` | Semgrep: `remote-property-injection`, Code Review |
| 24 | [CWE-863](cheatsheets/authorization.md) | Incorrect Authorization | [OK] | SR-07: `routes/order.ts:146` — привязка заказа к чужому `UserId`; SR-11: sensitive data в JWT | Code Review |
| 25 | [CWE-276](https://cwe.mitre.org/data/definitions/276.html) | Incorrect Default Permissions | [OK] | SR-13: CORS `Access-Control-Allow-Origin: *`; SR-20: открытый directory listing `/ftp` | ZAP: Cross-Domain Misconfiguration (19), Nuclei: `/metrics`, `/swagger` |

---

## Детальная привязка: Semgrep Rules

| Semgrep Rule | CWE | Найдено | Файлы |
|--------------|-----|:-------:|-------|
| `express-sequelize-injection` | CWE-89 | 6 | `routes/login.ts`, `routes/search.ts`, codefixes |
| `run-shell-injection` | CWE-78 | 5 | `.github/workflows/update-challenges-*.yml` |
| `gha-curl-pipe-shell` | CWE-347 (связана с CWE-78) | 1 | `.github/workflows/ci.yml` |
| `detected-generic-secret` | CWE-798 | 1 | `data/static/users.yml` |
| `remote-property-injection` | CWE-915 (маппится на CWE-862/863) | 1 | `routes/currentUser.ts` |
| `code-string-concat` | CWE-94 | 1 | `routes/userProfile.ts` |
| `github-actions-mutable-action-tag` | CWE-829 (supply chain) | 7 | `ci.yml`, `codeql-analysis.yml`, `image_actions.yml` |
| `express-res-sendfile` | CWE-22 | 4 | `routes/fileServer.ts`, `keyServer.ts`, `logfileServer.ts`, `quarantineServer.ts` |
| `express-check-directory-listing` | CWE-548 (смежная с CWE-22) | 4 | `server.ts` |
| `detect-non-literal-regexp` | CWE-185 (ReDoS) | 2 | `lib/codingChallenges.ts` |
| `hardcoded-hmac-key` | CWE-798 | 2 | `lib/insecurity.ts` |
| `detected-private-key` | CWE-798 | 1 | `lib/insecurity.ts` |
| `hardcoded-jwt-secret` | CWE-798 | 1 | `lib/insecurity.ts` |
| `cookies-default-express` | CWE-614 / CWE-352 | 2 | `lib/insecurity.ts`, `routes/updateUserProfile.ts` |
| `session-fixation` | CWE-384 | 2 | `lib/insecurity.ts`, `routes/updateUserProfile.ts` |
| `eval-detected` | CWE-95 | 2 | `routes/captcha.ts`, `routes/userProfile.ts` |
| `unknown-value-with-script-tag` | CWE-79 | 2 | `routes/videoHandler.ts` |
| `template-explicit-unescape` | CWE-79 | 1 | `views/promotionVideo.pug` |
| `open-redirect` (3 правила) | CWE-601 | 3 | `routes/redirect.ts` |

**Собственные taint-правила (модуль 15):**

| Правило | CWE | Покрытие |
|---------|-----|----------|
| `sqli-taint-express` | CWE-89 | SQLi от source до sink через переменные |
| `sqli-taint-string-concat` | CWE-89 | Конкатенация строк с инъекцией |
| `command-injection-taint-exec` | CWE-78 | Command injection через `exec()` |
| `path-traversal-taint-fs` | CWE-22 | Path traversal через `fs.*` |
| `open-redirect-taint-express` | CWE-601 | Open redirect через `res.redirect()` |

---

## Детальная привязка: ZAP Findings (DAST)

| ZAP Alert | CWE | Найдено | Статус в Top 25 |
|-----------|-----|:-------:|-----------------|
| Cross-Domain Misconfiguration (CORS wildcard) | CWE-942 | 19 | Связана с CWE-276 (Incorrect Default Permissions) |
| Content Security Policy (CSP) Header Not Set | CWE-693 | 3 | Косвенная защита от CWE-79 (XSS) |
| Timestamp Disclosure - Unix | CWE-200 | 15 | Info leak (связана с CWE-20) |

---

## Детальная привязка: Nuclei Findings (DAST)

| Nuclei Template | CWE | Severity | Статус в Top 25 |
|-----------------|-----|----------|-----------------|
| `prometheus-metrics` (открыт `/metrics`) | CWE-200 | medium | Связана с CWE-276 (открытые endpoint'ы) |
| `swagger-api` | CWE-200 | info | Info disclosure |
| `http-missing-security-headers` (8 заголовков) | CWE-693 | info | Косвенная защита XSS/CWE-79 |
| `robots-txt` (раскрывает `/ftp`) | CWE-200 | info | Связана с CWE-276 |

---

## Детальная привязка: Code Review (Security Review — 20 находок)

| ID | Уязвимость | CWE | Top 25 | Severity |
|----|-----------|-----|:------:|----------|
| SR-01 | SQL Injection (login, search) | CWE-89 | [OK] #3 | [CRIT] Critical |
| SR-02 | Hardcoded Private RSA Key | CWE-798 | [OK] #18 | [CRIT] Critical |
| SR-03 | eval() Injection | CWE-95 | [OK] #23 (CWE-94) | [CRIT] Critical |
| SR-04 | Shell Injection в CI/CD | CWE-78 | [OK] #5 | [CRIT] Critical |
| SR-05 | Weak Password Hashing (MD5) | CWE-327 | [*] (CWE-287 mix) | [CRIT] High |
| SR-06 | Hardcoded HMAC Secret | CWE-798 | [OK] #18 | [CRIT] High |
| SR-07 | Mass Assignment | CWE-915 | [OK] #24 (CWE-863) | [CRIT] High |
| SR-08 | Coupon Forgery (Z85) | CWE-327 | [*] | [CRIT] High |
| SR-09 | Negative Order Total | CWE-840 | [OK] #6 (CWE-20) | [CRIT] High |
| SR-10 | Open Redirect | CWE-601 | [*] (не в Top 25) | [MED] Medium |
| SR-11 | Sensitive Data in JWT | CWE-200 | [*] (Info leak) | [MED] Medium |
| SR-12 | No Rate Limiting | CWE-307 | [OK] #20 (CWE-306 mix) | [MED] Medium |
| SR-13 | CORS Misconfiguration | CWE-942 | [OK] #25 (CWE-276) | [MED] Medium |
| SR-14 | Session Fixation | CWE-384 | [OK] #13 (CWE-287 mix) | [MED] Medium |
| SR-15 | Null Byte Injection | CWE-158 | [OK] #8 (CWE-22 mix) | [MED] Medium |
| SR-16 | No CSRF Protection | CWE-352 | [OK] #9 | [MED] Medium |
| SR-17 | Insecure Cookie Configuration | CWE-614 | [OK] #9 mix | [MED] Medium |
| SR-18 | curl \| bash в CI | CWE-347 | [OK] #16 mix (supply chain) | [MED] Medium |
| SR-19 | Mutable Action Tags | CWE-829 | [OK] supply chain | [MED] Medium |
| SR-20 | Directory Listing / Path Traversal | CWE-548 | [OK] #8 + #25 | [MED] Medium |

---

## Покрытие CWE Top 25 в Juice Shop

```
CWE Top 25 (2023)
+------------------------------------------------------------------+
| Memory Safety (C/C++)                                |  0 из 7   |
|   CWE-787 | CWE-416 | CWE-125 | CWE-476 | CWE-119   | [NO]       |
|   CWE-190 | CWE-362                                     |           |
+------------------------------------------------------------------+
| Web/API (OWASP)                                     | 13 из 15  |
|   CWE-89  [OK]  SQL Injection                          |           |
|   CWE-78  [OK]  OS Command Injection                   |           |
|   CWE-79  [*]   XSS (CSP Not Set + unescape)           |           |
|   CWE-22  [OK]  Path Traversal                         |           |
|   CWE-352 [OK]  CSRF                                  |           |
|   CWE-434 [*]   Unrestricted Upload                    |           |
|   CWE-94  [OK]  Code Injection (eval)                  |           |
|   CWE-502 [NO]  Deserialization                        |           |
|   CWE-77  [OK]  Command Injection (CI/CD)              |           |
|   CWE-20  [OK]  Improper Input Validation              |           |
+------------------------------------------------------------------+
| Auth/Access Control                                  | 7 из 9    |
|   CWE-798 [OK]  Hard-coded Credentials (RSA, HMAC)     |           |
|   CWE-862 [OK]  Missing Authorization (Mass Assign)    |           |
|   CWE-863 [OK]  Incorrect Authorization (UserId)       |           |
|   CWE-287 [OK]  Improper Authentication (JWT forge)    |           |
|   CWE-306 [OK]  Missing Authentication (rate limit)    |           |
|   CWE-269 [OK]  Privilege Management (role)            |           |
|   CWE-276 [OK]  Incorrect Permissions (CORS, /ftp)     |           |
|   CWE-918 [NO]  SSRF                                  |           |
+------------------------------------------------------------------+
| Итого                                                | 20 из 25  |
|   [OK] = 13, [*] = 2, [NO] = 10                       |           |
+------------------------------------------------------------------+
```

**Итог: 15 из 25 CWE покрыты находками (13 [OK] + 2 [*]).**
Оставшиеся 10 — классы memory safety (C/C++), которые не применимы к TypeScript, плюс Deserialization и SSRF (отсутствуют в Juice Shop, но релевантны для Java/Python/Go проектов).

---

## Как использовать этот чек-лист в Code Review

```bash
# 1. SQL Injection (CWE-89)
grep -rn "sequelize.query\|executeQuery\|knex.raw\|pool.query" src/ --include="*.ts"

# 2. Hardcoded credentials (CWE-798)
grep -rn "BEGIN.*RSA.*PRIVATE\|BEGIN.*EC.*PRIVATE\|api[_-]?key\|secret" src/ --include="*.ts" --include="*.py" --include="*.go"
grep -rn "createHmac\|jwt.sign\|generateKeyPairSync" src/ --include="*.ts"

# 3. Code Injection / eval (CWE-94)
grep -rn "eval(\|new Function(" src/ --include="*.js" --include="*.ts"

# 4. Path Traversal (CWE-22)
grep -rn "readFile\|createReadStream\|sendFile\|res.download" src/ --include="*.ts"

# 5. CSRF (CWE-352)
grep -rn "csrf\|sameSite\|doubleSubmit" src/ --include="*.ts" --include="*.py"

# 6. Mass Assignment (CWE-862/863)
grep -rn "req\.body\|request\.data\|\.parse(req)" src/ --include="*.ts"
grep -rn "@RequestBody" src/ --include="*.java"

# 7. Command Injection (CWE-78)
grep -rn "exec(\|execSync\|spawn(\|child_process" src/ --include="*.js" --include="*.ts"

# 8. SSRF (CWE-918) — исходящие запросы с пользовательским URL
grep -rn "fetch(\|axios\.\|http\.get\|request(" src/ --include="*.ts"
```

---

## Как использовать этот чек-лист в интервью

1. **SQL Injection (CWE-89)** — расскажи про parameterized queries и taint tracking (модуль 15: `sqli-taint.yaml`)
2. **Hardcoded Credentials (CWE-798)** — приведи пример SR-02: приватный RSA-ключ в `lib/insecurity.ts`, последствия — подделка любого JWT
3. **CSRF (CWE-352)** — объясни разницу: SameSite vs CSRF-токен vs Double Submit Cookie
4. **Path Traversal (CWE-22)** — про `res.sendfile()` и null byte обход (SR-15)
5. **Improper Input Validation (CWE-20)** — бизнес-логика: отрицательная сумма заказа (SR-09)
6. **Missing/Incorrect Authorization (CWE-862/863)** — Mass Assignment: чтение password-хэша через `fields` параметр (SR-07)

---

## Ссылки

- [CWE Top 25 официальный список](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html)
- [Security Review — 20 находок](Experience/labs/juice-shop/module-16-security-review/report.md)
- [Semgrep — правила и findings](Experience/labs/juice-shop/module-15-semgrep/report.md)
- [ZAP — DAST findings](Experience/labs/juice-shop/module-14-zap/report.md)
- [Nuclei — DAST findings](Experience/labs/juice-shop/module-13-nuclei/report.md)

---

> **Принцип:** CWE — это единый язык общения между инструментами (SAST/DAST), инженерами и стандартами (OWASP ASVS, ГОСТ Р 56939). Используй этот чек-лист как мост между находками инструментов и приоритизацией.
