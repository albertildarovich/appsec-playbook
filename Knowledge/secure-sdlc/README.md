# Secure SDLC & Governance

> Раздел про организационную часть AppSec: процессы, модели зрелости, метрики и Security Champions.

---

## Содержание

| # | Документ | Описание |
|---|----------|----------|
| 01 | [Secure SDLC](01-secure-sdlc.md) | Процесс безопасной разработки: этапы, внедрение, проблемы |
| 02 | [BSIMM](02-bsimm.md) | Building Security In Maturity Model — benchmark |
| 03 | [OWASP SAMM](03-owasp-samm.md) | Software Assurance Maturity Model — roadmap |
| 04 | [NIST SSDF](04-nist-ssdf.md) | Secure Software Development Framework — compliance |
| 05 | [Security Champions](05-security-champions.md) | Программа Security Champions: как выбрать, обучить, удержать |
| 06 | [Security Requirements](06-security-requirements.md) | Формулирование и интеграция security requirements |
| 07 | [Secure Coding Guidelines](07-secure-coding-guidelines.md) | Язык-специфичные правила безопасного кодирования |
| 08 | [Security Gates](08-security-gates.md) | Контрольные точки в CI/CD pipeline |
| 09 | [Security Metrics](09-security-metrics.md) | Метрики и KPI для AppSec программы |
| 10 | [AppSec Maturity](10-appsec-maturity.md) | Оценка зрелости и roadmap развития |

---

## Как связаны эти документы

```
01. Secure SDLC ─── описание процесса
       │
       ├── 02. BSIMM ─── "как у других?" (benchmark)
       ├── 03. SAMM  ─── "что делать?" (roadmap)
       └── 04. SSDF  ─── "что обязательно?" (compliance)
       
05. Security Champions ─── кто помогает
06. Security Requirements ─── что нужно системе
07. Secure Coding ─── как писать код
08. Security Gates ─── где проверяем
09. Security Metrics ─── как измеряем
10. AppSec Maturity ─── где мы сейчас
```

---

## Модели зрелости: как выбрать

| Если нужно... | Используй |
|---------------|-----------|
| Сравнить с индустрией | **BSIMM** |
| Построить план улучшений | **SAMM** |
| Обеспечить compliance (US gov) | **SSDF** |
| Получить сертификат (ISO 27001) | **ISO 27k** |
| Начать с нуля | **SSDF** как baseline |

---

## Roadmap внедрения

```
Phase 1: Foundation (Months 1-3)
  - SAST в CI/CD
  - Security training для разработчиков
  - Secure coding guidelines

Phase 2: Process (Months 4-6)
  - Security Champions
  - Security Requirements в user stories
  - Базовые Security Gates

Phase 3: Metrics (Months 7-9)
  - Сбор метрик
  - Dashboard
  - Регулярная отчетность

Phase 4: Optimization (Months 10-12)
  - SAMM assessment
  - BSIMM benchmark
  - Continuous improvement
```

---

## Связанные стандарты

- **BSIMM**: Benchmarking
- **OWASP SAMM**: Maturity model
- **NIST SSDF (SP 800-218)**: Secure development framework
- **NIST CSF**: Cybersecurity framework
- **ISO 27001**: ISMS standard
- **PCI DSS**: Payment card industry
- **OWASP ASVS**: Verification standard
- **ГОСТ Р 56939-2024**: Безопасная разработка ПО (российский стандарт, 8 разделов требований)

**Практика по ГОСТ Р 56939-2024:** [module-24-gost-56939](../../Experience/labs/juice-shop/module-24-gost-56939/report.md) — gap analysis на Juice Shop: 20 уязвимостей сопоставлены с разделами стандарта.
