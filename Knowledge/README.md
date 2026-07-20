# Knowledge

> Всё, что отвечает на вопрос **"Как это работает?"**

Этот слой — фундаментальная теоретическая база AppSec-инженера. Без глубокого понимания этих тем невозможно принимать взвешенные инженерные решения.

---

## Содержание

| Раздел | Описание | Статус |
|--------|----------|--------|
| [Secure Design](./secure-design/) | Secure Design Principles — 6 готовых конспектов в interview-ready формате | ✅ |
| [Fundamentals](01-fundamentals/) | Security Principles, Interpreters, NIST CSF, ASVS | ✅ |
| [Secure SDLC & Governance](02-secure-sdlc/) | SDLC, BSIMM, SAMM, SSDF, Security Champions, Gates | 📝 |
| [Threat Modeling](03-threat-modeling/) | STRIDE, DFD, Attack Trees, методология | ✅ |
| [Web Security](04-web-security/) | SQLi, XSS, CSRF, SSRF, XXE, Command Injection, Deserialization | ✅ |
| [API Security](05-api-security/) | REST, GraphQL, BOLA, Mass Assignment, API Security Top 10 | ❌ |
| [Authentication](06-authentication/) | JWT, OAuth 2.0, OIDC, MFA, Session Management | 📝 |
| [Authorization](07-authorization/) | RBAC, ABAC, IDOR, BOLA, Privilege Escalation | ✅ |
| [Cryptography](08-cryptography/) | AES, RSA, ECC, Hashing, TLS, Key Management | 📝 |
| [DevSecOps](09-devsecops/) | SAST, DAST, SCA, Secret Scanning, IaC | ❌ |
| [Kubernetes](10-kubernetes/) | RBAC, Pod Security, Network Policies, Container Security | ❌ |
| [Linux](11-linux/) | Commands, systemd, auditd, openssl | ❌ |
| [Cloud](12-cloud/) | AWS Security, IAM, S3, Cloud Trail | ❌ |
| [Cheatsheets](19-cheatsheets/) | Быстрые справки по всем уязвимостям | ✅ |
| [OWASP Top 10](24-owasp-top10/) | Единый хаб по всем категориям A01–A10 | ✅ |
| [Tools](12-tools/) | Burp, Semgrep, Trivy, Gitleaks — workflow | ❌ |

---

## Secure Design Principles

Закрыты 6 из 12 принципов в едином формате:

| Принцип | Статус |
|---------|--------|
| [Least Privilege](./secure-design/least-privilege.md) | ✅ |
| [Fail Secure (Fail Closed)](./secure-design/fail-secure.md) | ✅ |
| [Secure Defaults (Secure by Default)](./secure-design/secure-defaults.md) | ✅ |
| [Defense in Depth](./secure-design/defense-in-depth.md) | ✅ |
| [Reduce Attack Surface](./secure-design/reduce-attack-surface.md) | ✅ |
| [Complete Mediation](./secure-design/complete-mediation.md) | ✅ |
| Economy of Mechanism | ❌ |
| Separation of Privilege | ❌ |
| Open Design | ❌ |
| Never Trust the Client | 📝 |
| Psychological Acceptability | ❌ |
| Least Common Mechanism | ❌ |

[Карта всех принципов →](../Security%20Thinking/architecture-thinking/secure-design-principles.md)

---

## Как читать этот раздел

Начинай с **Fundamentals** — там закладывается мышление.
Затем **OWASP Top 10** — это must-know для любого AppSec.
Потом углубляйся по приоритетам: Authentication → Authorization → API Security → Cryptography → DevSecOps.

---

## Формат каждой темы

Каждый конспект строится по шаблону:

