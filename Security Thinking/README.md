# Security Thinking

> **Центр плейбука.** Не конспекты, а мышление.

Этот раздел — самое ценное, что есть в этом плейбуке. Здесь собрано не *что* такое уязвимость, а *как думать* о безопасности, принимать решения, оценивать риски и находить неочевидные проблемы.

> "Security is not a product, but a way of thinking." — Bruce Schneier

---

## Почему это центр плейбука

Все остальные разделы отвечают на вопрос **"ЧТО?"**
- Что такое SQL Injection?
- Что такое JWT?
- Что такое RBAC?

**Security Thinking** отвечает на вопрос **"КАК?"**
- Как думать о безопасности новой фичи?
- Как принимать trade-offs?
- Как оценивать риски?
- Как объяснить разработчику, почему это важно?

Без этого раздела ты — ходячая энциклопедия уязвимостей.
С ним — инженер, который принимает решения.

---

## Содержание

| Раздел | Описание | Статус |
|--------|----------|--------|
| [Mental Models](./mental-models/) | Фреймворки мышления: Interpreters, Attack Surface, Trust Boundaries |  |
| [Risk Assessment](./risk-assessment/) | CVE vs Risk, контекст, compensating controls, reachability |  |
| [Trade-offs](./trade-offs/) | Инженерные компромиссы: когда что выбирать | [NO] |
| [Decision Framework](./decision-framework/) | Как принимать решения: алгоритмы, checklists | [NO] |
| [Architecture Thinking](./architecture-thinking/) | Архитектурное мышление: Abuse Cases, Never Trust the Client | [OK] |
| [Security Smells](./security-smells/) | Паттерны, которые должны настораживать: smells в коде, архитектуре, процессе | [NO] |
| [Lessons Learned](./lessons-learned/) | Что пошло не так и почему |  |
| [Interview Mistakes](./interview-mistakes/) | Ошибки на собеседованиях и как их избежать | [NO] |
| [Anti-patterns](./anti-patterns/) | Что НЕ надо делать: типовые ошибки AppSec-инженеров | [NO] |
| [Analysis](./analysis/) | Анализ и рефлексия по конкретным темам |  |

---

## Mental Models

Ментальные модели — это инструменты мышления. Они помогают анализировать новые ситуации, даже если вы никогда не сталкивались с ними раньше.

```
1. Интерпретаторы — объединяющая концепция всех инъекций
2. Attack Surface — всё, что доступно злоумышленнику
3. Trust Boundaries — где заканчивается доверие
4. Defense in Depth — ни один слой защиты не идеален
5. Least Privilege — минимум необходимого
6. Secure by Default — безопасно из коробки
7. Never Trust the Client — клиент всегда под подозрением
8. Compensating Controls — если не можем исправить, изолируем
```

[Ментальные модели →](./mental-models/)

---

## Trade-offs

Самый ценный раздел для Senior-позиции. 
Умение выбирать между двумя вариантами, понимая цену каждого.

```
• Availability vs Security
  Когда можно пожертвовать безопасностью ради доступности?
  
• Performance vs Validation
  Как валидировать, не убивая latency?
  
• Caching vs Authorization
  Кэш ускоряет, но ломает проверку прав.
  
• JWT vs Session
  Stateless vs возможность отзыва.
  
• RBAC vs ABAC
  Простота vs гибкость.
  
• Encryption vs Search
  Зашифрованные данные нельзя индексировать.
  
• Centralized Auth vs Local Auth
  Single point of failure vs consistency.
  
• Verbose Errors vs Generic Errors
  Debug convenience vs information disclosure.
```

[Trade-offs →](./trade-offs/)

---

## Security Smells

Паттерны, которые должны сразу вызвать вопросы:

```
В коде:
  - Конкатенация строк SQL
  - innerHTML / dangerouslySetInnerHTML
  - eval() / setTimeout(string)
  - Хардкоженные пароли/токены
  - Комментарии с TODO/FIXME security

В архитектуре:
  - "Мы доверяем внутренней сети"
  - "Клиент сам решает, админ он или нет"
  - "У нас нет денег на security"
  - "Мы всегда так делали"

В процессе:
  - Security review после релиза
  - "У нас agile, нет времени на threat modeling"
  - "Наймём security инженера, когда вырастем"
```

[Security Smells →](./security-smells/)

---

## Как использовать этот раздел

1. **Перед изучением новой темы** — прочитай ментальные модели
2. **При проектировании** — загляни в Trade-offs
3. **После инцидента** — запиши в Lessons Learned
4. **Перед собеседованием** — пройдись по Decision Framework
5. **При Code Review** — вспомни Security Smells

---

## Формат каждой записи

```
Проблема:
  [Что происходит]

Контекст:
  [Когда это важно]

Мой подход:
  [Как я думаю об этом]

Пример из жизни:
  [Реальный случай]

Что пошло не так:
  [Если был провал]

Вывод:
  [Что запомнить]
```

---

>  **Главное:** этот раздел никогда не будет "завершён". Он растёт вместе с опытом. Каждый новый инцидент, каждое новое решение — это новая запись здесь.
