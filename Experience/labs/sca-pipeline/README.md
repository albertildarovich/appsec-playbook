# SCA Pipeline Demo

> **Цель:** Построить SCA-пайплайн с Dependency-Check (или Trivy), сгенерировать SBOM в формате CycloneDX, научиться обрабатывать CVE и оценивать CVSS.

## Статус

[OK] Развёрнуто. Пайплайн, SBOM и разбор CVE — в документации ниже.

## Стек

| Инструмент | Роль |
|------------|------|
| Trivy | Сканирование уязвимостей зависимостей (fs + image) |
| OWASP Dependency-Check | Альтернативный сканер, NVD-база |
| CycloneDX | Формат SBOM (Software Bill of Materials) |
| CVSS | Оценка severity уязвимостей |

## Архитектура пайплайна

```
Merge Request
    |
    v
[L1] sca-trivy-fs         (trivy fs, блокировка CRITICAL)
    |
    v
[L2] sbom-cyclonedx       (генерация SBOM в формате CycloneDX)
    |
    v
[L3] sca-gate             (слияние Trivy + Dependency-Check, CVSS >= 9.0 -> блок)
    |
    v
[L4] publish-sbom         (публикация SBOM в artifact registry)
```

## Файлы

| Файл | Назначение |
|------|-----------|
| [.gitlab-ci.yml](./.gitlab-ci.yml) | Стадии SCA-пайплайна |
| [sbom-cdx.json](./sbom-cdx.json) | Пример SBOM в формате CycloneDX |
| [cve-report.md](./cve-report.md) | Разбор CVE и оценка CVSS |

---

## Как это работает

### Стадия L1: Trivy (сканирование)

```yaml
sca-trivy:
  stage: sca
  image: aquasec/trivy:0.50.1
  script:
    - trivy fs --format sarif --output trivy.sarif .
    - trivy fs --severity CRITICAL --exit-code 1 .
  artifacts:
    reports:
      dependency_scanning: trivy.sarif
```

### Стадия L2: SBOM (CycloneDX)

```yaml
sbom-cyclonedx:
  stage: sbom
  image: cyclonedx/cyclonedx-node-npm:latest
  script:
    - cyclonedx-bom --output sbom-cdx.json
  artifacts:
    paths:
      - sbom-cdx.json
```

### Стадия L3: Gate

Слияние результатов Trivy и Dependency-Check, проверка CVSS:

```yaml
sca-gate:
  stage: gate
  script:
    - trivy fs --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 .
```

Логика блокировки:
- CRITICAL (CVSS 9.0-10.0) — блокировка merge, фикс обязателен
- HIGH (CVSS 7.0-8.9) — блокировка, если нет mitigation
- MEDIUM (CVSS 4.0-6.9) — информационно, планировать
- LOW (CVSS 0.1-3.9) — информационно

---

## Как читать CVSS

CVSS (Common Vulnerability Scoring System) — стандарт оценки severity уязвимости.

```
CVSS = Base + Temporal + Environmental
```

| Severity | Base Score | Пример |
|----------|-----------|--------|
| NONE | 0.0 | Информационное раскрытие без риска |
| LOW | 0.1 - 3.9 | DoS без потери данных |
| MEDIUM | 4.0 - 6.9 | XSS, CSRF |
| HIGH | 7.0 - 8.9 | RCE с аутентификацией, SQLi |
| CRITICAL | 9.0 - 10.0 | RCE без аутентификации (Log4Shell — 10.0) |

### Вектор CVSS

```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
      │    │    │    │    │    │   │   │   │
      │    │    │    │    │    │   │   │   └── A: Impact (Availability)
      │    │    │    │    │    │   └──────┴── I: Impact (Integrity)
      │    │    │    │    │    └────────────── C: Impact (Confidentiality)
      │    │    │    │    └─────────────────── S: Scope
      │    │    │    └─────────────────────── UI: User Interaction
      │    │    └──────────────────────────── PR: Privileges Required
      │    └───────────────────────────────── AC: Attack Complexity
      └────────────────────────────────────── AV: Attack Vector (N=Network)
```

---

## SBOM: Software Bill of Materials

SBOM — структурированный список всех компонентов приложения: библиотеки, версии, лицензии, зависимости.

### Зачем нужен SBOM

1. **Управление уязвимостями** — зная состав, можно проверить: затронута ли библиотека новым CVE.
2. **Compliance** — ГОСТ Р 56939-2024, NIST SSDF, EO 14028 (США) требуют SBOM для поставки ПО.
3. **Supply chain security** — атаки типа SolarWinds, xz-utils становятся возможны из-за неучтённых зависимостей.
4. **Аудит лицензий** — GPL в коммерческом продукте может быть проблемой.

### Формат CycloneDX

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "components": [
    {
      "type": "library",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2"
    }
  ]
}
```

Полный пример: [sbom-cdx.json](./sbom-cdx.json)

---

## CVE: пример обработки

Полный разбор CVE-2024-21538, CVE-2023-44487 и других: [cve-report.md](./cve-report.md)

### Процесс обработки CVE

```
CVE опубликован
    |
    v
[1] Найден в SBOM          - NuGet/npm/pip package присутствует?
    |
    v
[2] Анализ CVSS           - вектор, severity, reachable?
    |
    v
[3] Проверка exploit      - есть ли публичный PoC/exploit в дикой природе?
    |
    v
[4] Решение               - обновить / обходной путь / принять риск
    |
    v
[5] Отслеживание          - следить за обновлениями, SLA
```

---

## Пайплайн-рекомендация

```
Trivy (fs, на MR) -> SBOM (CycloneDX, на MR+main) -> Gate (CVSS >= 9.0) -> Publish SBOM
```

1. **Trivy (fs)** — на каждый MR: CRITICAL/HIGH block, MEDIUM info.
2. **Trivy (image)** — на каждый собранный образ (container registry).
3. **OWASP Dependency-Check** — ночной прогон как второй источник (NVD).
4. **SBOM (CycloneDX)** — генерация на каждый релиз, публикация в registry.
5. **CVE-процесс** — еженедельный разбор, обновление зависимостей с SLA.

---

## Выводы

- SCA — это не «npm audit раз в месяц», а автоматизированный процесс на каждом MR.
- SBOM (CycloneDX) — обязательный артефакт для compliance и быстрого реагирования на новые CVE.
- CVSS — не самоцель: помимо CVSS важно понимать reachability (достижима ли уязвимость из кода) и наличие exploit.
- Dependency-Check и Trivy комплементарны: разные базы уязвимостей, разный охват.