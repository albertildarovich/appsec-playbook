# Отчёт по CWE: результат прогона Semgrep + SonarQube

> **Приложение:** demo-app (Node.js/Express + React)
> **Дата:** 2026-08-03
> **Метод:** Semgrep (p/default + p/owasp-top-ten + кастомные правила) + SonarQube Server

---

## 1. Сводка

| Инструмент | Файлов | Находок | CRITICAL | HIGH | MEDIUM | LOW |
|------------|--------|---------|----------|------|--------|-----|
| Semgrep | 214 | 14 | 2 | 3 | 4 | 5 |
| SonarQube | 214 | 9 | 0 | 1 | 2 | 6 |
| **Итого** | 214 | **23** | **2** | **4** | **6** | **11** |

---

## 2. CRITICAL — блокировка merge

### 2.1 CWE-89: SQL Injection (Semgrep)

**Файл:** `routes/search.ts`
**Правило:** `sql-query-concatenation`

```typescript
models.sequelize.query(
  "SELECT * FROM Products WHERE ((name LIKE '%" + criteria +
  "%' OR description LIKE '%" + criteria +
  "%') AND deletedAt IS NULL) ORDER BY name"
)
```

**Вердикт:** True Positive. `criteria = req.query.q` — не экранируется.
**Действие:** Параметризованный запрос (см. triage кейс 1).

### 2.2 CWE-798: Hardcoded Credentials (Semgrep)

**Файл:** `lib/insecurity.ts`
**Правило:** `hardcoded-jwt-secret`

```typescript
const jwtSecret = 'e731dl;d;1l2j3oi1j4oi2j34io23j4i23j431j413;j4;j'
```

**Вердикт:** True Positive. Секрет в git-репозитории.
**Действие:** Секрет в Vault / CI/CD variable, ротация ключа (см. triage кейс 2).

---

## 3. HIGH — требует ревью перед merge

### 3.1 CWE-79: XSS (Semgrep)

**Файл:** `components/ProductCard.tsx`
**Правило:** `react-dangerouslysetinnerhtml`

```tsx
<div dangerouslySetInnerHTML={{ __html: product.description }} />
```

**Вердикт:** Требует уточнения — зависит от источника `description` (см. triage кейс 4).

### 3.2 CWE-95: Code Injection (Semgrep)

**Файл:** `routes/captcha.ts`
**Правило:** `eval-detected`

```typescript
const result = eval(`(${req.body.expression})`)
```

**Вердикт:** True Positive. `eval()` с пользовательским вводом — RCE.
**Действие:** Заменить на математический парсер (mathjs) или вычисление без eval.

### 3.3 CWE-22: Path Traversal (Semgrep)

**Файл:** `routes/download.ts`
**Правило:** `path-traversal-taint-fs`

```typescript
const filePath = path.resolve(safeDir, req.params.filename)
res.sendFile(filePath)
```

**Вердикт:** False Positive — есть защита `startsWith(safeDir)` (см. triage кейс 5).
**Действие:** Добавить паттерн в allowlist.

### 3.4 CWE-79: XSS (SonarQube)

**Файл:** `components/ReviewList.tsx`
**Тип:** Security Hotspot

```tsx
<div dangerouslySetInnerHTML={{ __html: review.text }} />
```

**Вердикт:** True Positive. Отзывы может писать любой пользователь.
**Действие:** Экранировать при выводе, валидировать на сервере.

---

## 4. MEDIUM — информационно, но планировать исправление

| CWE | Инструмент | Файл | Описание |
|-----|------------|------|----------|
| CWE-601 | Semgrep | `routes/redirect.ts` | Open Redirect: `res.redirect(req.query.url)` без allowlist |
| CWE-352 | Semgrep | `routes/user.ts` | Missing CSRF token на state-changing POST |
| CWE-313 | Semgrep | `lib/logger.ts` | Запись паролей в логи (`console.log(password)`) |
| CWE-918 | Semgrep | `routes/proxy.ts` | SSRF: `fetch(req.query.target)` |
| CWE-79 | SonarQube | `views/order.pug` | Неэкранированный вывод `#{product.name}` |
| CWE-327 | SonarQube | `lib/crypto.ts` | Использование MD5 для хэширования |

---

## 5. LOW — информационно

| CWE | Инструмент | Файл | Описание |
|-----|------------|------|----------|
| CWE-200 | Semgrep | `server.ts` | Раскрытие версии Express в `X-Powered-By` |
| CWE-209 | Semgrep | `middleware/error.ts` | Stack trace в ответе 500 |
| CWE-307 | Semgrep | `routes/login.ts` | Нет rate limiting на login |
| CWE-1004 | Semgrep | `lib/session.ts` | Cookie без `HttpOnly` |
| CWE-352 | SonarQube | `routes/basket.ts` | Missing CSRF header check |
| CWE-614 | SonarQube | `lib/session.ts` | Cookie без `Secure` flag |
| CWE-311 | SonarQube | `config.js` | Пароль БД в конфиге (env override возможен) |
| CWE-117 | SonarQube | `lib/logger.ts` | Log Injection: пользовательский ввод в логах |
| CWE-209 | SonarQube | `middleware/auth.ts` | Разные сообщения об ошибках при логине (user enumeration) |
| CWE-502 | SonarQube | `routes/import.ts` | JSON.parse без валидации схемы |
| CWE-749 | SonarQube | `routes/admin.ts` | Exposed dangerous function |

---

## 6. Распределение по OWASP Top 10 (2021)

| OWASP Top 10 | Находок | CWE |
|--------------|---------|-----|
| A03 Injection | 3 | 89, 95 |
| A02 Cryptographic Failures | 2 | 327, 311 |
| A01 Broken Access Control | 2 | 352, 749 |
| A05 Security Misconfiguration | 2 | 200, 209 |
| A07 Identification & Auth Failures | 2 | 307, 614 |
| A10 SSRF | 1 | 918 |
| A09 Logging & Monitoring Failures | 2 | 313, 117 |
| A03 Injection (XSS) | 2 | 79 |
| A01 Broken Access Control (redirect) | 1 | 601 |
| A04 Insecure Design | 0 | - |

---

## 7. Динамика и рекомендации

### Метрики для отслеживания

| Метрика | Текущее | Цель |
|---------|---------|------|
| SAST coverage | 60% | >= 80% |
| MTTR (CRITICAL) | 7 дней | < 3 дней |
| CRITICAL в production | 2 | 0 |
| FP rate | 18% | < 10% |

### Рекомендации

1. **Блокировать merge:** CRITICAL (Semgrep `--error`). HIGH — требует ревью AppSec.
2. **Добавить правила:** SSRF (CWE-918), CSRF (CWE-352), Log Injection (CWE-117) — усилить набор.
3. **Allowlist:** тестовые фикстуры (`.semgrepignore`), уже подтверждённые FP.
4. **Обновить зависимости:** регулярный `npm audit` + Trivy (см. SCA pipeline demo).
5. **Ритуал triage:** еженедельный разбор новых находок, обновление allowlist.

---

## 8. Связанные материалы

- [Triage: FP vs TP](./triage.md) — разбор 5 кейсов с вердиктами
- [SAST Pipeline Demo](./README.md) — архитектура пайплайна
- [Knowledge: CWE Top 25](../../../Knowledge/cwe-top-25.md) — справочник по CWE
- [Knowledge: SAST Deep](../../../Knowledge/devsecops/sast-deep.md) — углублённый разбор SAST
- [Knowledge: OWASP Top 10](../../../Knowledge/owasp-top10/README.md) — категории 2021