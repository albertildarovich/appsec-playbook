# SBOM — Software Bill of Materials

> **Контекст:** SBOM — машиночитаемый список всех компонентов программного обеспечения. Вопросы про SBOM любят задавать: «Что такое SBOM?», «Чем SPDX отличается от CycloneDX?», «Как сгенерировать SBOM?».

---

## 1. Что такое SBOM

SBOM (Software Bill of Materials) — по аналогии со списком ингредиентов на продукте. Перечисляет:

- библиотеки и их версии
- транзитивные зависимости
- лицензии
- хэши компонентов
- информацию о сборке (build-time metadata)

Зачем нужен:

1. **SCA без SBOM работает хуже** — без точного списка версий нельзя сопоставить CVE.
2. **Log4Shell (2021)** — компании часами искали, где используется log4j. С SBOM поиск занимает минуты.
3. **Executive Order 14028 (США, 2021)** — правительственные контракты требуют SBOM от поставщиков.
4. **Ответственность** — знаешь состав, понимаешь риск.

---

## 2. Форматы: SPDX vs CycloneDX

| Критерий | SPDX | CycloneDX |
|----------|------|-----------|
| Автор | Linux Foundation | OWASP |
| Версия | 2.3 / 3.0 | 1.5 / 1.6 |
| Форматы | JSON, YAML, RDF/XML, tag-value | JSON, XML |
| Фокус | Лицензии и комплаенс | Безопасность (vuln, crypto) |
| Vuln-справочники | Нет (только в 3.0) | Да (vulnerabilities, advisories) |
| PURL-поддержка | Дополнительно | Нативно |
| Расширения | Нет | Extensions (VEX, EPC, Crypto) |
| Использование | Формальные отчёты, юридический комплаенс | CI/CD, security-сканирование |

Практическое правило:
- **CycloneDX** — если цель безопасность: SCA, VEX, эксплуатация в pipeline.
- **SPDX** — если цель лицензионный комплаенс, формальная отчётность.

---

## 3. Ключевые термины

### CVE
Common Vulnerabilities and Exposures — публичный реестр уязвимостей. Идентификатор: `CVE-2021-44228`.

### CPE
Common Platform Enumeration — формат описания платформы/продукта для NVD.
```
cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*
  ^  ^ ^      ^      ^
  |  | |      |      `-- версия
  |  | |      `--------- продукт
  |  | `---------------- поставщик
  |  `------------------ тип (a=application)
  `--------------------- версия схемы CPE
```

### PURL
Package URL — универсальный формат идентификации пакетов.
```
pkg:npm/lodash@4.17.21
pkg:pypi/django@4.2.1
pkg:golang/github.com/gin-gonic/gin@1.9.0
pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1
```

PURL — то, что используется в SCA (Trivy, Grype). Позволяет однозначно идентифицировать пакет независимо от менеджера.

### VEX
Vulnerability Exploitability eXchange — машиночитаемое заявление производителя о статусе уязвимости:
- `not_affected` — уязвимость не применима (функция не используется)
- `affected` — уязвима
- `fixed` — исправлено
- `under_investigation`

VEX решает проблему «SCA нашёл CVE, а она не эксплуатируема в нашем коде». Инструменты: OpenVEX, CycloneDX VEX.

---

## 4. Инструменты

| Инструмент | Какой SBOM | Особенность |
|------------|-----------|-------------|
| **Syft** | CycloneDX, SPDX | От Anchore, быстрый, сканирует fs и образы |
| **Trivy** | CycloneDX, SPDX | `trivy fs --format cyclonedx`, `trivy image --format cyclonedx` |
| **cdxgen** | CycloneDX | 500+ типов проектов, от AppThreat |
| **SPDX tools** | SPDX | Официальный набор |

---

## 5. Генерация SBOM

### Syft

```bash
# Файловая система
syft scan dir:. -o cyclonedx-json > sbom.cdx.json

# Docker-образ
syft scan docker:nginx:1.25 -o spdx-json > sbom.spdx.json
```

### Trivy

```bash
# Файловая система
trivy fs --format cyclonedx --output sbom.cdx.json .

