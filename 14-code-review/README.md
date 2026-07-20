# Security Code Review

> **Этот раздел расширен → [`../Engineering/code-reviews/`](../Engineering/code-reviews/) и [`../Engineering/playbooks/code-review-session.md`](../Engineering/playbooks/code-review-session.md)**

Здесь собраны чек-листы, сценарии и паттерны для проведения Security Code Review.

Новая структура добавляет к чек-листам полноценные разборы (code-reviews/) с реальными примерами из проектов.

## Почему это важно

> 80% уязвимостей можно найти на этапе Code Review. Это дешевле, быстрее и точнее, чем PenTest.
> Хороший Code Review — визитная карточка AppSec инженера.

## Структура

| Файл | Описание |
|------|----------|
| [review-checklist.md](review-checklist.md) | Универсальный чек-лист для любого проекта |
| [react.md](react.md) | Что проверять в React/Next.js |
| [node.md](node.md) | Express, Nest.js — типичные ошибки |
| [php.md](php.md) | Laravel, Symfony |
| [go.md](go.md) | Go — особенности безопасности |
| [api.md](api.md) | REST/GraphQL API review |
| [iac.md](iac.md) | Terraform, CloudFormation — review |
| [how-to-review.md](how-to-review.md) | Методология: как проводить Code Review |

## Мой процесс Code Review

```
1. Беглый просмотр → понять, что делает код
2. Фокус на sensitive areas:
   - Authentication / Authorization
   - Input handling
   - Data storage / transmission
   - Error handling
   - Dependencies
3. Использовать checklist
4. SAST поверх (Semgrep)
5. Оформить findings: Проблема → Риск → Fix → Пример
```
