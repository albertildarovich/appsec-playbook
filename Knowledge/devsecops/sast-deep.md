# SAST Deep Dive — как работает SAST

> **Контекст:** умение просто запускать Semgrep недостаточно. Интервьюер спросит: как работает AST, почему возникают false positives, как писать кастомные правила. Этот раздел закрывает эти вопросы.

---

## 1. Как работает SAST

### Уровни анализа

| Уровень | Что анализирует | Примеры инструментов |
|---------|----------------|---------------------|
| **Regex** | Текстовый поиск по паттернам | grep, TruffleHog (секреты) |
| **AST (Abstract Syntax Tree)** | Структура кода без учёта синтаксиса | Semgrep, SonarQube |
| **Data-flow / Taint analysis** | Пути данных от источника (source) к стоку (sink) | CodeQL, Semgrep taint mode, Fortify |
| **Control-flow analysis** | Порядок выполнения, ветвления | CodeQL, SonarQube |
| **Interprocedural analysis** | Межпроцедурные вызовы: source в функции A, sink в функции B | CodeQL, Checkmarx |

### Регулярки — почему недостаточно

```javascript
// Regex ищет: eval(
// Найденный безопасный код (метод объекта):
obj.eval()          // false positive
// Пропущенный уязвимый код (динамическое имя):
const fn = userInput + "()"
new Function(fn)()  // false negative
```

### AST — что это

AST (Abstract Syntax Tree) — дерево, в котором узлы это конструкции кода (Identifier, CallExpression, BinaryExpression), а не символы.

```javascript
// Код
const x = 1 + 2;
```

```
Program
`-- VariableDeclaration
    `-- VariableDeclarator
        |-- Identifier (x)
        `-- BinaryExpression (+)
            |-- Literal (1)
            `-- Literal (2)
```

Semgrep сопоставляет **паттерн** с AST, а не с текстом. Поэтому:

```yaml
# Паттерн Semgrep
pattern: eval(...)

# Найденное (одинаковый AST):
eval("alert(1)")       # да, CallExpression
eval(user_input)       # да, CallExpression
eval ( "x" )           # да, пробелы не важны
```

### Taint analysis

Taint = «грязный» поток данных. Анализ ищет передачу данных от **источника** к **стоку**:

```
source (user input)  ->  propagate (переменные, функции)  ->  sink (опасная функция)
     |                                                          |
  req.query.id        const id = req.query.id              query(`SELECT * FROM users WHERE id = ${id}`)
```

**Источники (sources):** `req.query`, `request.body`, `localStorage`, `readFile`
**Стоки (sinks):** `eval`, `exec`, `query`, `innerHTML`, `document.write`

Пример правила Semgrep с taint mode (SQLi):

```yaml
rules:
  - id: sql-injection-taint
    mode: taint
    message: "SQL injection: источник попадает в query()"
    severity: ERROR
    languages: [javascript, typescript]
    pattern-sources:
      - pattern: |
          ($REQ).query
      - pattern: |
          ($REQ).body
    pattern-sinks:
      - pattern: |
          ($DB).query(...)
```

---

## 2. False Positive и False Negative

### Определения

```
                  Реально уязвимо   Реально безопасно
SAST нашёл        True Positive     False Positive (FP)
SAST не нашёл     False Negative (FN)  True Negative
```

### Почему возникают FP

| Причина | Пример |
|---------|--------|
| Сантизация не распознана | `escapeHtml(userInput)` не распознана как очистка |
| Контекст не учтён | `eval()` на сервере с доверенным кодом |
| ORM скрыл запрос | `Model.find({ id })` — сгенерит запрос безопасно, а SAST думает иначе |
| Межпроцедурный анализ не работает | source в одной функции, sink в другой |
| Динамический код | `new Function(code)` — AST не видит содержимое строки |

### Почему возникают FN

| Причина | Пример |
|---------|--------|
| Нестандартный поток данных | Data через события/шины, не через вызовы функций |
| Сложный контроль потока | Callback, async, генераторы |
| Динамическое имя метода | `obj[methodName]()` |
| Рефлексия | Java Reflection, Python `getattr` |
| Собственные уязвимости приложения | Бизнес-логика, не типовой паттерн |
| Модификация через прототип | `Array.prototype.push = evil` |

### Как снижать FP

1. **Настройка под проект**: исключить тестовые файлы, legacy-модули.
2. **Baseline**: собрать все текущие находки, помечать как known.
3. **Reachability**: проверка, достижим ли уязвимый путь из кода (`--reachable` в Snyk, CodeQL reachable queries).
4. **VEX/Severity override**: документировать, почему находка не критична.
5. **AppSec review**: человек подтверждает или отклоняет.

### Метрика FP-rate

```
FP-rate = FP / (FP + TP) * 100%

Пример: 40 срабатываний, 30 TP, 10 FP
FP-rate = 10/40 = 25%
```

Хороший FP-rate для SAST: < 20%. Выше — сканер генерирует слишком много шума, команда перестаёт верить инструменту.

---

## 3. Semgrep: написание кастомного правила

### Структура правила

```yaml
rules:
  - id: rule-id                    # уникальный ID для проекта
    message: "Текст для разработчика"
    severity: ERROR | WARNING | INFO
    languages: [javascript, typescript]
    patterns:                       # несколько условий
      - pattern: eval(...)
      - pattern-not: eval("safe")   # исключение
```

