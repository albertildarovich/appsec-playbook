# Модуль 17: SSDLC для Juice Shop

> **Цель:** Встроить безопасность в процесс разработки Juice Shop
> **Контекст:** Результаты модулей 1-16 (20 уязвимостей, 4 Critical, 5 High, 11 Medium)

---

## 1. Security Pipeline для Juice Shop

### Текущее состояние (как есть)

Juice Shop — это deliberately vulnerable приложение, где уязвимости заложены в коде намеренно. Однако для учебных целей мы проектируем **идеальный pipeline безопасности**, который предотвратил бы эти уязвимости, если бы Juice Shop был реальным продуктом.

```
                    Pipeline безопасности
 ┌─────────────────────────────────────────────────────────────┐
 │                                                             │
 │  Code Commit ──▶ PR ──▶ CI ──▶ Staging ──▶ Release ──▶ Prod │
 │      │            │       │        │           │          │  │
 │      ▼            ▼       ▼        ▼           ▼          ▼  │
 │  Pre-commit    SAST    SCA +   DAST +    Security     EDR   │
 │  (secrets)     +       SAST    API Sec   Sign-off    +      │
 │  + lint        Tests           Scan                  WAF    │
 │                                                             │
 └─────────────────────────────────────────────────────────────┘
```

### Этапы pipeline с инструментами

| Этап | Инструмент | Что проверяет | Блокирует? |
|------|-----------|---------------|------------|
| **Pre-commit** | gitleaks + eslint-plugin-security | Secrets, insecure patterns | Нет (предупреждение) |
| **PR** | Semgrep (custom rules) | SQLi, eval, XSS, Mass Assignment | Да (CRITICAL) |
| **PR** | npm audit / Trivy | Known CVEs в зависимостях | Да (CRITICAL) |
| **CI** | Semgrep (full scan) | Все уязвимости в коде | Да (CRITICAL, HIGH) |
| **CI** | Trivy (fs + image) | Vulnerable dependencies | Да (CRITICAL) |
| **Staging** | OWASP ZAP / Nuclei | DAST сканирование | Да (XSS, SQLi) |
| **Staging** | Rate limiting test | DoS уязвимости | Нет (warn) |
| **Release** | Security Sign-off | Manual review checklist | Да (manual) |
| **Production** | WAF + EDR | Ongoing protection | Блокировка атак |

---

## 2. Проверки в Pull Request

### Что должно быть в каждом PR

```yaml
# .github/workflows/pr-security.yml
name: PR Security Checks
on: [pull_request]

jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check for secrets
        uses: gitleaks/gitleaks-action@v2

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Semgrep scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: >
            p/typescript
            p/owasp-top-ten
            rules/mass-assignment.yaml
            rules/sqli-concat.yaml

  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trivy scan
        run: |
          trivy fs --severity CRITICAL --exit-code 1 .
      - name: npm audit
        run: npm audit --audit-level=critical
```

### Gate policy для PR

| Severity | Action | Пример |
|----------|--------|--------|
| 🔴 **CRITICAL** | ❌ Block PR | SQL injection, hardcoded secret |
| 🟠 **HIGH** | ⚠️ Require review | XSS, weak crypto |
| 🟡 **MEDIUM** | 📝 Log + warn | Missing rate limiting |
| 🟢 **LOW** | ℹ️ Info | Missing security header |

### Что проверяем конкретно для Juice Shop

Исходя из найденных уязвимостей (модуль 16), в PR должны быть заблокированы:

```
❌ BLOCK (CRITICAL):
   - Конкатенация строк в SQL запросах (sequelize.query с ${})
   - Использование eval() с пользовательским вводом
   - Mass Assignment на модели User (role, deluxeToken)
   - Хардкоженные секреты/ключи в коде
   - Отсутствие Prepared Statements

⚠️ WARN + REQUIRED REVIEW (HIGH):
   - Использование MD5/SHA1 для паролей
   - Отсутствие rate limiting на login
   - New endpoint без ownership check
   - Изменение механизма подписи JWT (RS256 → HS256)
   - Новая зависимость с known CVE
```

