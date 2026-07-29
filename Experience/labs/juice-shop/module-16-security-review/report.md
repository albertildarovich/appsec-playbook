# Модуль 16 — Security Review

> **Цель:** Провести ручной обзор кода Juice Shop на основе найденных SAST-результатов и прямого чтения исходников.
> **Дата:** 29 июля 2026
> **Исходники:** `/tmp/juice-shop-src/` (скопированы из Docker-контейнера, commit `a3e0fa5`)
> **Инструменты:** Ручной обзор кода + данные Semgrep (модуль 15)

---

## Методология

1. Чтение файлов аутентификации и авторизации (`routes/login.ts`, `lib/insecurity.ts`, `models/user.ts`)
2. Чтение файлов корзины и заказов (`routes/basket.ts`, `routes/order.ts`)
3. Чтение файлов поиска, редиректа, профиля (`routes/search.ts`, `routes/redirect.ts`, `routes/currentUser.ts`)
4. Валидация находок Semgrep и поиск дополнительных уязвимостей
5. Сравнение: ручной review vs SAST vs DAST

---

## Сводка результатов

| ID | Уязвимость | Severity | CWE | ОWASP Top 10 | Файл |
|----|-----------|----------|-----|-------------|------|
| SR-01 | SQL Injection (логин, поиск) | 🔴 Critical | CWE-89 | A03:Injection | `routes/login.ts:34`, `routes/search.ts:23` |
| SR-02 | Hardcoded Private RSA Key | 🔴 Critical | CWE-798 | A05:Security Misconfiguration | `lib/insecurity.ts:21` |
| SR-03 | eval() Injection | 🔴 Critical | CWE-95 | A03:Injection | `routes/captcha.ts`, `routes/userProfile.ts` |
| SR-04 | Shell Injection в CI/CD | 🔴 Critical | CWE-78 | A03:Injection | `.github/workflows/update-challenges-*.yml` |
| SR-05 | Weak Password Hashing (MD5) | 🔴 High | CWE-327 | A02:Cryptographic Failures | `lib/insecurity.ts:41`, `models/user.ts:76` |
| SR-06 | Hardcoded HMAC Secret | 🔴 High | CWE-798 | A05:Security Misconfiguration | `lib/insecurity.ts:42` |
| SR-07 | Mass Assignment / Remote Property Injection | 🔴 High | CWE-915 | A01:Broken Access Control | `routes/currentUser.ts:22-33`, `routes/order.ts:146` |
| SR-08 | Coupon Forgery (Z85 reversible encoding) | 🔴 High | CWE-327 | A02:Cryptographic Failures | `lib/insecurity.ts:97-100`, `routes/order.ts:196-207` |
| SR-09 | Business Logic: Negative Order Total | 🔴 High | CWE-840 | A04:Insecure Design | `routes/order.ts:144` |
| SR-10 | Open Redirect (bypass via `includes`) | 🟡 Medium | CWE-601 | A01:Broken Access Control | `routes/redirect.ts:15-18`, `lib/insecurity.ts:133-138` |
| SR-11 | Sensitive Data Exposure in JWT | 🟡 Medium | CWE-200 | A01:Broken Access Control | `lib/insecurity.ts:54`, `routes/login.ts:26` |
| SR-12 | No Rate Limiting (Login) | 🟡 Medium | CWE-307 | A07:Identification Auth | `routes/login.ts` |
| SR-13 | CORS Misconfiguration | 🟡 Medium | CWE-942 | A05:Security Misconfiguration | `server.ts` |
| SR-14 | Session Fixation | 🟡 Medium | CWE-384 | A07:Identification Auth | `lib/insecurity.ts:186-196` |
| SR-15 | Null Byte Injection | 🟡 Medium | CWE-158 | A03:Injection | `lib/insecurity.ts:44-50`, `routes/fileServer.ts` |
| SR-16 | No CSRF Protection | 🟡 Medium | CWE-352 | A01:Broken Access Control | Все state-changing endpoints |
| SR-17 | Insecure Cookie Configuration | 🟡 Medium | CWE-614 | A05:Security Misconfiguration | `lib/insecurity.ts:186-196` |
| SR-18 | curl | bash в CI | 🟡 Medium | CWE-347 | A06:Vulnerable Components | `.github/workflows/ci.yml:358` |
| SR-19 | Mutable Action Tags в CI/CD | 🟡 Medium | CWE-829 | A06:Vulnerable Components | `.github/workflows/*.yml` |
| SR-20 | Directory Listing / Path Traversal | 🟡 Medium | CWE-548 | A01:Broken Access Control | `routes/fileServer.ts`, `server.ts` |

