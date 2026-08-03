# Secret Scanning — Gitleaks, TruffleHog

> **Контекст:** утёкший секрет — это инцидент уровня data breach. Secret scanning — первый и самый дешёвый уровень защиты: ловит проблему до того, как она попадёт в git history.

---

## 1. Почему секреты утекают

```
Developer создаёт .env -> .gitignore не настроен -> commit -> push -> секрет в истории навсегда
```

Даже если удалить файл из репозитория, секрет остаётся в git history. Именно поэтому ротация обязательна, а не «просто удалю строку».

Типовые источники утечек:

- `.env` закоммичен
- API-ключ в коде для «быстрого теста»
- Приватный ключ в тестовой директории
- Токен CI/CD в скрипте
- Секрет в примере документации
- Ключ в Dockerfile (ARG/ENV) и затем в слое образа

---

## 2. Как работают детекторы

### Regex detection

Поиск по известным паттернам:

```
AWS Access Key:      AKIA[0-9A-Z]{16}
AWS Secret Key:      [A-Za-z0-9/+=]{40}
GitHub Token:        ghp_[A-Za-z0-9]{36}
Slack Token:         xox[baprs]-[0-9A-Za-z-]{10,}
Private Key:         -----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----
```

**Ограничение:** только известные паттерны. Новый формат токена не найдёт. Также срабатывает на placeholder'ы и тестовые данные (например, `AKIAIOSFODNN7EXAMPLE` из документации AWS).

### Entropy detection

Оценка «случайности» строки. Чем выше энтропия — тем вероятнее секрет.

```
password123        -> низкая энтропия (не секрет)
7K3!xQe9#Lm2@Vz8  -> высокая энтропия (секрет)
```

**Ограничение:** длинные случайные строки без паттерна (например, session_id) дают false positives.

### Комбинация

```
Gitleaks:        конфиг в .gitleaks.toml: regex + allowlist, может добавлять свои правила
TruffleHog:      entropy + регулярные выражения + собственные детекторы (GitHub, AWS, Slack...)
```

---

## 3. Gitleaks

### Установка и базовое использование

```bash
# Установка (macOS)
brew install gitleaks

# Сканирование репозитория (включая историю)
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Сканирование staged изменений (pre-commit)
gitleaks protect --staged --verbose

# Сканирование с SARIF-отчётом для GitLab/GitHub
gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif
```

### Exit codes

```
0 — секретов не найдено
1 — найдены секреты
126 — конфиг не найден/невалиден
```

В CI/CD используем `--exit-code 1`, чтобы блокировать пайплайн.

### Конфигурация (.gitleaks.toml)

```toml
title = "gitleaks config"

[extend]
useDefault = true   # стандартные правила + свои

# Своё правило
[[rules]]
id = "jwt-token"
description = "JWT token hardcoded"
regex = '''eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+'''
tags = ["secret", "jwt"]

# Allowlist — исключения
[allowlist]
description = "Тестовые данные"
regexes = [
  '''AKIAIOSFODNN7EXAMPLE''',   # пример из документации AWS
  '''password123''',
]
paths = [
  '''test/.*''',
  '''.*\.md$''',
]
```

### Gitleaks в CI/CD

```yaml
secrets:
  stage: secrets
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
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

### Pre-commit hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

---

## 4. TruffleHog

### Базовое использование

```bash
# Установка
brew install trufflehog

# Сканирование репозитория (по умолчанию — вся история)
trufflehog git https://github.com/example/repo.git

# Сканирование локальной директории
trufflehog filesystem .

# Только высокоуверенные находки
trufflehog git --only-verified https://github.com/example/repo.git
```

### Ключевое отличие

TruffleHog умеет **verify** — проверять, что найденный секрет действительно работает:

```bash
# Проверка: токен реальный или нет?
trufflehog git --only-verified https://github.com/example/repo.git
```

Проверяет через API провайдера: делает запрос с найденным токеном. Если токен невалиден — не помечает. Это снижает FP, но требует доступа к API.

### TruffleHog в CI/CD

```yaml
trufflehog:
  stage: secrets
  image:
    name: trufflesecurity/trufflehog:latest
    entrypoint: [""]
  script:
    - trufflehog git "https://gitlab-ci-token:${CI_JOB_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git" --only-verified --fail
```

---

## 5. Что делать при утечке (Incident Response)

```
Обнаружение -> Ротация -> Удаление из истории -> Анализ -> Предотвращение
```

### 1. Обнаружение

- Сканер в CI/CD (gitleaks/trufflehog)
- Внешний мониторинг (GitHub secret scanning, TruffleHog Enterprise)
- Уведомление от провайдера (AWS, GitHub о скомпрометированном токене)

### 2. Ротация (обязательна)

Секрет в истории git считается скомпрометированным навсегда:

- Отозвать токен/ключ у провайдера (AWS Console, GitHub Settings -> Developer settings)
- Сгенерировать новый
- Обновить в secrets manager / CI/CD variables
- Не «просто удалить строку» — секрет мог быть скопирован

### 3. Удаление из истории

```bash
# bfg (проще для больших репозиториев)
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# git filter-repo (современный подход)
git filter-repo --invert-paths --path .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

Внимание: после переписывания истории нужен force-push и синхронизация всех локальных копий.

### 4. Анализ

- Куда попал секрет (PR, issue, fork, внешний сервис)
- Кто имел доступ
- Как долго секрет был публичным

### 5. Предотвращение

- Pre-commit hook (gitleaks protect)
- Секреты только в secrets manager (AWS Secrets Manager, Vault, GitLab CI variables)
- `.env` в `.gitignore` обязателен
- Секреты не в Dockerfile (ENV/ARG — попадают в слои)
- Проверка `.dockerignore`

---

## 6. Security Champions / разработчикам

| Правило | Почему |
|---------|--------|
| Секреты не в коде | История git хранит всё навсегда |
| Ротация при малейшем подозрении | Дешевле, чем инцидент |
| Используй secrets manager | Одно место хранения, аудит доступа |
| Never hardcode secrets in tests | Тестовые ключи тоже утекают |
| Не логируй секреты | Логи попадают в SIEM, экспортятся |

---

## 7. Interview Questions

| Вопрос | Ответ |
|--------|-------|
| Чем regex отличается от entropy? | Regex ищет известные паттерны токенов. Entropy оценивает случайность строки, ловит неизвестные форматы. Комбинация — максимальное покрытие. |
| Что делать, если секрет утёк в git? | Ротация (обязательно) + удаление из истории (bfg/filter-repo) + анализ доступа + предотвращение (pre-commit, secrets manager). |
| Зачем pre-commit, если есть CI/CD? | pre-commit ловит секрет за секунды на машине разработчика до коммита. CI/CD — после пуша. Плюс git history не засоряется. |
| Что такое verified secrets в TruffleHog? | Проверка токена через API провайдера (реальный он или нет). Снижает false positives. |
| Как не ловить placeholder'ы? | Allowlist в Gitleaks: regex-исключения (AKIAIOSFODNN7EXAMPLE), пути (test/), extensions (.md). |

---

## Связанные разделы

- [DevSecOps overview](devsecops.md) — секреты в пайплайне
- [GitLab CI/CD](gitlab-ci-cd.md) — джоба secrets с gitleaks
- [Automation](automation.md) — обработка находок gitleaks через jq/Python