# Security Metrics

## Определение

Security Metrics — это количественные показатели, которые помогают оценить эффективность программы безопасности и принимать data-driven решения.

## Принципы хороших метрик

**SMART:**
- **S**pecific — конкретные
- **M**easurable — измеримые
- **A**ctionable — на основе них можно принять решение
- **R**elevant — relevant для stakeholders
- **T**imely — своевременные

> "What gets measured gets managed."

## Категории метрик

### 1. Operational Metrics (для AppSec команды)

| Метрика | Описание | Цель |
|---------|----------|------|
| MTTR (Mean Time to Remediate) | Среднее время исправления | < 30 дней для HIGH |
| Vulnerabilities by severity | Количество уязвимостей по критичности | Снижение |
| Open vs Closed | Открытые vs закрытые | ≥ 80% closed |
| Time to triage | Время от обнаружения до анализа | < 48 часов |

### 2. Prevention Metrics (для разработчиков)

| Метрика | Описание | Цель |
|---------|----------|------|
| SAST coverage | % кода, покрытого SAST | > 90% |
| SAST false positive rate | % ложных срабатываний | < 20% |
| Security training completion | % прошедших обучение | > 95% |
| Security Champions per team | Количество Champions | ≥ 1 на команду |

### 3. Detection Metrics (для DevSecOps)

| Метрика | Описание | Цель |
|---------|----------|------|
| Vulnerabilities found in dev | % уязвимостей, найденных на ранних этапах | > 60% |
| Vulnerabilities found in prod | % в production | < 5% |
| DAST coverage | % endpoints, покрытых DAST | > 80% |
| Scan frequency | Как часто сканируется код | Daily |

### 4. Business Metrics (для менеджмента)

| Метрика | Описание | Цель |
|---------|----------|------|
| Cost of fixing late vs early | Стоимость фикса на разных этапах | Снижение |
| Release delay due to security | Задержка релизов из-за безопасности | < 5% |
| Security incidents | Количество инцидентов | Снижение |
| Compliance status | % compliance с требованиями | > 95% |

## Как собирать метрики

### Источники данных

```yaml
SAST: Semgrep / SonarQube API
SCA: Trivy / Snyk API
DAST: OWASP ZAP / Burp API
CI/CD: GitHub Actions / GitLab CI API
Jira: Security issues tracker
Training: LMS platform
```

### Dashboard

```sql
-- Пример: MTTR
SELECT 
    AVG(DATEDIFF(day, created_date, resolved_date)) as mttr
FROM vulnerabilities
WHERE severity = 'HIGH'
  AND created_date >= DATEADD(month, -3, GETDATE())
```

```sql
-- Пример: Vulnerabilities by stage
SELECT 
    stage,            -- dev, staging, prod
    COUNT(*) as total
FROM vulnerabilities
GROUP BY stage
```

## Типичные ошибки в метриках

| Ошибка | Почему плохо |
|--------|-------------|
| Vanity metrics | Количество найденных уязвимостей без контекста |
| Не учитывать FP | SAST с 50% FP — плохой показатель |
| Нет baseline | Рост метрики — может быть рост покрытия, а не проблемы |
| Слишком много метрик | Паралич анализа |
| Метрики без action | "Мы знаем, что плохо, но ничего не делаем" |

## Пример отчёта

```markdown
# Monthly Security Report

## Executive Summary
- SAST coverage: 92% (+2% vs last month)
- MTTR: 14 days (target: 30)
- Vulnerabilities in prod: 2 (target: <5)
- Security incidents: 0

## SAST
| Severity | Open | Closed | MTTR |
|----------|------|--------|------|
| CRITICAL | 0    | 5      | 3d   |
| HIGH     | 3    | 12     | 10d  |
| MEDIUM   | 8    | 20     | 25d  |
| LOW      | 15   | 30     | 45d  |

## Vulnerabilities by Stage
- Found in dev: 70% (target: >60%) [OK]
- Found in staging: 25%
- Found in prod: 5% (target: <5%) [OK]

## Training
- Completion: 98% (target: 95%) [OK]
- New Champions: 2 (total: 8)

## Recommendations
1. Уменьшить MTTR для MEDIUM (с 25d до 15d)
2. Добавить SAST coverage для legacy services
```

## Ключевые тезисы

- Метрики должны быть action-oriented
- Не измерять всё подряд — фокус на ключевых
- Baseline критичен: рост не всегда плох
- Vanity metrics бесполезны
- Метрики для разных stakeholders — разные
- Автоматизация сбора — единственный путь
- Регулярная отчетность (weekly/monthly)
- Метрики без action = бесполезны
