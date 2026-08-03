# Application Security Playbook

> **Engineering Portfolio of an Application Security / DevSecOps Engineer**

Практическое инженерное портфолио, демонстрирующее мой подход к Application Security, DevSecOps и Secure SDLC.

В репозитории собраны реальные инженерные артефакты: архитектурные обзоры, threat models, Security Code Review, DevSecOps pipeline, лабораторные проекты, ADR, практические плейбуки и разборы инцидентов.

Главная цель репозитория — показать **не только знания технологий, но и инженерное мышление, процесс принятия решений и подход к построению безопасной разработки.**

---

# Highlights

- 100+ инженерных документов
- 15 тематических разделов
- 24 лабораторных модуля OWASP Juice Shop (включая практику по ГОСТ Р 56939-2024)
- Production-grade Secure SDLC Pipeline (GitLab CI)
- Security Architecture Reviews
- Threat Modeling (STRIDE)
- Security Code Review
- DevSecOps Playbooks
- Case Studies реальных атак
- Open Source

---

# Core Competencies

| Competency | Evidence |
|------------|----------|
| Secure SDLC | [Security Gates, BSIMM, SAMM, SSDF, Champions, Metrics](Knowledge/secure-sdlc/) |
| DevSecOps | [SAST, DAST, SCA, Secret Detection, CI/CD Security](Knowledge/devsecops/devsecops.md) |
| Threat Modeling | [STRIDE](Knowledge/threat-modeling/stride.md), [Juice Shop Threat Model](Experience/labs/juice-shop/threat-model.md), [Overview](Knowledge/threat-modeling/) |
| Architecture Review | [API Gateway Review](Engineering/architecture-reviews/api-gateway.md), [Payments Review](Engineering/architecture-reviews/payments.md) |
| Security Code Review | [Checklist](Engineering/code-review/review-checklist.md), [Overview](Engineering/code-review/) |
| OWASP Top 10 | [All Categories A01–A10](Knowledge/owasp-top10/) |
| API Security | [Overview](Knowledge/api-security/), JWT, OAuth2/OIDC, API Gateway, OWASP API Security |
| Kubernetes Security | [Overview](Knowledge/kubernetes/), RBAC, Pod Security, Network Policies, Runtime Security |
| Docker Security | [Guide](Knowledge/docker-security/README.md), CIS Benchmark, Hardened Dockerfile, Trivy, Falco |
| Authentication & Authorization | [JWT](Knowledge/authentication/jwt.md), [OAuth2/OIDC](Knowledge/authentication/oauth2-oidc.md), [Overview](Knowledge/authentication/), [Authorization](Knowledge/authorization/) |
| Secure Design | [Security Principles](Knowledge/secure-design/), [Architecture Thinking](Security%20Thinking/architecture-thinking/secure-design-principles.md) |
| Security Reviews | [Architecture Reviews](Engineering/architecture-reviews/), [Playbooks](Engineering/playbooks/), [ADR](Engineering/adr/) |

---

# Featured Engineering Artifacts

## Production-grade Secure SDLC Pipeline

**Demonstrates**

- GitLab CI
- Security Gates
- SAST
- SCA
- Secret Detection
- DAST
- Gherkin Security Requirements

➡️ [Open document](Experience/labs/juice-shop/module-17-ssdlc/report.md)

---

## Security Architecture Review

API Gateway security assessment using STRIDE.

Includes

- 24 identified threats
- mitigation strategy
- architecture recommendations
- review checklist

➡️ [Open document](Engineering/architecture-reviews/api-gateway.md)

---

## Docker Security Guide

Practical Docker hardening.

Includes

- CIS Benchmark
- Hardened Dockerfile
- Trivy
- Falco
- BuildKit Secrets

➡️ [Open document](Knowledge/docker-security/README.md)

---

## Authentication & Authorization

Practical documentation covering

- JWT
- OAuth 2.0
- OIDC
- common vulnerabilities
- validation checklist

➡️ [JWT](Knowledge/authentication/jwt.md)

➡️ [OAuth2/OIDC](Knowledge/authentication/oauth2-oidc.md)

---

## Security Review Playbook

Complete methodology for conducting security reviews.

Includes

