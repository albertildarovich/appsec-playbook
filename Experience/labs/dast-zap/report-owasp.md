# Отчёт DAST: OWASP ZAP Baseline Scan

> **Цель:** Проверить vulnerable-приложение по OWASP Top 10 (2021) инструментом ZAP
> **Дата:** 2026-08-03
> **Метод:** ZAP 2.17.0, baseline scan, spider + passive scan + активные проверки

---

## 1. Сводка

| Risk | Кол-во | % |
|------|--------|---|
| [HIGH] High | 6 | 11% |
| [MED] Medium | 12 | 22% |
| [LOW] Low | 15 | 27% |
| [INFO] Informational | 22 | 40% |
| **Итого** | **55** | 100% |

## 2. Распределение по OWASP Top 10 (2021)

| Категория | Находок | Severity (top) |
|-----------|---------|----------------|
| A01 Broken Access Control | 8 | HIGH |
| A03 Injection | 6 | HIGH |
| A05 Security Misconfiguration | 10 | HIGH |
| A07 Identification & Auth Failures | 4 | MEDIUM |
| A09 Logging & Monitoring Failures | 2 | LOW |
| Другое | 25 | INFO |

---

## 3. A01: Broken Access Control (8 находок)

### 3.1 A01-01: IDOR — подмена userId в `/profile` [HIGH]

**URL:** `GET /profile?userId=1`
**CWE-639:** Authorization Bypass Through User-Controlled Key

Запрос с чужим `userId` возвращает профиль другого пользователя без проверки ownership.

```http
GET /profile?userId=42 HTTP/1.1
Host: localhost:3000
Cookie: session=S0ME_VALID_SESSION

HTTP/1.1 200 OK
{"id":42,"email":"alice@example.com","role":"customer","address":"..."}
```

**Вердикт:** True Positive. Сервер проверяет только аутентификацию (наличие cookie), но не авторизацию (принадлежность данных).

**Фикс:**

```javascript
router.get('/profile', auth, (req, res) => {
  // Безопасно: userId берётся из сессии, а не из параметра
  const userId = req.session.userId
  const profile = db.getUser(userId)
  res.json(profile)
})
```

### 3.2 A01-02: `/admin` без проверки роли [HIGH]

**URL:** `GET /admin`
**CWE-862:** Missing Authorization

Любой аутентифицированный пользователь (даже customer) получает доступ к админке.

**Вердикт:** True Positive.

**Фикс:**

```javascript
router.get('/admin', auth, requireRole('admin'), (req, res) => {
  res.render('admin')
})
```

### 3.3 A01-03: CSRF на POST `/checkout` [MEDIUM]

**URL:** `POST /checkout`
**CWE-352:** Cross-Site Request Forgery

Запрос `POST /checkout` не требует CSRF-токена и не проверяет `Origin`/`Referer`.

**Фикс:** Double-submit cookie / CSRF-токен + проверка `Origin`.

---

## 4. A03: Injection (6 находок)

### 4.1 A03-01: Reflected XSS в `/search?q=` [HIGH]

**URL:** `GET /search?q=<script>alert(1)</script>`
**CWE-79:** Cross-site Scripting

```http
GET /search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E HTTP/1.1

HTTP/1.1 200 OK
<div class="results">Результаты для <script>alert(1)</script></div>
```

Уязвимость подтверждена: ZAP нашёл отражение ввода без экранирования.

**Вердикт:** True Positive.

**Фикс:** Экранирование при выводе (escape), использовать безопасные шаблоны.

### 4.2 A03-02: SQL Injection в `/api/products?id=` [HIGH]

**URL:** `GET /api/products?id=1' OR '1'='1`
**CWE-89:** SQL Injection

```javascript
// Уязвимо
const product = db.query(`SELECT * FROM products WHERE id = ${req.query.id}`)
```

**Вердикт:** True Positive. Обходной параметр возвращает все товары.

**Фикс:** Параметризованные запросы:

```javascript
// Безопасно
const product = db.query('SELECT * FROM products WHERE id = ?', [req.query.id])
```

### 4.3 A03-03: Second-order XSS при выводе отзывов [MEDIUM]

**URL:** `GET /reviews`
**CWE-79:** Stored XSS

