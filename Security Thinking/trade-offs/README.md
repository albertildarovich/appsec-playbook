# Trade-offs

> Инженерные компромиссы. В безопасности нет серебряных пуль — каждое решение имеет цену.

Этот раздел — самый ценный для Senior-позиции. Умение выбирать между двумя вариантами, понимая цену каждого, — то, что отличает опытного инженера.

---

## Содержание

| Trade-off | Суть |
|-----------|------|
| [JWT vs Session](./jwt-vs-session.md) | Stateless vs возможность отзыва |
| [RBAC vs ABAC](./rbac-vs-abac.md) | Простота vs гибкость |
| [Encryption vs Search](./encryption-vs-search.md) | Безопасность данных vs возможность поиска |
| [Availability vs Security](./availability-vs-security.md) | Доступность vs защита |
| [Performance vs Validation](./performance-vs-validation.md) | Скорость vs проверка |
| [Caching vs Authorization](./caching-vs-authorization.md) | Производительность vs контроль доступа |
| [Verbose vs Generic Errors](./verbose-vs-generic-errors.md) | Удобство отладки vs information disclosure |
| Centralized vs Local Auth | SPOF vs консистентность |
| Public vs Internal API | Доступность vs контроль |

---

## Формат каждой записи

```
# Trade-off: [Название]

## Проблема
[Что выбираем]

## Вариант A: [Первый подход]
- Преимущества:
- Недостатки:
- Когда выбирать:

## Вариант B: [Второй подход]
- Преимущества:
- Недостатки:
- Когда выбирать:

## Decision Framework
[Как принимать решение]

## Пример из жизни
[Реальный кейс]

## Что я выбрал(а) и почему
[Личный опыт]
```

---

>  **Совет:** не запоминай "правильные" ответы. Понимай контекст, в котором каждый вариант становится правильным.