---

## 3. Security Gates перед деплоем

### Gate L1: Pre-commit (Developer)

```
┌──────────────────────────────────┐
│         PRE-COMMIT HOOKS         │
├──────────────────────────────────┤
│ ✔ gitleaks — secrets detection   │
│ ✔ eslint-plugin-security         │
│ ✔ prettier (форматирование)       │
│ ❌ BLOCK: только secrets          │
└──────────────────────────────────┘
```

**Что блокируем:** Только реальные секреты (AWS keys, passwords, tokens).  
**Почему:** Pre-commit должен быть быстрым. Полный SAST — в CI.

### Gate L2: CI (Pull Request)

```
┌─────────────────────────────────────┐
│          CI / PR CHECKS             │
├─────────────────────────────────────┤
│ ✔ SAST (Semgrep) — custom rules     │
│ ✔ SCA (Trivy + npm audit)           │
│ ✔ Unit tests + integration tests    │
│ ❌ BLOCK: CRITICAL severity          │
│ ⚠️ HIGH → AppSec review required     │
└─────────────────────────────────────┘
```

**Gate L2 policy для Juice Shop:**
```yaml
gates:
  sast:
    severity: CRITICAL
    action: block
    rules:
      - sql-injection
      - eval-user-input
      - hardcoded-secrets
      - mass-assignment

  sca:
    severity: CRITICAL  
    action: block
    min_severity: HIGH
    action_on_high: notify_appsec

  override:
    allowed: true
    approver: AppSec Lead
    expires: 7 days
```

### Gate L3: Staging (Pre-production)

```
┌─────────────────────────────────────┐
│         STAGING CHECKS              │
├─────────────────────────────────────┤
│ ✔ DAST (OWASP ZAP)                  │
│ ✔ Nuclei — custom templates         │
│ ✔ API Security Scan                  │
│ ✔ Rate limit test (k6/bombardier)    │
│ ❌ BLOCK: XSS, SQLi, Auth Bypass     │
│ ⚠️ MEDIUM → manual review            │
└─────────────────────────────────────┘
```

**Что блокируем на staging:**
- XSS (Reflected/Stored)
- SQL Injection
- Authentication Bypass
- Directory Traversal (/ftp/ доступ)
- JWT alg:none атака

### Gate L4: Release (Production)

```
┌─────────────────────────────────────┐
│          RELEASE SIGN-OFF           │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   RELEASE CHECKLIST            │ │
│ │                                 │ │
│ │ [ ] SAST: no CRITICAL findings  │ │
│ │ [ ] SCA: all CVEs resolved      │ │
│ │ [ ] DAST: no findings           │ │
│ │ [ ] Secrets: scan clean         │ │
│ │ [ ] Security headers: all set    │ │
│ │ [ ] Rate limiting: configured   │ │
│ │ [ ] Admin access: reviewed      │ │
│ │ [ ] Monitoring: alerts active   │ │
│ │                                 │ │
│ │   Sign: _____________ Date: ___ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Визуализация gates

```
Commit ──▶ L1 (Pre-commit) ──▶ PR ──▶ L2 (CI) ──▶ Staging ──▶ L3 (DAST) ──▶ L4 (Sign-off) ──▶ Prod
   │            │                         │              │                │
   ▼            ▼                         ▼              ▼                ▼
Secrets     Быстро        SAST + SCA    ZAP + API     Security        Релиз
detect      (1-2 сек)     (2-5 мин)     (5-10 мин)    Checklist       готов
                                                         
