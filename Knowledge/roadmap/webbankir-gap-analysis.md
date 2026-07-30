# WeBBankir AppSec Engineer -- Gap Analysis

> Оценка репозитория `appsec-playbook` на соответствие требованиям вакансии WeBBankir.
> Позиция: нанимающий менеджер / технический лид.

---

## Резюме

| Аспект | Оценка |
|--------|--------|
| Общее впечатление | Сильная концепция, хорошая структура, видна инженерная культура |
| OWASP Top 10 + Web Security | Закрыто на 100% |
| Kubernetes + Docker | Закрыто хорошо (12 файлов) |
| DevSecOps / CI/CD | Закрыто (module-17, SSDLC pipeline) |
| Критичные пробелы под вакансию | 6 позиций (Python, SOAP/XML-RPC, Cloud, Code Review, Crypto, Roadmap) |
| Рекомендуемое время на закрытие | ~15-18 рабочих дней |

---

## Критичные пробелы относительно требований вакансии

### 1. Python -- отсутствует полностью

**Требование вакансии:**
> «Умение разбираться в чужом коде (Golang/**Python**/Bash/SQL)»

**Текущее состояние:**
- Go -- 2 файла (README + sql-injection.md)
- Python -- **0 файлов**
- Bash -- косвенно в `Knowledge/linux/README.md`
- SQL -- косвенно через SQLi-конспекты

**Что нужно:**
```
Knowledge/python-security/
├── README.md          -- обзор типичных уязвимостей Flask/Django/FastAPI
├── sql-injection.md   -- SQLi в Python: f-strings vs параметризованные запросы
├── command-injection.md -- os.system, subprocess без shell=True
├── deserialization.md -- pickle vs json, unsafe yaml.load
└── dependencies.md    -- pip-audit, safety, известные CVE в PyPI-пакетах
```

**Трудозатраты:** ~2 дня

---

### 2. XML-RPC, SOAP, SOP -- не упоминаются нигде

**Требование вакансии:**
> «Понимание принципов работы современных веб-приложений и технологий: **XML-RPC, REST, SOAP, SOP**, CORS, HSTS, CSP, OAuth2 и др.»

**Текущее состояние:**
- REST -- хорошо раскрыт в `api-gateway.md` и `api-security/README.md`
- CORS, HSTS, CSP -- раскрыты в security-мисконфигурациях и чеклистах
- OAuth2 -- `oauth2-oidc.md`
- **XML-RPC -- 0 упоминаний**
- **SOAP -- 0 упоминаний**
- **SOP (Same-Origin Policy) -- не раскрыт отдельно**

**Что нужно:**
```
Knowledge/web-security/sop.md              -- Same-Origin Policy: схема, хост, порт; взаимодействие с CORS
Knowledge/api-security/soap-security.md    -- SOAP: WS-Security, XML Signature, XXE через SOAP, SAML
Knowledge/api-security/xml-rpc.md          -- XML-RPC: структура, уязвимости, pingback DDoS
```

**Трудозатраты:** ~1.5 дня

---

### 3. Code Review -- поверхностно

**Требование вакансии:**
> «Проводить анализ безопасности разрабатываемого ПО... выявлять уязвимости»

**Текущее состояние:**
- `Engineering/code-review/` -- 3 файла: react.md, review-checklist.md, README.md
- Нет методологии, нет примеров реального разбора PR, нет связки с SAST-инструментами
- Roadmap показывает Code Review Methodology -- **0%**

**Что нужно:**
```
Engineering/code-review/
├── methodology.md       -- процесс: scope -> automated scan -> manual review -> report -> verify fix
├── java-spring.md       -- типичные ошибки в Spring Boot (actuator exposure, SpEL injection)
├── python-flask.md      -- типичные ошибки Flask/Django (debug mode, SSTI, open redirect)
├── go-review.md         -- типичные ошибки Go (обработка ошибок, гонки, crypto/rand vs math/rand)
├── walkthrough-pr.md     -- разбор реального PR: что нашёл, почему, как исправить
└── semgrep-review.md    -- как использовать Semgrep в code review: кастомные правила, triage findings
```

