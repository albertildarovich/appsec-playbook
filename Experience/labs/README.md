# Labs

Практические лабораторные для отработки навыков AppSec.

## Содержание

| Лабораторная | Тема | Статус |
|--------------|------|--------|
| [SAST Pipeline](./sast-pipeline/) | GitLab CI + Semgrep/SonarQube, отчёт по CWE, triage FP/TP | [x] |
| [SCA Pipeline](./sca-pipeline/) | Trivy + Dependency-Check, SBOM CycloneDX, CVE-разбор | [x] |
| [DAST: OWASP ZAP](./dast-zap/) | Baseline scan, vulnerable-app, отчёт по OWASP Top 10 | [x] |
| [Secure Code Review](./secure-code-review/) | 5 кейсов уязвимого кода: SQLi, Mass Assignment, Secrets, IDOR, SSRF | [x] |
| [Threat Modeling](./threat-modeling/) | STRIDE-анализ интернет-магазина, security requirements, mitigation plan | [x] |
| [Mobile Security](./mobile-security/) | OWASP Mobile Top 10: insecure storage, insecure communication, weak auth | [x] |
| [Jenkins DevSecOps](./jenkins-devsecops/) | Jenkins pipeline: SAST/SCA/DAST stages, публикация отчётов | [x] |
| [OWASP Juice Shop](./juice-shop/) | Все категории уязвимостей, speedrun, ГОСТ Р 56939-2024 | [x] |

## План

- [x] OWASP Juice Shop
- [x] SAST Pipeline
- [x] SCA Pipeline
- [x] DAST: OWASP ZAP
- [x] Secure Code Review
- [x] Threat Modeling
- [x] Mobile Security
- [x] Jenkins DevSecOps
- [ ] PortSwigger Web Security Academy (SQLi, XSS, CSRF, SSRF, XXE, Auth, Access Control)
- [ ] DVWA
- [ ] Hack The Box

## Структура лабораторной

Каждая лабораторная содержит:

- Цель и контекст (архитектура, стек, инструменты).
- Пошаговый план выполнения.
- Примеры уязвимого кода и исправлений.
- Отчёт/выводы с маппингом на OWASP Top 10, CWE или STRIDE.
- Связанные материалы из Knowledge/.

## Формат отчёта

Для каждой лабораторной заполняется отчёт по шаблону:

```
Цель:
  Что отрабатываем и зачем.

Сценарий:
  Шаги выполнения, инструменты, конфигурация.

Находки:
  Тип уязвимости, CWE/OWASP, риск, FP/TP.

Выводы:
  Что узнал, как применять в реальной работе.

Связанные материалы:
  Ссылки на Knowledge/, Engineering/, другие лабы.