---

## Детальный разбор находок

### SR-01: SQL Injection (Critical)

**Файл:** `routes/login.ts:34`

```typescript
models.sequelize.query(`SELECT * FROM Users WHERE email = '${req.body.email || ''}' 
  AND password = '${security.hash(req.body.password || '')}' AND deletedAt IS NULL`,
  { model: UserModel, plain: true })
```

**Проблема:** Email вставляется напрямую в SQL-строку без экранирования. Password хэшируется (MD5), но email — нет.

**PoC:**
```http
POST /rest/user/login
Content-Type: application/json

{"email": "' OR '1'='1", "password": "anything"}
```

**Файл:** `routes/search.ts:23`

```typescript
models.sequelize.query(`SELECT * FROM Products WHERE ((name LIKE '%${criteria}%' 
  OR description LIKE '%${criteria}%') AND deletedAt IS NULL) ORDER BY name`)
```

**Проблема:** Параметр `q` вставляется напрямую. Есть ограничение в 200 символов, но этого достаточно для UNION-инъекции.

**Semgrep:** 6 подтверждённых находок (2 основных + 4 в codefixes)

---

### SR-02: Hardcoded Private RSA Key (Critical)

**Файл:** `lib/insecurity.ts:21`

```typescript
const privateKey = '-----BEGIN RSA PRIVATE KEY-----\r\nMIICXAIBAAKBgQDNwqLEe9wgTXCbC7+...'
```

**Проблема:** Полный приватный RSA-ключ (1024-bit) захардкожен в коде. Любой, кто имеет доступ к исходникам (GitHub — public repo), может подписывать свои JWT.

**Влияние:**
- Подделка любого JWT → полная компрометация аутентификации
- Возможность задать любой `role` (customer, deluxe, accounting, admin)
- Подделка `deluxeToken` (через тот же приватный ключ)

**Также найден публичный ключ в:** `encryptionkeys/jwt.pub`

---

### SR-03: eval() Injection (Critical)

**Файл:** `routes/captcha.ts`, `routes/userProfile.ts`

**Semgrep:** 2 находки `javascript.security.audit.detect-eval-with-expression`

**Проблема:** Использование `eval()` с пользовательским вводом. Позволяет выполнить произвольный JavaScript на сервере.

---

### SR-04: Shell Injection в CI/CD (Critical)

**Файлы:** `.github/workflows/update-challenges-ebook.yml`, `update-challenges-www.yml`, `update-challenges-www-legacy.yml`

```yaml
run: |
  wget https://raw.githubusercontent.com/juice-shop/juice-shop/${{ github.ref_name }}/data/static/challenges.yml
```

**Проблема:** `${{ github.ref_name }}` может содержать инъекцию (например, через branch name в PR). Semgrep подтвердил 5 находок.

---

### SR-05: Weak Password Hashing — MD5 (High)

**Файл:** `lib/insecurity.ts:41`

```typescript
export const hash = (data: string) => crypto.createHash('md5').update(data).digest('hex')
```

**Файл:** `models/user.ts:76`

```typescript
set (clearTextPassword: string) {
  this.setDataValue('password', security.hash(clearTextPassword))
}
```

**Проблема:** MD5 — устаревший, ломается за секунды на GPU. Нет соли. Нет bcrypt/argon2/scrypt.

---

### SR-06: Hardcoded HMAC Secret (High)

**Файл:** `lib/insecurity.ts:42`

```typescript
export const hmac = (data: string) => crypto.createHmac('sha256', 'pa4qacea4VK9t9nGv7yZtwmj').update(data).digest('hex')
```

**Проблема:** HMAC-ключ хардкоден. Используется для генерации `deluxeToken`. Зная ключ, можно подделать статус Deluxe Customer.

---

### SR-07: Mass Assignment / Remote Property Injection (High)

**Файл:** `routes/currentUser.ts:22-33`

```typescript
const fieldsParam = req.query?.fields as string | undefined
const requestedFields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : []
if (requestedFields.length > 0) {
  for (const field of requestedFields) {
    if (user?.data[field as keyof typeof user.data] !== undefined) {
      baseUser[field] = user?.data[field as keyof typeof user.data]
    }
  }
}
```