**Трудозатраты:** ~3 дня

---

### 4. Cloud Security (AWS) -- заявлен, но отсутствует

**Требование вакансии (косвенное):**
> «Опыт харденинга Kubernetes... безопасной настройки Docker-контейнеров»

Финтех-компания ожидает понимания облачной безопасности.

**Текущее состояние:**
- В README заявлен `cloud/ — AWS Security, IAM`
- Директории `Knowledge/cloud/` не существует
- Нет IAM, Security Hub, GuardDuty, CloudTrail, KMS, WAF

**Что нужно:**
```
Knowledge/cloud/
├── README.md        -- обзор AWS security services
├── iam.md           -- IAM: policies, roles, conditions, IAM Access Analyzer
├── encryption.md    -- KMS, envelope encryption, CMK rotation
├── logging.md       -- CloudTrail, VPC Flow Logs, GuardDuty
└── waf-shield.md    -- AWS WAF rules, Shield Advanced
```

**Трудозатраты:** ~2 дня

---

### 5. Cryptography -- 25% для финтеха

**Требование вакансии (косвенное):**
> «Знание OWASP Top 10, OWASP ASVS...» (ASVS V9 -- Cryptography, V10 -- Communications)

**Текущее состояние:**
- Один файл `cryptographic-failures.md`
- Нет разборов: AES-GCM vs CBC, RSA OAEP, ECC, TLS 1.3 handshake, mTLS, HSM, KMS, envelope encryption

**Что нужно:**
```
Knowledge/cryptography/
├── aes.md               -- AES-GCM vs CBC, nonce/IV management, padding oracle
├── rsa-ecc.md           -- RSA OAEP, ECDH, ECDSA, выбор размера ключа
├── tls.md               -- TLS 1.3 handshake, certificate pinning, mTLS
├── key-management.md    -- HSM, KMS, envelope encryption, key rotation
├── hashing.md           -- bcrypt/Argon2id параметры, HMAC, timing attacks
└── random.md            -- /dev/urandom vs /dev/random, CSPRNG в Go/Python
```

**Трудозатраты:** ~3 дня

---

### 6. Roadmap рассинхронизирован с реальностью

**Текущее состояние:**
`Knowledge/roadmap/README.md` показывает устаревшие данные:

| Тема | Roadmap | Факт | Расхождение |
|------|---------|------|-------------|
| Software Integrity (A08) | 0% [NO] | Файл создан | Факт: 100% |
| Logging & Monitoring (A09) | 0% [NO] | Файл создан | Факт: 100% |
| JWT / OAuth | 0% [NO] | 2 файла созданы | Факт: 100% |
| Kubernetes | 0% [NO] | 6 файлов создано | Факт: 95% |
| Linux | 0% [NO] | README переписан | Факт: 80% |
| REST / GraphQL | 0% [NO] | api-security README написан | Факт: 60% |
| SAST (Semgrep/CodeQL) | 0% [NO] | module-15 + custom rules | Факт: 60% |
| Secure SDLC | 30% | 10 файлов создано | Факт: 100% |
| SBOM / SCA | 100% [OK] | Верно | -- |

**Что нужно:**
Обновить все прогресс-бары в `Knowledge/roadmap/README.md` до актуальных значений.

**Трудозатраты:** ~0.5 дня

---

## Некритичные пробелы (желательно, но не блокирует)

### 7. Security Thinking -- 40%

Заявлено 7 категорий, реализовано ~4:

