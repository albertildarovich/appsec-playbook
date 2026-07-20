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
| [Labs](./labs/) | Лабораторные: PortSwigger, Juice Shop, DVWA, HTB | ❌ |
| [Writeups](./writeups/) | Разбор лабораторных и CVE | ❌ |
| [Real Incidents](./incidents/) | Реальные инциденты и postmortems | ❌ |
| [Mini Projects](./mini-projects/) | Практические проекты: расширения, инструменты, демо | ✅ |
| [Case Studies](./case-studies/) | CVE Analysis, Bug Bounty, Postmortems | ❌ |
| [Lessons Learned](./lessons-learned/) | Выводы из реальных проектов | ❌ |
| [Bug Bounty](./bug-bounty/) | Находки, методология, подходы | ❌ |

---

## Labs

Практические лабораторные для отработки навыков:

```
PortSwigger Web Security Academy
  - SQL Injection (все lab)
  - XSS (все lab)
  - CSRF
  - SSRF
  - XXE
  - Authentication
  - Access Control

OWASP Juice Shop
  - Все категории уязвимостей
  - Speedrun challenge

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
| [Chrome Security Auditor](./mini-projects/chrome-security-auditor/) | Расширение для аудита безопасности страниц | ✅ |
| [VSCode Security Auditor](./mini-projects/vscode-security-auditor/) | Линтер безопасности кода | ✅ |
| vulnerable-api | Умышленно уязвимое API | ❌ |
| secure-api | Защищённая версия API | ❌ |
| jwt-demo | Атаки на JWT + защита | ❌ |
| oauth-demo | OAuth 2.0 + PKCE реализация | ❌ |

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

> ⚡ **Принцип:** опыт без записи — теряется. Каждый lab, каждый инцидент, каждый проект должен оставить след в этом разделе. Даже 3 строки lessons learned лучше, чем ничего.
