# AppSec Playbook

---

## 🎯 Концепция

Этот репозиторий — **живой инженерный инструмент**, объединяющий:

| Роль | Как работает |
|------|-------------|
| **Playbook** | Готовые сценарии: как проводить Threat Modeling, что проверять в Code Review |
| **Second Brain** | Мои выводы, инсайты, Lessons Learned |
| **Wiki** | Структурированная база знаний по AppSec |
| **Portfolio** | Примеры кода, лабораторные, мини-проекты |

Каждая тема строится по формату:

```
Теория → Как разработчик может ошибиться → Как AppSec обнаружит → Как исправить → Как предотвратить → Практика → Lessons Learned
```

---

## 📋 Структура

| # | Раздел | Описание |
|---|--------|----------|
| 01 | [Fundamentals](01-fundamentals) | База: OWASP Top 10, ASVS, модели угроз |
| 02 | [Secure SDLC](02-secure-sdlc) | SDLC с интеграцией безопасности |
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
| 19 | [Cheatsheets](19-cheatsheets) | JWT, Docker, kubectl, OpenSSL |
| 20 | [Experience](20-experience) | Мой опыт в коммерческих проектах |
| 21 | [ADR](21-adr) | Architecture Decision Records |
| 22 | [Security Thinking](22-security-thinking) | Анализ, выводы, рефлексия |

---
