# DevSecOps — встраивание безопасности в CI/CD

> **Контекст:** Security as Code. Все проверки запускаются автоматически в пайплайне, результаты видны разработчику в MR/PR до мёрджа, блокировка — только на подтверждённых критических находках.

---

## Общая архитектура security-пайплайна

```
Pre-commit (секреты) → SAST → SCA → Container Scan → IaC Scan → DAST → Sign-off
         │                │      │          │            │         │
         ▼                ▼      ▼          ▼            ▼         ▼
     gitleaks         Semgrep  Trivy     Trivy       Checkov     ZAP
     truffleHog       SonarQube Snyk     Grype       tfsec       Burp
```

Каждый этап — отдельная джоба в CI/CD. Порядок — от быстрых и дешёвых проверок к медленным и дорогим. Если секреты найдены — дальше пайплайн не идёт. Если SAST нашёл критику — не идёт дальше. Экономит минуты CI/CD и нервы разработчика.

---

## 1. Secret Scanning (L1 — Pre-commit)

### Как работает

Сканирует код на наличие ключей, токенов, паролей, приватных ключей **до коммита** (pre-commit hook) и **в пайплайне** (первая джоба).

**Инструменты:**
| Инструмент | Где | Особенность |
|-------------|-----|-------------|
| **gitleaks** | CI/CD + pre-commit | Быстрый, настраиваемые правила в `.gitleaks.toml`, SARIF-отчёт |
| **truffleHog** | CI/CD | Ищет не только regex, но и энтропию (строки с высокой случайностью) |
| **git-secrets** | pre-commit | От AWS, только pre-commit, проверяет staged-изменения |

### Как разработчики делают ошибки

```
// Плохо: секрет в коде
const API_KEY = "sk_live_4fJ8kL...";
```

```
# Плохо: .env закоммичен
DATABASE_URL=postgres://user:password@prod-db:5432/mydb
```

```
# Плохо: приватный ключ в репозитории
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
```

### Как AppSec обнаруживает

```yaml
# .gitlab-ci.yml — джоба secret scanning
secretscan:
  stage: pre-commit
  image:
    name: zricethezav/gitleaks:v8
    entrypoint: [""]
  script:
    - gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif --redact --exit-code 1 --verbose
  artifacts:
    when: always
    paths:
      - gitleaks.sarif
    reports:
      secret_detection: gitleaks.sarif
```

```bash
# pre-commit hook (.git/hooks/pre-commit)
gitleaks protect --staged --verbose
```

### Как исправить

1. **Сразу ротировать** скомпрометированный ключ/токен (секрет в истории git — считать публичным)
2. `git filter-repo` или `bfg` для удаления из истории
3. Перенести секрет в vault/secrets manager/env-переменную CI/CD

### Как предотвратить

```bash
# .gitleaks.toml — кастомные правила
[[rules]]
id = "jwt-token"
description = "JWT token hardcoded"
regex = '''eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'''
tags = ["secret", "jwt"]
```

```bash
# pre-commit hook — обязателен для всего проекта
$ pre-commit install
$ pre-commit run gitleaks --all-files
```

---

## 2. SAST — Static Application Security Testing (L2)

### Как работает

Анализирует исходный код без запуска приложения. Ищет паттерны уязвимостей: SQLi, XSS, command injection, path traversal, hardcoded secrets.

**Инструменты:**
| Инструмент | Тип | Стоимость |
|-------------|-----|-----------|
| **Semgrep** | Pattern-based + taint | Open Source / Pro |
| **SonarQube** | AST-based + rules | Community / Enterprise |
| **CodeQL** | Data-flow analysis | Бесплатно (GitHub) |
| **Checkmarx** | Enterprise SAST | Коммерческий |

### Как выбирать инструмент

| Критерий | Semgrep | SonarQube | CodeQL |
|----------|---------|-----------|--------|
| Простота написания своих правил | +++++ | ++ | +++ |
| Скорость сканирования | быстро | средне | медленно |
| Качество OOTB-правил | хорошо | отлично | отлично |
| Интеграция с GitLab CI | отлично | хорошо | средне |
| Бесплатная версия | да | да (Community) | да |

**Для старта:** Semgrep (пишешь свои правила за 5 минут, покрываешь специфику проекта).  
**Для зрелых команд:** Semgrep + SonarQube (Semgrep — свои правила, SonarQube — Quality Gates).

### Как разработчики делают ошибки

```javascript
// SQLi через конкатенацию
const query = `SELECT * FROM users WHERE name = '${req.body.name}'`;
```

```javascript
// Command injection
exec(`convert ${req.file.path} ${req.file.path}.png`);
```

### Как AppSec обнаруживает

