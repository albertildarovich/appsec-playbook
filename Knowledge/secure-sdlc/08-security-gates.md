# Security Gates

## Определение

Security Gates — это контрольные точки в CI/CD pipeline, которые проверяют соответствие требованиям безопасности и могут блокировать релиз.

## Концепция

```
Code Commit ──▶ Pre-commit ──▶ CI ──▶ Staging ──▶ Release
                    │            │       │           │
                    ▼            ▼       ▼           ▼
             Secret Scan     SAST     DAST      Security
                                                Sign-off
```

### Gate Levels

| Gate | Stage | Блокирует | Автоматизация |
|------|-------|-----------|---------------|
| **L1** | Pre-commit | Нет | Pre-commit hooks |
| **L2** | CI | PR merge | Automated |
| **L3** | Staging | Deploy to prod | Automated + Manual |
| **L4** | Release | Release | Manual (sign-off) |

## Примеры Security Gates

### L1: Pre-commit
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: latest
    hooks:
      - id: gitleaks
  - repo: https://github.com/returntocorp/semgrep
    rev: latest
    hooks:
      - id: semgrep
```

### L2: CI/CD (PR)
```yaml
# GitHub Actions
security-sast:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: SAST Scan
      run: semgrep --config=auto --error .
    - name: SCA Scan
      run: trivy fs --severity CRITICAL --exit-code 1 .
```

**Gate policy:**
- [NO] CRITICAL vulnerabilities → блокировать PR
- [WARN] HIGH → уведомить, но не блокировать
- [OK] LOW/MEDIUM → логировать

### L3: Staging
```yaml
security-dast:
  runs-on: ubuntu-latest
  environment: staging
  steps:
    - name: DAST Scan
      run: zap-cli quick-scan --scanners xss,sqli https://staging.example.com
```

**Gate policy:**
- [NO] Найдена XSS/SQLi → блокировать деплой в prod
- [WARN] Medium findings → требуется manual review

### L4: Release
```yaml
security-signoff:
  runs-on: ubuntu-latest
  environment: production
  steps:
    - name: Security Sign-off
      run: |
        echo "Checklist:
        - [ ] SAST: no CRITICAL
        - [ ] SCA: no CRITICAL
        - [ ] DAST: no findings
        - [ ] Secrets: none leaked
        - [ ] Container: scan passed"
```

## Параметры Security Gates

| Параметр | Значение |
|----------|----------|
| **Action** | block / warn / notify |
| **Severity** | critical / high / medium / low |
| **Scope** | all / selective (depends on component) |
| **Override** | AppSec может override gate |
| **SLA** | время на исправление до блокировки |

## Типичные Security Gates

### 1. SAST Gate
```
Trigger: Pull Request created
Action: запустить Semgrep
Gate: block if CRITICAL severity
Override: AppSec review required
```

### 2. SCA Gate
```
Trigger: Деплой в staging
Action: запустить Trivy
Gate: block if known CRITICAL CVE
Override: Risk acceptance by AppSec
```

### 3. Secret Gate
```
Trigger: git push
Action: gitleaks
Gate: block if any secret found
Override: Force push (audited)
```

### 4. Container Gate
```
Trigger: Docker build
Action: trivy image
Gate: block if CRITICAL in base image
Override: Security exception
```

### 5. DAST Gate
```
Trigger: Deploy to staging
Action: OWASP ZAP scan
Gate: block if XSS/SQLi found
Override: Retest + manual review
```

## Как внедрять Security Gates

### Постепенное внедрение

```
Phase 1: Warn only
  - Добавить SAST, но не блокировать
  - Log findings

Phase 2: Block on critical
  - Блокировать только CRITICAL
  - Дать SLA на исправление

Phase 3: Block on high
  - Блокировать HIGH и выше
  - AppSec может override

Phase 4: Full automation
  - Все gates active
  - Исключения через process (не ad-hoc)
```

### Важно:
- Не вводить все gates сразу — разработчики взбунтуются
- Начинать с warn и логирования
- Давать время на исправление
- Override должен быть через процесс, а не ad-hoc
- Регулярно пересматривать политики gates

## Типичные ошибки

| Ошибка | Решение |
|--------|---------|
| Блокировать всё сразу | Постепенное внедрение |
| Нет возможности override | Процесс для исключений |
| Нет SLA на исправление | Определить timelines |
| SAST gate без tuning | Много FP → developer burnout |
| Gates только в production | Ранние gates = быстрее фикс |

## Ключевые тезисы

- Security Gates — автоматические контрольные точки в CI/CD
- Должны внедряться постепенно
- Начинать с warn, заканчивать block
- CRITICAL блокировать всегда
- Override должен быть через process
- Gates без SLA = gates без пользы
- Developer experience важна: много FP = gates игнорируют
