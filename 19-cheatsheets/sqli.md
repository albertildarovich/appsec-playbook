# SQL Injection Cheatsheet

## Обнаружение

```sql
-- Error detection
'
''
'-- -
';-- -

-- Boolean-based
' OR 1=1 --
' OR 1=2 --

-- Union-based
' UNION SELECT NULL --
' UNION SELECT NULL,NULL,NULL --

-- Time-based (MySQL)
' OR SLEEP(5) --
' OR BENCHMARK(5000000,MD5('test')) --

-- Time-based (MSSQL)
'; WAITFOR DELAY '0:0:5' --

-- Time-based (PostgreSQL)
'; SELECT pg_sleep(5) --
```

## Код-ревью: что искать

```bash
# Опасные функции
grep -rn "Statement" src/           # Java — не PreparedStatement
grep -rn "executeQuery" src/        # SQL запрос
grep -rn "createNativeQuery" src/   # JPA сырой запрос
grep -rn "rawQuery" src/            # Room / ORM сырой запрос
grep -rn ".exec(" src/              # Node.js SQL

# Динамическая сборка
grep -rn "concat.*SELECT" src/
grep -rn "ORDER BY.*+" src/         # Динамический ORDER BY
grep -rn "GROUP BY.*+" src/         # Динамический GROUP BY
```

## Безопасные паттерны

```java
// Java
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
ps.setInt(1, id);
```

```python
# Python
cursor.execute("SELECT * FROM users WHERE id = %s", (id,))
```

```javascript
// Node.js (pg)
await client.query('SELECT * FROM users WHERE id = $1', [id]);
```

```php
// PHP
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);
```

## Динамический ORDER BY (allowlist)

```python
# Уязвимо
query = f"SELECT * FROM users ORDER BY {user_input}"

# Безопасно — allowlist
ALLOWED_COLUMNS = ['name', 'email', 'created_at']
if user_input not in ALLOWED_COLUMNS:
    raise ValueError("Invalid sort column")
query = f"SELECT * FROM users ORDER BY {user_input}"
```

## Проверка после фикса

```bash
# Проверить, что параметризация работает
curl "https://target.com/users?id=1' OR 1=1 --"
# Должен вернуть одного пользователя (не всех)

# Проверить error handling
curl "https://target.com/users?id=1'"
# Должен вернуть generic error, не SQL ошибку
```

## Связанные CWE
- **CWE-89**: SQL Injection
- **CWE-564**: Hibernate Injection
- **CWE-943**: NoSQL Injection
вавава