```yaml
# GitLab CI: Semgrep с публичными + кастомными правилами
sast:
  stage: sast
  image: semgrep/semgrep:1
  variables:
    SEMGREP_RULES: "p/typescript p/owasp-top-ten p/javascript"
  script:
    # sarif — для GitLab виджета, json — для человекочитаемого отчёта
    - semgrep ci --config "$SEMGREP_RULES" --config ../../module-15-semgrep/rules/ --sarif --output semgrep.sarif --error || SEMGREP_EXIT=$?
    - semgrep scan --config "$SEMGREP_RULES" --config ../../module-15-semgrep/rules/ --json --output semgrep.json --severity ERROR --severity WARNING || true
    - exit ${SEMGREP_EXIT:-0}
  artifacts:
    when: always
    paths:
      - semgrep.sarif
      - semgrep.json
    reports:
      sast: semgrep.sarif
```

```yaml
# Кастомное Semgrep-правило: поиск eval()
rules:
  - id: forbidden-eval
    patterns:
      - pattern: eval(...)
    message: "eval() позволяет выполнение произвольного кода — заменить на JSON.parse() или безопасный парсер"
    severity: ERROR
    languages: [javascript, typescript]
```

### Интерпретация результатов

| Severity | Действие |
|----------|----------|
| **CRITICAL / ERROR** | Блокировка пайплайна. Разработчик обязан исправить до мёрджа. |
| **HIGH / WARNING** | Не блокирует. Попадает в отчёт. AppSec должен посмотреть на код-ревью. |
| **MEDIUM / LOW** | Just warn. Не блокирует. Копится в backlog. |

### Gate policy

```
CRITICAL → блокируем пайплайн (--error)
HIGH     → не блокируем, но AppSec review required (+ label в MR)
MEDIUM   → backlog, не блокируем
LOW      → информационно
```

---

## 3. SCA — Software Composition Analysis (L3 — Зависимости)

### Как работает

Сканирует `package.json`, `pom.xml`, `go.mod`, `requirements.txt` на известные CVE в зависимостях.

**Инструменты:**
| Инструмент | Что умеет | Стоимость |
|-------------|-----------|-----------|
| **Trivy** | FS-сканирование, образы, IaC, секреты | Бесплатно |
| **Snyk** | Зависимости + лицензии + fix PR | Freemium |
| **Dependabot** | Автоматические PR с обновлением | Бесплатно (GitHub) |
| **npm audit** | Только npm | Бесплатно |
| **OWASP Dependency-Check** | Java, .NET, Python | Бесплатно |

### Почему это важно

- **Log4Shell (CVE-2021-44228):** самая известная SCA-находка. CVSS 10.0.
- **59% проектов** содержат уязвимые зависимости (Synopsys 2023).
- **Время эксплуатации** после раскрытия CVE сократилось до 3-12 часов.

### Как разработчики делают ошибки

```json
// Плохо: версия не зафиксирована
{
  "dependencies": {
    "lodash": "*"       // любая версия, включая уязвимую
  }
}
```

```json
// Плохо: транзитивная зависимость с CVE не видна при беглом осмотре
{
  "dependencies": {
    "my-lib": "^1.0.0"  // my-lib тянет уязвимый lodash@4.17.15
  }
}
```

### Как AppSec обнаруживает

```yaml
# GitLab CI: Trivy FS-сканирование
sca:
  stage: sca
  image:
    name: aquasec/trivy:0.50
    entrypoint: [""]
  variables:
    TRIVY_CACHE_DIR: ".trivycache/"
  cache:
    key: trivy-db
    paths:
      - .trivycache/
  script:
    - trivy fs --download-db-only
    # SARIF для GitLab виджета
    - trivy fs --scanners vuln,secret,misconfig --severity CRITICAL,HIGH --ignore-unfixed --format sarif --output trivy-fs.sarif .
    # Блокировка только на CRITICAL
    - trivy fs --scanners vuln --severity CRITICAL --ignore-unfixed --exit-code 1 .
  artifacts:
    when: always
    paths:
      - trivy-fs.sarif
    reports:
      dependency_scanning: trivy-fs.sarif
```

### Политика обновления зависимостей

```
Критические CVE (CVSS >= 9.0) → патч в течение 24 часов
Высокие CVE (CVSS >= 7.0)     → патч в течение 7 дней
Средние CVE (CVSS >= 4.0)     → в ближайший спринт
Низкие CVE (CVSS < 4.0)       → backlog
```

---

## 4. Container Scanning (L4 — Образы)

### Как работает

Сканирует слои Docker-образа на уязвимости в пакетах (apt, apk, yum) и файловой системе.

**Инструменты:**
| Инструмент | Особенность |
|-------------|-------------|
| **Trivy** | Самый быстрый, сканирует и образы, и fs, и IaC |
| **Grype** | От Anchore, хорошая интеграция с SBOM |
| **Sysdig** | Runtime + image scanning |
| **Snyk Container** | Интеграция с Snyk Open Source |

