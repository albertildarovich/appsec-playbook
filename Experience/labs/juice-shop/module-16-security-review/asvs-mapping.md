# OWASP ASVS Mapping — Juice Shop Findings

> Маппинг находок Juice Shop (модуль 16) на OWASP Application Security Verification Standard v4.0.3.
> ASVS определяет три уровня: **L1** (базовый, все приложения), **L2** (чувствительные данные), **L3** (финансы, медицина, криптография).

---

## Формат

| Поле | Описание |
|------|----------|
| **Finding ID** | Идентификатор находки из `report.md` |
| **Уязвимость** | Краткое описание |
| **ASVS ID** | Контроль из OWASP ASVS v4.0.3 (формат: `V<категория>.<секция>.<контроль>`) |
| **Категория ASVS** | V2=Auth, V3=Session, V4=Access, V5=Validation, V11=Business Logic, V14=Config |
| **Level** | Минимальный уровень ASVS, на котором контроль обязателен |
| **CWE** | Common Weakness Enumeration |
| **Status** | PASS / FAIL |

---

## Таблица маппинга

| Finding | Уязвимость | ASVS ID | Категория ASVS | Level | CWE | Status |
|---------|------------|---------|---------------|-------|-----|--------|
| SR-01 | SQL Injection (логин, поиск) | **V5.3.4** | V5: Input Validation | L1 | CWE-89 | FAIL |
| SR-02 | Hardcoded Private RSA Key | **V2.1.2** | V2: Authentication | L1 | CWE-798 | FAIL |
| SR-03 | eval() Injection | **V5.2.4** | V5: Input Validation | L1 | CWE-95 | FAIL |
| SR-05 | Weak Password Hashing (MD5) | **V2.4.1** | V2: Authentication | L1 | CWE-327 | FAIL |
| SR-06 | Hardcoded HMAC Secret | **V2.1.2** | V2: Authentication | L1 | CWE-798 | FAIL |
| SR-07 | Mass Assignment (whoami, order) | **V5.1.2** | V5: Input Validation | L1 | CWE-915 | FAIL |
| SR-09 | Business Logic: Negative Order | **V11.1.1** | V11: Business Logic | L1 | CWE-840 | FAIL |
| SR-10 | Open Redirect (includes bypass) | **V5.5.3** | V5: Input Validation | L1 | CWE-601 | FAIL |
| SR-12 | No Rate Limiting (Login) | **V2.2.1** | V2: Authentication | L1 | CWE-307 | FAIL |
| SR-13 | CORS Misconfiguration | **V14.5.1** | V14: Configuration | L1 | CWE-942 | FAIL |
| SR-14 | Session Fixation (no revokation) | **V3.2.1** | V3: Session Management | L1 | CWE-384 | FAIL |
| SR-16 | No CSRF Protection | **V4.2.2** | V4: Access Control | L2 | CWE-352 | FAIL |
| SR-17 | Insecure Cookie (no httpOnly/secure) | **V3.4.1** | V3: Session Management | L1 | CWE-614 | FAIL |
| SR-20 | Path Traversal / Directory Listing | **V5.3.4** | V5: Input Validation | L1 | CWE-548 | FAIL |

---

## Детализация требований ASVS

### V2: Authentication Verification Requirements

| ASVS ID | Требование | Finding | Почему FAIL |
|---------|-----------|---------|-------------|
| **V2.1.2** | Verify that the application does not contain hardcoded credentials (passwords, keys, tokens) in source code, config files, or infrastructure-as-code | SR-02, SR-06 | Приватный RSA-ключ и HMAC-секрет захардкожены в `lib/insecurity.ts` |
| **V2.2.1** | Verify that anti-automation controls are in place to prevent credential stuffing, brute force, and account lockout attacks | SR-12 | Эндпоинт `/rest/user/login` не имеет rate limiting |
| **V2.4.1** | Verify that passwords are stored using an approved, computationally expensive hashing algorithm (bcrypt, scrypt, argon2id) with a unique salt per user | SR-05 | Пароли хэшируются MD5 без соли |

### V3: Session Management Verification Requirements

| ASVS ID | Требование | Finding | Почему FAIL |
|---------|-----------|---------|-------------|
| **V3.2.1** | Verify the application generates a new session token on authentication and does not reuse existing session tokens | SR-14 | Старый JWT из cookies автоматически валидируется при каждом запросе. Нет revokation |
| **V3.4.1** | Verify that cookie-based session tokens have the 'HttpOnly', 'Secure', and 'SameSite' attributes set | SR-17 | Cookies не имеют httpOnly, secure, sameSite |

### V4: Access Control Verification Requirements

