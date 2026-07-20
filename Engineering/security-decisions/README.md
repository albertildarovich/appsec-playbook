# Security Decisions

> Библиотека инженерных решений: что выбрать в конкретной ситуации и почему.

В отличие от ADR (которые про конкретные проекты), этот раздел — про **универсальные** решения и дилеммы, с которыми сталкивается каждый AppSec-инженер.

---

## Содержание

| Решение | Суть |
|---------|------|
| [Fail Open vs Fail Closed](./fail-open-vs-closed.md) | Что делать, когда security service недоступен |
| [Block vs Alert](./block-vs-alert.md) | Когда блокировать, а когда только уведомлять |
| [Allowlist vs Blocklist](./allowlist-vs-blocklist.md) | Что и когда использовать |
| [Centralized vs Distributed Security](./centralized-vs-distributed.md) | Один сервис или ответственность на каждом |
| [Pre-commit vs CI vs CD gates](./security-gates-placement.md) | Где размещать security gates |
| [In-house vs Vendor](./in-house-vs-vendor.md) | Покупать или писать свой security tool |
| [Top-down vs Bottom-up](./top-down-vs-bottom-up.md) | Как внедрять security культуру |
| [Preventive vs Detective controls](./preventive-vs-detective.md) | Что важнее: предотвратить или обнаружить |

---

## Формат каждой записи

```
# [Решение]

## Проблема
[Что выбираем]

## Контекст
[Когда этот выбор актуален]

## Вариант A
- Когда выбирать
- Почему
- Риски

## Вариант B
- Когда выбирать
- Почему
- Риски

## Decision Matrix

| Критерий | Вариант A | Вариант B |
|----------|-----------|-----------|
| ...      | ...       | ...       |

## Пример из жизни
[Реальный кейс]
```

---

> ⚡ **Принцип:** каждое решение должно быть привязано к контексту. Не "X лучше Y", а "в контексте Z, X лучше Y, потому что...".
