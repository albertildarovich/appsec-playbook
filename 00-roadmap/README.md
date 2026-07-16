# 🗺️ AppSec Roadmap

> Личный трекер подготовки и прогресса. Позволяет в любой момент увидеть, какие темы закрыты, а какие ещё в работе.

---

## 📊 Прогресс по темам

```
=== Security Thinking (Tier 0) ===
Interpreters           ████████████████████ 100% ✅
Risk Assessment        ████████░░░░░░░░░░░░  40% 📝
Triage                 ████████░░░░░░░░░░░░  40% 📝
Architecture Thinking  ████████░░░░░░░░░░░░  40% 📝

=== OWASP Top 10 (Done) ===
SQL Injection          ████████████████████ 100% ✅
XSS                    ████████████████████ 100% ✅
CSRF                   ████████████████████ 100% ✅
SSRF                   ████████████████████ 100% ✅
XXE                    ████████████████████ 100% ✅
Command Injection      ████████████████████ 100% ✅
Insecure Deserialization ████████████████████ 100% ✅
Security Misconfig.   ████████████████████ 100% ✅
Vulnerable Components ████████████████████ 100% ✅
Identification & Auth ████████████████████ 100% ✅

=== OWASP Top 10 (TODO) ===
Broken Access Control ████████████████████ 100% ✅
Cryptographic Failures ░░░░░░░░░░░░░░░░░░░░   0% ❌
Software Integrity    ░░░░░░░░░░░░░░░░░░░░   0% ❌
Logging & Monitoring  ░░░░░░░░░░░░░░░░░░░░   0% ❌

=== API Security ===
REST / GraphQL        ░░░░░░░░░░░░░░░░░░░░   0% ❌
BOLA / Mass Assign.   ░░░░░░░░░░░░░░░░░░░░   0% ❌
JWT / OAuth           ░░░░░░░░░░░░░░░░░░░░   0% ❌
API Security Top 10   ░░░░░░░░░░░░░░░░░░░░   0% ❌

=== Secure Code Review ===
Methodology           ░░░░░░░░░░░░░░░░░░░░   0% ❌
Java / Python / Go    ░░░░░░░░░░░░░░░░░░░░   0% ❌
SAST (Semgrep/CodeQL) ░░░░░░░░░░░░░░░░░░░░   0% ❌

=== Threat Modeling ===
STRIDE / DFD / Trees  ░░░░░░░░░░░░░░░░░░░░   0% ❌

=== Secure SDLC & DevSecOps ===
Secure SDLC           ██████░░░░░░░░░░░░░░  30% 📝
CI/CD Security        ██████░░░░░░░░░░░░░░  30% 📝
BSIMM / SAMM / SSDF   ░░░░░░░░░░░░░░░░░░░░   0% ❌

=== Supply Chain ===
SBOM / SCA            ████████████████████ 100% ✅
Cosign / Sigstore     ░░░░░░░░░░░░░░░░░░░░   0% ❌
CI/CD Pipeline Sec.   ░░░░░░░░░░░░░░░░░░░░   0% ❌

=== Infrastructure & Cloud ===
Kubernetes            ░░░░░░░░░░░░░░░░░░░░   0% ❌
Linux                 ░░░░░░░░░░░░░░░░░░░░   0% ❌
Cloud (AWS)           ░░░░░░░░░░░░░░░░░░░░   0% ❌
IaC                   ░░░░░░░░░░░░░░░░░░░░   0% ❌

=== Soft Skills & Process ===
Communication         ░░░░░░░░░░░░░░░░░░░░   0% ❌
Interview Prep        ░░░░░░░░░░░░░░░░░░░░   0% ❌
```

**Легенда:** ✅ Готово — 📝 В работе — ❌ Не начато

---

## 📚 Learning Roadmap

### Tier 0: Security Thinking (мышление)
- [x] **Интерпретаторы** — объединяющая концепция
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
- [ ] Cryptographic Failures (A02)
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
- [ ] STRIDE
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

## 🎯 Interview Progress

| Компания | Статус | Дата | Заметки |
|----------|--------|------|---------|
| — | — | — | — |

---

## 📖 Books

- [ ] The Web Application Hacker's Handbook
- [ ] Threat Modeling: Designing for Security — Adam Shostack
- [ ] The Tangled Web — Michal Zalewski
- [ ] OWASP Testing Guide
- [ ] Linux Command Line and Shell Scripting Bible

---

## 🎓 Courses

- [ ] SANS SEC542: Web App Penetration Testing
- [ ] SANS SEC566: Implementing and Auditing
- [ ] PortSwigger Web Security Academy (все лабораторные)
- [ ] PentesterLab PRO

---

## 🏆 Certificates

- [ ] OSWE (Offensive Security Web Expert)
- [ ] Certified AppSec Practitioner (CAP)
- [ ] GIAC Web Application Penetration Tester (GWAPT)

---

> ⚡ **Принцип:** прогресс обновляется по мере написания конспектов. 100% = в playbook есть полноценный раздел с теорией, примерами, практикой и чек-листами.
