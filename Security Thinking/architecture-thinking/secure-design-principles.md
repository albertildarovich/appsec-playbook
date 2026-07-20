# Secure Design Principles

> **Центральная тема Security Thinking.** Не "какие бывают уязвимости", а "как проектировать безопасные системы".

Этот документ — карта всех Secure Design Principles с ссылками на детальные конспекты.

---

## Содержание

| Принцип | Суть | Готово |
|---------|------|--------|
| [Fail Secure (Fail Closed)](../../Knowledge/secure-design/fail-secure.md) | При ошибке — безопасное состояние | ✅ |
| [Secure Defaults (Secure by Default)](../../Knowledge/secure-design/secure-defaults.md) | Безопасно из коробки | ✅ |
| Least Privilege | Минимум прав для работы | 📝 |
| Defense in Depth | Несколько слоёв защиты | ❌ |
| Never Trust the Client | Клиент всегда под подозрением | 📝 |
| Reduce Attack Surface | Меньше кода — меньше уязвимостей | ❌ |
| Separation of Duties | Никто не должен иметь все права | ❌ |
| Economy of Mechanism | Простота — залог безопасности | ❌ |
| Psychological Acceptability | Безопасность не должна мешать | ❌ |
| Complete Mediation | Всегда проверяй права | ❌ |

---

## Как эти принципы связаны

```
                          Secure Design
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   Архитектурные          Поведенческие         Организационные
   ─────────────         ─────────────         ────────────────
   Fail Secure           Least Privilege       Separation of Duties
   Secure Defaults       Defense in Depth      Economy of Mechanism
   Reduce Attack Surface Never Trust Client    Psychological Acceptability
   Complete Mediation
```

### Архитектурные — как спроектировать систему

Эти принципы определяют, *как* система принимает решения:
- **Fail Secure** — что делать при ошибке
- **Secure Defaults** — какие настройки по умолчанию
- **Reduce Attack Surface** — что должно быть доступно
- **Complete Mediation** — где проверять права

### Поведенческие — как действуют компоненты

Определяют, *как* компоненты взаимодействуют:
- **Least Privilege** — сколько прав давать
- **Defense in Depth** — сколько слоёв защиты
- **Never Trust the Client** — кому доверять

### Организационные — как работать в команде

Определяют, *как* проектировать и разрабатывать:
- **Separation of Duties** — кто что может
- **Economy of Mechanism** — насколько сложным должно быть решение
- **Psychological Acceptability** — будут ли люди использовать безопасность

---

## Принципы на собеседовании

Вопросы по Secure Design Principles проверяют **архитектурное мышление**:

### Пример: "Спроектируйте безопасный файловый загрузчик"

Кандидат перечисляет принципы:
- **Input Validation** — проверка типа файла (базово)
- **Scanning** — антивирус (хорошо)

Senior добавляет:
- **Least Privilege** — файлы хранятся с минимальными правами, процесс загрузки не имеет доступа к другим файлам
- **Fail Secure** — если сканер недоступен — файл не принимается
- **Secure Defaults** — по умолчанию файлы не исполняемые, не публичные
- **Defense in Depth** — валидация типа + сканирование + sandbox + Content-Disposition
- **Reduce Attack Surface** — только разрешённые форматы, отклонять всё остальное

### Почему это работает

Перечисление уязвимостей показывает, что ты **знаешь**.
Перечисление принципов показывает, что ты **понимаешь**, как проектировать.

---

## Связанные разделы

- [Trade-offs: Availability vs Security](../trade-offs/) — Fail Secure напрямую связан с этим компромиссом
- [Security Smells: нарушение Secure Defaults](../security-smells/) — как заметить, что принцип нарушен
- [Mental Models: Defense in Depth](../mental-models/) — как слои защиты работают вместе
