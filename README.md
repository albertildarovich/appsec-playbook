# Application Security Playbook

> **Engineering Portfolio of an Application Security / DevSecOps Engineer**

Практическое инженерное портфолио, демонстрирующее мой подход к Application Security, DevSecOps и Secure SDLC.

В репозитории собраны реальные инженерные артефакты: архитектурные обзоры, threat models, Security Code Review, DevSecOps pipeline, лабораторные проекты, ADR, практические плейбуки и разборы инцидентов.

Главная цель репозитория — показать **не только знания технологий, но и инженерное мышление, процесс принятия решений и подход к построению безопасной разработки.**

---

# Highlights

- 100+ инженерных документов
- 15 тематических разделов
- 17 лабораторных модулей OWASP Juice Shop
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
| Threat Modeling | [STRIDE](Knowledge/threat-modeling/stride.md), [Juice Shop Threat Model](Experience/labs/juice-shop/threat-model.md) |
| Architecture Review | [API Gateway Review](Engineering/architecture-reviews/api-gateway.md), [Payments Review](Engineering/architecture-reviews/payments.md) |
| Security Code Review | [Checklist](Engineering/code-review/review-checklist.md), React, Go |
| OWASP Top 10 | [All Categories A01–A10](Knowledge/owasp-top10/) |
| API Security | JWT, OAuth2/OIDC, API Gateway, OWASP API Security |
| Kubernetes Security | RBAC, Pod Security, Network Policies, Runtime Security |
| Docker Security | CIS Benchmark, Hardened Dockerfile, Trivy, Falco |
| Authentication & Authorization | JWT, OAuth2/OIDC, RBAC, BOLA, IDOR |
| Secure Design | Security Principles, Architecture Thinking |
| Security Reviews | Architecture Reviews, Playbooks, ADR |

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

- Capital One SSRF
- Auth0 JWT vulnerability
- Juice Shop Authentication Bypass

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
Knowledge/
    How security works

Engineering/
    How I build security

Experience/
    What I implemented

Security Thinking/
    How I analyze security
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