### Пример в CI/CD

```yaml
container-scan:
  stage: container-scan
  image:
    name: aquasec/trivy:0.50
    entrypoint: [""]
  variables:
    IMAGE_TAG: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
  script:
    - trivy image --severity CRITICAL,HIGH --ignore-unfixed --format sarif --output trivy-image.sarif "$IMAGE_TAG"
    - trivy image --severity CRITICAL --ignore-unfixed --exit-code 1 "$IMAGE_TAG"
  artifacts:
    when: always
    paths:
      - trivy-image.sarif
    reports:
      container_scanning: trivy-image.sarif
```

### Gate policy для образов

```
CRITICAL в базовом образе → блокировка деплоя, смена базового образа
CRITICAL в пакетах приложения → блокировка деплоя, срочный патч
HIGH → варнинг, тикет в бэклог команды
```

---

## 5. IaC Scanning (L5 — Infrastructure as Code)

### Как работает

Сканирует Terraform, CloudFormation, Kubernetes-манифесты, Dockerfile, Helm-чарты на misconfigurations.

**Инструменты:**
| Инструмент | Что проверяет | Стоимость |
|-------------|---------------|-----------|
| **Checkov** | Terraform, K8s, Helm, Dockerfile, CloudFormation, 750+ правил | Бесплатно |
| **tfsec** | Только Terraform, AWS/Azure/GCP-специфичные правила | Бесплатно |
| **KICS** | От Checkmarx, 2000+ правил, все платформы | Бесплатно |
| **Trivy** | misconfig scanner встроен рядом с vuln | Бесплатно |

### Типичные находки

```hcl
# Плохо: S3 bucket публичный
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
  acl    = "public-read"          # Checkov найдёт
}
```

```yaml
# Плохо: привилегированный контейнер без securityContext
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
    - name: app
      image: my-app:latest  # Checkov найдёт: нет securityContext + latest
```

### Пример в CI/CD

```yaml
iac-scan:
  stage: iac-scan
  image: bridgecrew/checkov:3
  script:
    - checkov --directory k8s/ --framework kubernetes --soft-fail-on LOW,MEDIUM --hard-fail-on HIGH,CRITICAL --output sarif --output-file-path checkov.sarif
  artifacts:
    when: always
    paths:
      - checkov.sarif
```

---

## 6. DAST — Dynamic Application Security Testing (L6)

### Как работает

Сканирует **запущенное** приложение, отправляя HTTP-запросы и анализируя ответы. Не требует доступа к исходному коду.

**Инструменты:**
| Инструмент | Тип | Когда |
|-------------|-----|-------|
| **OWASP ZAP** | Baseline (пассивный + активный) | Каждый MR в staging |
| **OWASP ZAP** | Full scan | Перед релизом, раз в спринт |
| **Burp Suite Pro** | Manual + automated | Пентест, раз в квартал |
| **Nuclei** | Template-based | Быстрые проверки на конкретные CVE/misconfig |

### Automated vs Manual

| | Automated (ZAP baseline) | Manual (Burp/ZAP full) |
|---|---|---|
| **Частота** | Каждый MR | Раз в спринт / квартал |
| **Покрытие** | 50-60% OWASP Top 10 | 80-90% |
| **Время** | 2-5 минут | 2-4 часа |
| **False positives** | Много | Мало |
| **Business logic** | Не находит | Находит |

### Пример в CI/CD

```yaml
dast:
  stage: dast
  image:
    name: ghcr.io/zaproxy/zaproxy:stable
    entrypoint: [""]
  variables:
    DAST_TARGET: "http://staging.app.svc:3000"
  script:
    - zap-baseline.py
        -t "$DAST_TARGET"
        -c ci/zap-rules.tsv
        -J zap-report.json
        -r zap-report.html
        -I
  artifacts:
    when: always
    paths:
      - zap-report.html
      - zap-report.json
```

### Gate policy для DAST

```
HIGH → блокировка (подтверждённая находка, не false positive)
MEDIUM → AppSec review
LOW → backlog
```

---

## Связь теории с практикой (module-17-ssdlc)

Все описанные выше проверки реализованы в production-grade пайплайне:

- **Корневой пайплайн:** `Experience/labs/juice-shop/module-17-ssdlc/.gitlab-ci.yml`
- **Переиспользуемые шаблоны:** `module-17-ssdlc/ci/templates/security-scanning.yml`
- **ZAP allowlist:** `module-17-ssdlc/ci/zap-rules.tsv`

Пайплайн использует паттерн `include: local:` + `extends` для переиспользования джоб между проектами — стандартная практика в enterprise GitLab CI.

