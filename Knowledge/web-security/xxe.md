# XXE (XML External Entity)

> Уязвимость, возникающая, когда XML-парсер разрешает обработку внешних сущностей (External Entities).
>
> В результате злоумышленник может заставить сервер:
> - читать локальные файлы
> - выполнять HTTP-запросы
> - обращаться к внутренним сервисам
> - вызвать отказ в обслуживании (DoS)

---

## Когда возникает XXE

Когда приложение:
1. принимает XML от пользователя
2. передаёт его XML-парсеру
3. **не отключает обработку внешних сущностей**

```java
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
DocumentBuilder builder = factory.newDocumentBuilder();
Document document = builder.parse(request.getInputStream());
```

Сам по себе `parse()` безопасен. Проблема возникает, если **парсер настроен небезопасно**.

---

## Почему XML вообще используется

Хотя JSON встречается чаще, XML до сих пор применяется:

- **SOAP** Web Services
- **SAML** (SSO)
- Банковские и государственные интеграции
- Office-документы (`.docx`, `.xlsx`)
- Конфигурационные файлы Java (`.xml`)
- Корпоративные интеграции (ERP, CRM)

---

## Что такое External Entity

Обычная сущность:

```xml
<!ENTITY username "Alex">
```

Парсер подставляет: `Alex`

Но злоумышленник может написать:

```xml
<!ENTITY secret SYSTEM "file:///etc/passwd">
```

Парсер попробует **открыть файл на сервере**.

---

## Чем опасен XXE

### 1. Чтение файлов

```
/etc/passwd
application.yml
config.properties
```

Можно получить: пароли, API-ключи, токены, строки подключения к БД.

### 2. SSRF

Парсер может обратиться по URL:

```xml
<!ENTITY xxe SYSTEM "http://internal-api/admin">
```

Таким образом XXE может стать **способом эксплуатации SSRF**.

### 3. DoS (Billion Laughs Attack)

```xml
<!ENTITY lol "lol">
<!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
<!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
...
```

Парсер начинает бесконечно раскрывать сущности и расходует **CPU и память**.

---

## Как искать XXE на Code Review

Ищи использование XML-парсеров:

```bash
grep -rn "DocumentBuilderFactory" src/
grep -rn "SAXParserFactory" src/
grep -rn "XMLInputFactory" src/
grep -rn "TransformerFactory" src/
grep -rn "XMLReader" src/
```

И смотри, **отключены ли опасные возможности**.

---

## Как защищаться

### 1. Лучший вариант — отключить всё опасное

Отключить:
- External Entities
- DOCTYPE
- загрузку внешних DTD

Это рекомендация OWASP и безопасная настройка по умолчанию.

```java
// Java — безопасная конфигурация
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

```python
# Python — безопасная конфигурация (lxml)
from lxml import etree

parser = etree.XMLParser(
    resolve_entities=False,
    no_network=True,
    dtd_validation=False,
    load_dtd=False
)
```

```javascript
// Node.js — безопасная конфигурация (libxmljs)
const libxml = require('libxmljs');

const options = {
    noent: false,    // не раскрывать entities
    nonet: true,     // не ходить в сеть
    dtdload: false,
    dtdvalid: false
};
```

### 2. Если отключить нельзя

Ограничить возможности парсера:
- запретить доступ к файловой системе
- запретить сетевые обращения
- разрешить только необходимые источники

### 3. Least Privilege

Сервис, который парсит XML:
- **не должен** иметь доступ к секретам
- **не должен** иметь доступ к базе данных, если она ему не нужна
- **не должен** иметь избыточных прав в ОС

Даже если XXE будет успешно использована, **последствия будут минимальными**.

### 4. Defense in Depth

Использовать несколько уровней защиты:

1. Безопасная конфигурация XML-парсера
2. Минимальные привилегии процесса
3. Сегментация сети
4. Контейнеризация (readOnlyRootFilesystem)
5. Мониторинг и логирование

---

## Может ли SAST найти XXE?

**Да, во многих случаях.** SAST способен обнаружить:
- использование XML-парсеров
- отсутствие безопасных настроек (`setFeature(...)`)
- потенциально опасную конфигурацию

Но SAST не может гарантировать, что XXE действительно эксплуатируема — это зависит от конфигурации, среды выполнения и бизнес-контекста.

---

## Что любят спрашивать на интервью

| Вопрос | Ответ |
|--------|-------|
| **Что такое XXE?** | Возможность заставить XML-парсер обработать внешнюю сущность, что может привести к чтению файлов, SSRF или DoS |
| **Почему XXE опасна?** | Злоумышленник получает возможность **управлять поведением XML-парсера**, а не просто передавать данные |
| **Может ли XXE привести к SSRF?** | Да. Если парсер загружает внешние сущности по HTTP, он может выполнять запросы к внутренним ресурсам |
| **Как защититься?** | Отключить External Entities и DOCTYPE. Использовать безопасную конфигурацию парсера. Запускать сервис с минимальными привилегиями. Defense in Depth |

---

## Что запомнить (коротко)

1. **XXE** — XML-парсер обрабатывает внешние сущности, которыми управляет злоумышленник
2. Основные последствия: **чтение файлов**, **SSRF**, **DoS**
3. **Лучшая защита** — отключить DOCTYPE, External Entities и DTD
4. **Defense in Depth**: безопасный парсер + минимальные привилегии + сегментация сети
5. XXE — хороший пример того, почему **сервис должен иметь доступ только к необходимым ресурсам** (Least Privilege, Zero Trust)

---

## Связанные темы

| Тема | Связь |
|------|-------|
| **SSRF** | XXE может быть вектором для SSRF |
| **Billion Laughs Attack** | DoS через вложенные сущности |
| **SAML** | Безопасность SSO через XML |
| **SOAP** | Legacy-протоколы, где XML всё ещё используется |

---

## Что дальше

- [ ] **Command Injection** — следующая тема OWASP Top 10, управление командами ОС
- [ ] **Insecure Deserialization**
- [ ] **Security Misconfiguration**
