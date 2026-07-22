# Cross-Site Scripting (XSS)

## Определение

Cross-Site Scripting (XSS) — это уязвимость, при которой злоумышленник добивается выполнения произвольного JavaScript-кода в браузере пользователя.

- **CWE**: CWE-79 — Improper Neutralization of Input During Web Page Generation
- **OWASP Top 10 (2021)**: A03: Injection
- **Риск**: Кража сессий, редирект на фишинг, deface, кража данных, выполнение действий от имени пользователя

## Причина возникновения

Основная причина — **отображение недоверенных пользовательских данных в HTML, JavaScript, CSS или HTML-атрибутах без корректной обработки** (Output Encoding или Sanitization).

Уязвимый пример (ОПАСНО):
```javascript
// JavaScript
const name = new URLSearchParams(location.search).get("name");
document.getElementById("welcome").innerHTML = "Hello " + name;
```

```python
# Python / Flask (без экранирования)
return f"<div>Привет, {user_input}</div>"
```

```php
<?php echo "Search: " . $_GET['q']; ?>
```

Пользовательские данные попадают в `innerHTML` (или echo), который интерпретирует их как HTML.
Ввод: `<img src=x onerror=alert(1)>` → выполнится JavaScript.

### Почему innerHTML опасен?
1. **Парсит строку как HTML** — все теги и скрипты становятся частью DOM
2. **Не экранирует данные** — любая HTML-разметка из строки выполняется
3. **Разница с textContent** — `textContent` интерпретирует данные как текст, а не как HTML

## Основные типы XSS

| Тип | Описание | Пример |
|-----|----------|--------|
| **Reflected XSS** | Payload передаётся в HTTP-запросе и сразу отражается в ответе приложения | `/search?q=<script>alert(1)</script>` |
| **Stored XSS** | Payload сохраняется на сервере (БД) и выполняется при открытии страницы другими пользователями | Комментарии, отзывы, сообщения форума, профиль пользователя |
| **DOM XSS** | Уязвимость возникает полностью на стороне клиента, сервер не участвует | `location.hash` → `innerHTML` |

```
Reflected XSS:

Клиент ── HTTP Request ──▶ Сервер
          ◀── HTML с payload ──
          ▼
Браузер выполняет JavaScript

Stored XSS:

Атакующий ──▶ Сервер (БД) ──▶ Жертва
                    │
     Payload сохраняется и
     отдаётся всем пользователям
```

**Stored XSS** обычно считается наиболее опасным типом, так как:
- не требует social engineering (жертве не нужно переходить по ссылке);
- поражает всех, кто открывает страницу;
- может накапливаться и поражать администраторов в панели управления.

### DOM XSS — детальнее

DOM XSS не требует передачи данных на сервер. Уязвимость живёт во frontend-коде.

```
Источник (Source) ──▶ Поток данных ──▶ Опасная операция (Sink)

Пример:
location.search ──▶ name ──▶ innerHTML
```

## Источники (Source)

Наиболее распространённые источники пользовательских данных:

