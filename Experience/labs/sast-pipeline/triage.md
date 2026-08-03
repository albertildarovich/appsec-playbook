# Triage: False Positive vs True Positive

> **Цель:** Показать процесс разбора (triage) находок SAST-инструментов. Как отличить реальную уязвимость от ложного срабатывания.

## Процесс триажа

```
SAST-находка
    |
    v
[1] Понимаем код       - читаем контекст, типы данных, что защищает код
    |
    v
[2] Проверяем ввод     - может ли пользователь контролировать источник данных?
    |
    v
[3] Проверяем sink     - достигнет ли поток данных опасной функции?
    |
    v
[4] Проверяем фиксы    - есть ли защита (экранирование, параметризация, allowlist)?
    |
    v
[5] Вердикт: TP / FP / требует уточнения
```

---

## Кейс 1: SQL Injection — True Positive

### Находка

Semgrep: `sql-query-concatenation` в `routes/search.ts`

```typescript
// routes/search.ts
models.sequelize.query(
  "SELECT * FROM Products WHERE ((name LIKE '%" + criteria +
  "%' OR description LIKE '%" + criteria +
  "%') AND deletedAt IS NULL) ORDER BY name"
)
```

### Разбор

| Шаг | Вопрос | Ответ |
|-----|--------|-------|
| 1 | Что за код? | Хранимый SQL-запрос в Express-роуте |
| 2 | Контролирует ли пользователь ввод? | Да, `criteria = req.query.q` |
| 3 | Достигает ли ввод sink? | Да, конкатенация в `sequelize.query()` |
| 4 | Есть ли защита? | Нет, нет параметризации, нет экранирования |

**Вердикт: True Positive (TP)**

Проверка: `GET /rest/products/search?q=' OR 1=1--` возвращает все товары.

### Фикс

```typescript
// Безопасно: параметризованный запрос
models.sequelize.query(
  "SELECT * FROM Products WHERE ((name LIKE :q OR description LIKE :q) AND deletedAt IS NULL) ORDER BY name",
  { replacements: { q: `%${criteria}%` }, type: QueryTypes.SELECT }
)
```

**CWE-89 (SQL Injection)** | Severity: CRITICAL

---

## Кейс 2: Hardcoded JWT Secret — True Positive

### Находка

Semgrep: `hardcoded-jwt-secret` в `lib/insecurity.ts`

```typescript
// lib/insecurity.ts
const jwtSecret = 'e731dl;d;1l2j3oi1j4oi2j34io23j4i23j431j413;j4;j'
```

### Разбор

| Шаг | Вопрос | Ответ |
|-----|--------|-------|
| 1 | Что за код? | Секрет подписи JWT в исходниках |
| 2 | Контролирует ли пользователь ввод? | Секрет попадает в git-репозиторий |
| 3 | Достигает ли ввод sink? | Любой, кто прочитал код, подпишет токен |
| 4 | Есть ли защита? | Нет, секрет одинаковый на всех окружениях |

**Вердикт: True Positive (TP)**

Проверка: подделываем JWT с `role: admin`, сервер его принимает.

### Фикс

```typescript
// Безопасно: секрет из окружения
const jwtSecret = process.env.JWT_SECRET  // в Vault / CI/CD variable
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET not configured or too weak')
}
```

**CWE-798 (Hardcoded Credentials)** | Severity: CRITICAL

---

## Кейс 3: Hardcoded API Key в тестах — False Positive

### Находка

Semgrep: `detected-generic-secret` в `test/fixtures/config.ts`

```typescript
// test/fixtures/config.ts
export const testApiKey = 'sk_test_51H3x...'
```

### Разбор

| Шаг | Вопрос | Ответ |
|-----|--------|-------|
| 1 | Что за код? | Тестовая фикстура для unit-тестов |
| 2 | Контролирует ли пользователь ввод? | Файл в тестовой директории, не в production |
| 3 | Достигает ли ввод sink? | Нет, ключ захардкожен только для моков Stripe |
| 4 | Есть ли защита? | Ключ `sk_test_` — тестовый, не имеет доступа к реальным деньгам |

**Вердикт: False Positive (FP)**

Ключ — тестовый (`sk_test_`), живёт в `test/`, никогда не попадает в production-окружение (Semgrep не учитывает контекст директории).

### Действие

Добавить исключение в конфигурации Semgrep:

```yaml
# .semgrepignore
test/fixtures/*
```

