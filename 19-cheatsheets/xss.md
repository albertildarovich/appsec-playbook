# XSS Cheatsheet

## Обнаружение

### Базовые payload
```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
javascript:alert(1)
<body onload=alert(1)>
<input autofocus onfocus=alert(1)>
<details open ontoggle=alert(1)>
```

### Контекстные payload

```html
<!-- Внутри HTML-тега -->
<div>PAYLOAD</div> → <div><script>alert(1)</script></div>

<!-- Внутри атрибута -->
<input value="PAYLOAD"> → <input value="" onclick="alert(1)">

<!-- Внутри JavaScript строки -->
<script>var x = "PAYLOAD"</script> → <script>var x = ""; alert(1);//</script>

<!-- Внутри URL -->
<a href="PAYLOAD"> → <a href="javascript:alert(1)">

<!-- Внутри CSS -->
<style>body { color: PAYLOAD }</style> → <style>body { color: expression(alert(1)) }</style>
```

### Обход фильтров

```html
<!-- Обход strip_tags -->
<<script>script>alert(1)</script>

<!-- Верхний регистр -->
<SCRIPt>alert(1)</SCRIPt>

<!-- Unicode -->
\u003cscript\u003ealert(1)\u003c/script\u003e

<!-- Hex encoding -->
<img src=x onerror=\x61\x6c\x65\x72\x74(1)>

<!-- Base64 -->
<img src=x onerror=eval(atob('YWxlcnQoMSk='))>

<!-- event handler variation -->
<IMG SRC=x: onerror=alert(1)>
<IMG SRC=x onerror="alert(1)">
<IMG SRC=x onerror=alert(1)>

<!-- Polyglot -->
jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert(1) )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert(1)>\x3e
```

## Код-ревью: что искать

```bash
# Опасные DOM API
grep -rn "innerHTML" src/
grep -rn "outerHTML" src/
grep -rn "document.write" src/
grep -rn "insertAdjacentHTML" src/

# Опасные JS функции
grep -rn "eval(" src/
grep -rn "setTimeout.*location" src/
grep -rn "setInterval.*location" src/
grep -rn "new Function(" src/

# Фреймворки
grep -rn "dangerouslySetInnerHTML" src/          # React
grep -rn "v-html" src/                            # Vue
grep -rn "innerHTML" src/                         # Angular/AngularJS

# Источники данных
grep -rn "location.search" src/
grep -rn "location.hash" src/
grep -rn "location.href" src/
grep -rn "document.URL" src/
grep -rn "document.cookie" src/
grep -rn "postMessage" src/
grep -rn "localStorage" src/
```

## Безопасные паттерны

### Вместо innerHTML — textContent
```javascript
// ОПАСНО
element.innerHTML = userInput;

// БЕЗОПАСНО
element.textContent = userInput;
element.innerText = userInput;
```

### Вместо document.write — createTextNode
```javascript
// ОПАСНО
document.write(userInput);

// БЕЗОПАСНО
document.createTextNode(userInput);
```

### Вместо dangerouslySetInnerHTML — props
```tsx
// ОПАСНО (React)
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// БЕЗОПАСНО (React)
<div>{userComment}</div>
```

### Если HTML необходим — DOMPurify
```javascript
import DOMPurify from 'dompurify';

const safe = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
});

element.innerHTML = safe;
```

### Context-aware encoding (backend)
```python
# Python / Flask
from flask import escape
return f"<div>{escape(user_input)}</div>"
```

```php
// PHP
<?= htmlspecialchars($input, ENT_QUOTES, 'UTF-8') ?>
```

```java
// Java (JSP)
<c:out value="${userInput}" />
```

## CSP (Content Security Policy)

### Минимальный безопасный CSP
```
Content-Security-Policy: default-src 'self'; script-src 'self'
```

### CSP с nonces (рекомендуется)
```
Content-Security-Policy: default-src 'self'; script-src 'nonce-abc123' 'strict-dynamic'
```

### CSP для сторонних скриптов
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
```

### CSP для inline-стилей и изображений
```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'nonce-def456'
```

### Проверка CSP
```bash
curl -sI https://target.com | grep -i content-security-policy
```

## Проверка после фикса

```bash
# 1. Отправить XSS payload
curl -X POST https://target.com/comment \
  -d "text=<script>alert(1)</script>"

# 2. Проверить, что payload экранирован
curl -s https://target.com/comment/1 | grep "&lt;script&gt;"

# 3. Проверить CSP заголовки
curl -sI https://target.com | grep -i content-security-policy

# 4. Проверить HttpOnly cookie
curl -sI https://target.com | grep -i set-cookie

# 5. Проверить reflected XSS
curl "https://target.com/search?q=<script>alert(1)</script>" | grep "&lt;script&gt;"
```

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| Только client-side validation | Атакующий отправляет напрямую POST/GET |
| `strip_tags()` | Обходится через `<<script>script>`, Unicode |
| CSP без nonces | `unsafe-inline` разрешает любые inline-скрипты |
| Blacklist фильтрация | Всегда можно обойти через encoding, Unicode, entities |
| Экранирование не для того контекста | HTML-safe ≠ JS-safe ≠ URL-safe |
| Один слой защиты | Всегда будет обойдён — используй defense in depth |

## Связанные CWE
- **CWE-79**: Cross-Site Scripting
- **CWE-80**: Improper Neutralization of Script-Related HTML Tags
- **CWE-83**: Improper Neutralization of Script in Attributes
- **CWE-87**: Improper Neutralization of Alternate XSS Syntax