---

## Gate Policy — сводная таблица

| Severity | SAST (Semgrep) | SCA (Trivy) | Container Scan | IaC (Checkov) | DAST (ZAP) |
|----------|---------------|-------------|----------------|---------------|------------|
| **CRITICAL** | Блокировка | Блокировка | Блокировка | Блокировка | Блокировка |
| **HIGH** | AppSec review | AppSec review | Тикет в бэклог | AppSec review | AppSec review |
| **MEDIUM** | Бэклог | Бэклог | Бэклог | Варнинг | Бэклог |
| **LOW** | Инфо | Инфо | Инфо | Инфо | Инфо |

---

## Чек-лист внедрения DevSecOps

- [ ] Secret Scanning: gitleaks в CI/CD + pre-commit hook
- [ ] SAST: Semgrep/SonarQube на каждом MR, блокировка на CRITICAL
- [ ] SCA: Trivy/Snyk на каждом MR, политика обновления зависимостей
- [ ] Container Scanning: Trivy на каждом билде образа
- [ ] IaC Scanning: Checkov/tfsec на изменениях в k8s/Terraform/HCL
- [ ] DAST: ZAP baseline на staging, full scan перед релизом
- [ ] Gate policy задокументирована и согласована с командами
- [ ] Все отчёты в формате SARIF для интеграции с GitLab/GitHub виджетами
- [ ] Security Champions в командах знают, как читать отчёты

---

## Типовые ошибки при внедрении

### [NO] Блокировать пайплайн на LOW/WARNING
> «У нас всё строго, даже на WARNING пайплайн красный.»

**Почему проблема:** Разработчики перестанут воспринимать security-проверки всерьёз. Красный пайплайн станет «нормой», зелёный — никто не ждёт.

**Зрелый подход:** Блокировка только на CRITICAL. HIGH → AppSec review. MEDIUM/LOW → backlog.

### [NO] Внедрить всё сразу
> «Давайте в понедельник включим SAST, DAST, SCA, секреты и контейнеры на всех проектах.»

**Почему проблема:** 500+ алертов в первый день. Команды в шоке. Security воспринимается как враг.

**Зрелый подход:** Поэтапно. Один сканер → настройка → reduce noise → следующий сканер.

### [NO] Не настраивать правила под проект
> «Semgrep default-правила всё найдут.»

**Почему проблема:** Default-правила дают 40-60% false positive rate для специфичного проекта. Разработчики тратят время на разбор ложных срабатываний.

**Зрелый подход:** Первые 2 недели — сбор статистики в режиме `allow_failure: true`. Настройка правил под кодовую базу. Включение блокировки.

---

## Связанные разделы

- [Kubernetes Security](../kubernetes/README.md) — hardening K8s, runtime security, network policies
- [Docker Security](../docker-security/README.md) — безопасная настройка контейнеров
- [Secure SDLC](../secure-sdlc/09-security-metrics.md) — метрики эффективности security-пайплайна
- [Module 17 — SSDLС Pipeline](../../Experience/labs/juice-shop/module-17-ssdlc/report.md) — практическая реализация пайплайна на Juice Shop

---

## Interview Questions

| Вопрос | Ответ |
|--------|-------|
| Чем отличается SAST от DAST? | SAST — белый ящик (анализ исходного кода без запуска), DAST — чёрный ящик (атака на запущенное приложение). SAST находит проблемы раньше и точнее указывает строку. DAST находит runtime-проблемы (например, неправильные заголовки, CORS) и не зависит от языка. |
| Почему нельзя полагаться только на SCA (Dependabot/Trivy)? | SCA находит только известные CVE в зависимостях. Кастомный код с SQLi или SSRF не видит. SCA — необходимый, но недостаточный уровень. |
| Что делать, если найден CRITICAL CVE, а патча нет? | Временные компенсирующие меры: WAF-правило, network policy, отключение affected-функциональности, runtime detection (Falco). Фикс — форк с патчем или смена библиотеки. |
| Как выбрать между Semgrep и SonarQube? | Semgrep — для кастомных правил под специфику проекта (быстро, дёшево). SonarQube — для Quality Gates и code smells (требует инфраструктуру). Идеально — оба. |
| Зачем pre-commit hooks, если есть CI/CD? | Сдвиг влево: pre-commit находит секреты за секунды на машине разработчика, CI/CD — через минуты после пуша. Плюс git history не засоряется. |

---

## Lessons Learned

- Блокируй только то, что действительно критично (RCE, data breach). Всё остальное — в backlog.
- Начинай с одного сканера, доводи до управляемого уровня шума, потом добавляй следующий.
- Security Champions в командах — ключевой фактор успеха DevSecOps-трансформации.
- Режим `allow_failure: true` на старте спасает отношения с разработчиками.