| Источник | Описание |
|----------|----------|
| `location.search` | Query-параметры URL |
| `location.hash` | Фрагмент URL (всё после #) |
| `location.href` | Полный URL |
| `document.URL` | Текущий URL страницы |
| `document.cookie` | Cookie (без HttpOnly) |
| `window.name` | Имя окна |
| `postMessage()` | Сообщения из других окон/iframe |
| `localStorage` | Локальное хранилище |
| `sessionStorage` | Сессионное хранилище |

## Опасные операции (Sink)

Наиболее распространённые sink (опасные API):

| Sink | Описание |
|------|----------|
| `innerHTML` | Устанавливает HTML-содержимое элемента |
| `outerHTML` | Заменяет элемент и его содержимое |
| `document.write()` | Записывает HTML в документ |
| `insertAdjacentHTML()` | Вставляет HTML в指定 позицию |
| `eval()` | Выполняет произвольный JavaScript |
| `setTimeout(string)` | Выполняет строку как JavaScript |
| `setInterval(string)` | Выполняет строку как JavaScript циклически |
| `new Function()` | Создаёт функцию из строки |

> Использование пользовательского ввода в этих API требует особой осторожности.

### Безопасные альтернативы

Вместо:
```javascript
element.innerHTML = userInput;
```

использовать:
```javascript
element.textContent = userInput;
// или
element.innerText = userInput;
```

Если **отображение HTML действительно необходимо**, использовать **санитизацию** (см. ниже).

## Sanitizer

Если приложение должно отображать HTML (например, редактор комментариев, WYSIWYG), следует использовать специализированные библиотеки.

Рекомендуемый инструмент: **[DOMPurify](https://github.com/cure53/DOMPurify)**

```javascript
const safe = DOMPurify.sanitize(userInput);
element.innerHTML = safe;
```

**Что важно проверить:**
- [ ] Используется ли надежная библиотека (DOMPurify — от Cure53)
- [ ] Актуальна ли версия (обновления безопасности)
- [ ] Безопасна ли конфигурация (разрешённые теги/атрибуты)

## Как это обнаружить

### SAST (Static Analysis)

Большинство SAST-инструментов используют **Taint Analysis**

Типичный поток данных:
```
Source (location.search, document.cookie, GET[param])
  │
Поток данных (присваивание, конкатенация)
  │
Sink (innerHTML, document.write, dangerouslySetInnerHTML)
```

Если **отсутствует корректный Sanitizer** (DOMPurify, htmlspecialchars, escape) — инструмент сообщает о потенциальной XSS.

**Что проверять при анализе SAST findings:**
- [ ] Источник пользовательских данных (Source)
- [ ] Путь распространения данных (Taint Flow)
- [ ] Используется ли безопасный Sanitizer
- [ ] Какой именно Sink используется
- [ ] Действительно ли пользовательский ввод достигает Sink
- [ ] Является ли срабатывание истинным (True Positive) или ложноположительным (False Positive)

**Semgrep правило (пример):**
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

DAST не анализирует код, а проверяет приложение извне.

**Типичный процесс:**
1. Отправка XSS-пейлоадов
2. Анализ HTML-ответа (отразился ли payload)
3. Проверка выполнения JavaScript (через headless browser)
4. Анализ изменений DOM

**Типичные payload:**
```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
javascript:alert(1)

<!-- Контекстные payloads -->
"><img src=x onerror=alert(1)>
'><script>alert(1)</script>
{{constructor.constructor('alert(1)')()}}
```

### Code Review

```bash
# Что искать
grep -rn "innerHTML" src/
grep -rn "outerHTML" src/
grep -rn "document.write" src/
grep -rn "eval(" src/
grep -rn "dangerouslySetInnerHTML" src/
grep -rn "insertAdjacentHTML" src/
grep -rn "setTimeout.*location" src/   # setTimeout с данными из URL
grep -rn "htmlspecialchars" src/       # проверить, что используется везде
```

## Способы предотвращения

### 1. Output Encoding (основной механизм защиты)

Пользовательские данные должны кодироваться в соответствии с **контекстом вывода**.

| Контекст | Что кодировать | Пример результата |
|----------|---------------|-------------------|
| HTML body | `< > & " '` | `&lt;script&gt;` |
| HTML attribute | кавычки, пробелы | `&quot; onclick` |
| JavaScript | экранирование строк | `\x3Cscript\x3E` |
| CSS | CSS-escape | `\3C script\3E` |
| URL | URL-encoding | `%3Cscript%3E` |

> Использование **неправильного типа кодирования** может не устранить XSS. HTML-safe ≠ JavaScript-safe.

Пример:
```javascript
// Вставка в HTML-атрибут:
element.setAttribute("data-name", encodeURIComponent(userInput));

// Вставка как текст:
element.textContent = userInput;
```

### 2. Использование безопасных DOM API

**Предпочитать:**
- `textContent`
- `innerText`
- `createTextNode()`
- `setAttribute()` (с кодированием)

**Избегать:**
- `innerHTML`
- `outerHTML`
- `document.write()`
- `insertAdjacentHTML()`

### 3. Санитизация HTML

Использовать **только при необходимости отображения HTML**.

Рекомендуемый инструмент: **DOMPurify**

```javascript
import DOMPurify from 'dompurify';
const safe = DOMPurify.sanitize(userInput, { ALLOWED_TAGS: ['b', 'i', 'em'] });
```

### 4. Content Security Policy (CSP)

CSP ограничивает выполнение ресурсов браузером.

```
Content-Security-Policy: default-src 'self'; script-src 'self';
```

**CSP:**
- снижает последствия успешной XSS (скрипты с других доменов не выполнятся);
- **не устраняет саму уязвимость**;
- является **дополнительным уровнем защиты** (defense in depth).

**Не рекомендуется использовать:**
- `unsafe-inline` — разрешает inline-скрипты;
- `unsafe-eval` — разрешает `eval()`.

**Лучшая практика:** использовать CSP с nonces или хешами:

```
Content-Security-Policy: script-src 'nonce-abc123' 'strict-dynamic'
```

### 5. HttpOnly Cookie

HttpOnly предотвращает чтение cookie через JavaScript (`document.cookie`).

Однако:
- не предотвращает XSS;
- не мешает злоумышленнику выполнять действия от имени пользователя (API-запросы выполняются с cookie автоматически).

### 6. Trusted Types API (современные браузеры)

Позволяет запретить использование опасных sink без проверки:

```javascript
// Включение Trusted Types
Content-Security-Policy: require-trusted-types-for 'script';

// Использование
element.innerHTML = trustedHTML;  // только через Trusted Type policy
```

## Анализ результатов SAST

При анализе найденной XSS необходимо проверить:

1. **Источник пользовательских данных (Source)**
   - Откуда приходят данные? (URL, БД, cookie, postMessage)
   - Контролирует ли атакующий этот источник?

2. **Путь распространения данных (Taint Flow)**
   - Проходят ли данные через какие-либо преобразования?
   - Есть ли проверки или фильтрация на пути?

3. **Используется ли безопасный Sanitizer**
   - DOMPurify? htmlspecialchars? Template engine с autoescape?

4. **Какой именно Sink используется**
   - `innerHTML`? `document.write`? `eval`?

5. **Действительно ли пользовательский ввод достигает Sink**
   - Возможно, данные проверяются перед выводом

6. **Является ли срабатывание истинным (True Positive) или ложноположительным (False Positive)**

## Defense in Depth

Защита от XSS должна строиться в несколько уровней:

```
Layer 1: Безопасная разработка (autoescaping, textContent)
Layer 2: Output Encoding (контекстное кодирование)
Layer 3: Безопасные DOM API (textContent вместо innerHTML)
Layer 4: Санитизация (DOMPurify — при необходимости HTML)
Layer 5: Content Security Policy (CSP)
Layer 6: HttpOnly + Secure + SameSite Cookie
Layer 7: Trusted Types API
Layer 8: Регулярный SAST
Layer 9: Регулярный DAST
```

> Ни один механизм по отдельности не гарантирует полную защиту.

## Связанные стандарты

- **CWE-79**: Cross-Site Scripting
- **OWASP Top 10 (2021)**: A03: Injection
- **OWASP ASVS**: V.5 Validation, Sanitization and Encoding
- **PCI DSS**: 6.5.7 Cross-site scripting (XSS)
- **NIST SSDF**: PW.9 — Secure Coding Practices

## Полезные ссылки

- [OWASP XSS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP XSS Filter Evasion](https://owasp.org/www-community/xss-filter-evasion-cheatsheet)
- [PortSwigger XSS Labs](https://portswigger.net/web-security/cross-site-scripting)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [PayloadsAllTheThings — XSS](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XSS%20Injection)

## AppSec Notes

> 💡 Практические наблюдения, которые редко встречаются в учебниках, но часто помогают в работе.

1. **`innerHTML` не всегда означает XSS** — важно проверить, действительно ли пользовательский ввод достигает этого sink'a. Если данные проходят через санитизатор или берутся не из пользовательского источника — это может быть False Positive.

2. **Если HTML не нужен, `textContent` почти всегда лучше, чем санитизация** — санитизация может быть ошибочной, а `textContent` гарантированно безопасен.

3. **При анализе отчёта SAST сначала изучай taint flow, а уже потом решай, является ли находка True Positive или False Positive.** Не блокируйся на sink'e — смотри весь путь данных.

4. **Наличие CSP не является основанием закрыть XSS как ложноположительное срабатывание.** CSP снижает последствия эксплуатации, но не устраняет саму уязвимость.

5. **Всегда учитывай контекст вывода:** HTML, атрибут, JavaScript, CSS и URL требуют разных способов экранирования. Кодирование для HTML-контекста не защитит в JavaScript-контексте.

## Практика

**Из опыта**: самая частая причина XSS — разработчик уверен, что данные безопасны. "Это же просто имя пользователя" — а в имени `</div><script>...</script>`.

**Где чаще всего нахожу XSS в 2025:**
- Комментарии и отзывы (Stored XSS)
- Поисковые формы (Reflected XSS)
- SPA с динамическим рендерингом (DOM XSS)
- JSON-ответы, которые вставляются в `innerHTML` без экранирования
- Application cache/service workers

**Лучшая защита**: autoescaping (React/Vue/Svelte) + CSP с nonces + регулярный DAST. Не полагаться на один слой.

**Что спрашивать разработчиков на Code Review:**
- "Как ты экранируешь этот вывод?"
- "Почему здесь `dangerouslySetInnerHTML`?"
- "Какие данные могут попасть в этот `innerHTML`?"
- "CSP настроен или в процессе?"
- "Ты проверял, что будет, если ввести `<img src=x onerror=alert(1)>`?"
- "Какой контекст вывода? HTML, атрибут или JavaScript?"

## Ключевые тезисы

- XSS — выполнение произвольного JavaScript в браузере пользователя
- Основная причина — вывод недоверенных данных без корректной обработки
- Основные типы: Reflected, Stored, DOM
- `innerHTML` — опасный Sink
- `textContent` — безопасная альтернатива для отображения текста
- SAST выявляет XSS с помощью Taint Analysis
- DAST обнаруживает XSS, отправляя специальные payload и анализируя выполнение JavaScript
- Output Encoding — основная защита
- Sanitization применяется, когда необходимо отображать HTML
- CSP снижает последствия успешной XSS, но не устраняет уязвимость
- HttpOnly защищает cookie от чтения JavaScript, но не предотвращает выполнение XSS
- Защита должна строиться по принципу Defense in Depth
