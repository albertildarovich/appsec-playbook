# XSS (Cross-Site Scripting)

## Определение

XSS (Cross-Site Scripting) — тип инъекции, при котором злоумышленник внедряет клиентский скрипт (JavaScript) в веб-страницу, которая затем выполняется в браузере жертвы.

- **CWE**: CWE-79 — Improper Neutralization of Input During Web Page Generation
- **OWASP Top 10 (2021)**: A03: Injection
- **Риск**: Кража сессий, редирект на фишинг, deface, кража данных

## Причина возникновения

Основная причина — вывод пользовательского ввода в HTML/JS контексте без корректного экранирования (encoding).

Уязвимый пример (ОПАСНО):
```python
# Python / Flask
return f"<div>Привет, {user_input}</div>"
```

```tsx
// React — dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userComment }} />
```

```php
<?php echo "Search: " . $_GET['q']; ?>
```

Безопасная реализация:
```python
from flask import escape
return f"<div>Привет, {escape(user_input)}</div>"
```

```tsx
// React — экранирует по умолчанию
<div>{userInput}</div>
```

```php
<?= htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8') ?>
```

## Как это обнаружить

### SAST (Static Analysis)

Большинство SAST-инструментов используют **Taint Analysis**:

```
Source (GET/POST/input)
  |
Поток данных (конкатенация, манипуляции)
  |
Sink (echo, innerHTML, dangerouslySetInnerHTML, render_template_string)
```

Если есть путь Source → Sink и нет Sanitizer (htmlspecialchars, escape, encoding) — инструмент сообщит о XSS.

**Semgrep правило:**
```yaml
rules:
  - id: react-dangerouslySetInnerHTML
    patterns:
      - pattern: dangerouslySetInnerHTML={{...}}
    message: "dangerouslySetInnerHTML may lead to XSS"
    languages: [ts, tsx]
    severity: WARNING
```

### DAST (Dynamic Analysis)

DAST отправляет тестовые payloads и анализирует ответы:

```html
<!-- Базовые payloads -->
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
javascript:alert(1)

<!-- Контекстные payloads -->
"><img src=x onerror=alert(1)>
'><script>alert(1)</script>
{{constructor.constructor('alert(1)')()}}
```

**Что анализирует DAST:**
- Наличие неэкранированных payloads в ответе
- Выполнение JavaScript (через headless browser)
- Content-Type (text/html vs application/json)

### Code Review

```bash
# Что искать
grep -rn "innerHTML" src/
grep -rn "dangerouslySetInnerHTML" src/
grep -rn "document.write" src/
grep -rn "eval(" src/
grep -rn "htmlspecialchars" src/  # проверить, что используется везде
```

## Типы XSS

| Тип | Описание | Источник | Пример |
|-----|----------|----------|--------|
| **Stored (Persistent)** | Скрипт сохраняется на сервере (БД, файл) | Сервер | Комментарий, профиль, сообщение |
| **Reflected (Non-persistent)** | Скрипт отражается в ответе сервера | Запрос (URL, param) | Поиск, error page |
| **DOM-based** | Уязвимость на клиенте, сервер не участвует | URL hash, fragment | `document.write`, `eval` с location.hash |

## Способы предотвращения

### Обязательно:

1. **Context-aware encoding** (основной метод):

| Контекст | Метод | Пример |
|----------|-------|--------|
| HTML body | HTML entity encoding | `&lt;script&gt;` |
| HTML attribute | Attribute encoding | `&quot;` |
| JavaScript | JS string escape | `\x3Cscript\x3E` |
| URL | URL encoding | `%3Cscript%3E` |
| CSS | CSS escape | `\3C script\3E` |

2. **Content Security Policy (CSP)** — defense in depth:
```
Content-Security-Policy: default-src 'self'; script-src 'self'
```

3. **Template engines с auto-escaping**:
```python
# Jinja2 — autoescape ON by default
{{ user_input }}  # безопасно

# React — экранирует по умолчанию
<div>{userInput}</div>  # безопасно
```

### Дополнительно:
- HttpOnly + Secure + SameSite cookies
- Trusted Types API (современные браузеры)
- Input validation (allowlist там, где возможно)
- DOMPurify для случаев, когда HTML необходим

## Как проверить исправление

```bash
# 1. Отправить payload
curl -X POST https://target.com/comment \
  -d "text=<script>alert(1)</script>"

# 2. Проверить, что payload не выполняется
curl -s https://target.com/comment/1 | grep "&lt;script&gt;"

# 3. Проверить CSP заголовки
curl -sI https://target.com | grep -i content-security-policy

# 4. Проверить HttpOnly cookie
curl -sI https://target.com | grep -i set-cookie
```

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| Только client-side validation | Атакующий шлёт напрямую POST |
| Экранирование через `strip_tags()` | Не всё удаляет, обходится через `<<script>script>` |
| CSP без nonces | `unsafe-inline` разрешает inline скрипты |
| Blacklist фильтрация | Обходится через encoding, Unicode, entities |
| Регулярные выражения | Не покрывают все варианты |
| Sanitize в одном контексте для другого | HTML safe не значит JS safe |

## Defense in Depth

```
Layer 1: Input validation (allowlist)
Layer 2: Context-aware encoding (основной)
Layer 3: CSP заголовки
Layer 4: HttpOnly cookies
Layer 5: Trusted Types API
Layer 6: XSS Auditor (legacy, но может помочь)
Layer 7: Регулярный SAST + DAST
```

## Связанные стандарты

- **CWE-79**: Cross-site Scripting
- **OWASP Top 10 (2021)**: A03: Injection
- **OWASP ASVS**: V.5 Validation, Sanitization and Encoding
- **PCI DSS**: 6.5.7 Cross-site scripting (XSS)
- **NIST SSDF**: PW.9 — Secure Coding Practices

## Ключевые тезисы

- XSS возникает из-за вывода пользовательского ввода без экранирования
- **Context-aware encoding — основной метод защиты**
- CSP — defense in depth, а не замена encoding
- Sanitize ≠ Encode. Sanitize удаляет, Encode делает безопасным
- React/Vue/Svelte безопасны по умолчанию, но `dangerouslySetInnerHTML` — red flag
- Один слой защиты будет обойдён. Всегда используй defense in depth

## Полезные ссылки

- [OWASP XSS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP XSS Filter Evasion](https://owasp.org/www-community/xss-filter-evasion-cheatsheet)
- [PortSwigger XSS Labs](https://portswigger.net/web-security/cross-site-scripting)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [DOMPurify](https://github.com/cure53/DOMPurify)

## Практика

**Из опыта**: самая частая причина XSS — разработчик уверен, что данные безопасны. "Это же просто имя пользователя" — а в имени `</div><script>...</script>`.

**Лучшая защита**: autoescaping (React/Vue/Svelte) + CSP с nonces + регулярный DAST сканинг. Не полагаться на один слой.

**Что спрашивать разработчиков на Code Review:**
- "Как ты экранируешь этот вывод?"
- "Почему здесь `dangerouslySetInnerHTML`?"
- "Какие данные могут попасть в этот `innerHTML`?"
- "CSP настроен или в процессе?"
