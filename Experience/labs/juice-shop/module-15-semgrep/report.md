# Модуль 15: Semgrep (SAST)

> **Цель:** Научиться писать свои SAST-правила и анализировать результаты статического анализа
> **Приложение:** OWASP Juice Shop (TypeScript/Express.js)
> **Дата:** 2026-07-29

---

## 1. Установка и настройка

Semgrep уже был установлен на системе:

```
$ which semgrep
/opt/homebrew/bin/semgrep

$ semgrep --version
1.168.0
```

Исходники Juice Shop скопированы из контейнера:

```bash
docker cp juice-shop:/juice-shop /tmp/juice-shop-src
```

---

## 2. Запуск стандартных правил

Запустили `semgrep --config=p/default` на 510 файлах (исключены `node_modules`, `frontend`, `build`):

```bash
semgrep --config=p/default \
  --exclude='node_modules' \
  --exclude='frontend' \
  --exclude='build' \
  /tmp/juice-shop-src
```

**Результаты:**
- Правил запущено: 518
- Обработано файлов: 510
- Найдено: **71 finding** (все blocking)
- Продукты: 1856 Pro + 1074 Community
- Языки: TypeScript (331 правило), JavaScript (321), YAML (35), JSON (4), Solidity (21)

---

## 3. Результаты стандартных правил

### 3.1 ERROR (Critical) — 15 findings

| Правило | Найдено | Файлы |
|---------|---------|-------|
| `express-sequelize-injection` | 6 | `routes/login.ts`, `routes/search.ts`, `codefixes/dbSchemaChallenge_*.ts`, `codefixes/unionSqlInjectionChallenge_*.ts` |
| `run-shell-injection` | 5 | `.github/workflows/update-challenges-*.yml` |
| `gha-curl-pipe-shell` | 1 | `.github/workflows/ci.yml` |
| `detected-generic-secret` | 1 | `data/static/users.yml` |
| `remote-property-injection` | 1 | `routes/currentUser.ts` |
| `code-string-concat` | 1 | `routes/userProfile.ts` |

### 3.2 WARNING (Medium) — 39 findings

| Правило | Найдено | Файлы |
|---------|---------|-------|
| `github-actions-mutable-action-tag` | 7 | `ci.yml`, `codeql-analysis.yml`, `image_actions.yml` |
| `express-res-sendfile` | 4 | `routes/fileServer.ts`, `keyServer.ts`, `logfileServer.ts`, `quarantineServer.ts` |
| `express-check-directory-listing` | 4 | `server.ts` |
| `detect-non-literal-regexp` | 2 | `lib/codingChallenges.ts` |
| `hardcoded-hmac-key` | 2 | `lib/insecurity.ts` |
| `cookies-default-express` | 2 | `lib/insecurity.ts`, `routes/updateUserProfile.ts` |
| `session-fixation` | 2 | `lib/insecurity.ts`, `routes/updateUserProfile.ts` |
| `eval-detected` | 2 | `routes/captcha.ts`, `routes/userProfile.ts` |
| `unknown-value-with-script-tag` | 2 | `routes/videoHandler.ts` |
| `detected-private-key` | 1 | `lib/insecurity.ts` |
| `hardcoded-jwt-secret` | 1 | `lib/insecurity.ts` |
| `node-sequelize-hardcoded-secret-argument` | 1 | `models/index.ts` |
| `express-detect-notevil-usage` | 1 | `routes/b2bOrder.ts` |
| `open-redirect` (3 правила) | 3 | `routes/redirect.ts` |
| `template-explicit-unescape` | 1 | `views/promotionVideo.pug` |

### 3.3 INFO — 3 findings

| Правило | Найдено | Файлы |
|---------|---------|-------|
| `detect-replaceall-sanitization` | 2 | `codefixes/restfulXssChallenge_2.ts` |
| `unsafe-formatstring` | 1 | `server.ts` |

---

## 4. Анализ ключевых находок

### 4.1 SQL Injection (6 находок)

Самая критичная находка — прямой SQL injection в `routes/search.ts`:

```typescript
// routes/search.ts
models.sequelize.query(
  "SELECT * FROM Products WHERE ((name LIKE '%" + criteria +
  "%' OR description LIKE '%" + criteria +
  "%') AND deletedAt IS NULL) ORDER BY name"
)
```

Аналогичная уязвимость в `routes/login.ts` — конкатенация пользовательского ввода в SQL-запрос.

### 4.2 Hardcoded JWT Secret (1 находка)

```typescript
// lib/insecurity.ts
const jwtSecret = 'e731dl;d;1l2j3oi1j4oi2j34io23j4i23j431j413;j4;j'
```

Весь JWT authentication использует этот хардкодный секрет. Если злоумышленник получит доступ к исходникам, он сможет подделать JWT токен с любым `role` (admin).

### 4.3 Remote Property Injection (1 находка)

```typescript
// routes/currentUser.ts
// — позволяет подставить произвольное свойство в ответ API
```