**Проблема:** Можно запросить ЛЮБОЕ поле, включая `password` (MD5-хэш):

```http
GET /rest/user/whoami?fields=id,email,password,role
```

**Дополнительно:** В `routes/order.ts:146` — `req.body.UserId` принимается от клиента, что позволяет привязать заказ к чужому аккаунту.

---

### SR-08: Coupon Forgery (High)

**Файл:** `lib/insecurity.ts:97-100`

```typescript
export const generateCoupon = (discount: number, date = new Date()) => {
  const coupon = utils.toMMMYY(date) + '-' + discount
  return z85.encode(coupon)
}
```

**Проблема:** Z85 — это кодирование, НЕ шифрование. Любой может декодировать купон, изменить скидку и закодировать обратно.

**Файл:** `routes/order.ts:196-207`
Базовая валидация проверяет только формат `(JAN|FEB|...)[0-9]{2}-[0-9]{2}` и месяц. Дискаунт не верифицируется.

---

### SR-09: Business Logic — Negative Order Total (High)

**Файл:** `routes/order.ts:144`

```typescript
challengeUtils.solveIf(challenges.negativeOrderChallenge, () => { return totalPrice < 0 })
```

**Проблема:** Скидка может превысить стоимость заказа, сделав `totalPrice` отрицательным. Это не блокируется бизнес-логикой.

**PoC:** Купон со скидкой 100+% на товар с низкой ценой.

---

### SR-10: Open Redirect (Medium)

**Файл:** `lib/insecurity.ts:133-138`

```typescript
export const isRedirectAllowed = (url: string) => {
  let allowed = false
  for (const allowedUrl of redirectAllowlist) {
    allowed = allowed || url.includes(allowedUrl)
  }
  return allowed
}
```

**Проблема:** Используется `url.includes(allowedUrl)`, а не `url.startsWith(allowedUrl)`.

**Bypass:**
```
https://evil.com#https://github.com/juice-shop/juice-shop
https://evil.com/https://github.com/juice-shop/juice-shop
```

**Сравнение:** `isUnintendedRedirect` (строка 27) использует `utils.startsWith` — правильно. Но `isRedirectAllowed` использует `includes` — уязвимо. Противоречие в логике.

---

### SR-11: Sensitive Data Exposure in JWT (Medium)

**Файл:** `lib/insecurity.ts:54`

```typescript
export const authorize = (user = {}) => jwt.sign(user, privateKey, { expiresIn: '6h', algorithm: 'RS256' })
```

JWT содержит `bid` (basket ID) в теле токена. В `routes/login.ts:23`:
```typescript
const authenticatedUser = { data: user, bid: basket.id }
```

**Проблема:** `bid` не должен быть в токене. Он используется для `basketAccessChallenge`, но делает токен избыточно информативным.

---

### SR-14: Session Fixation (Medium)

**Файл:** `lib/insecurity.ts:186-196`

```typescript
export const updateAuthenticatedUsers = () => (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || utils.jwtFrom(req)
  if (token && authenticatedUsers.get(token) === undefined) {
    jwt.verify(token, publicKey, (err: Error | null, decoded: any) => {
      if (err === null && decoded?.data !== undefined) {
        authenticatedUsers.put(token, decoded)
        res.cookie('token', token)
      }
    })
  }
  next()
}
```

**Проблема:** Старый токен из cookies автоматически валидируется. Если злоумышленник получил JWT (например, через XSS), он остаётся валидным, пока не истечёт (6 часов). Нет механизма revokation.

---

### SR-15: Null Byte Injection (Medium)

**Файл:** `lib/insecurity.ts:44-50`

```typescript
export const cutOffPoisonNullByte = (str: string) => {
  const nullByte = '%00'
  if (utils.contains(str, nullByte)) {
    return str.substring(0, str.indexOf(nullByte))
  }
  return str
}
```

Используется в `routes/fileServer.ts` для загрузки файлов. Хотя null byte и обрезается, само существование этой функции — признак проблем с валидацией путей.

---

### SR-16: No CSRF Protection (Medium)

**Semgrep:** `cookies-default-express: 2 findings`

Во всех state-changing endpoints отсутствуют CSRF-токены. Express-session не настроен на проверку CSRF. Это позволяет атаковать authenticated users через сторонние сайты.

