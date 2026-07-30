# Checklists → Operational Playbooks

> **Этот раздел расширен и переименован → [`../playbooks/`](../playbooks/)**

Старые чек-листы превратились в **Operational Playbooks** — пошаговые сценарии для ежедневной работы.

В новой структуре каждый playbook содержит не просто список проверок, а полный сценарий:

```
Когда применять → Подготовка → Процесс (пошагово) → Чек-лист → Типичные ошибки → Результат
```

## Доступные playbooks

| Playbook | Описание |
|----------|----------|
| [Security Review](../playbooks/security-review.md) | Полный security review сервиса/фичи |
| [Release Review](../playbooks/release-review.md) | Security gates перед релизом |
| [Incident Response](../playbooks/incident-response.md) | Обнаружение, анализ, remediation |
| [Container Security Review](../playbooks/container-review.md) | Docker image, Dockerfile, scanning |
| [Kubernetes Security Review](../playbooks/k8s-review.md) | Pod security, RBAC, network policies |
| [API Security Review](../playbooks/api-review.md) | REST/GraphQL endpoints, auth |
| [Third-party Review](../playbooks/third-party-review.md) | Внешние сервисы, OAuth, webhooks |
| [Bug Bounty Triage](../playbooks/bug-bounty-triage.md) | Приоритизация, валидация |
| [Threat Modeling Session](../playbooks/threat-modeling-session.md) | Как провести TM |
| [Code Review Session](../playbooks/code-review-session.md) | Как проводить code review |

[Перейти к новой структуре →](../playbooks/)
