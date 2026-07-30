# 🗺 AppSec Roadmap

> Личный трекер подготовки и прогресса. Позволяет в любой момент увидеть, какие темы закрыты, а какие ещё в работе.

---

##  Прогресс по темам

```
=== Security Thinking (Tier 0) ===
Interpreters           ████████████████████ 100% [OK]
Insecure Design (A04) ████████████████████ 100% [OK]
Risk Assessment        ████████░░░░░░░░░░░░  40% 
Triage                 ████████░░░░░░░░░░░░  40% 
Architecture Thinking  ████████░░░░░░░░░░░░  40% 

=== OWASP Top 10 (Done) ===
SQL Injection          ████████████████████ 100% [OK]
XSS                    ████████████████████ 100% [OK]
CSRF                   ████████████████████ 100% [OK]
SSRF                   ████████████████████ 100% [OK]
XXE                    ████████████████████ 100% [OK]
Command Injection      ████████████████████ 100% [OK]
Insecure Deserialization ████████████████████ 100% [OK]
Security Misconfig.   ████████████████████ 100% [OK]
Vulnerable Components ████████████████████ 100% [OK]
Identification & Auth ████████████████████ 100% [OK]

=== OWASP Top 10 (TODO) ===
Broken Access Control ████████████████████ 100% [OK]
Cryptographic Failures ████████████████████ 100% [OK]
Software Integrity    ░░░░░░░░░░░░░░░░░░░░   0% [NO]
Logging & Monitoring  ░░░░░░░░░░░░░░░░░░░░   0% [NO]

=== API Security ===
REST / GraphQL        ░░░░░░░░░░░░░░░░░░░░   0% [NO]
BOLA / Mass Assign.   ░░░░░░░░░░░░░░░░░░░░   0% [NO]
JWT / OAuth           ░░░░░░░░░░░░░░░░░░░░   0% [NO]
API Security Top 10   ░░░░░░░░░░░░░░░░░░░░   0% [NO]

=== Secure Code Review ===
Methodology           ░░░░░░░░░░░░░░░░░░░░   0% [NO]
Java / Python / Go    ░░░░░░░░░░░░░░░░░░░░   0% [NO]
SAST (Semgrep/CodeQL) ░░░░░░░░░░░░░░░░░░░░   0% [NO]

=== Threat Modeling ===
STRIDE                 ████████████████████ 100% [OK]
DFD                    ░░░░░░░░░░░░░░░░░░░░   0% [NO]
Attack Trees           ░░░░░░░░░░░░░░░░░░░░   0% [NO]

=== Secure SDLC & DevSecOps ===
Secure SDLC           ██████░░░░░░░░░░░░░░  30% 
CI/CD Security        ██████░░░░░░░░░░░░░░  30% 
BSIMM / SAMM / SSDF   ░░░░░░░░░░░░░░░░░░░░   0% [NO]

=== Supply Chain ===
SBOM / SCA            ████████████████████ 100% [OK]
Cosign / Sigstore     ░░░░░░░░░░░░░░░░░░░░   0% [NO]
CI/CD Pipeline Sec.   ░░░░░░░░░░░░░░░░░░░░   0% [NO]

=== Infrastructure & Cloud ===
Kubernetes            ░░░░░░░░░░░░░░░░░░░░   0% [NO]
Linux                 ░░░░░░░░░░░░░░░░░░░░   0% [NO]
Cloud (AWS)           ░░░░░░░░░░░░░░░░░░░░   0% [NO]
IaC                   ░░░░░░░░░░░░░░░░░░░░   0% [NO]

=== Soft Skills & Process ===
Communication         ░░░░░░░░░░░░░░░░░░░░   0% [NO]
Interview Prep        ░░░░░░░░░░░░░░░░░░░░   0% [NO]
```

**Легенда:** [OK] Готово —  В работе — [NO] Не начато

---

##  Learning Roadmap

### Tier 0: Security Thinking (мышление)
- [x] **Интерпретаторы** — объединяющая концепция
- [x] **Insecure Design (A04)** — архитектурное мышление, Abuse Cases, Never Trust the Client
- [ ] Risk Assessment (CVE vs Risk, контекст)
- [ ] Triage (приоритизация, FP, reachability)
- [ ] Architecture Thinking (trade-offs, surface reduction)

### Tier 1: Fundamentals & OWASP Top 10
- [x] Security Principles (CIA, Defense in Depth, Least Privilege)
- [x] OWASP Top 10 — общий обзор
- [x] SQL Injection
- [x] XSS
- [x] CSRF
- [x] SSRF
- [x] XXE
- [x] Command Injection
- [x] Insecure Deserialization
- [x] Security Misconfiguration (A05)
- [x] Vulnerable Components (A06)
- [x] Identification & Authentication Failures (A07)
- [x] Broken Access Control (A01)
- [x] Cryptographic Failures (A02)
- [ ] Software & Data Integrity Failures (A08)
- [ ] Logging & Monitoring Failures (A09)

### Tier 2: API Security
- [ ] REST API Security
- [ ] GraphQL Security
- [ ] BOLA / Mass Assignment
- [ ] JWT / OAuth
- [ ] API Gateway
- [ ] Rate Limiting
- [ ] OWASP API Security Top 10

### Tier 3: Secure Code Review
- [ ] Code Review Methodology
- [ ] Java — patterns & anti-patterns
- [ ] Python — patterns & anti-patterns
- [ ] Go — patterns & anti-patterns
- [ ] Node.js — patterns & anti-patterns
- [ ] SAST (Semgrep, CodeQL)

### Tier 4: Threat Modeling
- [x] **STRIDE** — методология поиска угроз (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, EoP)
- [ ] DFD (Data Flow Diagrams)
- [ ] Attack Trees
- [ ] Практика: нарисовать TM для реального сервиса

### Tier 5: Secure SDLC & DevSecOps
- [ ] Secure SDLC (фазы, security gates)
- [ ] CI/CD Security (Pipeline, SAST/DAST/SCA)
- [ ] BSIMM
- [ ] OWASP SAMM
- [ ] NIST SSDF

### Tier 6: Supply Chain Security
- [x] SBOM / SCA
- [ ] Cosign / Sigstore
- [ ] CI/CD Pipeline Security (Artifact Integrity)

### Tier 7: Infrastructure & Cloud
- [ ] Kubernetes Security
- [ ] Linux Security
- [ ] Cloud Security (AWS)
- [ ] IaC Security (Terraform)

### Tier 8: Soft Skills & Process
- [ ] Communication (как говорить с разработчиками и бизнесом)
- [ ] Interview Preparation

---

##  Interview Progress

| Компания | Статус | Дата | Заметки |
|----------|--------|------|---------|
| — | — | — | — |

---

##  Books

- [ ] The Web Application Hacker's Handbook
- [ ] Threat Modeling: Designing for Security — Adam Shostack
- [ ] The Tangled Web — Michal Zalewski
- [ ] OWASP Testing Guide
- [ ] Linux Command Line and Shell Scripting Bible

---

##  Courses

- [ ] SANS SEC542: Web App Penetration Testing
- [ ] SANS SEC566: Implementing and Auditing
- [ ] PortSwigger Web Security Academy (все лабораторные)
- [ ] PentesterLab PRO

---

##  Certificates

- [ ] OSWE (Offensive Security Web Expert)
- [ ] Certified AppSec Practitioner (CAP)
- [ ] GIAC Web Application Penetration Tester (GWAPT)

---

>  **Принцип:** прогресс обновляется по мере написания конспектов. 100% = в playbook есть полноценный раздел с теорией, примерами, практикой и чек-листами.