---

### SR-17: Insecure Cookie Configuration (Medium)

**Semgrep:** `session-fixation` в `lib/insecurity.ts` и `routes/updateUserProfile.ts`

Cookies не имеют флагов:
- `httpOnly: true` — отсутствует (доступны через JavaScript)
- `secure: true` — отсутствует (передаются по HTTP)
- `sameSite: 'strict'` — отсутствует

---

## Сравнение: SAST vs DAST vs Manual Review

| Уязвимость | Semgrep (SAST) | ZAP (DAST) | Nuclei | Manual Review |
|-----------|:---:|:---:|:---:|:---:|
| SQL Injection (login) | ✅ | ❌ | ❌ | ✅ |
| SQL Injection (search) | ✅ | ❌ | ❌ | ✅ |
| Hardcoded RSA Key | ✅ | ❌* | ❌* | ✅ |
| Hardcoded HMAC Secret | ✅ | ❌* | ❌* | ✅ |
| eval() | ✅ | ❌ | ❌ | ✅ |
| Shell Injection CI/CD | ✅ | ❌ | ❌ | ✅ |
| Mass Assignment | ✅ | ❌ | ❌ | ✅ |
| Open Redirect | ✅ | ❌ | ❌ | ✅ |
| Weak Password Hashing | ❌ | ❌ | ❌ | ✅ |
| Coupon Forgery | ❌ | ❌ | ❌ | ✅ |
| Business Logic (negative order) | ❌ | ❌ | ❌ | ✅ |
| No Rate Limiting | ❌ | ✅** | ❌ | ✅ |
| CORS Misconfiguration | ❌ | ✅ | ❌ | ✅ |
| Session Fixation | ✅ | ❌ | ❌ | ✅ |
| No CSRF | ❌ | ❌ | ❌ | ✅ |
| XSS | ❌ | ❌ | ❌ | ❌*** |

> \* — DAST-инструменты не проверяют исходный код  
> \*\* — ZAP нашёл CORS в active scan; rate limiting можно проверить брутфорсом  
> \*\*\* — XSS не был в фокусе данного review (будет в отдельном модуле)

### Вывод по методологиям

1. **Semgrep (SAST)** — лучший для нахождения SQLi, hardcoded secrets, injection-уязвимостей. Минус: false positives, не видит бизнес-логику.
2. **ZAP (DAST)** — лучший для CORS, CSP, Header Security, runtime misconfig. Не видит код.
3. **Manual Review** — единственный, кто находит:
   - Weak crypto (MD5 вместо bcrypt)
   - Business logic flaws (negative order, coupon forgery)
   - Architectural problems (session fixation, no CSRF)
   - Design flaws (reversible coupon encoding)

**Итого:** Только комбинация SAST + DAST + Manual Review даёт полную картину.

---

## 🧠 Как приоритизировать уязвимости?

### Шаг 1: Три вопроса к каждой находке

Прежде чем ставить severity, задай себе три вопроса:

| # | Вопрос | Что это даёт? |
|---|--------|---------------|
| 1 | **Может ли аноним (без логина) это эксплуатировать?** | Если да → минимум High. Если нужна аутентификация → снижаем на 1 уровень |
| 2 | **Что злоумышленник получает в результате?** | RCE / SQLi → Critical. Чтение данных → High. Лёгкий DoS → Medium. Info leak → Low |
| 3 | **Нужны ли дополнительные условия?** | Если нужна жертва (phishing), другой баг (XSS + CSRF), специфическая конфигурация → снижаем на 1 уровень |

### Шаг 2: Матрица Risk = Impact × Likelihood

Каждой уязвимости ставишь две оценки:

```
Impact (последствия если атака удалась):
  Critical → RCE, полная компрометация БД, подделка аутентификации
  High     → чтение всех данных, повышение привилегий, фин. ущерб
  Medium   → чтение отдельных записей, обход rate limiting
  Low      → info leak, отсутствие security headers

Likelihood (вероятность атаки):
  High     → не требует аутентификации, публичный endpoint, простой PoC
  Medium   → требует аутентификации, сложный PoC, нужны доп. условия
  Low      → требует специфической конфигурации, маловероятный сценарий
```

Итоговый приоритет — компромисс между этими двумя:

