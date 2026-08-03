# GitLab CI/CD — Security Pipeline

> **Контекст:** GitLab CI/CD — самый частый инструмент в вакансиях DevSecOps. Нужно не просто знать YAML-синтаксис, а уметь строить security-gates и переиспользуемые шаблоны.

---

## 1. Базовые ключевые слова

### `stages` — порядок выполнения

```yaml
stages:
  - build
  - test
  - sast
  - sca
  - container-scan
  - deploy
```

Все джобы одной стадии выполняются параллельно. Джобы следующей стадии ждут завершения предыдущей.

### `variables` — переменные

```yaml
variables:
  IMAGE_TAG: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
  SAST_EXIT_CODE: "1"
  TRIVY_CACHE_DIR: ".trivycache/"
```

Стандартные предопределённые переменные GitLab:

| Переменная | Значение |
|------------|----------|
| `CI_COMMIT_SHA` | Полный хэш коммита |
| `CI_COMMIT_SHORT_SHA` | Короткий хэш (8 символов) |
| `CI_COMMIT_REF_NAME` | Имя ветки/тега |
| `CI_PIPELINE_ID` | Уникальный ID пайплайна |
| `CI_REGISTRY_IMAGE` | Адрес registry для проекта |
| `CI_PROJECT_DIR` | Директория проекта на раннере |
| `CI_MERGE_REQUEST_IID` | Номер MR (для merge request pipelines) |
| `CI_DEFAULT_BRANCH` | Дефолтная ветка (обычно main/master) |

### `before_script` — общий пролог

```yaml
before_script:
  - echo "Starting job on $CI_COMMIT_REF_NAME"
  - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
```

Выполняется перед `script` каждой джобы. Удобно для логина в registry, настройки окружения, инсталляции зависимостей.

### `cache` — кэширование

```yaml
cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - node_modules/
    - .trivycache/
```

Кэш нужен для ускорения: npm ci, Trivy DB, Semgrep registry. `key` меняется при изменении ветки или версии lock-файла.

### `needs` — нелинейный порядок

```yaml
needs:
  - job: build
    artifacts: true
```

Позволяет запускать джобу **не дожидаясь** всей стадии, а только конкретной джобы. Критично для больших пайплайнов.

```
Без needs:  build -> (все тесты) -> deploy  (sequential, медленно)
С needs:    build -> sast -> deploy        (sast не ждёт unit-tests)
```

```yaml
stages: [build, test, sast, deploy]

build:
  stage: build
  script: [make build]

unit-tests:
  stage: test
  script: [make test]

sast:
  stage: sast
  needs: [build]          # не ждёт unit-tests
  script: [semgrep ci]

deploy:
  stage: deploy
  needs: [build, sast]    # ждёт только build и sast
  script: [make deploy]
```

### `rules` — условия запуска

Правило из 3 приоритетных операторов:

```yaml
rules:
  - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'   # только для MR
    when: always
  - if: '$CI_COMMIT_BRANCH == "main"'                     # только main
    when: manual                                         # запуск вручную
  - when: never                                          # во всех остальных случаях отключить
```

Типовые паттерны для security-джоб:

```yaml
# SAST на каждый MR + nightly на main
sast:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_PIPELINE_SOURCE == "schedule"'      # nightly scan

# Сканирование секретов, только если изменились исходники
secrets:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      changes:
        - "**/*.{js,ts,py,go,java}"

# Сканирование контейнера только после сборки образа
container-scan:
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

### `artifacts` — передача файлов между джобами

```yaml
sast:
  script:
    - semgrep scan --sarif --output semgrep.sarif .
  artifacts:
    when: always          # сохранять даже при падении джобы
    expire_in: 1 week
    paths:
      - semgrep.sarif
    reports:
      sast: semgrep.sarif # подключается к GitLab Security Dashboard
