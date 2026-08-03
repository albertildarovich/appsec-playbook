# Secure Code Review: Кейсы

> **Цель:** Разобрать 5 примеров уязвимого кода: описание риска, безопасный фикс, ссылка на CWE.
> **Формат:** Каждый кейс = уязвимый код + риск + исправление + CWE-маппинг.

## Сводка кейсов

| # | Название | CWE | Severity | OWASP Top 10 |
|---|----------|-----|----------|--------------|
| 1 | SQL Injection через конкатенацию | CWE-89 | CRITICAL | A03 |
| 2 | Mass Assignment (role) | CWE-915 | HIGH | A01 |
| 3 | Hardcoded Secret | CWE-798 | CRITICAL | A05 |
| 4 | IDOR / BOLA | CWE-639 | HIGH | A01 |
| 5 | Server-Side Request Forgery (SSRF) | CWE-918 | HIGH | A10 |

---

## Кейс 1: SQL Injection через конкатенацию

### Уязвимый код

```typescript
// routes/products.ts
import { Request, Response } from 'express'
import db from '../db'

router.get('/products', (req: Request, res: Response) => {
  const category = req.query.category as string

  // УЯЗВИМО: пользовательский ввод конкатенируется в SQL
  const query = `
    SELECT * FROM products
    WHERE category = '${category}'
    ORDER BY name
  `
  const products = db.query(query)
  res.json(products)
})
```

### Описание риска

Злоумышленник может изменить структуру SQL-запроса через параметр `category`:

```http
GET /products?category=' OR '1'='1'-- HTTP/1.1
```

Ответ: **все товары**, включая удалённые и скрытые. Более опасные варианты — UNION-based extract данных из других таблиц (`users`, `orders`), blind SQLi, time-based SQLi.

**Возможный ущерб:**
- Полное чтение БД (включая хэши паролей)
- Запись/изменение данных (INSERT/UPDATE через stacked queries)
- В некоторых БД — RCE через `xp_cmdshell` (SQL Server) или `COPY ... FROM PROGRAM` (PostgreSQL)

### Безопасное исправление

```typescript
// routes/products.ts
router.get('/products', (req: Request, res: Response) => {
  const category = req.query.category as string

  // БЕЗОПАСНО: параметризованный запрос
  const products = db.query(
    'SELECT * FROM products WHERE category = ? ORDER BY name',
    [category]
  )
  res.json(products)
})
```

Для ORM (Sequelize, TypeORM) аналогично:

```typescript
// Sequelize
const products = await Product.findAll({
  where: { category },
  order: [['name', 'ASC']]
})
```

### Проверка фикса

```bash
# До фикса: возвращает все товары
curl "http://localhost:3000/products?category=' OR '1'='1'--"

# После фикса: 400/пустой результат, SQLi не срабатывает
curl "http://localhost:3000/products?category=' OR '1'='1'--"
```

### CWE

**CWE-89: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')**