Блок:       ❌ Secrets    ❌ CRITICAL   ❌ XSS/SQLi   ❌ Любой
только                                         пункт не
секреты                                         выполнен
```

---

## 4. Security Requirements для Juice Shop

### REQ-AUTH: Аутентификация

| ID | Требование | Связь с finding | Приоритет |
|----|-----------|-----------------|-----------|
| REQ-AUTH-01 | Пароли должны хэшироваться bcrypt (cost ≥ 12) или Argon2id | MD5 passwords (P1) | P0 |
| REQ-AUTH-02 | После 5 неудачных попыток входа — блокировка на 15 минут | No rate limiting (P1) | P1 |
| REQ-AUTH-03 | JWT должен проверять `exp`, `nbf`, `aud`, `iss` | JWT validation missing (P0) | P0 |
| REQ-AUTH-04 | JWT должен быть подписан RS256, алгоритм проверяется сервером | JWT alg:none (P0) | P0 |
| REQ-AUTH-05 | Logout должен инвалидировать сессию/токен | No session invalidation (P2) | P1 |
| REQ-AUTH-06 | MFA для административных действий | No MFA (P2) | P1 |

**Acceptance Criteria:**
```gherkin
Scenario: Login with wrong password
  Given user "admin@juice-sh.op" exists
  When I POST /rest/user/login with wrong password 5 times
  Then account should be locked for 15 minutes
  And response should be 429 Too Many Requests

Scenario: JWT with alg:none
  Given I have a JWT with algorithm "none"
  When I send request to /api/Users
  Then server should reject with 401 Unauthorized
```

### REQ-AUTHZ: Авторизация

| ID | Требование | Связь с finding | Приоритет |
|----|-----------|-----------------|-----------|
| REQ-AUTHZ-01 | Доступ проверяется на сервере, не на клиенте | Client-side auth (P0) | P0 |
| REQ-AUTHZ-02 | Default deny для всех ресурсов | Admin panel без RBAC (P0) | P0 |
| REQ-AUTHZ-03 | Ownership проверяется для всех user-specific данных | IDOR on basket (P1) | P0 |
| REQ-AUTHZ-04 | Mass Assignment защищён (allowlist полей) | Mass Assignment (P0) | P0 |
| REQ-AUTHZ-05 | Административные функции доступны только admin роли | No RBAC (P0) | P0 |

**Acceptance Criteria:**
```gherkin
Scenario: Mass Assignment protection
  Given I register a new user
  When I send POST /api/Users with { "email": "test@test.com", "role": "admin" }
  Then the "role" field should be ignored
  And user should be created with role "customer"

Scenario: Access admin panel without admin role
  Given I am logged in as "customer"
  When I GET /administration
  Then response should be 403 Forbidden
```

### REQ-CRYPTO: Криптография

| ID | Требование | Связь с finding | Приоритет |
|----|-----------|-----------------|-----------|
| REQ-CRYPTO-01 | Пароли хэшируются bcrypt/Argon2id (не MD5, SHA1) | MD5 passwords (P1) | P0 |
| REQ-CRYPTO-02 | RSA private key хранится в Vault, не в исходниках | Hardcoded RSA key (P0) | P0 |
| REQ-CRYPTO-03 | JWT secret не захардкожен, хранится в environment | Hardcoded secret (P0) | P0 |
| REQ-CRYPTO-04 | Купоны подписываются HMAC-SHA256, не reversible encoding | Coupon forgery (P1) | P1 |
| REQ-CRYPTO-05 | Все данные в транзите — TLS 1.2+ | Отсутствует (P2) | P1 |

### REQ-INPUT: Input Validation

| ID | Требование | Связь с finding | Приоритет |
|----|-----------|-----------------|-----------|
| REQ-INPUT-01 | Все SQL запросы через Prepared Statements | SQLi login + search (P0) | P0 |
| REQ-INPUT-02 | Никакого eval() с пользовательским вводом | eval() in checkout (P0) | P0 |
| REQ-INPUT-03 | REST API endpoint — allowlist методов | PUT/DELETE без auth (P1) | P1 |
| REQ-INPUT-04 | Валидация типов на всех API endpoint | No input validation (P2) | P1 |

**Acceptance Criteria:**
```gherkin
Scenario: SQL Injection prevention
  Given malicious input: "' OR 1=1--"
  When I POST /rest/user/login with email = malicious input
  Then response should be 401 Unauthorized
  And no user data should be leaked

