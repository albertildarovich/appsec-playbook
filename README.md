# AppSec Playbook | Engineering Portfolio

> Инженерный репозиторий AppSec / DevSecOps инженера: база знаний, практические
> плейбуки, портфолио выполненных работ и аналитическое мышление.
> 
> **Цель репозитория** — показать, как я мыслю, работаю и принимаю решения в области
> безопасности приложений, а не просто перечислить технологии в резюме.

---

## Компетенции

Ниже — карта компетенций с прямыми ссылками на соответствующие разделы репозитория.
Каждая ссылка ведёт к документу, который можно открыть и оценить глубину проработки.

| Компетенция | Где в репозитории |
|-------------|-------------------|
| **Secure SDLC** | [10 документов: фазы, gates, maturity, security champions, метрики](Knowledge/secure-sdlc/) |
| **Threat Modeling (STRIDE)** | [Методология](Knowledge/threat-modeling/stride.md) + [практическая модель Juice Shop](Experience/labs/juice-shop/threat-model.md) |
| **SAST/SCA/Secret Scanning** | [DevSecOps-стек](Knowledge/devsecops/devsecops.md) + [кастомные Semgrep-правила](Experience/labs/juice-shop/module-15-semgrep/rules/) |
| **CI/CD Pipeline as Code** | [Production-grade GitLab CI: include + extends + gate policy](Experience/labs/juice-shop/module-17-ssdlc/report.md) |
| **OWASP Top 10 + ASVS** | [Все 10 категорий](Knowledge/owasp-top10/) + [ASVS mapping (14 находок на 12 контролей)](Experience/labs/juice-shop/module-16-security-review/asvs-mapping.md) |
| **Kubernetes Hardening** | [6 документов: RBAC, Pod Security, Network Policies, CIS Benchmark, Runtime Security, Security Context](Knowledge/kubernetes/) |
| **Docker Hardening** | [CIS Benchmark + hardened Dockerfile + Trivy + Falco-правила](Knowledge/docker-security/README.md) |
| **Code Review** | [Чек-лист](Engineering/code-review/review-checklist.md) + [React](Engineering/code-review/react.md) + [Go (SQL injection)](Knowledge/go-security/sql-injection.md) |
| **API Security** | [Gateway security review (STRIDE + конфигурация)](Engineering/architecture-reviews/api-gateway.md) + [JWT](Knowledge/authentication/jwt.md) + [OAuth2/OIDC](Knowledge/authentication/oauth2-oidc.md) |
| **Security Review** | [Playbook: полный процесс](Engineering/playbooks/security-review.md) + [Payments-сервис](Engineering/architecture-reviews/payments.md) |
| **Безопасный дизайн** | [12 принципов](Knowledge/secure-design/) + [архитектурное мышление](Security%20Thinking/architecture-thinking/secure-design-principles.md) |
| **Инциденты и Case Studies** | [Auth0 JWT CVE](Experience/case-studies/case02-auth0-jwt.md) + [Capital One SSRF](Experience/case-studies/case03-capital-one-ssrf.md) |

---

## Инструменты

| Категория | Инструменты |
|-----------|-------------|
| **SAST** | Semgrep (public + custom taint rules: SQLi, command injection, path traversal, open redirect) |
| **SCA** | Trivy, npm audit |
| **Secret Scanning** | Gitleaks |
| **Container Scanning** | Trivy (образы + Dockerfile misconfig) |
| **IaC Scanning** | Checkov, tfsec (запланировано) |
| **DAST** | OWASP ZAP (baseline + full scan), Nuclei |
| **Runtime Security** | Falco (eBPF, custom rules) |
| **Kubernetes** | kube-bench, CIS Benchmark |
| **Ручное тестирование** | Burp Suite Professional |
| **Pipeline** | GitLab CI (include, extends, SARIF), GitHub Actions |

---

## Избранные артефакты

Чтобы не копаться во всех 100+ файлах — вот 7 документов, которые лучше всего
показывают инженерный уровень:

| # | Документ | Что внутри |
|---|----------|------------|
| 1 | [SSDLC Pipeline для Juice Shop](Experience/labs/juice-shop/module-17-ssdlc/report.md) | 710 строк: production-grade GitLab CI (include + extends), gate policy, 25 security requirements в Gherkin, план внедрения на 4 недели |
| 2 | [Security Review: API Gateway](Engineering/architecture-reviews/api-gateway.md) | 238 строк: полный STRIDE (24 угрозы), безопасный паттерн из 9 шагов, чек-лист на 50+ пунктов, 10 вопросов к команде |
| 3 | [Docker Security](Knowledge/docker-security/README.md) | 462 строки: hardened Dockerfile, CIS Benchmark v1.6, Trivy-интеграция, Falco-правила, Docker BuildKit secrets |
| 4 | [JWT Security](Knowledge/authentication/jwt.md) | Структура, алгоритмы, 5 уязвимостей (alg:none, RS/HS confusion, kid injection, jku/x5u, weak secret), чек-лист валидации |
| 5 | [OAuth 2.0 + OIDC](Knowledge/authentication/oauth2-oidc.md) | Grant types, PKCE, redirect_uri validation, state-параметр, BFF-паттерн, ID Token validation |
| 6 | [ASVS Mapping](Experience/labs/juice-shop/module-16-security-review/asvs-mapping.md) | 14 находок из Juice Shop распределены по 12 контролам ASVS v4.0 с обоснованием |
| 7 | [Case Study: Capital One SSRF](Experience/case-studies/case03-capital-one-ssrf.md) | Разбор атаки: SSRF -> metadata -> IAM credentials -> S3 exfiltration. Архитектурные ошибки и выводы |

