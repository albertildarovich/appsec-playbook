# Topics Inventory

> Полный список тем для изучения с приоритетами.
>
> **Легенда:** ✅ Done — 📝 Started — ❌ TODO

---

## Tier 0: Security Thinking (мышление AppSec-инженера)

> Не про технологии, а про навыки мышления. Именно это отличает сильного AppSec-инженера от просто знающего OWASP.

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | Risk Assessment (CVE vs Risk, контекст, компенсирующие меры) | P0 | 📝 Started | `04-web-security/vulnerable-components.md` |
| 2 | Triage (приоритизация, FP, reachability, KEV) | P0 | 📝 Started | `04-web-security/vulnerable-components.md` |
| 3 | Business Impact (что будет, если сервис скомпрометируют?) | P0 | ❌ TODO | — |
| 4 | Compensating Controls (WAF, сегментация, sandbox) | P0 | 📝 Started | `04-web-security/vulnerable-components.md` |
| 5 | Architecture Thinking (почему это вообще доступно?, trade-offs) | P0 | 📝 Started | `04-web-security/security-misconfiguration.md` |
| 6 | **Интерпретаторы** — объединяющая концепция | P0 | ✅ Done | `01-fundamentals/interpreters.md` |

## Tier 1: Core AppSec (Must Know)

### Fundamentals

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | Security Principles (CIA, Defense in Depth, Least Privilege) | P0 | ✅ Done | `01-fundamentals` |
| 2 | OWASP Top 10 (общий обзор) | P0 | ✅ Done | `01-fundamentals` |

### OWASP Top 10 — пройденные темы

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | SQL Injection | P0 | ✅ Done | `04-web-security/sqli.md` |
| 2 | XSS | P0 | ✅ Done | `04-web-security/xss.md` |
| 3 | CSRF | P0 | ✅ Done | `04-web-security/csrf.md` |
| 4 | SSRF | P0 | ✅ Done | `04-web-security/ssrf.md` |
| 5 | XXE | P0 | ✅ Done | `04-web-security/xxe.md` |
| 6 | Command Injection | P0 | ✅ Done | `04-web-security/command-injection.md` |
| 7 | Insecure Deserialization | P0 | ✅ Done | `04-web-security/insecure-deserialization.md` |
| 8 | Security Misconfiguration (A05) | P0 | ✅ Done | `04-web-security/security-misconfiguration.md` |
| 9 | Vulnerable & Outdated Components (A06) | P0 | ✅ Done | `04-web-security/vulnerable-components.md` |
| 10 | Identification & Authentication Failures (A07) | P0 | ✅ Done | `06-authentication/identification-authentication-failures.md` |
| 11 | Broken Access Control (A01) | P0 | ✅ Done | `07-authorization/broken-access-control.md` |

### OWASP Top 10 — осталось пройти

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | Cryptographic Failures (A02) | P0 | ❌ TODO | `08-cryptography` |
| 2 | Software & Data Integrity Failures (A08) | P0 | ❌ TODO | — |
| 3 | Logging & Monitoring Failures (A09) | P0 | ❌ TODO | — |

## Tier 2: API Security

> Сегодня AppSec без API Security практически невозможен.

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | REST API Security | P0 | ❌ TODO | `05-api-security` |
| 2 | GraphQL Security | P0 | ❌ TODO | `05-api-security` |
| 3 | BOLA (API1 — уже есть в OWASP Top 10) | P0 | ❌ TODO | — |
| 4 | Mass Assignment | P0 | ❌ TODO | — |
| 5 | JWT (токены, подпись, ключи) | P0 | ❌ TODO | — |
| 6 | API Gateway (Kong, AWS API Gateway, Zuul) | P1 | ❌ TODO | — |
| 7 | Rate Limiting | P0 | ❌ TODO | — |
| 8 | OWASP API Security Top 10 | P0 | ❌ TODO | — |

## Tier 3: Secure Code Review