- [CWE-89 на MITRE](https://cwe.mitre.org/data/definitions/89.html)
- [OWASP A03: Injection](../../../Knowledge/owasp-top10/a03-injection.md)
- [Cheatsheet: SQLi](../../../Knowledge/cheatsheets/sqli.md)

---

## Кейс 2: Mass Assignment (подмена role)

### Уязвимый код

```typescript
// routes/users.ts
import { Request, Response } from 'express'
import { User } from '../models/User'

router.post('/users', async (req: Request, res: Response) => {
  // УЯЗВИМО: тело запроса напрямую в модель
  const user = await User.create(req.body)
  res.status(201).json(user)
})
```

### Описание риска

Клиент может отправить **произвольные поля**, не предусмотренные формой регистрации:

```http
POST /users HTTP/1.1
Content-Type: application/json

{
  "email": "attacker@example.com",
  "password": "secret123",
  "role": "admin",
  "isVerified": true,
  "balance": 999999
}
```

Сервер создаст пользователя с правами администратора. Это классический **Mass Assignment** (также известен как Remote Property Injection, Object Mass Assignment).

**Реальные примеры:**
- GitHub Mass Assignment (2012): добавление `plan` в профиль
- HackerOne блог: изменение `price` в корзине
- Juice Shop: добавление `role: admin` через POST /api/Users

### Безопасное исправление

```typescript
// routes/users.ts
import { Request, Response } from 'express'
import { User } from '../models/User'

// Allowlist разрешённых полей
const ALLOWED_FIELDS = ['email', 'password', 'firstName', 'lastName']

router.post('/users', async (req: Request, res: Response) => {
  // БЕЗОПАСНО: извлекаем только разрешённые поля
  const safeUserData: Partial<User> = {}
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      safeUserData[field] = req.body[field]
    }
  }

  const user = await User.create(safeUserData)
  res.status(201).json(user)
})
```

Альтернативы:

```typescript
// Sequelize: защита на уровне модели
User.init({
  email: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'customer',  // сервер сам задаёт роль
    set(value) { /* игнорируем клиентское значение */ }
  }
})
```

### Проверка фикса

```bash
# До фикса: создаётся пользователь с role=admin
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"x","role":"admin"}'

# После фикса: поле role игнорируется, роль = customer
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"x","role":"admin"}'
```

### CWE

**CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes**

- [CWE-915 на MITRE](https://cwe.mitre.org/data/definitions/915.html)
- [OWASP A01: Broken Access Control](../../../Knowledge/owasp-top10/a01-broken-access-control.md)
- [Knowledge: Mass Assignment / BOLA](../../../Knowledge/authorization/bola.md)

---

## Кейс 3: Hardcoded Secret

### Уязвимый код

```typescript
// config/keys.ts
export const jwtSecret = 'my-super-secret-key-123'
export const stripeApiKey = 'sk_live_51H3x9...'
export const dbPassword = 'P@ssw0rd'

// lib/auth.ts
import { jwtSecret } from '../config/keys'

export function signToken(user: User): string {
  // УЯЗВИМО: хардкодный секрет для подписи JWT
  return jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
    expiresIn: '6h'
  })
}
```

### Описание риска

Секреты в коде — это **мгновенная компрометация** при утечке репозитория (GitHub, GitLab, npm registry, увольнение сотрудника):

1. **JWT secret** → подделка любого токена: `role: admin`, чужой `userId`
2. **Stripe live key** → прямой финансовый ущерб: списание средств клиентов
3. **DB password** → полный доступ к базе данных (чтение, изменение, удаление)

**История:**
- Uber: Amazon AWS keys в GitHub → кража данных 57 млн пользователей
- Capital One: SSRF → доступ к S3 через метаданные (секреты в коде усугубляют)
- Juice Shop: поддельный JWT с любым `role` из-за хардкодного приватного ключа

### Безопасное исправление

```typescript
// config/keys.ts — секреты только из окружения
export const jwtSecret = process.env.JWT_SECRET
export const stripeApiKey = process.env.STRIPE_API_KEY
export const dbPassword = process.env.DB_PASSWORD

// lib/auth.ts
import { jwtSecret } from '../config/keys'

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET not configured or too weak. ' +
    'Set a random 32+ char secret in environment.'
  )
}

export function signToken(user: User): string {
  return jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
    expiresIn: '6h'
  })
}
```

Секреты хранятся в:
- **CI/CD Variables** (GitLab, GitHub Actions) — для пайплайна
- **Vault** (HashiCorp Vault) — для production
- **Secret Manager** (AWS Secrets Manager, GCP Secret Manager) — облако

Генерация случайного секрета:

```bash
openssl rand -base64 48   # 64 символа случайных данных
```

### Проверка фикса

```bash
# Скопируй репозиторий и проверь, есть ли секреты в git-истории:
gitleaks detect --source . --verbose

# До фикса: найдёт JWT secret, Stripe key, DB password
# После фикса: все секреты удалены из кода
```

### CWE

**CWE-798: Use of Hard-coded Credentials**

- [CWE-798 на MITRE](https://cwe.mitre.org/data/definitions/798.html)
- [OWASP A05: Security Misconfiguration](../../../Knowledge/owasp-top10/a05-security-misconfiguration.md)
- [Knowledge: Secret Scanning](../../../Knowledge/devsecops/secret-scanning.md)

---

## Кейс 4: IDOR / BOLA (доступ к чужим данным)

### Уязвимый код

```typescript
// routes/profile.ts
import { Request, Response } from 'express'
import { Order } from '../models/Order'
import { auth } from '../middleware/auth'

router.get('/orders/:id', auth, async (req: Request, res: Response) => {
  // УЯЗВИМО: не проверяется принадлежность заказа пользователю
  const order = await Order.findByPk(req.params.id)
  res.json(order)
})
```

### Описание риска

Любой аутентифицированный пользователь может прочитать заказы **других пользователей**, просто перебирая `id`:

```http
GET /orders/1 HTTP/1.1
Cookie: session=SOME_VALID_SESSION

GET /orders/2 HTTP/1.1
Cookie: session=SOME_VALID_SESSION

GET /orders/3 HTTP/1.1
Cookie: session=SOME_VALID_SESSION
```

Заказы содержат: имя, адрес доставки, телефон, email — **PII** (персональные данные). Утечка PII = нарушение GDPR/152-ФЗ, штрафы, репутационные потери.

Этот класс называется:
- **IDOR** (Insecure Direct Object Reference) — технический термин
- **BOLA** (Broken Object Level Authorization) — термин OWASP API Security Top 10

### Безопасное исправление

```typescript
// routes/profile.ts
import { Request, Response } from 'express'
import { Order } from '../models/Order'
import { auth } from '../middleware/auth'

router.get('/orders/:id', auth, async (req: Request, res: Response) => {
  // БЕЗОПАСНО: userId берётся из сессии, заказ фильтруется по владельцу
  const order = await Order.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id   // владелец из токена/сессии
    }
  })

  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }

  res.json(order)
})
```

Используй **непредсказуемые идентификаторы** (UUID) как второй уровень защиты:

```typescript
// Модель: id: UUID вместо sequence
id: {
  type: DataTypes.UUID,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true
}
```

### Проверка фикса

```bash
# До фикса: пользователь A читает заказ пользователя B
curl http://localhost:3000/orders/42 -H "Cookie: session=USER_A_SESSION"
# -> 200 OK с данными пользователя B

# После фикса: 404 Not Found (заказ не принадлежит пользователю A)
curl http://localhost:3000/orders/42 -H "Cookie: session=USER_A_SESSION"
# -> 404 {"error":"Order not found"}
```

### CWE

**CWE-639: Authorization Bypass Through User-Controlled Key**

- [CWE-639 на MITRE](https://cwe.mitre.org/data/definitions/639.html)
- [Knowledge: BOLA](../../../Knowledge/authorization/bola.md)
- [Knowledge: IDOR](../../../Knowledge/authorization/idor.md)

---

## Кейс 5: SSRF (Server-Side Request Forgery)

### Уязвимый код

```typescript
// routes/preview.ts
import { Request, Response } from 'express'
import axios from 'axios'

router.post('/preview', async (req: Request, res: Response) => {
  // УЯЗВИМО: URL принимается от клиента без валидации
  const { url } = req.body
  const { data } = await axios.get(url)
  res.json({ title: extractTitle(data) })
})
```

### Описание риска

Злоумышленник заставляет **сервер** делать запросы к внутренним ресурсам, недоступным напрямую из интернета:

```http
POST /preview HTTP/1.1
Content-Type: application/json

{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}
```

- **169.254.169.254** — AWS metadata endpoint: кража IAM-ключей
- **localhost:6379** — Redis без пароля: запись SSH-ключей / RCE
- **localhost:9200** — Elasticsearch: чтение данных
- **file:///etc/passwd** — чтение локальных файлов (если поддерживается)

**Capital One (2019):** SSRF через metadata endpoint привёл к краже данных 100 млн клиентов.

### Безопасное исправление

```typescript
// routes/preview.ts
import { Request, Response } from 'express'
import axios from 'axios'
import dns from 'dns/promises'

// Allowlist разрешённых хостов
const ALLOWED_HOSTS = new Set(['example.com', 'blog.example.com'])

// Запрещённые диапазоны (private, loopback, link-local)
const BLOCKED_IPS = [
  /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./
]

router.post('/preview', async (req: Request, res: Response) => {
  const { url } = req.body

  // 1. Валидация протокола
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only https URLs allowed' })
  }

  // 2. Проверка хоста по allowlist
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return res.status(400).json({ error: 'Host not allowed' })
  }

  // 3. DNS-rebinding: резолвим и проверяем IP
  const ips = await dns.lookup(parsed.hostname, { all: true })
  for (const { address } of ips) {
    if (BLOCKED_IPS.some(re => re.test(address))) {
      return res.status(400).json({ error: 'Internal IP blocked' })
    }
  }

  const { data } = await axios.get(url, {
    // Ограничение редиректов (проверять так же)
    maxRedirects: 0,
    timeout: 5000
  })
  res.json({ title: extractTitle(data) })
})
```

Дополнительно на уровне инфраструктуры:
- **Network policy**: исходящий трафик приложения только через proxy с allowlist
- **WAF**: блокировка `169.254.169.254`, private-диапазонов
- **IMDSv2**: использование токенов вместо открытого metadata endpoint

### Проверка фикса

```bash
# До фикса: сервер обращается к внутреннему ресурсу
curl -X POST http://localhost:3000/preview \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
# -> 200 OK с AWS credentials

# После фикса: 400 Bad Request
curl -X POST http://localhost:3000/preview \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
# -> 400 {"error":"Host not allowed"}
```

### CWE

**CWE-918: Server-Side Request Forgery (SSRF)**

- [CWE-918 на MITRE](https://cwe.mitre.org/data/definitions/918.html)
- [OWASP A10: SSRF](../../../Knowledge/owasp-top10/a10-ssrf.md)
- [Knowledge: SSRF](../../../Knowledge/web-security/ssrf.md)
- [Cheatsheet: SSRF](../../../Knowledge/cheatsheets/ssrf.md)

---

## Методология проведения Security Code Review

### Процесс (checklist)

```
[ ] 1. Определить trust boundaries (входные точки: req.body, req.query, headers, files)
[ ] 2. Проследить данные от входной точки до опасного sink
      (SQL query, eval, file write, redirect, network request)
[ ] 3. Проверить, применяется ли нейтрализация/валидация
[ ] 4. Оценить Impact x Likelihood (см. module-16-security-review)
[ ] 5. Зафиксировать: CWE, severity, рекомендация по фиксу
```

### Фокус на приоритетные файлы

| Файл/маршрут | Что искать |
|--------------|-----------|
| login/auth | SQLi, brute force, weak crypto, session fixation |
| upload/download | Path traversal, file type validation, size limits |
| checkout/orders | IDOR, Mass Assignment, business logic (negative totals) |
| redirect | Open redirect, SSRF |
| API CRUD | BOLA/IDOR, Mass Assignment, missing auth |
| CI/CD | Shell injection, hardcoded secrets, mutable tags |

### Чек-лист для каждого файла

| Вопрос | Да/Нет |
|--------|--------|
| Есть ли входные точки? (req.body, query, params, files) | |
| Есть ли выходные точки? (response, redirect, file, network) | |
| Вход валидируется? (тип, длина, формат, allowlist) | |
| Выход кодируется/экранируется? | |
| Используются параметризованные запросы? | |
| Есть ли проверка авторизации? (ownership, role) | |
| Секреты в environment, не в коде? | |
| Обработка ошибок не раскрывает внутренние детали? | |

---

## Выводы

1. **Топ-5 CWE в организации**: SQLi (CWE-89), Mass Assignment (CWE-915), Hardcoded Secrets (CWE-798), IDOR (CWE-639), SSRF (CWE-918) — покрывают большинство реальных инцидентов.
2. **Secure Code Review — обязательный этап SSDLC**: находит то, что не видят SAST/DAST (бизнес-логика, архитектура, дизайн).
3. **Фикс должен быть на уровне архитектуры**: параметризация, allowlist, server-side authorization, секреты из окружения.
4. **Проверь фикс автоматически**: добавь Semgrep-правило на паттерн уязвимости, чтобы не было регрессий.

---

## Связанные материалы

- [Knowledge: CWE Top 25](../../../Knowledge/cwe-top-25.md) — полный список CWE
- [Knowledge: Review Checklist](../../../Engineering/code-review/review-checklist.md) — чек-лист ревью
- [Juice Shop Module 16](../../juice-shop/module-16-security-review/report.md) — реальный review 20 уязвимостей
- [Case Study: Capital One SSRF](../../../case-studies/case03-capital-one-ssrf.md) — Capital One SSRF
- [Knowledge: OWASP Top 10](../../../Knowledge/owasp-top10/README.md) — категории