**Важно:** FP не означает «инструмент плохой». Правило `detected-generic-secret` предназначено для production-кода. В тестовых фикстурах использование статичных ключей — нормальная практика.

---

## Кейс 4: XSS через dangerouslySetInnerHTML — сомнительно, уточнить

### Находка

Semgrep: `react-dangerouslysetinnerhtml` в `components/ProductCard.tsx`

```tsx
// components/ProductCard.tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: product.description }} />
  )
}
```

### Разбор

| Шаг | Вопрос | Ответ |
|-----|--------|-------|
| 1 | Что за код? | React-компонент, рендерит HTML |
| 2 | Контролирует ли пользователь ввод? | `product.description` из БД, может быть изменён админом или через Mass Assignment |
| 3 | Достигает ли ввод sink? | Да, `__html` рендерится в DOM без экранирования |
| 4 | Есть ли защита? | Не видно. Нужно проверить источник и валидацию `description` на сервере |

**Требует уточнения:** Вердикт зависит от того, кто может писать `description`:
- Только доверенные админы + серверная санитизация HTML → **FP**
- Любой пользователь (например, через отзывы) → **TP**

### Действие

Запросить использование `description` в коде:

```bash
grep -rn "description" src/ --include="*.ts" | grep -i "create\|update"
```

---

## Кейс 5: Path Traversal с защитой — False Positive

### Находка

Semgrep: `path-traversal-taint-fs` в `routes/download.ts`

```typescript
// routes/download.ts
app.get('/download/:filename', (req, res) => {
  const safeDir = path.join(__dirname, '..', 'public')
  const filePath = path.resolve(safeDir, req.params.filename)

  // Защита: файл должен находиться внутри safeDir
  if (!filePath.startsWith(safeDir + path.sep)) {
    return res.status(403).send('Forbidden')
  }

  res.sendFile(filePath)
})
```

### Разбор

| Шаг | Вопрос | Ответ |
|-----|--------|-------|
| 1 | Что за код? | Download-эндпоинт с проверкой пути |
| 2 | Контролирует ли пользователь ввод? | Да, `req.params.filename` |
| 3 | Достигает ли ввод sink? | Да, `sendFile(filePath)` |
| 4 | Есть ли защита? | Да, проверка `startsWith(safeDir)` — файл должен быть внутри `public/` |

**Вердикт: False Positive (FP)**

Защита реальная: `startsWith(safeDir + path.sep)` блокирует выход за пределы директории. Semgrep (trusted by default) не учитывает наличие валидации.

### Действие

Добавить `pattern-not` в правило или allowlist:

```yaml
# rules/path-traversal-taint-fs.yaml
patterns:
  - pattern-inside: |
      if (!$FILEPATH.startsWith($SAFE_DIR + path.sep)) { ... }
    pattern-not: $FS_METHOD($FILEPATH)
```

**Важно:** Перед добавлением в allowlist всегда проверять, что защита покрывает все случаи (например, `..%2f` URL-encoding).

---

## Итоговая таблица

| # | Находка | Файл | Вердикт | CWE | Почему |
|---|---------|------|---------|-----|--------|
| 1 | SQL concat | `routes/search.ts` | TP | CWE-89 | Пользовательский ввод в `sequelize.query()` без параметризации |
| 2 | JWT secret | `lib/insecurity.ts` | TP | CWE-798 | Секрет в git, подпись любого токена |
| 3 | API key | `test/fixtures/config.ts` | FP | CWE-798 | Тестовый `sk_test_`, не в production |
| 4 | XSS `__html` | `components/ProductCard.tsx` | Уточнить | CWE-79 | Зависит от источника `description` |
| 5 | Path traversal | `routes/download.ts` | FP | CWE-22 | Есть защита `startsWith(safeDir)` |

---

## Статистика типичного триажа

| Класс правила | % TP | % FP | Комментарий |
|---------------|------|------|-------------|
| Taint (SQLi, XSS) | 60-80% | 20-40% | Зависит от количества тестовых данных |
| Hardcoded secrets | 30-50% | 50-70% | Много тестовых ключей в фикстурах |
| Pattern (eval, concat) | 70-90% | 10-30% | Точные паттерны, мало шума |
| Security headers | 5-20% | 80-95% | Много FPs: заголовки могут ставиться на прокси/WAF |

**Практический совет:** Не удаляйте FP-находки молча — добавляйте их в allowlist с комментарием «почему». Это позволяет через 6 месяцев понять, почему конкретное срабатывание было пропущено.