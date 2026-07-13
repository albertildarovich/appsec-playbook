# Security Champions

## Определение

Security Champions — это разработчики в командах, которые:
- Выступают локальными экспертами по безопасности
- Помогают коллегам с security вопросами
- Участвуют в Code Review
- Проводят Threat Modeling для своей команды
- Являются мостом между командой и AppSec

## Почему Security Champions?

```
AppSec команда               Product команды
┌──────────────┐             ┌─────┐ ┌─────┐ ┌─────┐
│              │             │ Dev │ │ Dev │ │ Dev │
│   AppSec     │────▶▶▶─────│ Team│ │ Team│ │ Team│
│    (2-3)     │             │  A  │ │  B  │ │  C  │
│              │             └──▲──┘ └──▲──┘ └──▲──┘
└──────────────┘                │       │       │
                            ┌───┴───┐ ┌─┴──┐ ┌──┴───┐
                            │Champion│ │Ch.│ │Champ.│
                            └───────┘ └────┘ └──────┘
```

AppSec не может физически покрыть все команды. Security Champions масштабируют безопасность.

## Роль и ответственность

### Что делает Champion:
- Участвует в security trainings
- Проводит lightweight Threat Modeling для своей фичи
- Помогает команде исправлять SAST/DAST findings
- Участвует в security review
- Делится знаниями внутри команды
- Присутствует на регулярных sync с AppSec

### Что НЕ делает Champion:
- Не заменяет AppSec на code review
- Не отвечает за безопасность团队 (это ответственность всей команды)
- Не выполняет работу AppSec инженера
- Не принимает security decisions в одиночку

## Как выбрать Champions

### Критерии:
- Интерес к безопасности (ключевое!)
- Seniority: минимум Middle разработчик
- Влияние в команде: к нему уже приходят за советом
- Время: готов уделять ~10-20% времени на security активности

### Красные флаги:
- "Меня назначили, я не хочу"
- Junior без опыта
- Разработчик, который не может уделить время

## Программа Champions

### Онбординг (1-2 недели)
```
Week 1:
  - OWASP Top 10 overview
  - SAST tool: как читать findings
  - Как triage vulnerabilities

Week 2:
  - Threat Modeling basics (STRIDE)
  - Security Requirements в user stories
  - Code Review: что искать
```

### Регулярные активности
```
Daily: ответы на вопросы команды
Weekly: 30 min sync с AppSec
Monthly: community meeting (все Champions)
Quarterly: advanced training
Yearly: conference / training
```

### Развитие
```yaml
Level 1: Baseline
  - Понимает OWASP Top 10
  - Может triage SAST findings
  - Знает secure coding practices

Level 2: Advanced
  - Проводит Threat Modeling
  - Участвует в security design review
  - Может проводить security training

Level 3: Expert
  - Ведёт security community
  - Разрабатывает security guidelines
  - Может проводить penetration testing
```

## Метрики для Champions

| Метрика | Описание |
|---------|----------|
| Findings resolved | Сколько SAST/DAST фиксов помогли сделать |
| Training completion | Прохождение обучения |
| Time to respond | Скорость ответа на security вопросы |
| Team coverage | Процент команд с Champions |
| Satisfaction | Feedback от команды |

## Типичные проблемы

| Проблема | Решение |
|----------|---------|
| Нет времени на security | AppSec должен защищать время Champions |
| Выгорание | Ротация каждые 12-18 месяцев |
| Нет поддержки от менеджмента | Показать ROI: сколько уязвимостей нашли раньше |
| Champions не чувствуют прогресс | Геймификация, badges, recognition |
| Только один Champion на всех | Каждая команда должна иметь минимум одного |

## Ключевые тезисы

- Security Champions — ключ к масштабированию AppSec
- Не заменяют AppSec, а дополняют
- Должны быть добровольцами, а не назначенными
- Требуют поддержки и защиты времени
- Лучшая инвестиция в security culture
- Ротация — профилактика выгорания
