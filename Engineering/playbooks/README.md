# Operational Playbooks

> Пошаговые сценарии для ежедневной работы AppSec-инженера.

Не чек-листы, а полноценные playbooks: что делать, в каком порядке, какие вопросы задавать, на что обращать внимание.

---

## Содержание

| Playbook | Описание | Статус |
|----------|----------|--------|
| [Security Review](./security-review.md) | Полный security review сервиса/фичи | ❌ |
| [Release Review](./release-review.md) | Security gates перед релизом | ❌ |
| [Incident Response](./incident-response.md) | Обнаружение, анализ, remediation | ❌ |
| [Container Security Review](./container-review.md) | Docker image, Dockerfile, scanning | ❌ |
| [Kubernetes Security Review](./k8s-review.md) | Pod security, RBAC, network policies | ❌ |
| [API Security Review](./api-review.md) | REST/GraphQL endpoints, auth, rate limiting | ❌ |
| [Third-party Integration Review](./third-party-review.md) | Внешние сервисы, OAuth, webhooks | ❌ |
| [Bug Bounty Triage](./bug-bounty-triage.md) | Приоритизация, валидация, скоринг | ❌ |
| [Threat Modeling Session](./threat-modeling-session.md) | Как провести TM: подготовка, проведение, результаты | ❌ |
| [Code Review Session](./code-review-session.md) | Как проводить code review: методология, checklists | ❌ |

---

## Формат каждого playbook

```
# Playbook: [Название]

## Когда применять
[Trigger / условие]

## Подготовка
[Что нужно перед началом]

## Процесс (пошагово)
### Шаг 1: [Название]
[Что делать]

### Шаг 2: [Название]
[Что делать]

...

## Чек-лист
[ ] Пункт 1
[ ] Пункт 2

## Типичные ошибки
1. ...
2. ...

## Результат
[Что должно быть на выходе]

## Время выполнения
[Оценка времени]
```

---

> ⚡ **Принцип:** playbook должен быть настолько конкретным, чтобы его мог выполнить другой инженер без дополнительных уточнений.
