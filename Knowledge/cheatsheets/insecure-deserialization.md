# Insecure Deserialization Cheatsheet

> Быстрая справка по Insecure Deserialization.

---

## Что искать на Code Review

```bash
# Java — опасные API
grep -rn "ObjectInputStream\|readObject\|readUnshared" src/ --include="*.java"
grep -rn "readResolve\|readExternal" src/ --include="*.java"

# Python — pickle
grep -rn "pickle.load\|pickle.loads\|cPickle\|pickle.Unpickler" src/ --include="*.py"

# PHP — unserialize
grep -rn "unserialize" src/ --include="*.php"
# PHP — магические методы, которые могут быть использованы в gadget chains
grep -rn "__wakeup\|__destruct\|__toString\|__call\|__sleep" src/ --include="*.php"

# Node.js
grep -rn "unserialize\|deserialize\|node-serialize\|serialize\." src/ --include="*.js"
grep -rn "eval(JSON.parse" src/ --include="*.js"  # опасный паттерн

# Ruby
grep -rn "Marshal.load\|Marshal.restore\|YAML.load\|YAML.safe_load\|Oj.load" src/ --include="*.rb"

# .NET
grep -rn "BinaryFormatter\|DataContractSerializer\|JavaScriptSerializer\|NetDataContractSerializer" src/ --include="*.cs"
grep -rn "Deserialize\|SoapFormatter\|LosFormatter" src/ --include="*.cs"

# JSON с контролем типа (@class, @type)
grep -rn "@class\|@type\|_type\|typeref\|enableDefaultTyping" src/ --include="*.json" --include="*.java" --include="*.py"
```

---

## Известные Gadget Chains

### Java

| Библиотека | Проблема |
|------------|----------|
| **Apache Commons Collections** | Классическая gadget chain для RCE |
| **Jackson** | `@class` атрибут при включённом `enableDefaultTyping()` |
| **Fastjson** | Поле `@type` — RCE через автотипизацию |
| **Spring** | RCE через десериализацию |
| **Hibernate** | SQLi / RCE через прокси-объекты |
| **JBoss** | RCE через инвокацию MBean |
| **WebLogic** | RCE через T3-протокол |

### Python

| Библиотека / Компонент | Проблема |
|------------------------|----------|
| **pickle** | `pickle.loads()` — RCE через `__reduce__` |
| **PyYAML** | `yaml.load()` — RCE через создание произвольных объектов |
| **Flask** | `flask.sessions` с PickleSerializer (если секретный ключ скомпрометирован) |

### PHP

| Библиотека / Компонент | Проблема |
|------------------------|----------|
| **PHPGGC (Generic Gadget Chains)** | Инструмент для генерации payload под Guzzle, SwiftMailer, Monolog, Doctrine и др. |
| **Laravel** | RCE через десериализацию |
| **Drupal** | RCE через `__destruct` / `__wakeup` (CVE-2019-6340 и др.) |

### .NET

| Библиотека / Компонент | Проблема |
|------------------------|----------|
| **BinaryFormatter** | RCE через десериализацию (Microsoft официально считает небезопасным) |
| **Newtonsoft.Json** | RCE при включённом `TypeNameHandling` |
| **ViewState** | RCE через манипуляцию ViewState (если MAC не настроен) |

### Ruby

| Библиотека / Компонент | Проблема |
|------------------------|----------|
| **Marshal.load** | RCE через десериализацию |
| **YAML.load** | RCE через создание символов и объектов |

---

## Безопасные паттерны

### Java

```java
// [NO] ОПАСНО — десериализация без проверки
ObjectInputStream in = new ObjectInputStream(request.getInputStream());
Object obj = in.readObject();

// [OK] БЕЗОПАСНО — JSON с известным типом
ObjectMapper mapper = new ObjectMapper();
User user = mapper.readValue(json, User.class);

// [OK] ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА — LookAheadObjectInputStream
public class SafeObjectInputStream extends ObjectInputStream {
    private final Set<String> ALLOWED_CLASSES = Set.of(
        "com.app.User", "com.app.Order"
    );

    @Override
    protected Class<?> resolveClass(ObjectStreamClass desc) throws IOException {
        if (!ALLOWED_CLASSES.contains(desc.getName())) {
            throw new InvalidClassException(desc.getName(), "Class not allowed");
        }
        return super.resolveClass(desc);
    }
}
```

### Python

```python
# [NO] ОПАСНО — pickle с пользовательскими данными
import pickle
data = pickle.loads(request.body)  # RCE

# [OK] БЕЗОПАСНО — JSON
import json
data = json.loads(request.body)

# [WARN] ЕСЛИ PICKLE НЕОБХОДИМ — safe unpickle
# Но это сложно, лучше не использовать pickle с данными от пользователя
```

### PHP

```php
// [NO] ОПАСНО — unserialize с пользовательскими данными
$user = unserialize($_POST['data']);  // RCE через __wakeup / __destruct

// [OK] БЕЗОПАСНО — JSON
$user = json_decode($_POST['data']);

// [OK] Чуть безопаснее — разрешённые классы (PHP 7+)
$user = unserialize($data, ['allowed_classes' => ['User', 'Order']]);
// Внимание: это НЕ гарантирует безопасность, если классы содержат опасные методы
```

