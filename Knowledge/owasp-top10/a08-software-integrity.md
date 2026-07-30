# A08 — Software and Data Integrity Failures

> **Суть:** Приложение полагается на плагины, библиотеки, модули или данные из непроверенных источников, что позволяет подменить код или конфигурацию.
>
> **Главная опасность:** Неавторизованное изменение кода/данных в CI/CD, автообновлениях, десериализации — ведущее к компрометации всей системы.

---

## Быстрый чек-лист

- [ ] Все зависимости имеют проверенные цифровые подписи (checksums, signatures)?
- [ ] Используется Software Bill of Materials (SBOM) — CycloneDX или SPDX?
- [ ] CI/CD пайплайн защищён от несанкционированных изменений (branch protection, signed commits)?
- [ ] Автообновления проверяют подпись перед установкой?
- [ ] Десериализация недоверенных данных исключена или ограничена allowlist'ом типов?
- [ ] Docker-образы используют pinned-версии (digest, а не `:latest`)?
- [ ] Конфигурационные файлы проверяются на целостность перед загрузкой?

---

## Категории уязвимостей

### 1. Insecure Deserialization

Злоумышленник передаёт сериализованный объект, который при десериализации выполняет произвольный код (gadget chains).

| Язык | Механизм | Защита |
|------|----------|--------|
| Java | `ObjectInputStream.readObject()`, `Serializable` | Allowlist типов (`ObjectInputFilter`), переход на JSON/Protobuf, запрет `readObject` |
| .NET | `BinaryFormatter`, `DataContractSerializer` | `SerializationBinder` с allowlist, запрет `BinaryFormatter` |
| PHP | `unserialize()` | `allowed_classes` в опциях, JSON вместо serialize |
| Python | `pickle.loads()`, `yaml.load()` | Запретить pickle для недоверенных данных, `yaml.safe_load()` |
| Node.js | `node-serialize`, `serialize-to-js` | Запретить десериализацию недоверенных данных, использовать `JSON.parse` |

### 2. CI/CD Pipeline Integrity

Атака на сборочный конвейер — подмена артефактов, вредоносные PR, компрометация runner'а.

| Вектор | Описание | Защита |
|--------|----------|--------|
| **Compromised dependency** | Вредоносный пакет в npm/PyPI/maven | SCA (Trivy, Dependabot), lock-файлы с hashes |
| **Malicious PR** | Изменение `.github/workflows/` или `Jenkinsfile` | CODEOWNERS, обязательное ревью для CI-файлов |
| **Artifact poisoning** | Подмена собранного артефакта между CI и CD | Sign + verify (Cosign, SLSA framework) |
| **Runner compromise** | Утечка секретов CI → доступ к runner'у | OIDC вместо static secrets, short-lived tokens |
| **Replay attack** | Повторное использование старого (уязвимого) артефакта | Nonce/версионирование артефактов, проверка свежести |

### 3. Unsafe Auto-Updates

Автоматические обновления без проверки подписи позволяют MITM-подмену.

```
[BAD]  curl https://example.com/latest.sh | bash
[GOOD] curl https://example.com/latest.sh | gpg --verify - | bash
```

| Платформа | Риск | Защита |
|-----------|------|--------|
| npm | `npm install` без `package-lock.json` — floating версии | `package-lock.json` + `npm ci`, проверка integrity |
| Docker | `FROM node:latest` — floating образ | `FROM node:18.17.1-alpine@sha256:abc...` |
| Electron | Автообновление без проверки подписи | `electron-updater` с code signing |
| Mobile | APK из сторонних источников | Проверка через `apksigner`, App Store как единственный источник |
| Electron | Автообновление без проверки подписи | `electron-updater` с code signing |

---

## SBOM (Software Bill of Materials)

SBOM — машиночитаемая опись всех компонентов приложения. Позволяет ответить на вопрос «подвержены ли мы log4shell?» за минуты, а не дни.

| Формат | Экосистема | Инструмент |
|--------|------------|------------|
| **CycloneDX** | OWASP, универсальный | `cyclonedx-npm`, `cyclonedx-maven`, Syft, Trivy |
| **SPDX** | Linux Foundation | `spdx-sbom-generator`, Syft |
| **SWID** | ISO/IEC 19770-2 | Редко используется в Open Source |

Генерация SBOM через Syft:
```bash
# Генерация SBOM для Docker-образа
syft node:18-alpine -o cyclonedx-json > sbom.json

# Для директории с кодом
syft dir:./src -o spdx-json > sbom.spdx.json
```

---

## SLSA Framework (Supply-chain Levels for Software Artifacts)

SLSA (произносится «salsa») — фреймворк от Google для обеспечения целостности цепочки поставок ПО.

| Уровень | Требование | Инструмент |
|---------|------------|------------|
| **L1: Build exists** | Сборка автоматизирована, есть provenance | GitHub Actions с `SLSA-GitHub-Generator` |
| **L2: Hosted build platform** | Сборка на изолированной платформе, подписанные provenance | Tekton Chains, GitHub Actions + OIDC |
| **L3: Hardened builds** | Изолированная сборка, HSM для подписи, воспроизводимость | Tekton + Fulcio + Rekor |
| **L4: Hermetic builds** | Полная воспроизводимость, изолированная сеть | Bazel, hermetic build tools |

---

## Проверка целостности на практике

### Docker — проверка подписи образа (Cosign)

```bash
# Подписать образ
cosign sign --key cosign.key myregistry/myapp:v1.0.0

# Проверить подпись перед деплоем
cosign verify --key cosign.pub myregistry/myapp:v1.0.0
```

### Git — подписанные коммиты

```bash
# Настройка GPG-подписи
git config --global user.signingkey <KEY-ID>
git config --global commit.gpgsign true

# Проверка подписи
git log --show-signature
```

### Go modules — проверка checksums

```bash
# Go автоматически проверяет go.sum
# Для дополнительной верификации — Go Checksum Database
GONOSUMCHECK=* GONOSUMDB=*  # НЕ отключать без крайней необходимости
```

---

## Чек-лист безопасности цепочки поставок

- [ ] Все CI/CD пайплайны защищены от модификации через PR (CODEOWNERS, branch protection)
- [ ] Используются OIDC-токены вместо long-lived API keys
- [ ] Секреты не кэшируются в слоях Docker
- [ ] SBOM генерируется для каждого релиза
- [ ] Все внешние зависимости проверяются через SCA-сканер
- [ ] Автообновления проверяют цифровую подпись
- [ ] Десериализация недоверенных данных запрещена
- [ ] Релизные артефакты подписаны (Cosign, GPG)
- [ ] Уровень зрелости цепочки поставок оценён по SLSA

---

## Полная версия

Ключевые конспекты для углублённого изучения:

| Тема | Конспект |
|------|----------|
| Insecure Deserialization | [`web-security/insecure-deserialization.md`](../web-security/insecure-deserialization.md) |
| Insecure Design (связан) | [`owasp-top10/a04-insecure-design.md`](../owasp-top10/a04-insecure-design.md) |

---

## Полезные ссылки

- [OWASP A08: Software and Data Integrity Failures](https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/)
- [SLSA Framework](https://slsa.dev/)
- [Google: Binary Authorization for Borg (будущий SLSA)](https://cloud.google.com/docs/security/binary-authorization-for-borg)
- [OWASP CycloneDX](https://cyclonedx.org/)
- [CISA: SBOM Minimum Elements](https://www.cisa.gov/sbom)