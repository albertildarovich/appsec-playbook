# Knowledge

> Всё, что отвечает на вопрос **"Как это работает?"**

Этот слой — фундаментальная теоретическая база AppSec-инженера. Без глубокого понимания этих тем невозможно принимать взвешенные инженерные решения.

---

## Содержание

| Раздел | Описание | Статус |
|--------|----------|--------|
| [Secure Design](./secure-design/) | Secure Design Principles — все 12 в interview-ready формате | [OK] |
| [Fundamentals](01-fundamentals/) | Security Principles, Interpreters, NIST CSF, ASVS | [OK] |
| [Secure SDLC & Governance](02-secure-sdlc/) | SDLC, BSIMM, SAMM, SSDF, Security Champions, Gates |  |
| [Threat Modeling](03-threat-modeling/) | STRIDE, DFD, Attack Trees, методология | [OK] |
| [Web Security](04-web-security/) | SQLi, XSS, CSRF, SSRF, XXE, Command Injection, Deserialization | [OK] |
| [API Security](05-api-security/) | REST, GraphQL, BOLA, Mass Assignment, API Security Top 10 | [NO] |
| [Authentication](06-authentication/) | JWT, OAuth 2.0, OIDC, MFA, Session Management |  |
| [Authorization](07-authorization/) | RBAC, ABAC, IDOR, BOLA, Privilege Escalation | [OK] |
| [Cryptography](08-cryptography/) | AES, RSA, ECC, Hashing, TLS, Key Management |  |
| [DevSecOps](09-devsecops/) | SAST, DAST, SCA, Secret Scanning, IaC | [NO] |
| [Kubernetes](10-kubernetes/) | RBAC, Pod Security, Network Policies, Container Security | [NO] |
| [Linux](11-linux/) | Commands, systemd, auditd, openssl | [NO] |
| [Cloud](12-cloud/) | AWS Security, IAM, S3, Cloud Trail | [NO] |
| [Cheatsheets](19-cheatsheets/) | Быстрые справки по всем уязвимостям | [OK] |
| [OWASP Top 10](24-owasp-top10/) | Единый хаб по всем категориям A01–A10 | [OK] |
| [Tools](12-tools/) | Burp, Semgrep, Trivy, Gitleaks — workflow | [NO] |

---

## Secure Design Principles

**12 из 12** принципов готовы в едином interview-ready формате.

| Принцип | Статус |
|---------|--------|
| [Least Privilege](./secure-design/least-privilege.md) | [OK] |
| [Fail Secure (Fail Closed)](./secure-design/fail-secure.md) | [OK] |
| [Secure Defaults (Secure by Default)](./secure-design/secure-defaults.md) | [OK] |
| [Defense in Depth](./secure-design/defense-in-depth.md) | [OK] |
| [Reduce Attack Surface](./secure-design/reduce-attack-surface.md) | [OK] |
| [Complete Mediation](./secure-design/complete-mediation.md) | [OK] |
| [Economy of Mechanism](./secure-design/economy-of-mechanism.md) | [OK] |
| [Separation of Privilege](./secure-design/separation-of-privilege.md) | [OK] |
| [Least Common Mechanism](./secure-design/least-common-mechanism.md) | [OK] |
| [Never Trust the Client](./secure-design/never-trust-client.md) | [OK] |
| [Open Design](./secure-design/open-design.md) | [OK] |
| [Psychological Acceptability](./secure-design/psychological-acceptability.md) | [OK] |

[Карта всех принципов →](../Security%20Thinking/architecture-thinking/secure-design-principles.md)

---

## Как читать этот раздел

Начинай с **Fundamentals** — там закладывается мышление.
Затем **OWASP Top 10** — это must-know для любого AppSec.
Потом углубляйся по приоритетам: Authentication → Authorization → API Security → Cryptography → DevSecOps.

---

## Формат каждой темы

Каждый конспект строится по шаблону:

```
1. Теория — что это, как работает
2. Как разработчик может ошибиться — типичные anti-patterns
3. Как AppSec обнаружит — SAST, DAST, Code Review, Threat Modeling
4. Как исправить — безопасные паттерны
5. Как предотвратить — preventive controls
6. Практика — примеры, упражнения
7. Lessons Learned — что пошло не так в реальных проектах
```

---

>  **Принцип:** знание без практики — просто информация. Используй этот слой как справочник, но применяй знания в `Engineering/` и `Experience/`.