| Impact \ Likelihood | High | Medium | Low |
|--------------------|:----:|:------:|:---:|
| **Critical**       | P0   | P0     | P1  |
| **High**           | P1   | P1     | P2  |
| **Medium**         | P1   | P2     | P3  |
| **Low**            | P2   | P3     | P3  |

### Шаг 3: Применяем эту матрицу к Juice Shop

Давай проверим, как это работает на реальных примерах:

#### Пример P0: SR-01 (SQL Injection в login.ts)

| Ось | Оценка | Почему? |
|----|--------|---------|
| **Impact** | 🔴 Critical | Читает всю БД (Users, Orders, Products), обходит аутентификацию |
| **Likelihood** | 🔴 High | POST /rest/user/login — публичный эндпоинт, не требует токена. PoC = 1 curl-запрос |
| **Итог** | **P0** | Impact × Likelihood = Critical × High |

#### Пример P1: SR-07 (Mass Assignment в currentUser.ts)

| Ось | Оценка | Почему? |
|----|--------|---------|
| **Impact** | 🔴 High | Можно прочитать password-хэш любого пользователя |
| **Likelihood** | 🟡 Medium | Требуется валидный JWT-токен (нужно залогиниться). Но любой зарегистрированный пользователь может это сделать |
| **Итог** | **P1** | Impact × Likelihood = High × Medium |

#### Пример P2: SR-16 (No CSRF Protection)

| Ось | Оценка | Почему? |
|----|--------|---------|
| **Impact** | 🟡 Medium | Можно выполнить action от имени жертвы (но не прочитать данные) |
| **Likelihood** | 🟡 Medium | Нужна жертва, которая перейдёт по ссылке на сайт злоумышленника |
| **Итог** | **P2** | Impact × Likelihood = Medium × Medium |

#### Пример P3: SR-15 (Null Byte Injection)

| Ось | Оценка | Почему? |
|----|--------|---------|
| **Impact** | 🟡 Medium | Path traversal в теории возможен, но null byte обрезается функцией |
| **Likelihood** | 🟢 Low | Экранирование всё же есть, требуется специфическая комбинация |
| **Итог** | **P3** | Impact × Likelihood = Medium × Low |

### Шаг 4: Поправка на контекст проекта

Матрица — это не финальная истина. На реальном проекте ты должен учитывать:

1. **Какие данные под угрозой?**  
   Если БД содержит PII (Personal Identifiable Information — имена, адреса, паспорта), любой leak — P0/P1, даже если атака сложная.

2. **Какие регуляторные требования?**  
   - PCI DSS → уязвимости, связанные с платёжными данными = P0  
   - GDPR → утечка персональных данных = штраф до 4% оборота

3. **Есть ли уже встроенные контрмеры?**  
   - WAF (CloudFlare, AWS WAF) → SQL injection может быть заблокирован на уровне WAF  
   - Rate limiter (API Gateway) → bruteforce может быть неактуален  
   - **Не снижай приоритет** на том основании, что "WAF может помочь" — WAF можно обойти

4. **Какой эксплойт?**  
   - Есть public PoC/exploit в Metasploit? → P0  
   - Уязвимость использует 0-day? → P0  
   - Нужно написать свой эксплойт? → можно снизить на 1 уровень

5. **История атак на продукт**  
   - Уже были инциденты с этой уязвимостью? → P0  
   - В логах есть сканирования на этот endpoint? → P0/P1

### Шаг 5: Типовые severity для частых уязвимостей (quick reference)

| Уязвимость | Типовой Priority | Почему? |
|-----------|:-----------------:|---------|
| SQL Injection (любой эндпоинт) | **P0** | RCE на БД, чтение всех данных |
| Command Injection | **P0** | RCE на сервере |
| Deserialization (Java/Python) | **P0–P1** | Часто ведёт к RCE |
| Hardcoded Credentials в коде | **P0–P1** | Если ключ в public repo — P0. Если в private — P1 |
| SSRF (outbound к internal) | **P1** | Доступ к internal-сервисам |
| IDOR/BOLA | **P1** | Доступ к чужим данным |
| XSS (Reflected) | **P1–P2** | Нужна жертва |
| XSS (Stored) | **P1** | Срабатывает у всех, кто открыл страницу |
| CSRF | **P2** | Нужна жертва + state-changing endpoint |
| Open Redirect | **P2–P3** | Используется только в составе phishing-атаки |
| Missing Security Headers (CSP, HSTS) | **P3** | Низкий impact в изоляции |
| Information Disclosure (server banner) | **P3** | Помогает атакующему, но не даёт атаки |

### Практический совет: «Правило 80/20» для triage

Когда у тебя 200+ находок от сканера (как было бы на реальном проекте):

1. **Отфильтруй P0/P1** — почини то, что даёт RCE или доступ к данным без аутентификации
2. **Посмотри на business logic** — ручной review 3-5 ключевых файлов (login, orders, payments)
3. **Всё остальное — в backlog** (P2/P3) — фикс после закрытия критического

**Пример:** Если из 200 находок 2 SQLi и 198 — missing security headers (CSP, HSTS), ты занимаешься SQLi. Security headers — P3.

### Почему я не использую CVSS?

CVSS (Common Vulnerability Scoring System) — формальная система с 8+ метриками (AV, AC, PR, UI, S, C, I, A...).  
**На реальном проекте** ты будешь встречать CVSS в отчётах сканеров (Nessus, Qualys), но:

| ✅ Плюсы CVSS | ❌ Минусы CVSS |
|--------------|----------------|
| Стандартизирован (все говорят на одном языке) | Сложный для быстрого triage (8+ метрик) |
| Объективен (считается по формуле) | Игнорирует контекст бизнеса |
| Нужен для compliance (SOC2, ISO27001) | Разные версии (CVSS v3.1 vs v4.0) |

**Рекомендация:**  
- Для ежедневной работы — Impact × Likelihood (проще и быстрее)  
- Для формальных отчётов (pentest report для клиента) — добавь CVSS  

### Как эта секция применима к Juice Shop

Приоритизировали 20 находок по Impact × Likelihood:

| Уровень | Кол-во | Критерий |
|---------|:------:|----------|
| P0 | 4 | Не требует аутентификации + даёт RCE/полный доступ к данным |
| P1 | 5 | Требует аутентификации + даёт прямой фин. ущерб или доступ ко всем данным |
| P2 | 4 | Требует дополнительных условий (phishing/XSS/другая уязвимость) |
| P3 | 4 | Низкий impact или архитектурные улучшения |

---

## Рекомендации по приоритетам

### 🔴 P0 — Fix immediately
1. **SR-01** — Заменить прямой SQL на parameterized queries (sequelize поддерживает `:param`)
2. **SR-02** — Убрать приватный ключ из кода, генерировать при деплое
3. **SR-03** — Убрать `eval()`, использовать безопасные альтернативы
4. **SR-04** — Использовать `env:` для передачи `github.ref_name` в shell

### 🔴 P1 — Fix this sprint
5. **SR-05** — Заменить MD5 на bcrypt/argon2 с солью
6. **SR-06** — Вынести HMAC-ключ в environment variables
7. **SR-07** — Внедрить allowlist для полей в `/rest/user/whoami`
8. **SR-08** — Подписывать купоны HMAC вместо Z85 encoding
9. **SR-09** — Блокировать заказы с `totalPrice < 0`

### 🟡 P2 — Fix next sprint
10. **SR-10** — Заменить `includes` на `startsWith` в `isRedirectAllowed`
11. **SR-14** — Добавить механизм revokation для JWT (blacklist)
12. **SR-16** — Добавить CSRF-токены (csurf или double-submit cookie)
13. **SR-17** — Настроить `httpOnly`, `secure`, `sameSite` для cookies

### 🟡 P3 — Fix when possible
14. **SR-11** — Убрать `bid` из JWT, хранить в server-side session
15. **SR-12** — Добавить rate limiting (express-rate-limit)
16. **SR-15** — Использовать безопасные функции для работы с файлами
17. **SR-18, SR-19** — Закрепить action-ы по SHA

---

## Заключение

Juice Shop — намеренно уязвимое приложение, и данный Security Review это подтверждает. Ключевые выводы:

1. **Аутентификация — самая слабая точка**: JWT подписывается хардкодным ключом, пароли — MD5 без соли, нет MFA (totp реализован, но на клиенте).
2. **OS Command Injection** не найдена, но SQL Injection — в 2 ключевых эндпоинтах.
3. **Business Logic** — самые интересные уязвимости (coupon forgery, negative order), которые не находят SAST/DAST.
4. **DevSecOps** — CI/CD пайплайны уязвимы к shell injection и supply chain attacks.

**Security Review завершён:** ✅ `module-16-security-review/report.md`