# NIST SSDF (Secure Software Development Framework)

## Определение

NIST SSDF (SP 800-218) — это фреймворк безопасной разработки ПО от Национального института стандартов и технологий США.

- **Recommendations**: рекомендации, а не обязательные требования
- **Practices-based**: описывает практики, а не процессы
- **Compliance-friendly**: используется для FedRAMP, EO 14028

## Структура SSDF

SSDF состоит из **4 групп** и **19 практик**:

### 1. Prepare (Подготовка)

| ID | Практика | Ключевые действия |
|----|----------|-------------------|
| PO.1 | Define security requirements | Определить требования безопасности для ПО |
| PO.2 | Implement secure coding practices | Внедрить стандарты безопасного кодирования |
| PO.3 | Configure toolchain securely | Настроить инструменты сборки безопасно |
| PO.4 | Implement secure software management | Управление конфигурациями и зависимостями |

### 2. Protect (Защита)

| ID | Практика | Ключевые действия |
|----|----------|-------------------|
| PS.1 | Protect all forms of code | Защита исходного кода |
| PS.2 | Protect build pipeline | Защита CI/CD |
| PS.3 | Protect developer environments | Защита рабочих станций |
| PS.4 | Protect software artifacts | Подпись и проверка артефактов |

### 3. Produce (Производство)

| ID | Практика | Ключевые действия |
|----|----------|-------------------|
| PW.1 | Perform code reviews | Code review, SAST |
| PW.2 | Perform vulnerability testing | DAST, SCA, Penetration Test |
| PW.3 | Identify and track vulnerabilities | Трекинг уязвимостей |
| PW.4 | Verify third-party software | Проверка зависимостей |
| PW.5 | Validate software integrity | Проверка целостности |

### 4. Respond (Реагирование)

| ID | Практика | Ключевые действия |
|----|----------|-------------------|
| RV.1 | Identify vulnerabilities | Мониторинг CVE |
| RV.2 | Assess vulnerabilities | Оценка и приоритизация |
| RV.3 | Remediate vulnerabilities | Исправление и патчи |
| RV.4 | Communicate vulnerabilities | Уведомление пользователей |
| RV.5 | Coordinate vulnerability disclosure | Coordinated disclosure |

## SSDF и Execuitive Order 14028

Исполнительный указ Байдена (May 2021) требует:
- Использовать SSDF для всего ПО, поставляемого правительству США
- Self-attestation соответствия SSDF
- Software Bill of Materials (SBOM)

**Ключевые требования EO 14028:**
1. Безопасная разработка по SSDF
2. Публичное раскрытие уязвимостей
3. SBOM для всех компонентов
4. Проверка целостности артефактов

## SSDF vs SAMM vs BSIMM

| Критерий | SSDF | SAMM | BSIMM |
|----------|------|------|-------|
| **Подход** | Recommendations | Prescriptive | Descriptive |
| **Обязательность** | EO 14028 (US gov) | Voluntary | Voluntary |
| **Scope** | Software only | Full security program | Full security program |
| **Гибкость** | Высокая | Средняя | Низкая |
| **SBOM** | ✅ Включён | ❌ | ❌ |
| **CI/CD** | ✅ | SAMM v2 | Ограничен |

## Как внедрить SSDF

### Step 1: Gap Assessment
```
Текущее состояние vs. SSDF Practices
PO.1: ❌ Нет security requirements
PW.1: ✅ Code review есть
PW.2: ❌ Нет DAST
...
```

### Step 2: Prioritize
- Критические: PW.1 (code review), PW.2 (testing), PS.2 (build pipeline)
- Важные: PO.2 (secure coding), RV.3 (remediation)
- Опционально: PO.4 (software management), RV.5 (disclosure)

### Step 3: Implement
```yaml
PO.2: Внедрить Semgrep rules для secure coding
PS.2: Добавить SAST + SCA в CI/CD pipeline
PW.1: Внедрить mandatory code review
PW.2: Добавить DAST в staging pipeline
PW.3: Jira workflow для трекинга уязвимостей
```

### Step 4: Validate
- Self-assessment
- External audit
- Continuous monitoring

## Ключевые тезисы

- NIST SSDF — набор рекомендаций, а не стандарт
- Обязателен для поставщиков ПО правительству США (EO 14028)
- 4 группы, 19 практик
- Включает SBOM и Coordinated Disclosure
- Легко комбинируется с SAMM/BSIMM
- Хорошая отправная точка для построения Secure SDLC "с нуля"