```

Виды reports в GitLab:

| Ключ | Инструмент | Куда попадает |
|------|-----------|---------------|
| `sast` | Semgrep, CodeQL | Security Dashboard (SAST tab) |
| `secret_detection` | Gitleaks, TruffleHog | Security Dashboard (Secrets tab) |
| `dependency_scanning` | Trivy, Gemnasium | Security Dashboard (Dependencies tab) |
| `container_scanning` | Trivy, Clair | Security Dashboard (Container tab) |
| `license_scanning` | License Finder | License Compliance |
| `coverage_report` | JaCoCo, Cobertura | Coverage badge |

### `include` — переиспользование конфигурации

```yaml
include:
  - local: '/ci/templates/security-scanning.yml'   # из текущего репозитория
  - project: 'security/templates'                  # из другого проекта
    ref: 'main'
    file: '/templates/sast.yml'
  - remote: 'https://gitlab.com/...'               # по URL
  - template: 'Security/SAST.gitlab-ci.yml'        # встроенный шаблон GitLab
```

### `extends` — наследование джоб

```yaml
.security-base:
  image: alpine:3.18
  before_script:
    - apk add --no-cache curl jq

sast:
  extends: .security-base
  stage: sast
  script:
    - semgrep scan .
```

Паттерн `include` + `extends` — стандарт для enterprise: один репозиторий шаблонов, все проекты его подключают.

---

## 2. Полный security-пайплайн

Целевой пайплайн из плана подготовки:

```yaml
stages:
  - build
  - unit-tests
  - sast
  - sca
  - secrets
  - container-scan
  - deploy

variables:
  IMAGE_TAG: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
  TRIVY_CACHE_DIR: ".trivycache/"

cache:
  paths:
    - .trivycache/

build:
  stage: build
  image: docker:24
  services: [docker:24-dind]
  script:
    - docker build -t "$IMAGE_TAG" .
    - docker push "$IMAGE_TAG"

unit-tests:
  stage: unit-tests
  script:
    - npm ci
    - npm test

sast:
  stage: sast
  image: semgrep/semgrep:1
  script:
    - semgrep ci --config "p/typescript p/owasp-top-ten" --sarif --output semgrep.sarif --error || true
  artifacts:
    when: always
    paths: [semgrep.sarif]
    reports:
      sast: semgrep.sarif

sca:
  stage: sca
  image:
    name: aquasec/trivy:0.50
    entrypoint: [""]
  script:
    - trivy fs --scanners vuln --severity CRITICAL --ignore-unfixed --exit-code 1 .
    - trivy fs --scanners vuln --format sarif --output trivy.sarif . || true
  artifacts:
    when: always
    paths: [trivy.sarif]
    reports:
      dependency_scanning: trivy.sarif

secrets:
  stage: secrets
  image:
    name: zricethezav/gitleaks:v8
    entrypoint: [""]
  script:
    - gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif --redact --exit-code 1 --verbose || true
  artifacts:
    when: always
    paths: [gitleaks.sarif]
    reports:
      secret_detection: gitleaks.sarif

container-scan:
  stage: container-scan
  needs: [build]
  image:
    name: aquasec/trivy:0.50
    entrypoint: [""]
  script:
    - trivy image --severity CRITICAL --ignore-unfixed --exit-code 1 "$IMAGE_TAG"
    - trivy image --format sarif --output trivy-image.sarif "$IMAGE_TAG" || true
  artifacts:
    when: always
    paths: [trivy-image.sarif]
    reports:
      container_scanning: trivy-image.sarif

deploy:
  stage: deploy
  needs: [build, unit-tests, sast, sca, secrets, container-scan]
  script:
    - ./deploy.sh
  environment: production
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

---

## 3. Security Gates (блокировки)

### Gate на уровне джобы

```yaml
sca:
  script:
    - trivy fs --severity CRITICAL --exit-code 1 .   # падение джобы при CRITICAL
```

### Gate через allow_failure + отдельная джоба