| ASVS ID | Требование | Finding | Почему FAIL |
|---------|-----------|---------|-------------|
| **V4.2.2** | Verify that the application or framework enforces a strong anti-CSRF mechanism to protect authenticated functionality | SR-16 | Все state-changing endpoints не имеют CSRF-токенов |

### V5: Input Validation Verification Requirements

| ASVS ID | Требование | Finding | Почему FAIL |
|---------|-----------|---------|-------------|
| **V5.1.2** | Verify that the application protects against mass assignment by validating that the user is allowed to modify only those properties they should be allowed to | SR-07 | `/rest/user/whoami?fields=password,role` возвращает любые поля, включая пароль |
| **V5.2.4** | Verify that the application avoids the use of eval() or other dynamic code execution features where user input could influence the executed code | SR-03 | `eval()` используется с пользовательским вводом в captcha и userProfile |
| **V5.3.4** | Verify that data selection or database queries (SQL, HQL, ORM, NoSQL) use parameterized queries, ORMs, entity frameworks, or are otherwise protected from database injection attacks | SR-01, SR-20 | Прямая конкатенация SQL в `login.ts` и `search.ts`. Path traversal через `fileServer.ts` |
| **V5.5.3** | Verify that the application protects against open redirects by validating that any redirect URL is on an allowlist and does not contain user-controllable parts | SR-10 | `isRedirectAllowed` использует `url.includes()` вместо `startsWith()` |

### V11: Business Logic Verification Requirements

| ASVS ID | Требование | Finding | Почему FAIL |
|---------|-----------|---------|-------------|
| **V11.1.1** | Verify the application will only process business logic flows in sequential step order, with all steps being processed in realistic human time, and not process out of order, skipped steps, process steps from another user, or too quickly submitted | SR-09 | Заказы с отрицательной суммой (`totalPrice < 0`) не блокируются |

### V14: Configuration Verification Requirements

| ASVS ID | Требование | Finding | Почему FAIL |
|---------|-----------|---------|-------------|
| **V14.5.1** | Verify that the application only allows specific trusted origins in Cross-Origin Resource Sharing (CORS) Access-Control-Allow-Origin header | SR-13 | CORS misconfiguration в `server.ts` — слишком широкий Allow-Origin |

---

## Покрытие ASVS-категорий

| Категория | Контролей маппится | Уровень |
|-----------|:------------------:|---------|
| **V2** Authentication | 3 | L1 — все обязательны |
| **V3** Session Management | 2 | L1 — все обязательны |
| **V4** Access Control | 1 | L2 — CSRF не обязателен на L1, но рекомендован |
| **V5** Input Validation | 4 | L1 — все обязательны |
| **V11** Business Logic | 1 | L1 — обязателен |
| **V14** Configuration | 1 | L1 — обязателен |

**Итого:** 12 требований ASVS маппится на 14 находок Juice Shop, покрыты 6 из 14 категорий ASVS.

---

## Анализ: какой ASVS Level проходят?

Если бы Juice Shop проходил аудит по ASVS:

| ASVS Level | Результат | Обоснование |
|------------|-----------|-------------|
| **L1** (базовый) | **FAIL** | 11 из 12 маппленных контролей L1 нарушены. L1 — минимальный уровень для всех приложений, Juice Shop не проходит даже его |
| **L2** (чувствительные данные) | **FAIL** | + CSRF на L2 тоже нарушен |
| **L3** (финансы/медицина) | **FAIL** | L3 требует L1+L2+дополнительные контроли (V1.14 — архитектура, V9.2 — шифрование клиентских коммуникаций и т.д.) |

---

## Как использовать ASVS на проекте

1. **Определи целевой уровень ASVS до начала разработки.** Для Webbankir (финтех, кредитные данные) — **уровень L2** как минимум.
2. **Встрой проверку ASVS в Definition of Ready.** Каждая фича должна иметь список применимых ASVS-контролей.
3. **Маппь находки на ASVS при пентесте.** Это даёт команде понятный ориентир: «у нас нарушен V5.3.4 — идём чинить SQL Injection».
4. **Используй ASVS в security gate.** CI/CD пайплайн может проверять ASVS-контроли автоматически (например, Checkov для V14, Semgrep для V5.3.4).

---

## Ссылки

- [OWASP ASVS v4.0.3 (PDF)](https://github.com/OWASP/ASVS/raw/v4.0.3/OWASP%20Application%20Security%20Verification%20Standard%204.0.3-en.pdf)
- [OWASP ASVS GitHub](https://github.com/OWASP/ASVS)
- [ASVS Excel Checklist](https://github.com/OWASP/ASVS/tree/master/4.0)