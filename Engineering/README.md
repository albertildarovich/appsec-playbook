# Engineering

> Всё, что отвечает на вопрос **"Как я работаю?"**

Этот слой — инженерная практика. Не теория, а готовые сценарии, шаблоны, чек-листы и архитектурные решения, которые я применяю в реальной работе.

```
Knowledge → Engineering → Experience
  (знаю)      (делаю)       (понимаю)
```

---

## Содержание

| Раздел | Описание | Статус |
|--------|----------|--------|
| [Architecture Reviews](./architecture-reviews/) | Шаблоны security review для типовых компонентов | [NO] |
| [Architecture Patterns](./architecture-patterns/) | Паттерны безопасности: Authentication, Authorization, Secrets, Logging | [NO] |
| [Threat Models](./threat-models/) | Готовые Threat Models для типовых систем | [NO] |
| [Code Reviews](./code-reviews/) | Разборы Code Review: что искать, как аргументировать | [NO] |
| [Security Reviews](./security-reviews/) | Полные security review: методология, шаблоны, примеры | [NO] |
| [ADR](./adr/) | Архитектурные решения и компромиссы (Architecture Decision Records) |  |
| [Operational Playbooks](./playbooks/) | Пошаговые сценарии: Security Release, Incident Response, Container Review |  |
| [Security Decisions](./security-decisions/) | Библиотека инженерных решений: Trade-offs, сравнения, почему X а не Y | [NO] |
| [Patterns](./patterns/) | Повторяемые решения: безопасные паттерны для типовых задач | [NO] |
| [Checklists](./checklists/) | Быстрые чек-листы для Code Review, Security Review, Release |  |

---

## Architecture Reviews

Готовые шаблоны для security review типовых компонентов:

```
Password Reset Flow
OAuth / Social Login
Payments Integration
File Upload
Webhook Handling
Email / Notifications
CI/CD Pipeline
Internal API
Public API
Admin Panel
```

Каждый review отвечает на вопросы:
- Какие угрозы? (STRIDE)
- Что проверять? (чек-лист)
- Типичные ошибки?
- Безопасные паттерны?

---

## Architecture Patterns

Повторяемые архитектурные решения:

```
Authentication Patterns
  - Token-based auth (JWT, opaque tokens)
  - Session-based auth
  - API Key patterns
  - Service-to-service auth (mTLS, SPIFFE)

Authorization Patterns
  - Centralized (OPA, SpiceDB, Casbin)
  - Distributed (RBAC in each service)
  - Token-based (JWT claims)

Secret Management Patterns
  - Vault dynamic secrets
  - Cloud KMS (AWS KMS, GCP KMS)
  - Kubernetes External Secrets
  - Encryption at rest patterns

Logging & Monitoring Patterns
  - Structured logging
  - Audit trail patterns
  - SIEM integration

Encryption Patterns
  - Encryption in transit
  - Encryption at rest
  - Application-level encryption
  - Field-level encryption
```

---

## ADR (Architecture Decision Records)

Библиотека архитектурных решений — почему выбрали X, а не Y:

```
ADR-001: OAuth 2.0 вместо Session-based auth
ADR-002: Semgrep для SAST вместо SonarQube
ADR-003: WAF в режиме Fail Open
ADR-004: Vault для secrets management
ADR-005: Centralized authorization (OPA)

Формат каждой записи:
- Контекст: что происходило
- Проблема: какую задачу решали
- Варианты: какие были альтернативы
- Решение: что выбрали и почему
- Trade-offs: чем пришлось пожертвовать
- Последствия: к чему привело решение
```

---

## Operational Playbooks

Пошаговые сценарии для ежедневной работы:

```
Security Review Playbook
Release Review Playbook
Incident Response Playbook
Container Security Review
Kubernetes Security Review
API Security Review
Third-party Integration Review
Bug Bounty Triage Playbook
```

Каждый playbook содержит:
- Когда применять
- Пошаговая инструкция
- Чек-лист проверок
- Типичные ошибки
- Выходные артефакты

---

## Security Decisions

Библиотека инженерных компромиссов — Trade-offs, которые приходится делать:

```
Availability vs Security
Performance vs Validation
Caching vs Authorization
JWT vs Session
RBAC vs ABAC
Encryption vs Searchability
Public API vs Internal API
Centralized Auth vs Local Auth
Rate Limiting Strategy
Error Handling: Verbose vs Generic
```

Каждое решение:
- Проблема
- Варианты
- Trade-offs
- Когда выбирать каждый вариант
- Реальный пример

---