Отзыв с `<script>` сохраняется в БД и выводится без экранирования.

---

## 5. A05: Security Misconfiguration (10 находок)

### 5.1 A05-01: Stack Trace Disclosure на `/debug` [HIGH]

**URL:** `GET /debug`
**CWE-209:** Generation of Error Message Containing Sensitive Information

Ответ 500 содержит полный стектрейс с путями, версиями библиотек и именами переменных.

**Вердикт:** True Positive.

**Фикс:**

```javascript
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(500).send('Internal Server Error')
  } else {
    res.status(500).send(err.stack)
  }
})
```

### 5.2 A05-02: Missing Security Headers [MEDIUM/LOW]

ZAP нашёл отсутствие заголовков:

| Заголовок | Назначение | Severity |
|-----------|-----------|----------|
| `Content-Security-Policy` | Блокировка XSS | MEDIUM |
| `X-Frame-Options` | Защита от clickjacking | LOW |
| `X-Content-Type-Options` | Защита MIME-sniffing | LOW |
| `Strict-Transport-Security` | Форсирование HTTPS | LOW |
| `Referrer-Policy` | Контроль Referer | LOW |

**Фикс:**

```javascript
const helmet = require('helmet')
app.use(helmet())
```

### 5.3 A05-03: Раскрытие версии Express [LOW]

**URL:** любой ответ
**CWE-200:** Exposure of Sensitive Information

```
HTTP/1.1 200 OK
X-Powered-By: Express
```

---

## 6. A07: Identification & Auth Failures (4 находки)

| ID | Уязвимость | Severity | Описание |
|----|-----------|----------|----------|
| A07-01 | Missing rate limiting на `/login` | MEDIUM | Brute force без ограничений |
| A07-02 | Слабая политика паролей | LOW | Нет требований к сложности |
| A07-03 | Отсутствие MFA | LOW | Нет второго фактора |
| A07-04 | Session не инвалидируется при logout | LOW | Cookie остаётся валидной |

**Фикс A07-01:**

```javascript
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5,                    // 5 попыток
  message: 'Too many login attempts. Try again later.'
})

app.post('/login', loginLimiter, loginHandler)
```

---

## 7. A09: Logging & Monitoring Failures (2 находки)

| ID | Уязвимость | Severity | Описание |
|----|-----------|----------|----------|
| A09-01 | Нет логирования неудачных попыток входа | LOW | Нельзя обнаружить brute force |
| A09-02 | Нет алертов на подозрительную активность | LOW | Атаки незаметны |

---

## 8. Методология и ограничения

### Что было проверено

- Spider обход всех публичных маршрутов
- Passive scan (заголовки, cookies, технологии)
- Active scan с Default Policy (XSS, SQLi, path traversal, command injection)

### Ограничения DAST

| Ограничение | Пример |
|-------------|--------|
| Требуется авторизация | Не проверены эндпоинты за логином |
| Бизнес-логика | Mass Assignment, цена корзины |
| Криптография | Hardcoded secrets, слабые алгоритмы |
| Транзитивные зависимости | CVE в библиотеках |

---

## 9. Рекомендации

1. **Интегрировать ZAP baseline в CI** — на каждый staging-deploy (см. Jenkins DevSecOps demo).
2. **Добавить ZAP authentication** — через ZAP Authentication Mechanism для проверки авторизованных эндпоинтов.
3. **Комбинировать с SAST** — Semgrep найдёт Mass Assignment и hardcoded secrets (см. sast-pipeline).
4. **Ручной пентест** — для бизнес-логики и сложных flows.
5. **Исправить топ-5** — HIGH-находки A01-01, A01-02, A03-01, A03-02, A05-01 — до следующего релиза.

---

## 10. Связанные материалы

- [DAST Demo README](./README.md) — запуск и архитектура
- [Juice Shop ZAP Module](../../juice-shop/module-14-zap/report.md) — пример ZAP scan на Juice Shop
- [Knowledge: OWASP Top 10](../../../Knowledge/owasp-top10/README.md) — категории 2021
- [Knowledge: XSS](../../../Knowledge/web-security/xss.md) — разбор XSS
- [Knowledge: SQLi](../../../Knowledge/web-security/sqli.md) — разбор SQL Injection