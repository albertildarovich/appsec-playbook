# AppSec Playbook

> 🧠 Живая база знаний AppSec инженера. Playbook + Second Brain + Wiki + Interview Prep.

---

## Концепция

Этот репозиторий — **живой инженерный инструмент**, объединяющий:

| Роль | Как работает |
|------|-------------|
| **Playbook** | Готовые сценарии: как проводить Threat Modeling, что проверять в Code Review |
| **Second Brain** | Мои выводы, инсайты, Lessons Learned |
| **Wiki** | Структурированная база знаний по AppSec |
| **Portfolio** | Примеры кода, лабораторные, мини-проекты |
| **Roadmap** | Трекер прогресса и подготовки к собеседованиям |

Каждая тема строится по формату:

```
Теория → Как разработчик может ошибиться → Как AppSec обнаружит → Как исправить → Как предотвратить → Практика → Lessons Learned
```

---

## Структура

| # | Раздел | Описание |
|---|--------|----------|
| 00 | [Roadmap](00-roadmap) | Прогресс, трекер, learning roadmap, цели |
| 01 | [Fundamentals](01-fundamentals) | OWASP Top 10, ASVS, Security Principles |
| 02 | [Secure SDLC & Governance](02-secure-sdlc) | SDLC, BSIMM, SAMM, SSDF, Security Champions, Gates, Metrics |
| 03 | [Threat Modeling](03-threat-modeling) | STRIDE, DFD, Attack Trees, примеры |
| 04 | [Web Security](04-web-security) | XSS, CSRF, SQLi, SSRF, XXE, IDOR |
| 05 | [API Security](05-api-security) | REST, GraphQL, BOLA, Mass Assignment |
| 06 | [Authentication](06-authentication) | JWT, OAuth 2.0, OIDC, MFA, Session management |
| 07 | [Authorization](07-authorization) | RBAC, ABAC, Ownership, Least Privilege |
| 08 | [Cryptography](08-cryptography) | AES, RSA, ECC, Hashing, TLS |
| 09 | [DevSecOps](09-devsecops) | SAST, DAST, SCA, Secret Scanning, IaC |
| 10 | [Kubernetes](10-kubernetes) | RBAC, Pod Security, Network Policies |
| 11 | [Linux](11-linux) | Команды, systemd, auditd, openssl |
| 12 | [Tools](12-tools) | Burp, Semgrep, Trivy, Gitleaks — workflow |
| 13 | [Labs](13-labs) | PortSwigger, Juice Shop, DVWA, HTB |
| 14 | [Code Review](14-code-review) | Чек-листы: React, Node, PHP, Go |
| 15 | [Checklists](15-checklists) | Security Review, Docker, K8s, Release |
| 16 | [Writeups](16-writeups) | Разбор лабораторных и CVE |
| 17 | [Mini Projects](17-mini-projects) | vulnerable-api, jwt-demo, oauth-demo |
| 18 | [Case Studies](18-case-studies) | CVE Analysis, Bug Bounty, Postmortems |
| 19 | [Cheatsheets](19-cheatsheets) | JWT, Docker, kubectl, OpenSSL, XSS, SQLi |
| 20 | [Experience](20-experience) | Мой опыт в коммерческих проектах |
| 21 | [ADR](21-adr) | Architecture Decision Records |
| 22 | [Security Thinking](22-security-thinking) | Анализ, выводы, рефлексия |
| 23 | [Interview Notes](23-interview-notes) | Подготовка к собеседованиям по AppSec |

---

## 📈 Прогресс

```
Web Security:     ████████████████████ 80%
Governance:       ████████░░░░░░░░░░░░ 40%
Authentication:   ██████████████░░░░░░ 70%
Authorization:    ██████████░░░░░░░░░░ 50%
DevSecOps:        ██████████░░░░░░░░░░ 50%
Interview:        ████████░░░░░░░░░░░░ 30%
```

[Подробный трекер →](00-roadmap/README.md)