### Node.js

```javascript
// [NO] ОПАСНО — node-serialize
const serialize = require('node-serialize');
const obj = serialize.unserialize(req.body.data);  // RCE

// [NO] ОПАСНО — unsafe JSON.parse с eval
const obj = eval('(' + req.body.data + ')');  // RCE

// [OK] БЕЗОПАСНО — JSON.parse
const obj = JSON.parse(req.body.data);
```

### Ruby

```ruby
# [NO] ОПАСНО — Marshal.load
data = Marshal.load(params[:data])  # RCE

# [NO] ОПАСНО — YAML.load (может создавать объекты)
data = YAML.load(params[:data])

# [OK] БЕЗОПАСНО — JSON.parse
require 'json'
data = JSON.parse(params[:data])

# [WARN] Чуть безопаснее — YAML.safe_load
data = YAML.safe_load(params[:data])  # не создаёт произвольные объекты
```

### .NET (C#)

```csharp
// [NO] ОПАСНО — BinaryFormatter (Microsoft не рекомендует)
BinaryFormatter formatter = new BinaryFormatter();
object obj = formatter.Deserialize(stream);

// [NO] ОПАСНО — SoapFormatter / LosFormatter
SoapFormatter soap = new SoapFormatter();
object obj = soap.Deserialize(stream);

// [OK] БЕЗОПАСНО — JSON
var user = JsonSerializer.Deserialize<User>(jsonString);

// [OK] БЕЗОПАСНО — XML (без DTD)
var serializer = new XmlSerializer(typeof(User));
var user = (User)serializer.Deserialize(reader);
```

### Go (безопасно)

```go
// [OK] БЕЗОПАСНО — json.Unmarshal
var user User
err := json.Unmarshal(jsonData, &user)

// [OK] БЕЗОПАСНО — encoding/gob для внутренних протоколов
// goob не предназначен для недоверенных данных, но не выполняет произвольный код

// [NO] ОСТОРОЖНО — рефлексия с типом от пользователя
var user = reflect.New(userType).Interface()
json.Unmarshal(data, user)  // если userType от пользователя — риск
```

### Rust (безопасно)

```rust
// [OK] БЕЗОПАСНО — serde_json
let user: User = serde_json::from_str(json_data)?;

// [OK] БЕЗОПАСНО — serde с Protobuf / MessagePack и т.д.
// Все serde десериализаторы работают с известными типами
```

---

## Проверка после фикса

```bash
# 1. Проверить, что приложение не принимает сериализованные объекты
curl -X POST "https://target.com/api/data" \
  -H "Content-Type: application/x-java-object" \
  --data-binary "@payload.ser"
# Должен вернуть 400/415, не 200

# 2. Проверить Content-Type
curl -X POST "https://target.com/api/data" \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'
# Должен работать, если JSON разрешён

# 3. Проверить, что @class/@type игнорируется
curl -X POST "https://target.com/api/data" \
  -H "Content-Type: application/json" \
  -d '{"@class": "java.lang.Runtime", "name": "test"}'
# Должен игнорировать @class или вернуть ошибку
```

---

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| "Insecure Deserialization — это только Java" | Python (`pickle`), PHP (`unserialize`), .NET (`BinaryFormatter`), Ruby (`Marshal.load`) — все могут быть уязвимы |
| Использование Java Serialization для HTTP | Любой `ObjectInputStream` с пользовательскими данными — риск |
| `enableDefaultTyping()` в Jackson | Позволяет злоумышленнику выбирать тип через `@class` |
| Blacklist классов в `resolveClass` | Легко обходится — лучше allowlist |
| Использование `pickle` в Python | Pickle не предназначен для недоверенных данных |
| `unserialize()` в PHP без allowed_classes | Любая gadget chain сработает |
| BinaryFormatter в .NET | Microsoft официально не рекомендует |
| Старая версия библиотеки | Известные gadget chains в Commons Collections, Log4j и др. |
| Десериализация ради кэширования | Данные в кэше могут быть отравлены |

---

## Когда JSON становится опасным

```java
// [NO] ОПАСНО — enableDefaultTyping
ObjectMapper mapper = new ObjectMapper();
mapper.enableDefaultTyping();  // разрешает @class
User user = mapper.readValue(json, User.class);
// Злоумышленник может подставить любой класс через "@class": "..."

// [OK] БЕЗОПАСНО — без default typing
ObjectMapper mapper = new ObjectMapper();
User user = mapper.readValue(json, User.class);
// @class игнорируется, создаётся только User
```

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-502** | Deserialization of Untrusted Data |
| **CWE-184** | Incomplete List or Blacklist |
| **CWE-915** | Improperly Controlled Modification of Dynamically-Determined Object Attributes |
| **CWE-470** | Use of Externally-Controlled Input to Select Classes or Code ('Unsafe Reflection') |
| **CWE-134** | Use of Externally-Controlled Format String |
