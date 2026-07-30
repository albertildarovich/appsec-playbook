# Secure Design Principles

> **Центральная тема Security Thinking.** Не "какие бывают уязвимости", а "как проектировать безопасные системы".

Этот документ — карта всех Secure Design Principles с ссылками на детальные конспекты.

---

## Содержание

| Принцип | Суть | Готово |
|---------|------|--------|
| [Least Privilege](../../Knowledge/secure-design/least-privilege.md) | Минимум прав для работы | [OK] |
| [Fail Secure (Fail Closed)](../../Knowledge/secure-design/fail-secure.md) | При ошибке — безопасное состояние | [OK] |
| [Secure Defaults (Secure by Default)](../../Knowledge/secure-design/secure-defaults.md) | Безопасно из коробки | [OK] |
| [Defense in Depth](../../Knowledge/secure-design/defense-in-depth.md) | Несколько слоёв защиты | [OK] |
| [Reduce Attack Surface](../../Knowledge/secure-design/reduce-attack-surface.md) | Меньше кода — меньше уязвимостей | [OK] |
| [Complete Mediation](../../Knowledge/secure-design/complete-mediation.md) | Всегда проверяй права | [OK] |
| [Economy of Mechanism](../../Knowledge/secure-design/economy-of-mechanism.md) | Простота — залог безопасности | [OK] |
| [Separation of Privilege](../../Knowledge/secure-design/separation-of-privilege.md) | Разделение условий для доступа | [OK] |
| [Least Common Mechanism](../../Knowledge/secure-design/least-common-mechanism.md) | Минимизация разделяемых механизмов | [OK] |
| [Never Trust the Client](../../Knowledge/secure-design/never-trust-client.md) | Клиент всегда под подозрением | [OK] |
| [Psychological Acceptability](../../Knowledge/secure-design/psychological-acceptability.md) | Безопасность не должна мешать | [OK] |
| [Open Design](../../Knowledge/secure-design/open-design.md) | Безопасность не должна быть секретом | [OK] |

---

## Как эти принципы связаны

```
                          Secure Design
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   Архитектурные          Поведенческие         Организационные
   ─────────────         ─────────────         ────────────────
   Fail Secure           Least Privilege       Economy of Mechanism
   Secure Defaults       Defense in Depth      Separation of Privilege
   Reduce Attack Surface Never Trust Client    Psychological Acceptability
   Complete Mediation    Least Common Mech.    Open Design
```

### Архитектурные — как спроектировать систему *на уровне архитектуры*

Эти принципы определяют, *как* система принимает решения и *что* должно быть доступно.

| Принцип | Вопрос, на который отвечает |
|---------|---------------------------|
| **Fail Secure** | Что делать, если что-то пошло не так? |
| **Secure Defaults** | Какие настройки стоят по умолчанию? |
| **Reduce Attack Surface** | Что должно быть доступно злоумышленнику? |
| **Complete Mediation** | Где и когда проверять права? |

Архитектурные принципы — фундамент. Если они нарушены, система небезопасна независимо от того, как написаны компоненты.

### Поведенческие — как действуют компоненты *в рантайме*

Определяют, *как* компоненты взаимодействуют и какими правами обладают.

| Принцип | Вопрос, на который отвечает |
|---------|---------------------------|
| **Least Privilege** | Сколько прав давать каждому субъекту? |
| **Defense in Depth** | Сколько слоёв защиты необходимо? |
| **Never Trust the Client** | Какие данные можно принимать от клиента? |
| **Least Common Mechanism** | Можно ли изолировать компоненты друг от друга? |

Поведенческие принципы определяют, как система ведёт себя в процессе работы.

### Организационные — как организовать процесс разработки

Определяют, *как* проектировать, разрабатывать и управлять безопасностью.

| Принцип | Вопрос, на который отвечает |
|---------|---------------------------|
| **Economy of Mechanism** | Насколько сложным должно быть решение? |
| **Separation of Privilege** | Какие операции требуют нескольких независимых разрешений? |
| **Psychological Acceptability** | Будут ли люди использовать механизм безопасности или обходить его? |
| **Open Design** | Зависит ли безопасность от секретности реализации? |

Организационные принципы — про процесс и людей. Их нарушение не фатально для одного релиза, но системно снижает уровень безопасности.

---

## Принципы на собеседовании

Вопросы по Secure Design Principles проверяют **архитектурное мышление**:

### Пример: "Спроектируйте безопасный файловый загрузчик"

**Junior** перечисляет уязвимости:
- "Нужно проверять Content-Type" (базово)
- "Не доверять расширению файла" (хорошо)

**Middle** добавляет защиты:
- "Антивирусное сканирование"
- "Ограничение размера файла"
- "Хранение вне webroot"

**Senior** применяет принципы:
| Принцип | Как применён |
|---------|-------------|
| **Least Privilege** | Процесс загрузки имеет доступ только к директории загрузки; файлы неисполняемые |
| **Fail Secure** | Если сканер virus total недоступен — файл не принимается |
| **Secure Defaults** | По умолчанию файлы приватные, непубличные, неисполняемые |
| **Defense in Depth** | Content-Type check + magic bytes + антивирус + sandbox + CSP + Content-Disposition |
| **Reduce Attack Surface** | Только разрешённые форматы (allowlist); всё остальное отклоняется |
| **Complete Mediation** | Каждый запрос на скачивание проверяет права — даже если файл загружен тем же пользователем |
| **Economy of Mechanism** | Простая и понятная логика проверки, без сложных цепочек filter'ов |
| **Separation of Privilege** | Загрузка и утверждение (approval) — разные роли для sensitive files |
| **Psychological Acceptability** | Пользователь получает понятные сообщения об ошибках; безопасность не мешает работе |

### Почему это работает

Перечисление уязвимостей показывает, что ты **знаешь**, какие бывают атаки.
Перечисление принципов показывает, что ты **понимаешь**, как проектировать системы, устойчивые к этим атакам.

---

## Связанные разделы

- [Trade-offs: Availability vs Security](../trade-offs/) — Fail Secure напрямую связан с этим компромиссом
- Security Smells: нарушение Secure Defaults (в плане) — как заметить, что принцип нарушен
- Mental Models: Defense in Depth (в плане) — как слои защиты работают вместе
