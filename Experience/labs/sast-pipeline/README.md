# SAST Pipeline Demo

> **Цель:** Построить SAST-пайплайн в GitLab CI на Semgrep + SonarQube, научиться читать отчёт по CWE и проводить triage находок (false positive / true positive).

## Статус

[OK] Развёрнуто. Пайплайн в `.gitlab-ci.yml`, отчёт и triage — ниже.

## Стек

| Инструмент | Роль |
|------------|------|
| GitLab CI | Оркестрация стадий |
| Semgrep | Быстрый SAST на каждый MR (Community rules + кастомные) |
| SonarQube | Глубокий анализ качества и безопасности кода |
| CWE | Классификация находок (Common Weakness Enumeration) |

## Архитектура пайплайна

```
Merge Request
    |
    v
[L1] sast-semgrep-fast   (Semgrep p/default + custom rules, ~30 сек)
    |
    v
[L2] sonarqube-scan      (SonarQube Server, ~2-3 мин, качество + security)
    |
    v
[L3] sast-gate           (блокировка merge при CRITICAL/ERROR)
```

## Файлы

| Файл | Назначение |
|------|-----------|
| [.gitlab-ci.yml](./.gitlab-ci.yml) | Стадии SAST-пайплайна |
| [triage.md](./triage.md) | Пример triage: false positive vs true positive |
| [report-sonar-cwe.md](./report-sonar-cwe.md) | Отчёт по найденным CWE |

---

## Как это работает

### Стадия L1: Semgrep (быстрая)

Запускается на каждый MR. Дешёвая, быстрая, блокирует CRITICAL.

```yaml
sast-semgrep:
  stage: sast
  image: semgrep/semgrep
  script:
    - semgrep scan
        --config=p/default
        --config=rules/sql-injection.yaml
        --sarif --output=semgrep.sarif
        --error  # exit code != 0 при ERROR-находках
  artifacts:
    reports:
      sast: semgrep.sarif
```

### Стадия L2: SonarQube (глубокая)

Запускается на MR и на main. Даёт Quality Gate и Security Hotspots.

```yaml
sonarqube-scan:
  stage: test
  image: sonarsource/sonar-scanner-cli:latest
  script:
    - sonar-scanner
        -Dsonar.projectKey=demo-app
        -Dsonar.sources=src
        -Dsonar.host.url=$SONAR_HOST_URL
        -Dsonar.token=$SONAR_TOKEN
```

### Стадия L3: Gate

Semgrep `--error` уже блокирует merge. Дополнительно SonarQube Quality Gate через API:

```yaml
sast-gate:
  stage: gate
  script:
    - sonar qualitygate check --project demo-app
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

---

## Как читать отчёт по CWE

Формат Semgrep SARIF содержит `ruleId` и `message`. Каждое правило маппится на CWE:

| Находка Semgrep | CWE | Severity |
|-----------------|-----|----------|
| `sql-query-concatenation` | CWE-89 (SQL Injection) | CRITICAL |
| `react-dangerouslysetinnerhtml` | CWE-79 (XSS) | HIGH |
| `hardcoded-jwt-secret` | CWE-798 (Hardcoded Credentials) | CRITICAL |
| `eval-detected` | CWE-95 (Code Injection) | HIGH |
| `path-traversal-taint-fs` | CWE-22 (Path Traversal) | HIGH |
| `open-redirect-taint` | CWE-601 (Open Redirect) | MEDIUM |

Полный разбор CWE с примерами: [Knowledge/cwe-top-25.md](../../../Knowledge/cwe-top-25.md)

---

## Triage: false positive / true positive

Ключевой навык AppSec-инженера — не «передавать» все находки разработчикам, а отсеивать FP.

| Вердикт | Определение | Что делать |
|---------|-------------|-----------|
| **True Positive (TP)** | Реальная уязвимость, эксплуатируемая | Завести задачу, приоритизировать, слоупочный фикс |
| **False Positive (FP)** | Инструмент ошибся: код защищён | Добавить в allowlist/noise, задокументировать |
| **True Negative** | Нет проблемы, инструмент молчит | Не требует действий |
| **False Negative** | Уязвимость есть, инструмент не нашёл | Дополнить правила, написать свой semgrep-rule |

Подробный разбор 4 кейсов: [triage.md](./triage.md)

---

## Отчёт по CWE (результат прогона)

Результаты прогона Semgrep + SonarQube на демо-приложении: [report-sonar-cwe.md](./report-sonar-cwe.md)

### Сводка

| Severity | Semgrep | SonarQube | CWE (топ) |
|----------|---------|-----------|-----------|
| CRITICAL | 2 | 0 | CWE-89, CWE-798 |
| HIGH | 3 | 1 | CWE-79, CWE-95, CWE-22 |
| MEDIUM | 4 | 2 | CWE-601, CWE-352 |
| LOW | 5 | 6 | CWE-200, CWE-209 |

---

## Пайплайн-рекомендация

```
Semgrep (fast, на MR) -> SonarQube (глубоко, на MR+main) -> Gate (блокировка)
```

1. **Semgrep** — на каждый MR: `p/default` + кастомные правила, блокировка CRITICAL/ERROR.
2. **SonarQube** — на каждый MR и main: Quality Gate, Security Hotspots, coverage.
3. **Triage** — раз в неделю AppSec-инженер разбирает новые находки, обновляет allowlist.
4. **Метрика** — SAST coverage >= 80%, MTTR(CRITICAL) < 3 дней.

---

## Выводы

- SAST находит проблемы **в коде**, до деплоя — это самый дешёвый этап исправления.
- Semgrep и SonarQube комплементарны: Semgrep — быстрые точные правила, SonarQube — сложный анализ + метрики.
- CWE-классификация обязательна: она позволяет агрегировать находки и приоритизировать по топу CWE.
- Без процесса triage SAST превращается в шум. Фиксированный ритуал разбора находок — обязателен.