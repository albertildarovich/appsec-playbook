# Checklists → Operational Playbooks

> **Этот раздел расширен и переименован → [`../Engineering/playbooks/`](../Engineering/playbooks/)**

Старые чек-листы превратились в **Operational Playbooks** — пошаговые сценарии для ежедневной работы.

В новой структуре каждый playbook содержит не просто список проверок, а полный сценарий:

```
Когда применять → Подготовка → Процесс (пошагово) → Чек-лист → Типичные ошибки → Результат
```

## Доступные playbooks

| Playbook | Описание |
|----------|----------|
| [Security Review](../Engineering/playbooks/security-review.md) | Полный security review сервиса/фичи |
| [Release Review](../Engineering/playbooks/release-review.md) | Security gates перед релизом |
| [Incident Response](../Engineering/playbooks/incident-response.md) | Обнаружение, анализ, remediation |
| [Container Security Review](../Engineering/playbooks/container-review.md) | Docker image, Dockerfile, scanning |
| [Kubernetes Security Review](../Engineering/playbooks/k8s-review.md) | Pod security, RBAC, network policies |
| [API Security Review](../Engineering/playbooks/api-review.md) | REST/GraphQL endpoints, auth |
| [Third-party Review](../Engineering/playbooks/third-party-review.md) | Внешние сервисы, OAuth, webhooks |
| [Bug Bounty Triage](../Engineering/playbooks/bug-bounty-triage.md) | Приоритизация, валидация |
| [Threat Modeling Session](../Engineering/playbooks/threat-modeling-session.md) | Как провести TM |
| [Code Review Session](../Engineering/playbooks/code-review-session.md) | Как проводить code review |

[Перейти к новой структуре →](../Engineering/playbooks/)
