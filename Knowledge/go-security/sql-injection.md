# SQL Injection в Go — разбор уязвимости

> **Контекст:** Go — язык с сильной типизацией, но SQL-инъекции в нём возможны ровно там, где разработчик отказывается от параметризованных запросов в пользу конкатенации строк.

---

## Как работает SQL-инъекция в Go

Go-экосистема (`database/sql`, `pgx`, `sqlx`, `GORM`) предоставляет безопасные механизмы параметризации. Но ни один из них не является принудительным. Разработчик может обойти защиту, используя `fmt.Sprintf` для вставки пользовательского ввода в SQL-запрос.

---

## Уязвимый код (конкатенация)

```go
// Плохо: SQL-инъекция через fmt.Sprintf
func getUserByName(db *sql.DB, name string) (*User, error) {
    query := fmt.Sprintf("SELECT id, name, role FROM users WHERE name = '%s'", name)
    row := db.QueryRow(query)
    // ...
}
```

**Что происходит при `name = "admin' OR '1'='1"`:**
```sql
SELECT id, name, role FROM users WHERE name = 'admin' OR '1'='1'
```
Возвращает все строки. Обход аутентификации.

**Что происходит при `name = "'; DROP TABLE users; --"`:**
```sql
SELECT id, name, role FROM users WHERE name = ''; DROP TABLE users; --'
```
Удаление таблицы. Хотя `database/sql` по умолчанию не выполняет несколько statement'ов, некоторые драйверы (например, `go-sqlite3` с включённым multi-statement) — выполняют.

```go
// Тоже плохо: SQLi через strings.Builder
func searchProducts(db *sql.DB, keyword string) ([]Product, error) {
    var q strings.Builder
    q.WriteString("SELECT * FROM products WHERE name LIKE '%")
    q.WriteString(keyword)
    q.WriteString("%'")
    rows, err := db.Query(q.String())
    // ...
}
```

---

## Безопасный код (параметризованные запросы)

```go
// Хорошо: параметризованный запрос через database/sql
func getUserByName(db *sql.DB, name string) (*User, error) {
    row := db.QueryRow(
        "SELECT id, name, role FROM users WHERE name = $1", // PostgreSQL
        name,
    )
    var u User
    err := row.Scan(&u.ID, &u.Name, &u.Role)
    if err != nil {
        return nil, err
    }
    return &u, nil
}
```

**Для MySQL — плейсхолдер `?`:**
```go
row := db.QueryRow(
    "SELECT id, name, role FROM users WHERE name = ?", // MySQL
    name,
)
```

### Безопасный LIKE (поиск с подстановкой)

```go
// Хорошо: экранирование спецсимволов LIKE + параметризация
func searchProducts(db *sql.DB, keyword string) ([]Product, error) {
    // Экранируем спецсимволы LIKE: % и _
    escaped := strings.ReplaceAll(keyword, "%", "\\%")
    escaped = strings.ReplaceAll(escaped, "_", "\\_")
    rows, err := db.Query(
        "SELECT * FROM products WHERE name LIKE $1",
        "%"+escaped+"%",
    )
    // ...
}
```

### Безопасный IN (список значений)

```go
// Хорошо: динамический IN через параметризацию
func getUsersByIDs(db *sql.DB, ids []int) ([]User, error) {
    placeholders := make([]string, len(ids))
    args := make([]interface{}, len(ids))
    for i, id := range ids {
        placeholders[i] = fmt.Sprintf("$%d", i+1)
        args[i] = id
    }
    query := fmt.Sprintf(
        "SELECT id, name FROM users WHERE id IN (%s)",
        strings.Join(placeholders, ", "),
    )
    rows, err := db.Query(query, args...)
    // ...
}
```

---

## Semgrep-правило для обнаружения SQLi в Go

```yaml
rules:
  - id: go-sql-injection-sprintf
    patterns:
      - pattern: |
          $QUERY := fmt.Sprintf("...%s...", $INPUT)
          ...
          $DB.Query($QUERY, ...)
      - pattern-not: |
          $QUERY := fmt.Sprintf("...$1...", ...)
          ...
          $DB.Query($QUERY, ...)
    message: |
      Обнаружена SQL-инъекция: пользовательский ввод ($INPUT) вставляется в SQL-запрос
      через fmt.Sprintf. Используй параметризованный запрос:
        db.Query("SELECT ... WHERE name = $1", input)
      Никогда не вставляй пользовательский ввод напрямую в строку SQL-запроса.
    severity: ERROR
    languages: [go]

  - id: go-sql-injection-string-concat
    patterns:
      - pattern-either:
          - pattern: |
              $QUERY := "SELECT" + ... + $INPUT + ...
              ...
              $DB.Query($QUERY, ...)
          - pattern: |
              $QUERY := "SELECT" + ... + $INPUT + ...
              ...
              $DB.Exec($QUERY, ...)
    message: |
      Конкатенация строк в SQL-запросе с пользовательским вводом.
      Замени на параметризованный запрос: db.Query("SELECT ... WHERE x = $1", input)
    severity: ERROR
    languages: [go]

  - id: go-sql-sprintf-raw
    pattern: |
      $DB.Query(fmt.Sprintf("...", $INPUT), ...)
    message: |
      fmt.Sprintf в аргументе Query/Exec — потенциальная SQL-инъекция.
      Используй параметризованный запрос.
    severity: ERROR
    languages: [go]

  - id: go-sql-query-row-sprintf
    pattern: |
      $DB.QueryRow(fmt.Sprintf("...", $INPUT), ...)
    message: |
      fmt.Sprintf в аргументе QueryRow — потенциальная SQL-инъекция.
      Используй параметризованный запрос.
    severity: ERROR
    languages: [go]
```

