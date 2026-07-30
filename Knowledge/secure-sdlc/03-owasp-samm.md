# OWASP SAMM (Software Assurance Maturity Model)

## Определение

OWASP SAMM — это открытая модель зрелости безопасности ПО, которая помогает организациям оценивать, формулировать и реализовывать стратегию безопасности.

- **Prescriptive**: предписывает, что делать
- **Level-based**: 3 уровня зрелости на каждую практику
- **Flexible**: адаптируется под размер и тип организации
- **Free**: open source, поддерживается OWASP

## Структура SAMM v2

SAMM состоит из **5 бизнес-функций** и **15 практик безопасности**:

### 1. Governance (Управление)
| # | Практика | Уровень 0 | Уровень 1 | Уровень 2 | Уровень 3 |
|---|----------|-----------|-----------|-----------|-----------|
| A | Strategy & Metrics | Нет стратегии | Определена стратегия | Метрики и KPI | Data-driven improvement |
| B | Policy & Compliance | Нет политик | Базовые политики | Compliance automation | Continuous compliance |
| C | Education & Guidance | Нет обучения | Security champions | Role-based training | Continuous learning |

### 2. Design (Проектирование)
| # | Практика | Уровень 0 | Уровень 1 | Уровень 2 | Уровень 3 |
|---|----------|-----------|-----------|-----------|-----------|
| A | Threat Assessment | Нет TM | Ad hoc TM | Lightweight TM | Continuous TM |
| B | Security Requirements | Нет | Baseline | Automated | Proactive |
| C | Secure Architecture | Нет | Security review | Reference architectures | Automate validation |

### 3. Implementation (Реализация)
| # | Практика | Уровень 0 | Уровень 1 | Уровень 2 | Уровень 3 |
|---|----------|-----------|-----------|-----------|-----------|
| A | Secure Build | Нет SAST | SAST в CI/CD | SAST gates | Supply chain security |
| B | Secure Deployment | Нет | Config hardening | Automated deployment | Immutable infra |
| C | Defect Management | Нет | Bug tracking | Risk-based priorities | SLA-driven |

### 4. Verification (Верификация)
| # | Практика | Уровень 0 | Уровень 1 | Уровень 2 | Уровень 3 |
|---|----------|-----------|-----------|-----------|-----------|
| A | Architecture Validation | Нет AA | Ad hoc review | Formal TM | Automated checks |
| B | Requirements-driven Testing | Нет | Manual pentest | DAST in CI/CD | Orchestrated testing |
| C | Security Testing | Нет | SAST only | SAST + DAST + SCA | Full automation |

### 5. Operations (Эксплуатация)
| # | Практика | Уровень 0 | Уровень 1 | Уровень 2 | Уровень 3 |
|---|----------|-----------|-----------|-----------|-----------|
| A | Incident Management | Нет IR plan | Basic IR | Playbooks | SOAR automation |
| B | Environment Management | Нет | Hardening guides | Automated config | Immutable infra |
| C | Operational Management | Нет | Monitoring | Alerting | Auto-remediation |

## Как провести SAMM assessment

### Процесс

```
1. Выбрать scope (вся организация или одна команда)
2. Собрать stakeholders (AppSec, Dev, DevOps, Manager)
3. Провести workshop (2-4 часа)
4. Interview по каждой практике
5. Определить текущий уровень (0-3)
6. Определить target level
7. Gap analysis
8. Roadmap
```

### Пример оценки

```
Practice: Strategy & Metrics

Текущий уровень: 1
- Есть стратегия безопасности
- Нет метрик и KPI

Target уровень: 2
- Добавить метрики: MTTR, количество уязвимостей, coverage

Gap: автоматизация сбора метрик
```

## SAMM в Agile-процессе

```yaml
# Пример: интеграция SAMM в Scrum

Sprint Planning:
  - Добавить security stories в backlog
  - Оценить effort на security activities

Sprint Execution:
  - SAST findings → bug fixes
  - Security Requirements → реализация

Sprint Review:
  - Показать security метрики
  - Обновить SAMM score

Sprint Retrospective:
  - Что улучшить в security процессе
  - Новые activities
```

## SAMM vs BSIMM

| Критерий | SAMM | BSIMM |
|----------|------|-------|
| **Подход** | Prescriptive | Descriptive |
| **Уровни** | 0-3 | Activities (без уровней) |
| **Бесплатный** | [OK] | [NO] (BSIMM книга) |
| **Адаптация** | Гибкий | Фиксированный |
| **Benchmark** | Ограничен | Лучший |
| **Roadmap** | Есть | Нет |
| **DevOps** | SAMM v2 включает | Ограничен |

## Связь с другими фреймворками

```
SAMM ──▶ Roadmap улучшений
         │
         ├── BSIMM (benchmark: как у других?)
         ├── NIST CSF (compliance: что обязательно?)
         ├── ISO 27001 (certification: audit-ready?)
         └── OWASP ASVS (technical: что проверять в коде?)
```

## Ключевые тезисы

- SAMM предписывает, что делать (в отличие от BSIMM)
- 5 бизнес-функций, 15 практик, 4 уровня
- Бесплатный, open source, поддерживается OWASP
- Лучший инструмент для roadmapping
- SAMM + BSIMM = полная картина: SAMM даёт путь, BSIMM — benchmark
- SAMM v2 адаптирован под DevOps и Cloud
