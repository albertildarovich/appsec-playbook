# Secure Coding Guidelines

## Определение

Secure Coding Guidelines — это набор правил и рекомендаций, которые разработчики должны соблюдать при написании кода.

## Общие принципы

### 1. Input Validation
- Всегда валидировать на сервере (клиентская валидация — только UX)
- Использовать allowlist (не blacklist)
- Проверять: тип, длину, формат, диапазон

### 2. Output Encoding
- Всегда экранировать вывод в соответствии с контекстом
- Использовать autoescaping в шаблонизаторах
- Избегать innerHTML

### 3. Authentication
- PreparedStatement для всех SQL
- Не конкатенировать SQL строки
- Использовать ORM с параметризацией

### 4. Cryptography
- Не писать свою криптографию
- Использовать проверенные библиотеки
- Правильно настраивать параметры

## Язык-специфичные правила

### JavaScript / TypeScript

```javascript
// [NO] ОПАСНО
element.innerHTML = userInput;
eval(userInput);
const sql = `SELECT * FROM users WHERE id = ${id}`;

// [OK] БЕЗОПАСНО
element.textContent = userInput;
JSON.parse(userInput);
const sql = 'SELECT * FROM users WHERE id = $1';
```

**React специфика:**
```tsx
// [NO] ОПАСНО
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// [OK] БЕЗОПАСНО
<div>{userComment}</div>
```

### Python

```python
# [NO] ОПАСНО
query = f"SELECT * FROM users WHERE id = {user_id}"
return render_template_string("Hello " + user_input)

# [OK] БЕЗОПАСНО
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
return render_template("hello.html", name=escape(user_input))
```

### Java

```java
// [NO] ОПАСНО
String sql = "SELECT * FROM users WHERE id = " + id;
Statement stmt = conn.createStatement();

// [OK] БЕЗОПАСНО
PreparedStatement ps = conn.prepareStatement(
    "SELECT * FROM users WHERE id = ?"
);
ps.setInt(1, id);
```

### PHP

```php
// [NO] ОПАСНО
echo "Hello, " . $_GET['name'];
$sql = "SELECT * FROM users WHERE id = " . $id;

// [OK] БЕЗОПАСНО
<?= htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8') ?>
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);
```

### Go

```go
// [NO] ОПАСНО
query := fmt.Sprintf("SELECT * FROM users WHERE id = %s", id)
tmpl := template.Must(template.New("").Parse(userInput))

// [OK] БЕЗОПАСНО
db.Query("SELECT * FROM users WHERE id = $1", id)
tmpl, _ := template.New("").Parse("Hello {{.}}")
```

## Dependency Security

```bash
# Еженедельно
npm audit      # Node.js
pip audit      # Python
go list -m     # Go
trivy fs .     # Universal
```

### Правила:
- Не использовать библиотеки с known vulnerabilities
- Минимизировать зависимости
- Использовать lock файлы (package-lock.json, go.sum)
- Регулярно обновлять зависимости
- Не использовать unmaintained пакеты

## Secrets Management

### Что нельзя хранить в коде:
- Пароли
- API keys
- Database connection strings
- Private keys
- Tokens

### Где хранить:
```yaml
CI/CD: GitHub Secrets / GitLab CI Variables
Local: .env (в .gitignore!)
Cloud: AWS Secrets Manager / HashiCorp Vault
K8s: External Secrets Operator
```

## Error Handling

### Правила:
```javascript
// [NO] ОПАСНО — раскрытие деталей
catch(err) {
    res.send(`Error: ${err.message}`);
}

// [OK] БЕЗОПАСНО — generic message
catch(err) {
    log.error(err);
    res.status(500).send("Internal Server Error");
}
```

## Logging

### Что логировать:
- Authentication events (success/failure)
- Authorization failures
- Sensitive data access
- Configuration changes
- Errors

### Что НЕ логировать:
- Passwords
- Tokens
- PII
- Session IDs
- Credit cards

## Ключевые тезисы

- Secure coding — ответственность разработчика, не AppSec
- Autoescaping в шаблонизаторах — базовая защита
- PreparedStatement — единственный способ защититься от SQLi
- Не писать свою криптографию
- Secrets не должны быть в коде
- Dependency scanning — обязательный шаг
- Error handling не должен раскрывать детали