Scenario: eval() prevention
  Given malicious input: "process.env"
  When I POST /api/Orders with coupon = malicious input
  Then server should return 400 Bad Request
  And no environment variables should be leaked
```

### REQ-LOG: Логирование и Мониторинг

| ID | Требование | Связь с finding | Приоритет |
|----|-----------|-----------------|-----------|
| REQ-LOG-01 | Все failed login попытки логируются | Repudiation (P2) | P1 |
| REQ-LOG-02 | Все admin действия логируются | Admin actions (P2) | P1 |
| REQ-LOG-03 | Логи не содержат PII / пароли | Log leak (P2) | P1 |
| REQ-LOG-04 | Rate limiting alerts настроены | DoS (P1) | P1 |
| REQ-LOG-05 | Алёрт на подозрительные паттерны (SQLi попытки) | IDS/IPS (P2) | P2 |

### REQ-CONFIG: Конфигурация

| ID | Требование | Связь с finding | Приоритет |
|----|-----------|-----------------|-----------|
| REQ-CONFIG-01 | Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options | Missing headers (P2) | P1 |
| REQ-CONFIG-02 | CORS настроен строго (не `*`) | CORS misconfig (P2) | P1 |
| REQ-CONFIG-03 | /ftp/ доступ закрыт (не публичный) | FTP exposure (P1) | P0 |
| REQ-CONFIG-04 | Rate limiting на всех публичных endpoint | No rate limiting (P1) | P1 |
| REQ-CONFIG-05 | Swagger/OpenAPI доступен только в dev режиме | API docs exposure (P2) | P1 |

---

## 5. Пример CI/CD Pipeline для Juice Shop

### GitHub Actions workflow

```yaml
name: Secure CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # L1: Pre-commit checks (secrets + lint)
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        with:
          fail: true

  # L2: SAST + SCA
  sast-sca:
    needs: pre-commit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: SAST (Semgrep)
        uses: returntocorp/semgrep-action@v1
        with:
          config: >
            p/typescript
            p/owasp-top-ten
            rules/mass-assignment.yaml
            rules/sqli-concat.yaml
          fail-on: >-
            --severity=ERROR
            --severity=WARNING

      - name: SCA (Trivy)
        run: |
          trivy fs \
            --severity CRITICAL,HIGH \
            --exit-code 1 \
            --ignore-unfixed \
            .

      - name: npm audit
        run: npm audit --audit-level=high

  # L3: DAST (deploy staging first)
  dast:
    needs: sast-sca
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          docker compose -f docker-compose.staging.yml up -d
          
      - name: ZAP Scan
        uses: zaproxy/action-full-scan@v0.7.0
        with:
          target: 'https://staging.juice-shop.com'
          cmd_options: '-a'
          fail_action: true
          allow_issue_writing: false

      - name: Nuclei Scan
        run: |
          nuclei -u https://staging.juice-shop.com \
                 -t ~/nuclei-templates/ \
                 -severity critical,high \
                 -o nuclei-report.txt

  # L4: Deploy to production
  deploy:
    needs: [sast-sca, dast]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Security Sign-off
        run: |
          echo "=== SECURITY SIGN-OFF CHECKLIST ==="
          echo "✅ SAST: Clean"
          echo "✅ SCA: Clean" 
          echo "✅ DAST: Clean"
          echo "✅ Secrets: Clean"
          echo "=== APPROVED FOR DEPLOYMENT ==="

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # actual deploy command
```

---

## 6. Security Requirements по этапам разработки

### Этап: Requirements (сейчас)

```markdown
**User Story:** Как администратор, я хочу настроить MFA для admin аккаунтов

Security Requirements:
- REQ-AUTH-06: MFA для admin/sensitive действий
- Acceptance: Admin не может войти без OTP кода
- Тест: Попытка входа в /administration без MFA → 403
```

### Этап: Design (следующий спринт)

```markdown
**User Story:** Как система, я хочу защитить API от Mass Assignment

