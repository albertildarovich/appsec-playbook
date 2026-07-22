# BSIMM (Building Security In Maturity Model)

## Определение

BSIMM — это модель зрелости безопасности ПО, основанная на наблюдении за реальными практиками в ведущих компаниях.

- **Не предписывает**, а **описывает** — BSIMM показывает, что делают другие
- **Измеряет**: текущий уровень зрелости vs индустрия
- **Ориентир**: куда двигаться дальше

## Структура BSIMM

BSIMM состоит из **4 доменов** и **12 практик**:

### 1. Governance (Управление)
| Практика | Описание |
|----------|----------|
| **SM** — Strategy & Metrics | Стратегия безопасности, метрики, бюджет |
| **CP** — Compliance & Policy | Соответствие стандартам, политики |
| **TR** — Training | Обучение, Security Champions |

### 2. Intelligence (Интеллект)
| Практика | Описание |
|----------|----------|
| **AM** — Attack Models | Модели угроз, Attack Patterns |
| **SF** — Security Features | Безопасные фичи, security design |
| **SR** — Standards & Requirements | Стандарты, требования безопасности |

### 3. SSDL (Secure Software Development Lifecycle)
| Практика | Описание |
|----------|----------|
| **AA** — Architecture Analysis | Threat Modeling, Architecture Review |
| **CR** — Code Review | SAST, Manual Code Review |
| **ST** — Security Testing | DAST, Penetration Testing |
| **SE** — Software Environment | Dependency, Configuration |

### 4. Deployment (Развёртывание)
| Практика | Описание |
|----------|----------|
| **CM** — Configuration Management | Secure configs, Hardening |
| **VM** — Vulnerability Management | Patch management, Bug bounty |

## Уровни зрелости

BSIMM не использует уровни (как SAMM/CMMI). Вместо этого:
- Каждая практика имеет **от 1 до 3** activities (активностей)
- Компания может выполнять activities частично
- Результат — количество выполненных activities из общего списка

**Пример (Practice CR — Code Review):**
```
Activity 1: Ad hoc code review
Activity 2: SAST integrated in CI/CD
Activity 3: Automated blocking gates
Activity 4: Metrics-driven review prioritisation
```

## Как использовать BSIMM

### 1. Baseline Assessment
1. Опросить команды: какие activities уже выполняются
2. Сравнить с BSIMM (свежая версия)
3. Получить baseline: сколько activities из скольки

### 2. Gap Analysis
1. Определить target maturity
2. Найти gaps (activities не выполняются)
3. Приоритизировать по риску и effort

### 3. Roadmap
1. Определить, какие activities добавить в ближайшие 6-12 месяцев
2. Оценить effort и влияние
3. Распределить по спринтам

## BSIMM vs SAMM

| Критерий | BSIMM | SAMM |
|----------|-------|------|
| Подход | Descriptive (как есть) | Prescriptive (как должно быть) |
| Уровни | Нет уровней, activities | 3 уровня (0-3) на каждую практику |
| База | Наблюдения за 100+ компаний | Экспертное определение |
| Гибкость | Ниже (фиксированный набор activities) | Выше (адаптация под компанию) |
| Цель | Бенчмарк | Улучшение процесса |

## Когда использовать BSIMM

✅ **Когда нужно:**
- Оценить текущий уровень безопасности в сравнении с рынком
- Получить объективный benchmark
- Обосновать бюджет руководству ("мы отстаём от индустрии")

❌ **Когда не подходит:**
- Нужен конкретный план улучшений (тогда SAMM)
- Маленькая компания (BSIMM ориентирован на enterprise)

## Ключевые тезисы

- BSIMM описывает, что делают другие, а не предписывает, что делать
- Не использует уровни зрелости — вместо этого количество activities
- Лучший инструмент для benchmark, но не для roadmap
- BSIMM + SAMM = оптимальная комбинация
- Обновляется ежегодно на основе реальных данных