# Docker-образ
trivy image --format cyclonedx --output sbom.cdx.json nginx:1.25

# Сравнение: SBOM в формате CycloneDX + JSON
```

### cdxgen

```bash
cdxgen -o sbom.cdx.json .
# 500+ типов проектов: npm, pip, go, maven, gradle, docker, k8s
```

---

## 6. Компоненты SBOM (пример CycloneDX)

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "metadata": {
    "timestamp": "2026-07-31T08:00:00Z",
    "component": {
      "type": "application",
      "name": "my-app",
      "version": "1.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "bom-ref": "pkg:npm/express@4.18.2",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2"
    }
  ]
}
```

---

## 7. SBOM в pipeline (цепочка)

```yaml
generate-sbom:
  stage: sbom
  image:
    name: anchore/syft:latest
    entrypoint: [""]
  script:
    - syft scan dir:. -o cyclonedx-json > sbom.cdx.json
  artifacts:
    paths:
      - sbom.cdx.json
    expire_in: 1 year   # SBOM храним для аудита

sca:
  stage: sca
  needs: [generate-sbom]
  image:
    name: aquasec/trivy:0.50
    entrypoint: [""]
  script:
    # Сканируем уже готовый SBOM (быстрее повторного сканирования)
    - trivy sbom --severity CRITICAL --ignore-unfixed --exit-code 1 sbom.cdx.json
```

Преимущество: сканируем SBOM, а не файловую систему — быстрее и можно сканировать «чужой» артефакт без доступа к коду.

---

## 8. Supply Chain: подпись артефактов

SBOM + подпись (Cosign/Sigstore) = Integrity:

```
Build -> SBOM (Syft) -> Sign (Cosign) -> Verify (Cosign) -> Deploy
             |                              |
             `-- SBOM подписывается       `-- верификация перед деплоем
```

Основные понятия:
- **Cosign** — подпись контейнерных образов и SBOM (keyless через Sigstore).
- **Sigstore** — экосистема: Fulcio (CA), Rekor (ledger), Cosign (подпись).
- **SLSA** — фреймворк уровней зрелости supply chain (SLSA L1-L4).

---

## 9. Interview Questions

| Вопрос | Ответ |
|--------|-------|
| Что такое SBOM? | Машиночитаемый список всех компонентов (библиотеки, версии, лицензии, хэши) и транзитивных зависимостей приложения. |
| Чем SPDX отличается от CycloneDX? | SPDX — от Linux Foundation, фокус на лицензиях и комплаенсе. CycloneDX — от OWASP, фокус на безопасности: нативная поддержка PURL, vulnerabilities, VEX. |
| Зачем нужен SBOM? | Быстрый поиск уязвимых компонентов (Log4Shell), SCA-сканирование, лицензионный комплаенс, требование регуляторов (EO 14028), управление рисками поставщиков. |
| Что такое PURL? | Package URL — универсальный формат идентификации пакета: `pkg:npm/lodash@4.17.21`. Используется в SCA и SBOM. |
| Чем CPE отличается от PURL? | CPE — от NVD, описывает продукт/платформу (2.3 формат). PURL — универсальный идентификатор пакета в экосистемах (npm, pip, maven). Сканеры переводят PURL в CPE для поиска по NVD. |
| Как сгенерировать SBOM? | `syft scan dir:. -o cyclonedx-json`, `trivy fs --format cyclonedx`, `cdxgen -o sbom.cdx.json .`. |
| Что такое VEX? | Машиночитаемое заявление о статусе уязвимости: not_affected / affected / fixed / under_investigation. Решает проблему ложных срабатываний SCA. |

---

## Связанные разделы

- [DevSecOps overview](devsecops.md) — SCA, container scanning, pipeline
- [GitLab CI/CD](gitlab-ci-cd.md) — джоба SBOM в pipeline
- [SCA (secure-sdlc)](../secure-sdlc/README.md) — управление уязвимостями зависимостей