### Базовые операторы

```yaml
pattern: eval(...)                        # точно такой вызов
pattern-either:                            # ИЛИ
  - pattern: eval($X)
  - pattern: document.write($X)
pattern-inside:                            # только внутри контекста
  - pattern: |
      function $F($PARAMS) {
        ...
      }
pattern-not: eval("safe")                  # исключение
metavariable-regex:                        # regex на метапеременную
  metavariable: $FN
  regex: '(exec|spawn|fork)'
```

### Пример 1: запрет `new Function`

```yaml
rules:
  - id: no-new-function
    message: "new Function() позволяет выполнение произвольного кода"
    severity: ERROR
    languages: [javascript, typescript]
    pattern: new Function(...)
```

### Пример 2: запрет shell=True в Python

```yaml
rules:
  - id: no-shell-true
    message: "subprocess с shell=True — command injection"
    severity: ERROR
    languages: [python]
    pattern: subprocess.*(..., shell=True)
```

### Пример 3: поиск хардкоженных секретов

```yaml
rules:
  - id: hardcoded-api-key
    message: "Найден хардкоженный API-ключ"
    severity: WARNING
    languages: [go, javascript, typescript, python]
    patterns:
      - pattern-either:
          - pattern: |
              $KEY = "sk-..."
          - pattern: |
              $KEY = "AKIA..."
      - pattern-not: |
          $KEY = "$FALLBACK"
```

### Проверка правила (registry)

| Источник правил | Что там |
|----------------|---------|
| `semgrep --config p/owasp-top-ten` | OWASP Top 10 правила |
| `semgrep --config p/typescript` | TypeScript best practices |
| `semgrep --config p/python` | Python patterns |
| Registry.semgrep.dev | Community rules |

### Запуск своего правила

```bash
semgrep scan --config rules/sql-injection.yml --severity ERROR .
semgrep scan --config p/owasp-top-ten --sarif --output semgrep.sarif .
```

---

## 4. Знакомство с CodeQL (если спросят)

CodeQL — от GitHub. Отличается моделью: код компилируется в базу данных, запросы пишутся на QL (декларативный язык).

```ql
// Пример: SQLi источник -> сток
import javascript

from Dataflow::PathNode source, Dataflow::PathNode sink
where
  source.getNode() instanceof RemoteFlowSource and
  sink.getNode() instanceof SqlInjectionSink and
  Dataflow::localFlow(source, sink)
select source.getNode(), sink.getNode()
```

Разница Semgrep vs CodeQL:

| | Semgrep | CodeQL |
|---|---------|--------|
| Модель | AST pattern matching | Compilation to DB + QL queries |
| Скорость | Высокая | Средняя |
| Порог входа | Низкий | Высокий |
| Custom rules | YAML | QL |
| Taint analysis | Есть (простой) | Глубокий (interprocedural) |
| Стоимость | Free/Pro | Free для OSS/учёбы |

---

## 5. Как отвечать на интервью

Паттерн ответа: «Инструмент X использует [уровень анализа], поэтому [сильная сторона] и [ограничение]. Для нашего проекта мы [что сделали]».

Пример для Semgrep:
> Semgrep использует pattern-matching по AST. Это делает его быстрым и простым для кастомных правил — мы покрываем специфику проекта за минуты. Ограничение — AST не видит динамический код (eval, рефлексию) и имеет ограниченный межпроцедурный анализ. Для глубокого taint analysis мы используем CodeQL на критичных сервисах.

---

## 6. Interview Questions

| Вопрос | Ответ |
|--------|-------|
| Как работает SAST? | Строит AST и ищет паттерны уязвимостей; продвинутые инструменты выполняют taint/data-flow analysis. Позволяет найти проблему до запуска кода. |
| Что такое false positive? | Срабатывание сканера на безопасный код. Происходит из-за неучтённой санитизации, контекста, ORM. |
| Что такое false negative? | Пропуск реальной уязвимости. Происходит из-за динамического кода, рефлексии, сложных потоков данных. |
| Как писать Semgrep-правила? | YAML с pattern/patterns, метапеременными $X, pattern-either, pattern-inside. Проверка: `semgrep scan --config rule.yml .` |
| Чем Semgrep отличается от CodeQL? | Semgrep — AST pattern matching (быстрый, простые правила, YAML). CodeQL — компиляция в DB + QL (глубокий межпроцедурный taint analysis). |
| Как снизить FP-rate? | Baseline, исключения тестов/legacy, reachability analysis, VEX/documentation, AppSec review. |
| Что такое taint analysis? | Отслеживание потока данных от источника (source) к стоку (sink) через propagation. |

---

## Связанные разделы

- [DevSecOps overview](devsecops.md) — Semgrep в пайплайне
- [GitLab CI/CD](gitlab-ci-cd.md) — джоба SAST в пайплайне
- [SBOM](sbom.md) — связь с SCA и VEX
- [Module 15 — Semgrep](../../Experience/labs/juice-shop/module-15-semgrep/report.md) — практика с taint rules
- [Secure Code Review](../secure-sdlc/07-secure-coding-guidelines.md) — паттерны уязвимого кода