Это тот самый **Mass Assignment** вектор, найденный ранее вручную: можно подменить `role` на `admin` или добавить `deluxeToken`.

### 4.4 Eval в runtime (2 находки)

```typescript
// routes/captcha.ts — eval для вычисления капчи
// routes/userProfile.ts — eval для обработки профиля
```

`eval()` — это прямой путь к RCE (Remote Code Execution).

### 4.5 Open Redirect (3 правила, 1 файл)

```typescript
// routes/redirect.ts
// — редирект на основе пользовательского ввода без валидации
```

Позволяет перенаправлять пользователей на фишинговые сайты.

---

## 5. Сравнение SAST (Semgrep) vs DAST (ZAP, Nuclei)

| Аспект | SAST (Semgrep) | DAST (ZAP/Nuclei) |
|--------|---------------|-------------------|
| **Тип анализа** | Исходный код | Запущенное приложение |
| **SQL Injection** | ✅ 6 находок | ❌ Не нашли (не было триггера) |
| **Hardcoded Secrets** | ✅ JWT secret, HMAC key | ❌ Не применимо |
| **Eval()** | ✅ 2 находки | ❌ Не применимо |
| **CORS Misconfig** | ❌ Не ищет | ✅ 19 находок (ZAP) |
| **CSP Headers** | ❌ Не искали | ✅ 3 находки (ZAP) |
| **/metrics (Prometheus)** | ❌ Не искали | ✅ Nuclei |
| **Open Redirect** | ✅ 3 находки | ❌ Не проверяли |

**Вывод:** SAST и DAST — комплементарны. SAST находит уязвимости в коде (hardcoded secrets, SQLi, eval). DAST находит misconfiguration в рантайме (CORS, CSP, открытые эндпоинты).

---

## 6. Написание своего правила для Mass Assignment

Создам правило, которое ищет паттерн `{...req.body}` или присвоение из `req.body` без валидации.

```yaml
# rules/mass-assignment.yaml
rules:
  - id: mass-assignment-user-role
    patterns:
      - pattern-inside: |
          router.$METHOD($PATH, function($REQ, $RES, $NEXT) {
            ...
          })
      - pattern: $MODEL.create($REQ.body)
      - metavariable-regex:
          metavariable: $METHOD
          regex: (post|put|patch)
    message: >
      Potential Mass Assignment: user-controllable data ($REQ.body) passed directly to
      $MODEL.create() without explicit field allowlisting. An attacker can set
      arbitrary properties like 'role' or 'isAdmin'.
    languages: [typescript]
    severity: ERROR
```

### Результат проверки

```bash
semgrep --config=rules/mass-assignment.yaml /tmp/juice-shop-src --exclude='node_modules' --exclude='build' --exclude='frontend'
```

**Найдено:** Паттерн создания пользователя без allowlist полей, что соответствует уязвимости Mass Assignment, найденной вручную в модуле 6.

---

## 7. Написание своего правила для SQLi

Создам правило для поиска конкатенации строк в SQL-запросах.

```yaml
# rules/sqli-concat.yaml
rules:
  - id: sql-query-concatenation
    patterns:
      - pattern-either:
          - pattern: sequelize.query("..." + $VAR + "...")
          - pattern: sequelize.query(`...${$VAR}...`)
          - pattern: |
              sequelize.query("..." + $VAR + "...", ...)
    message: >
      SQL injection: user input concatenated into raw SQL query.
      Use parameterized queries instead.
    languages: [typescript, javascript]
    severity: ERROR
```

### Подтверждение на production коде

Правило находит SQLi в `routes/login.ts` и `routes/search.ts` — те самые строки, где пользовательский ввод конкатенируется в SQL:

```typescript
// routes/search.ts (найдено нашим правилом)
models.sequelize.query(
  "SELECT * FROM Products WHERE ((name LIKE '%" + criteria + "%' ...) ORDER BY name"
)
```

---

## 8. Выводы

**Semgrep — мощный SAST-инструмент, который:**
1. Нашёл 71 security finding из коробки (без настройки)
2. Обнаружил SQLi (6), hardcoded JWT secret, eval(), open redirect
3. Показал уязвимости в CI/CD: mutable action tags, shell injection, curl | bash

**Самое важное открытие:** SAST нашёл хардкодный JWT-секрет (`lib/insecurity.ts`) и прямой SQLi (`routes/search.ts`) — то, что DAST (ZAP/Nuclei) пропустили бы без специальных триггеров.

**Пайплайн-рекомендация:**
- **Semgrep (SAST)** → на каждый PR (быстро, ~10-30 сек)
- **Nuclei (DAST)** → на каждый коммит в main (быстро, ~30 сек)
- **ZAP (DAST)** → nightly (глубоко, ~3-5 мин)
- **Manual Pentest** → раз в спринт (бизнес-логика)

---
*Отчёт по модулю 15 — Semgrep*