```yaml
sast-report:
  stage: sast
  allow_failure: false    # пайплайн красный, если отчёт не сгенерирован
  script:
    - semgrep scan --sarif --output semgrep.sarif --error

security-gate:
  stage: gate
  script:
    - ./gate-check.sh semgrep.sarif --block-on CRITICAL,HIGH
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

### Gate через Merge Request Approval

GitLab позволяет блокировать мёрдж, пока security-джоба не прошла. Это реализуется в настройках проекта (Settings -> Merge Requests -> Security gates), а не в YAML. Для DevSecOps-инженера важно объяснить разницу: «джоба упала» vs «джоба прошла, но MR заблокирован политикой approvals».

---

## 4. Переиспользуемые шаблоны (enterprise-паттерн)

```yaml
# ci/templates/security-scanning.yml
.semgrep-base:
  image: semgrep/semgrep:1
  variables:
    SEMGREP_ARGS: ""
  script:
    - semgrep ci --config "$SEMGREP_RULES" $SEMGREP_ARGS || true
  artifacts:
    when: always
    paths: [semgrep.sarif]
    reports:
      sast: semgrep.sarif

sast-js:
  extends: .semgrep-base
  variables:
    SEMGREP_RULES: "p/typescript p/javascript p/owasp-top-ten"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      changes: ["**/*.{js,ts}"]

sast-py:
  extends: .semgrep-base
  variables:
    SEMGREP_RULES: "p/python p/owasp-top-ten"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      changes: ["**/*.py"]
```

Использование в проекте:

```yaml
# .gitlab-ci.yml
include:
  - local: '/ci/templates/security-scanning.yml'

stages: [sast, deploy]

sast-js:
  extends: sast-js      # переопределение или добавление стадии
  stage: sast
```

---

## 5. Типовые проблемы и решения

### Медленные джобы из-за установки зависимостей

```yaml
# Плохо: каждая джоба ставит всё заново
sast:
  script:
    - npm ci
    - semgrep scan .

# Хорошо: кэш + needs
cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths: [node_modules/]

sast:
  needs: [build]
  script:
    - semgrep scan .
```

### Джоба падает, но отчёт нужен

```yaml
# Правильно: генерируем отчёт всегда (when: always), блокируем отдельно
sast:
  script:
    - semgrep scan --sarif --output semgrep.sarif || true       # не падаем
  artifacts:
    when: always                                                # отчёт сохраняем
```

### Нет Docker-in-Docker на раннере

```yaml
# Вместо dind — подключаемся к внешнему kaniko
container-build:
  image:
    name: gcr.io/kaniko-project/executor:debug
    entrypoint: [""]
  script:
    - /kaniko/executor --context . --destination "$IMAGE_TAG"
```

---

## 6. Interview Questions

| Вопрос | Ответ |
|--------|-------|
| Чем `needs` отличается от `stages`? | `stages` — последовательность стадий, джобы одной стадии параллельны. `needs` — граф зависимостей на уровне джоб: позволяет запускать джобу, не дожидаясь всей стадии. |
| Для чего `extends` и `include`? | `include` — подключает внешние файлы конфигурации (шаблоны). `extends` — наследует конфигурацию одной джобы в другой. Вместе дают переиспользуемые security-джобы для всех проектов. |
| Как собрать отчёт в SARIF? | Указать `--sarif --output <file>.sarif` в инструменте (Semgrep, Trivy, Gitleaks) и передать путь в `artifacts.reports.sast` / `dependency_scanning` / `secret_detection`. |
| Как сделать, чтобы пайплайн не блокировался на LOW? | Блокировать только на CRITICAL: используем `--exit-code 1` с `--severity CRITICAL` в Trivy; в Semgrep — `--error` на severities ERROR/CRITICAL; либо отдельная джоба gate с парсингом SARIF. |
| Что такое `rules:changes`? | Условие запуска джобы при изменении определённых файлов: `changes: ["**/*.py"]`. Позволяет запускать SAST только на изменённый язык. |
| Как запустить сканирование ночью? | GitLab Schedules -> создаём расписание, в rules: `if: '$CI_PIPELINE_SOURCE == "schedule"'`. Плюс переменная `$NIGHTLY_SCAN` для определения, что это ночной скан. |

---

## Связанные разделы

- [DevSecOps overview](devsecops.md) — инструменты и gate policy
- [SAST deep dive](sast-deep.md) — как работает AST, custom rules, FP/FN
- [SBOM](sbom.md) — генерация и форматы
- [Module 17 — SSDLС Pipeline](../../Experience/labs/juice-shop/module-17-ssdlc/report.md) — практическая реализация пайплайна с include/extends