### Тестирование правил

```bash
# Запуск кастомного правила на Go-проекте
semgrep --config go-sql-injection.yaml ./...
```

### Ожидаемые находки

| Правило | True positive | False positive |
|---------|---------------|----------------|
| `go-sql-injection-sprintf` | `fmt.Sprintf("SELECT ... '%s'", userInput)` -> `db.Query()` | Формирование имени таблицы/колонки из конфига (не пользовательский ввод) |
| `go-sql-injection-string-concat` | `"SELECT * FROM users WHERE id = " + req.FormValue("id")` | Сборка статического запроса из констант |
| `go-sql-sprintf-raw` | `db.Query(fmt.Sprintf(..., input))` с единственным аргументом | `fmt.Sprintf` для динамического IN (допустимо если аргументы параметризованы) |

---

## Другие типичные уязвимости в Go

### Command Injection

```go
// Плохо: пользовательский ввод передаётся в shell
func convertImage(filename string) error {
    cmd := exec.Command("sh", "-c", "convert "+filename+" output.png")
    return cmd.Run()
}
// filename = "test; cat /etc/passwd" -> чтение /etc/passwd
```

```go
// Хорошо: аргументы без shell
func convertImage(filename string) error {
    cmd := exec.Command("convert", filename, "output.png")
    return cmd.Run()
}
```

### SSRF

```go
// Плохо: http.Get с невалидированным URL
func fetchURL(rawURL string) (*http.Response, error) {
    return http.Get(rawURL)
}
// rawURL = "http://169.254.169.254/latest/meta-data/" -> AWS metadata
```

```go
// Хорошо: валидация URL перед запросом
func fetchURL(rawURL string) (*http.Response, error) {
    u, err := url.Parse(rawURL)
    if err != nil {
        return nil, err
    }
    if u.Scheme != "https" {
        return nil, fmt.Errorf("only https allowed, got %s", u.Scheme)
    }
    // Запрет internal IP через net.LookupIP + проверка диапазонов
    // Allowlist доменов: u.Hostname() in allowedDomains
    client := &http.Client{Timeout: 10 * time.Second}
    return client.Get(u.String())
}
```

### Path Traversal

```go
// Плохо: прямая конкатенация пути
func readFile(filename string) ([]byte, error) {
    return os.ReadFile("/var/data/" + filename)
}
// filename = "../../etc/passwd" -> чтение /etc/passwd
```

```go
// Хорошо: filepath.Clean + проверка префикса
func readFile(filename string) ([]byte, error) {
    basePath := "/var/data/"
    fullPath := filepath.Clean(filepath.Join(basePath, filename))
    if !strings.HasPrefix(fullPath, basePath) {
        return nil, fmt.Errorf("path traversal attempt: %s", filename)
    }
    return os.ReadFile(fullPath)
}
```

---

## Interview Questions

| Вопрос | Ответ |
|--------|-------|
| Защищает ли `database/sql` от SQL-инъекций автоматически? | Нет. `database/sql` предоставляет плейсхолдеры (`$1`, `?`), но не запрещает конкатенацию строк. Защита работает только если разработчик использует параметризованные запросы. |
| Можно ли параметризовать имя таблицы или колонки? | Нет. Плейсхолдеры работают только для значений. Имена таблиц/колонок нужно валидировать через allowlist: `if !slices.Contains(allowedColumns, columnName) { return err }`. |
| Чем опасно использование `math/rand`? | `math/rand` — детерминированный генератор, не криптостойкий. Для токенов, ключей, сессий — только `crypto/rand`. |
| Как в Go проверить сертификат при HTTPS-запросе? | По умолчанию `net/http` проверяет сертификат. Если кастомный `tls.Config`, не выставлять `InsecureSkipVerify: true`. |

---

## Lessons Learned

- Параметризованные запросы (`$1`, `?`) — единственный правильный способ вставки пользовательских данных в SQL.
- Никакая обёртка/ORM не гарантирует безопасность — GORM.Raw() с конкатенацией так же уязвим, как database/sql с конкатенацией.
- Semgrep-правила для Go должны искать не только fmt.Sprintf + Query, но и strings.Builder + Query, string concat + Query.
- Экранирование (`strings.ReplaceAll`) не делает конкатенацию безопасной — только параметризация.