> Один из ключевых навыков на AppSec интервью.

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | Code Review Methodology | P0 | ❌ TODO | `14-code-review` |
| 2 | Java — patterns & anti-patterns | P0 | ❌ TODO | `14-code-review` |
| 3 | Python — patterns & anti-patterns | P1 | ❌ TODO | `14-code-review` |
| 4 | Go — patterns & anti-patterns | P1 | ❌ TODO | `14-code-review` |
| 5 | Node.js — patterns & anti-patterns | P1 | ❌ TODO | `14-code-review` |
| 6 | SAST (Semgrep, CodeQL) — что может, что нет | P0 | ❌ TODO | `14-code-review` |

## Tier 4: Threat Modeling

> Почти все Senior интервью начинаются с «Нарисуйте Threat Model».

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | STRIDE | P0 | ❌ TODO | `03-threat-modeling` |
| 2 | DFD (Data Flow Diagrams) | P0 | ❌ TODO | `03-threat-modeling` |
| 3 | Attack Trees | P0 | ❌ TODO | `03-threat-modeling` |
| 4 | Threat Modeling Tools (OWASP Threat Dragon, MS TMT) | P1 | ❌ TODO | `03-threat-modeling` |
| 5 | Практика: нарисовать TM для реального сервиса | P0 | ❌ TODO | `03-threat-modeling` |

## Tier 5: Secure SDLC & DevSecOps

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | Secure SDLC (фазы, security gates) | P0 | 📝 Started | `02-secure-sdlc` |
| 2 | CI/CD Security (Pipeline, SAST/DAST/SCA) | P0 | 📝 Started | `09-devsecops` |
| 3 | BSIMM | P1 | ❌ TODO | `02-secure-sdlc` |
| 4 | OWASP SAMM | P1 | ❌ TODO | `02-secure-sdlc` |
| 5 | NIST SSDF | P1 | ❌ TODO | `02-secure-sdlc` |
| 6 | Security Champions | P1 | ❌ TODO | `02-secure-sdlc` |
| 7 | Security Gates | P1 | ❌ TODO | `02-secure-sdlc` |

## Tier 6: Supply Chain Security

> Сегодня огромная и быстрорастущая тема.

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | SBOM (Software Bill of Materials) | P0 | ✅ Done | `04-web-security/vulnerable-components.md` |
| 2 | SCA (Trivy, Snyk, Dependabot) | P0 | ✅ Done | `04-web-security/vulnerable-components.md` |
| 3 | Cosign / Sigstore | P1 | ❌ TODO | — |
| 4 | SolarWinds-подобные атаки | P1 | ❌ TODO | — |
| 5 | Package Manager Security (npm, pip, Maven, Go) | P1 | ❌ TODO | — |
| 6 | CI/CD Pipeline Security (Artifact Integrity) | P0 | ❌ TODO | — |

## Tier 7: Infrastructure & Cloud

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | Kubernetes Security | P1 | ❌ TODO | `10-kubernetes` |
| 2 | Linux Security | P1 | ❌ TODO | `11-linux` |
| 3 | Cloud Security (AWS) | P1 | ❌ TODO | — |
| 4 | IaC Security (Terraform, CloudFormation) | P1 | ❌ TODO | — |
| 5 | Container Security (Docker, image scanning) | P1 | ❌ TODO | — |

## Tier 8: Soft Skills & Process

| # | Тема | Приоритет | Статус | Раздел в playbook |
|---|------|-----------|--------|-------------------|
| 1 | Communication (как говорить с разработчиками и бизнесом) | P1 | ❌ TODO | `22-security-thinking` |
| 2 | Security Metrics (как измерить безопасность) | P2 | ❌ TODO | `02-secure-sdlc` |
| 3 | AppSec Maturity Assessment | P2 | ❌ TODO | `02-secure-sdlc` |
| 4 | Interview Preparation | P0 | ❌ TODO | `23-interview-notes` |