| Категория | Статус |
|-----------|--------|
| mental-models/ | Не создан |
| risk-assessment/ | Не создан |
| decision-framework/ | Не создан |
| security-smells/ | Не создан |
| anti-patterns/ | Не создан |
| trade-offs/ | Создан (JWT vs Session) |
| architecture-thinking/ | Создан (secure-design-principles) |
| analysis/ | Создан (broken-access-control, jwt-vs-sessions) |

**Трудозатраты:** ~3 дня

---

### 8. Architecture Reviews -- 20% (2 документа)

Есть `api-gateway.md` (отличный) и `payments.md`. Не хватает:
- Кредитный конвейер / скоринг
- Личный кабинет пользователя
- Партнёрские интеграции

**Трудозатраты:** ~2 дня (по 0.5 дня на документ)

---

### 9. Experience -- нет внешних достижений

| Категория | Факт |
|-----------|------|
| Juice Shop | module-01..17 (хорошо) |
| PortSwigger Academy | Пусто |
| HTB | Пусто |
| Bug Bounty | Пусто |
| Writeups | Пусто |
| Incidents | Пусто |

**Трудозатраты:** внешние достижения накапливаются со временем, не быстро

---

### 10. BSIMM/SAMM -- теория без практического применения

Есть файлы `02-bsimm.md` и `03-owasp-samm.md`. Не хватает самооценки по SAMM с конкретными баллами и планом перехода.

**Что нужно:**
```
Experience/mini-projects/samm-assessment/
└── report.md    -- самооценка по OWASP SAMM v2, конкретные баллы, roadmap улучшения
```

**Трудозатраты:** ~1 день

---

## Что сделано хорошо

| Область | Детали |
|---------|--------|
| OWASP Top 10 | 10/10 категорий, каждый файл глубокий |
| Web Security | 11/11 уязвимостей (SQLi, XSS, CSRF, SSRF, XXE, Command Injection, Deserialization, Misconfig, Vuln Components, Insecure Design) |
| Kubernetes | 6 файлов: RBAC, Pod Security, Network Policies, CIS Benchmark, Runtime Security, Security Context |
| Docker | 462 строки: CIS Benchmark + hardened Dockerfile + Trivy + Secrets |
| Module-17 SSDLC | 710 строк, production-grade pipeline (include+extends, gate policy, Gherkin AC) |
| JWT/OAuth/OIDC | Глубокие разборы с уязвимостями и BFF-паттерном |
| API Gateway Review | STRIDE + безопасный паттерн + вопросы команде |
| Semgrep Taint Rules | SQL injection, command injection, path traversal, open redirect |
| ASVS Mapping | 14 находок Juice Shop на 12 контролей ASVS v4.0 |
| Case Studies | Auth0 JWT CVE (CVE-2022-39211) + Capital One SSRF |

---

## Итоговый план доработок

| # | Задача | Приоритет | Дни |
|---|--------|-----------|-----|
| 1 | Python-security раздел | P0 | 2 |
| 2 | XML-RPC, SOAP, SOP | P0 | 1.5 |
| 3 | Code Review (methodology + walkthrough) | P0 | 3 |
| 4 | Cloud Security (AWS) | P1 | 2 |
| 5 | Cryptography (AES, RSA, ECC, TLS, KMS) | P1 | 3 |
| 6 | Roadmap sync | P1 | 0.5 |
| 7 | Security Thinking (mental-models, risk-assessment, smells) | P2 | 3 |
| 8 | Architecture Reviews (кредитный конвейер, ЛК, партнёры) | P2 | 2 |
| 9 | SAMM self-assessment | P3 | 1 |
| 10 | External experience (PortSwigger, HTB, Bug Bounty) | P3 | ongoing |

**Всего:** ~18 дней на P0-P2

---

> **Вывод:** репозиторий производит хорошее впечатление структурой и глубиной отдельных разделов, но на собеседовании в WeBBankir я задам 6 вопросов по критичным пробелам. Закрытие P0-пробелов (Python, SOAP/XML-RPC, Code Review) -- минимально необходимое условие для прохождения технического скрининга.