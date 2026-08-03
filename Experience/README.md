# Experience

> Всё, что отвечает на вопрос **"Что я сделал и чему научился?"**

Этот слой — практический опыт. Лабораторные, write-ups, реальные инциденты, мини-проекты и lessons learned. То, что превращает теорию в навыки.

```
Knowledge → Engineering → Experience
  (знаю)      (делаю)       (понимаю)
```

---

## Содержание

| Раздел | Описание | Статус |
|--------|----------|--------|
| [Labs](./labs/) | Лабораторные: DevSecOps (SAST/SCA/DAST), Threat Modeling, Mobile Security, Juice Shop | [OK] |
| [Writeups](./writeups/) | Разбор лабораторных и CVE | [NO] |
| [Real Incidents](./incidents/) | Реальные инциденты и postmortems | [NO] |
| [Mini Projects](./mini-projects/) | Практические проекты: расширения, инструменты, демо | [OK] |
| [Case Studies](./case-studies/) | CVE Analysis, Bug Bounty, Postmortems | [NO] |
| [Lessons Learned](./lessons-learned/) | Выводы из реальных проектов | [NO] |
| [Bug Bounty](./bug-bounty/) | Находки, методология, подходы | [NO] |

---

## Labs

Практические лабораторные для отработки навыков:

```
DevSecOps
  - SAST Pipeline (Semgrep + SonarQube, triage FP/TP)
  - SCA Pipeline (Trivy + Dependency-Check, SBOM CycloneDX)
  - DAST: OWASP ZAP (baseline scan)
  - Jenkins DevSecOps (CI/CD pipeline с security gates)

Secure Code Review
  - SQLi, Mass Assignment, Hardcoded Secrets, IDOR/BOLA, SSRF

Threat Modeling
  - STRIDE-анализ, security requirements, mitigation plan

Mobile Security
  - OWASP Mobile Top 10: insecure storage, insecure communication, weak auth

OWASP Juice Shop
  - Все категории уязвимостей
  - Speedrun challenge
  - ГОСТ Р 56939-2024 (практика: gap analysis 20 уязвимостей по разделам стандарта)

PortSwigger Web Security Academy
  - SQL Injection (все lab)
  - XSS (все lab)
  - CSRF
  - SSRF
  - XXE
  - Authentication
  - Access Control

DVWA / WebGOAT
  - Базовые уязвимости

HTB / PentesterLab
  - Продвинутые сценарии
```

Каждый lab содержит:
- Цель
- Walkthrough
- Что я узнал
- Как это применить в реальной работе

---

## Writeups

Разбор уязвимостей и CVE:

```
Format:
- CVE ID
- Продукт/библиотека
- Root cause
- Exploitation
- Fix
- Detection (как найти в своём проекте)
- Lessons Learned
```

---

## Real Incidents

Реальные инциденты из коммерческой разработки:

```
Format (без sensitive data):
- Контекст
- Как обнаружили
- Timeline
- Root cause
- Impact
- Fix
- Prevention
- Lessons Learned
```

---

## Mini Projects

Практические инструменты и демо:

| Проект | Описание | Статус |
|--------|----------|--------|
| [Chrome Security Auditor](./mini-projects/chrome-security-auditor/) | Расширение для аудита безопасности страниц | [OK] |
| [VSCode Security Auditor](./mini-projects/vscode-security-auditor/) | Линтер безопасности кода | [OK] |
| vulnerable-api | Умышленно уязвимое API | [NO] |
| secure-api | Защищённая версия API | [NO] |
| jwt-demo | Атаки на JWT + защита | [NO] |
| oauth-demo | OAuth 2.0 + PKCE реализация | [NO] |

---

## Lessons Learned

Главные выводы из каждого проекта и инцидента:

```
- Что пошло не так?
- Что сделал бы иначе?
- Какой паттерн/антипаттерн?
- Как предотвратить в следующий раз?
```

---

## Bug Bounty

Методология и находки:

```
- Цели
- Подход
- Найденные уязвимости
- Что не сработало
- Выводы
```

---

>  **Принцип:** опыт без записи — теряется. Каждый lab, каждый инцидент, каждый проект должен оставить след в этом разделе. Даже 3 строки lessons learned лучше, чем ничего.