Security Requirements:
- REQ-AUTHZ-04: Allowlist полей для создания/обновления User
- Acceptance: Поле role игнорируется при регистрации
- Тест: POST /api/Users с role=admin → role = "customer"
```

### Этап: Development (текущий спринт)

```markdown
**User Story:** Как разработчик, я хочу использовать Prepared Statements

Security Requirements:
- REQ-INPUT-01: Все SQL запросы через ORM/Prepared Statements
- Acceptance: Запрос с "' OR 1=1--" не возвращает данные
- Check в PR: Semgrep rule блокирует конкатенацию SQL
```

---

## 7. Метрики для Juice Shop

### Baseline (текущее состояние)

| Метрика | Значение | Цель |
|---------|----------|------|
| CRITICAL уязвимости | 4 | 0 |
| HIGH уязвимости | 5 | 0 |
| MEDIUM уязвимости | 11 | < 3 |
| MTTR (CRITICAL) | ∞ (не фиксят) | < 7 дней |
| SAST coverage | 0% | > 80% |
| DAST coverage | 0% | > 60% |

### Целевые метрики после внедрения SSDLC

```yaml
phase_1_month_1:
  sast_coverage: "> 60%"
  critical_findings: "blocked in PR"
  sca_scan: "daily"
  security_training: "> 90%"

phase_2_month_3:
  sast_coverage: "> 80%"
  mttr_critical: "< 3 days"
  dast_in_staging: "yes"
  security_gates: "L2 active"

phase_3_month_6:
  sast_coverage: "> 95%"
  dast_coverage: "> 80%"
  vulnerabilities_in_prod: 0
  full_pipeline: "automated"
```

---

## 8. Краткий план внедрения для Juice Shop

### Неделя 1: Quick wins

```
Day 1-2:  Добавить Semgrep в CI (GitHub Actions)
Day 3:    Настроить custom rules (SQLi, Mass Assignment)
Day 4:    Добавить npm audit / Trivy
Day 5:    Настроить gitleaks pre-commit hook
```

### Неделя 2: Security Gates

```
Day 1-2:  L2 gate — блокировать CRITICAL в PR
Day 3-4:  L3 gate — DAST на staging (ZAP)
Day 5:    Настроить dashboard с метриками
```

### Неделя 3: Процессы

```
Day 1-2:  Написать Security Requirements для P0 уязвимостей
Day 3-4:  Настроить алёрты (Slack + email)
Day 5:    Security training для команды
```

### Неделя 4: Hardening

```
Day 1-2:  Security headers, CORS, CSP
Day 3-4:  Rate limiting на API endpoint
Day 5:    Security Sign-off process
```

---

## 9. Выводы

| Аспект | Результат |
|--------|-----------|
| **Pipeline** | SAST (Semgrep) → SCA (Trivy) → DAST (ZAP) → Sign-off |
| **PR checks** | 4 gates: secrets, SAST, SCA, tests |
| **Gates** | L1 (pre-commit), L2 (CI), L3 (staging), L4 (release) |
| **Security Requirements** | 25 требований (AUTH, AUTHZ, CRYPTO, INPUT, LOG, CONFIG) |
| **План внедрения** | 4 недели: quick wins → gates → процессы → hardening |

### Ключевые уроки на основе Juice Shop

1. **SAST без процесса — шум.** Semgrep нашёл 71 finding, но без gates их никто не фиксит
2. **Ранние gates дешевле.** SQLi на этапе PR стоит $100, в production — $100,000
3. **Security Requirements должны быть измеримыми.** "Пароли хэшируются bcrypt" — проверяемо. "Пароли хранятся безопасно" — нет
4. **Override gate — исключение, не правило.** Если каждый второй PR требует override, gates настроены неправильно
5. **DevEx важен.** Если gates тормозят разработчиков на 30 минут каждый commit — их будут обходить