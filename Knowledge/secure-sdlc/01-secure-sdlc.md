# Secure SDLC

## Определение

Secure SDLC (Software Development Life Cycle) — это процесс разработки, в который безопасность интегрирована на каждом этапе, а не добавлена в конце.

## Зачем это нужно

> "Security should be baked in, not bolted on."

Безопасность, добавленная постфактум:
- стоит в 10-100x дороже;
- замедляет релизы;
- воспринимается командой как бюрократия;
- пропускает уязвимости, которые могли быть найдены на ранних этапах.

## Этапы Secure SDLC

```
Requirements ──▶ Design ──▶ Development ──▶ Testing ──▶ Release ──▶ Maintenance
      │              │            │             │           │             │
      ▼              ▼            ▼             ▼           ▼             ▼
   Security      Threat       SAST +       DAST +      Security     Incident
 Requirements   Modeling    Secure Coding  SCA + VA   Review +     Response
                                                      Sign-off
```

### 1. Security Requirements
На этом этапе определяются требования безопасности к системе.

**Что делаем:**
- Определяем уровень чувствительности данных
- Определяем compliance требования (GDPR, PCI DSS, 152-ФЗ)
- Формируем Security Requirements в user stories
- Определяем security acceptance criteria

**Артефакты:** Security Requirements Specification

### 2. Threat Modeling
На этом этапе моделируются угрозы для проектируемой системы.

**Что делаем:**
- Строим DFD (Data Flow Diagram)
- Определяем trust boundaries
- Применяем STRIDE
- Оцениваем риски
- Документируем mitigation

**Артефакты:** Threat Model Document

### 3. Secure Coding
На этом этапе код пишется с учётом безопасности.

**Что делаем:**
- Используем secure coding guidelines
- Применяем SAST в IDE (pre-commit)
- Используем безопасные библиотеки и API
- Не используем insecure functions (eval, innerHTML и т.д.)

**Артефакты:** Code с учётом secure coding practices

### 4. Security Testing
На этом этапе код проверяется инструментами и вручную.

**Что делаем:**
- SAST (Semgrep, SonarQube) — в CI/CD
- SCA (Trivy, Snyk) — проверка зависимостей
- DAST (OWASP ZAP, Burp) — на staging
- Manual Code Review
- Penetration Testing (периодически)

**Артефакты:** SAST/DAST reports, Code Review comments

### 5. Security Release
На этом этапе проверяется готовность к релизу.

**Что делаем:**
- Security sign-off
- Проверка security headers
- Проверка конфигураций
- Review инфраструктуры

**Артефакты:** Release checklist, Sign-off

### 6. Maintenance & Incident Response
На этом этапе система поддерживается в безопасном состоянии.

**Что делаем:**
- Vulnerability management (CVE tracking)
- Patch management
- Incident response
- Periodic reassessment

**Артефакты:** Incident reports, Patch logs

## Как внедрить Secure SDLC в существующий процесс

### Вариант 1: "Big Bang" (не рекомендуется)
Внедрить всё и сразу.
Риск: команда саботирует, процесс воспринимается как бюрократия.

### Вариант 2: Incremental (рекомендуется)
Внедрять этап за этапом, начиная с самого критичного.

**План внедрения:**
```
Month 1:   SAST в CI/CD (Semgrep)
Month 2:   SCA для зависимостей
Month 3:   Security Requirements в user stories
Month 4:   Threat Modeling для архитектурных изменений
Month 5:   Security Release Checklist
Month 6:   DAST в staging
```

### Вариант 3: Champion-Driven
Начать с Security Champions в командах и постепенно растить культуру.

## Типичные проблемы

| Проблема | Решение |
|----------|---------|
| "У нас agile, нет времени на безопасность" | Интегрировать safety checks в Definition of Done |
| SAST находит слишком много FP | Настроить правила, исключить тесты и документацию |
| Разработчики игнорируют findings | Сделать security gates, блокирующие релиз |
| Threat Modeling делается формально | Легковесный подход: 30-60 минут на фичу |
| Нет buy-in от менеджмента | Показать метрики: сколько уязвимостей найдено на каждом этапе |

## Ключевые тезисы

- Secure SDLC — это процесс, а не инструмент
- Безопасность должна быть интегрирована, а не добавлена в конце
- Лучше внедрять incremental, чем "big bang"
- SAST без процесса — просто шум
- Threat Modeling — самый эффективный этап Secure SDLC
- Security Champions — ключ к масштабированию безопасности
