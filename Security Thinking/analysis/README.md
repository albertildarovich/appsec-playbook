# Security Thinking

> **Этот раздел стал центром плейбука → [`../`](../)**

Раздел для анализа и рефлексии. Не конспекты. Мысли, выводы, инсайты, которые появляются после изучения темы или работы над реальным проектом.

## Новая структура

В новой версии Security Thinking — это не просто раздел, а **центр плейбука**:

```
 Security Thinking/
├── mental-models/          — Фреймворки мышления (Interpreters, Attack Surface)
├── risk-assessment/        — CVE vs Risk, контекст, reachability
├── trade-offs/             — Инженерные компромиссы (JWT vs Session и т.д.)
│   ├── jwt-vs-session.md
│   └── ...
├── decision-framework/     — Алгоритмы принятия решений
├── architecture-thinking/  — Abuse Cases, Never Trust the Client
├── security-smells/        — Паттерны, которые должны настораживать
├── lessons-learned/        — Что пошло не так и почему
├── analysis/               — Анализ и рефлексия
│   ├── broken-access-control.md
│   └── jwt-vs-sessions.md
└── anti-patterns/          — Что НЕ надо делать
```

## Содержание (старая структура)

| Файл | О чём |
|------|-------|
| [broken-access-control.md](broken-access-control.md) | Почему Broken Access Control сложнее XSS |
| [jwt-vs-sessions.md](jwt-vs-sessions.md) | Почему JWT не решает проблему авторизации |

[Перейти к новой структуре →](../)