- preparation
- architecture analysis
- threat modeling
- reporting
- recommendations

➡️ [Open document](Engineering/playbooks/security-review.md)

---

## Case Studies

Analysis of real-world incidents.

- [Capital One SSRF](Experience/case-studies/case03-capital-one-ssrf.md)
- [Auth0 JWT vulnerability](Experience/case-studies/case02-auth0-jwt.md)
- [Juice Shop Authentication Bypass](Experience/case-studies/case01.md)

➡️ [All case studies](Experience/case-studies/)

---

## Mini Projects

Practical implementations.

- [Chrome Security Auditor Extension](Experience/mini-projects/chrome-security-auditor/)
- [VS Code Security Auditor Extension](Experience/mini-projects/vscode-security-auditor/)

➡️ [All mini projects](Experience/mini-projects/)

---

# Tooling

| Category | Stack |
|-----------|------|
| SAST | Semgrep (public + custom rules) |
| DAST | OWASP ZAP, Nuclei |
| SCA | Trivy, npm audit |
| Secret Detection | Gitleaks |
| Container Security | Trivy |
| Runtime Security | Falco |
| IaC | Checkov, tfsec |
| Kubernetes | kube-bench, CIS Benchmark |
| Manual Testing | Burp Suite Professional |
| CI/CD | GitLab CI, GitHub Actions |

---

# Repository Structure

```
[Knowledge](Knowledge/)                          How security works
  |-- [Fundamentals](Knowledge/fundamentals/)
  |-- [Secure Design](Knowledge/secure-design/)
  |-- [Authentication](Knowledge/authentication/)
  |-- [Authorization](Knowledge/authorization/)
  |-- [Threat Modeling](Knowledge/threat-modeling/)
  |-- [OWASP Top 10](Knowledge/owasp-top10/)
  |-- [API Security](Knowledge/api-security/)
  |-- [Web Security](Knowledge/web-security/)
  |-- [Cryptography](Knowledge/cryptography/)
  |-- [Kubernetes Security](Knowledge/kubernetes/)
  |-- [Docker Security](Knowledge/docker-security/)
  |-- [DevSecOps](Knowledge/devsecops/)
  |-- [Cheatsheets](Knowledge/cheatsheets/)
  |-- [Roadmap](Knowledge/roadmap/)
  |-- [Tools](Knowledge/tools/)
  |-- [Go Security](Knowledge/go-security/)
  |-- [Linux Security](Knowledge/linux/)
  |-- [Secure SDLC](Knowledge/secure-sdlc/)

[Engineering](Engineering/)                      How I build security
  |-- [Architecture Reviews](Engineering/architecture-reviews/)
  |-- [Code Review](Engineering/code-review/)
  |-- [Checklists](Engineering/checklists/)
  |-- [Playbooks](Engineering/playbooks/)
  |-- [ADR (Architecture Decision Records)](Engineering/adr/)
  |-- [Architecture Patterns](Engineering/architecture-patterns/)
  |-- [Security Decisions](Engineering/security-decisions/)

[Experience](Experience/)                        What I implemented
  |-- [Case Studies](Experience/case-studies/)
  |-- [Labs: OWASP Juice Shop](Experience/labs/juice-shop/)
  |-- [Mini Projects](Experience/mini-projects/)

[Security Thinking](Security%20Thinking/)        How I analyze security
  |-- [Analysis](Security%20Thinking/analysis/)
  |-- [Trade-offs](Security%20Thinking/trade-offs/)
  |-- [Architecture Thinking](Security%20Thinking/architecture-thinking/)
```

---

# Engineering Principles

This repository follows several principles:

- Security should support development, not slow it down.
- Automation is preferred over manual processes.
- Threats are analyzed before selecting tools.
- Security controls should be reproducible.
- Engineering decisions should be documented.
- Every recommendation should have technical justification.

---

# Why this repository exists

Most security repositories focus on explaining technologies.

This repository focuses on demonstrating engineering practice.

Instead of isolated notes, it contains complete engineering artifacts that can be used as references during architecture reviews, Secure SDLC implementation, DevSecOps adoption and Application Security assessments.

---

# About

Repository maintained by an Application Security / DevSecOps Engineer.

GitHub:
https://github.com/albertildarovich