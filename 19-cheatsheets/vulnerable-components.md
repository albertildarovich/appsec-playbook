# Vulnerable & Outdated Components Cheatsheet

> Быстрая справка по OWASP A06: SCA, triage, reachability, SBOM, компенсирующие меры.

---

## Что проверять

```bash
# 1. Trivy — сканирование репозитория
trivy fs .

# 2. Trivy — сканирование Docker образа
trivy image nginx:1.20.0

# 3. Trivy — сканирование Kubernetes
trivy k8s cluster

# 4. Trivy — генерация SBOM
trivy image --format cyclonedx --output result.cdx.json alpine:latest

# 5. Проверка зависимостей (языковые)
# Java
mvn dependency:tree
gradle dependencies

# Python
pip freeze
pip-audit

# JavaScript
npm audit
yarn audit

# Go
go list -m all
govulncheck ./...

# Ruby
bundle audit
```

---

## Что искать на Code Review

```bash
# Устаревшие версии библиотек
grep -rn "spring-boot.*2\.\|spring-boot.*1\.\|^spring.*version" build.gradle pom.xml --include="*.xml" --include="*.gradle"

# Фиксированные версии с известными CVE
grep -rn "log4j.*1\.\|log4j.*2\.0\|log4j.*2\.1\|log4j.*2\.2\|log4j.*2\.3\|log4j.*2\.4\|log4j.*2\.5\|log4j.*2\.6\|log4j.*2\.7\|log4j.*2\.8\|log4j.*2\.9\|log4j.*2\.10\|log4j.*2\.11\|log4j.*2\.12\|log4j.*2\.13\|log4j.*2\.14" pom.xml build.gradle

# Wildcard dependencies (dangerous — no pinning)
grep -rn "version.*latest\|version.*LATEST\|version.*RELEASE\|version.*\*\|\"version\": \"\*\"" package.json pom.xml build.gradle requirements.txt Cargo.toml

# Docker — старые базовые образы
grep -rn "FROM.*:latest\|FROM.*:alpine\|FROM.*:slim" Dockerfile --include="Dockerfile"

# Проверка наличия SCA в CI/CD
grep -rn "trivy\|snyk\|dependabot\|owasp.*dependency\|dependency-check\|npm audit\|pip-audit\|govulncheck\|bundle audit" .github/workflows/ Jenkinsfile .gitlab-ci.yml
```

---

## Triage — алгоритм оценки CVE

```
Получен отчёт SCA
       ↓
┌─────────────────────────────┐
│ 1. False Positive?          │ → Да → Отклонить
└─────────────────────────────┘
       ↓ Нет
┌─────────────────────────────┐
│ 2. Reachable?               │ → Нет → Low priority
└─────────────────────────────┘
       ↓ Да
┌─────────────────────────────┐
│ 3. Public exploit (PoC)?    │
│    KEV? (CISA list)         │ → Да → Critical
└─────────────────────────────┘
       ↓ Нет
┌─────────────────────────────┐
│ 4. Internet Facing?         │ → Нет → Medium/Low
└─────────────────────────────┘
       ↓ Да
┌─────────────────────────────┐
│ 5. Business Critical?       │ → Да → High/Critical
└─────────────────────────────┘
       ↓
Приоритизация и remediation
```

---

## Компенсирующие меры (если нельзя обновить)

| Проблема | Компенсирующая мера |
|----------|-------------------|
| Нет patched версии | WAF, network segmentation, feature disable |
| Breaking changes | Feature disable, isolation, monitoring |
| Транзитивная зависимость | Override версии в build-файле, изолировать микросервис |
| EOL библиотека | Container sandbox, restricted network, API gateway |

---

## Пример: обновление зависимостей

### Java (Maven)

```xml
<!-- ❌ Уязвимая версия -->
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.14.1</version>  <!-- log4shell -->
</dependency>

<!-- ✅ Исправленная версия -->
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.17.1</version>  <!-- patched -->
</dependency>
```

### Python (pip)

```bash
# ❌ Устаревшая версия
pip install requests==2.25.0

# ✅ Проверить уязвимости
pip-audit

# ✅ Обновить
pip install requests==2.31.0
```

### Node.js

```bash
# ❌ Устаревшая версия (package.json)
"express": "^4.17.1"

# ✅ Проверить уязвимости
npm audit
npm audit fix

# ✅ Обновить
"express": "^4.19.2"
```

### Docker

```dockerfile
# ❌ Устаревший базовый образ
FROM node:14-alpine

# ✅ Актуальный базовый образ
FROM node:20-alpine
```

---

## Интеграция в CI/CD

### GitHub Actions

```yaml
name: Security Scan
on:
  pull_request:
  push:
    branches: [main]

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'HIGH,CRITICAL'
```

### GitLab CI

```yaml
trivy-scan:
  stage: security
  script:
    - trivy fs --severity HIGH,CRITICAL --exit-code 1 .
  only:
    - merge_requests
    - main
```

---

## Типичные ошибки

| Ошибка | Почему плохо |
|--------|-------------|
| Исправлять все CVE подряд | Нет приоритизации, ресурсы уходят на нереachable уязвимости |
| Доверять только CVSS | CVSS не учитывает контекст (Internet Facing, reachability) |
| Не проверять reachability | Много false positives, команда перестаёт доверять SCA |
| Сканировать только перед релизом | Новые CVE появляются ежедневно, нужно continuous scanning |
| Не иметь SBOM | Не знаешь, что входит в приложение |
| Не иметь compensating controls | Если нельзя обновить — нет плана Б |
| Использовать `latest` в Dockerfile | Непредсказуемые изменения, невозможность повторить сборку |

---

## Полезные команды Trivy

```bash
# Сканировать файловую систему
trivy fs --severity HIGH,CRITICAL .

# Сканировать Docker образ
trivy image --severity HIGH,CRITICAL alpine:3.18

# Сканировать с ignore unfixed (только CVE с фиксом)
trivy image --ignore-unfixed alpine:3.18

# Сканировать с форматом SARIF (для GitHub Security Tab)
trivy fs --format sarif --output result.sarif .

# Сгенерировать SBOM
trivy image --format cyclonedx --output sbom.cdx.json alpine:latest

# Сканировать по SBOM
trivy sbom sbom.cdx.json
```

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-1104** | Use of Unmaintained Third-Party Components |
| **CWE-937** | Using Components with Known Vulnerabilities |