---

## Структура репозитория

```
appsec-playbook/
|
+-- Knowledge/           "Как это работает" — теория и справочники
|   +-- owasp-top10/         10/10 категорий (A01–A10)
|   +-- web-security/        11 уязвимостей (SQLi, XSS, CSRF, SSRF, XXE, ...)
|   +-- api-security/        REST, API Gateway, OWASP API Top 10
|   +-- authentication/      JWT, OAuth 2.0, OIDC
|   +-- authorization/       BOLA, IDOR, BAC, Privilege Escalation
|   +-- secure-design/       12 принципов (Least Privilege, Defense in Depth, ...)
|   +-- secure-sdlc/         10 документов (SDLC, BSIMM, SAMM, SSDF, Champions, Gates, ...)
|   +-- threat-modeling/     STRIDE, Threat Modeling
|   +-- devsecops/           SAST, DAST, SCA, Secret Scanning
|   +-- cryptography/        Cryptographic Failures (A02)
|   +-- kubernetes/          6 документов (RBAC, Pod Security, Network Policies, CIS, Runtime)
|   +-- docker-security/     CIS Benchmark, hardened Dockerfile, Trivy
|   +-- go-security/         SQL injection в Go, Semgrep-правила
|   +-- linux/               AppSec-ориентированная шпаргалка (~150 строк)
|   +-- fundamentals/        Security Principles, Interpreters, NIST CSF
|   +-- cheatsheets/         14 быстрых справок
|
+-- Engineering/         "Как я работаю" — плейбуки и шаблоны
|   +-- architecture-reviews/   API Gateway, Payments (STRIDE + чек-листы)
|   +-- code-review/            Чек-лист, React, Go
|   +-- playbooks/              Security Review (полный процесс)
|   +-- adr/                    ADR-001 (Keycloak), ADR-002 (Semgrep)
|   +-- checklists/             API Review, Threat Modeling
|
+-- Experience/          "Что я сделал" — портфолио
|   +-- labs/juice-shop/       17 модулей (от recon до SSDLC pipeline)
|   +-- case-studies/          Auth0 JWT CVE, Capital One SSRF, Juice Shop auth bypass
|   +-- mini-projects/         Chrome Security Auditor, VSCode Security Auditor
|
+-- Security Thinking/    "Как я думаю" — анализ и trade-offs
    +-- analysis/              Broken Access Control, JWT vs Sessions
    +-- architecture-thinking/ Secure Design Principles (практическое применение)
    +-- trade-offs/            JWT vs Session

15 директорий   |   100+ файлов   |   10 000+ строк
```

---

## Прогресс по ключевым направлениям

Цифры отражают реальное состояние репозитория, а не планы. Подробный трекер
с 50+ темами — в [roadmap](Knowledge/roadmap/README.md).

```
OWASP Top 10         100% (10/10)   Все категории A01–A10 закрыты
Web Security         100% (11/11)   SQLi, XSS, CSRF, SSRF, XXE, Command Injection,
                                    Insecure Deserialization, Security Misconfiguration,
                                    Vulnerable Components, Insecure Design, SSRF
Secure SDLC          100% (10/10)   От SDLC-фаз до AppSec Maturity Model
Kubernetes            95%           RBAC, Pod Security, Network Policies, CIS,
                                    Runtime Security, Security Context
Docker               100%           CIS Benchmark, Trivy, Falco, hardened Dockerfile
Authentication        85%           JWT, OAuth2/OIDC, Auth Failures
Authorization         70%           BOLA, IDOR, BAC, Privilege Escalation
DevSecOps             70%           SAST/DAST/SCA + CI/CD pipeline
Cryptography          25%           Cryptographic Failures (A02), нужно AES/RSA/ECC/TLS
Architecture Reviews  25%           API Gateway (238 строк), Payments
Code Review           30%           Чек-лист, React, Go (SQL injection)
Security Thinking     40%           Trade-offs, Analysis, Architecture Thinking
Cloud                  0%           Запланировано (AWS IAM, KMS, GuardDuty)
Python Security        0%           Запланировано (Flask/Django/FastAPI)
```

---

## Контакты

| Канал | Ссылка |
|--------|--------|
| GitHub | [github.com/albertildarovich](https://github.com/albertildarovich) |

---

## Лицензия

MIT. Используйте, форкайте, адаптируйте. Буду рад, если этот репозиторий поможет
ещё кому-то структурировать знания по Application Security.