# Go Security

Типичные уязвимости в Go-приложениях: разбор, Semgrep-правила, безопасные паттерны.

## Структура раздела

| Файл | Что внутри |
|------|------------|
| [sql-injection.md](sql-injection.md) | SQL-инъекция в Go: небезопасная конкатенация vs параметризованные запросы, Semgrep-правило для обнаружения, обзор других типичных уязвимостей (command injection, SSRF, path traversal, crypto) |

## Типичные уязвимости в Go (краткий обзор)

| Уязвимость | Типичная ошибка | Безопасный паттерн |
|------------|-----------------|-------------------|
| **SQL Injection** | `fmt.Sprintf("SELECT * FROM users WHERE id = %s", userInput)` | `db.Query("SELECT * FROM users WHERE id = $1", userInput)` |
| **Command Injection** | `exec.Command("sh", "-c", "grep "+userInput+" /var/log/app.log")` | `exec.Command("grep", userInput, "/var/log/app.log")` — без shell |
| **SSRF** | `http.Get(userURL)` без валидации URL | Валидация схемы и хоста, allowlist доменов, запрет internal IP |
| **Path Traversal** | `os.Open("/var/data/" + userFile)` | `filepath.Clean`, проверка что результат в пределах разрешённой директории |
| **Crypto** | `math/rand` для токенов/ключей | `crypto/rand` |
| **Unsafe deserialization** | `encoding/gob` на недоверенных данных | JSON + строгая валидация структуры, подпись/шифрование |

## Связанные разделы

- [DevSecOps](../devsecops/devsecops.md) — SAST (Semgrep) в CI/CD
- [SQL Injection](../web-security/sqli.md) — общая теория SQLi
- [OWASP Top 10: Injection](../owasp-top10/a03-injection.md) — инъекции в OWASP