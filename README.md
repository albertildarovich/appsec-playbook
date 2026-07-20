# AppSec Playbook

> 🧠 Живая база знаний AppSec инженера. Playbook + Second Brain + Wiki + Interview Prep.

---

## Концепция

Этот репозиторий — **живой инженерный инструмент**, объединяющий:

| Слой | Роль | Как работает |
|------|------|-------------|
| **Knowledge** | Вики | Теория: как работают уязвимости, протоколы, технологии |
| **Engineering** | Плейбук | Практика: как я провожу review, какие решения принимаю |
| **Experience** | Портфолио | Опыт: лабораторные, проекты, инциденты, lessons learned |
| **Career** | Трекер | Рост: roadmap, подготовка к собеседованиям, книги |
| **Security Thinking** | Мозг | Мышление: ментальные модели, trade-offs, анализ |

Каждая техническая тема строится по формату:

```
Теория → Как разработчик может ошибиться → Как AppSec обнаружит → Как исправить → Как предотвратить → Практика → Lessons Learned
```

---

## Структура по слоям

```
📚 Knowledge/                   — "Как это работает?"
├── fundamentals/               — Security Principles, Interpreters, NIST CSF
├── secure-sdlc/                — SDLC, BSIMM, SAMM, SSDF, Security Champions
├── threat-modeling/            — STRIDE, DFD, Attack Trees
├── web-security/               — SQLi, XSS, CSRF, SSRF, XXE, Command Injection
├── api-security/               — REST, GraphQL, BOLA, API Security Top 10
├── authentication/             — JWT, OAuth 2.0, OIDC, MFA
├── authorization/              — RBAC, ABAC, IDOR, BOLA, Privilege Escalation
├── cryptography/               — AES, RSA, ECC, Hashing, TLS
├── devsecops/                  — SAST, DAST, SCA, Secret Scanning
├── kubernetes/                 — RBAC, Pod Security, Network Policies
├── linux/                      — Commands, systemd, auditd
├── cloud/                      — AWS Security, IAM
├── cheatsheets/                — Быстрые справки по всем уязвимостям
├── owasp-top10/                — Единый хаб по всем категориям A01–A10
└── tools/                      — Burp, Semgrep, Trivy workflow

🛠️ Engineering/                 — "Как я работаю?"
├── architecture-reviews/       — Шаблоны security review для типовых компонентов
├── architecture-patterns/      — Паттерны: Auth, Secrets, Encryption, API
├── threat-models/              — Готовые Threat Models для типовых систем
├── code-reviews/               — Разборы Code Review с примерами
├── security-reviews/           — Полные security review (методология + примеры)
├── adr/                        — Архитектурные решения и компромиссы
├── playbooks/                  — Пошаговые сценарии (Security Review, Release, IR)
├── security-decisions/         — Инженерные trade-offs (Fail Open vs Closed и т.д.)
├── patterns/                   — Повторяемые безопасные решения
└── checklists/                 — Быстрые чек-листы для ежедневной работы

🎯 Experience/                  — "Что я сделал?"
├── labs/                       — PortSwigger, Juice Shop, DVWA, HTB
├── writeups/                   — Разбор лабораторных и CVE
├── incidents/                  — Реальные инциденты и postmortems
├── mini-projects/              — Chrome/VSCode Security Auditor, vulnerable-api
├── case-studies/               — CVE Analysis, Bug Bounty, Postmortems
├── lessons-learned/            — Выводы из каждого проекта и инцидента
└── bug-bounty/                 — Находки, методология, подходы

🚀 Career/                      — "Куда я расту?"
├── roadmap/                    — Трекер прогресса и целей
├── interview/                  — Подготовка к собеседованиям по AppSec
├── books/                      — Книги с заметками и выводами
├── courses/                    — Пройденные курсы
├── certificates/               — Сертификаты и подготовка
├── cv/                         — Резюме и сопроводительные
├── behavioral/                 — STAR, конфликты, работа с командами
└── system-design/              — Security в архитектуре

🧠 Security Thinking/           — "Как я думаю?"
├── mental-models/              — Фреймворки мышления (Interpreters, Attack Surface)
├── risk-assessment/            — CVE vs Risk, контекст, reachability
├── trade-offs/                 — Инженерные компромиссы (JWT vs Session и т.д.)
├── decision-framework/         — Алгоритмы принятия решений
├── architecture-thinking/      — Abuse Cases, Never Trust the Client
├── security-smells/            — Паттерны, которые должны настораживать
├── lessons-learned/            — Что пошло не так и почему
├── analysis/                   — Анализ и рефлексия по конкретным темам
└── anti-patterns/              — Что НЕ надо делать
```

> **💡 Навигация:** Все старые пути (01-fundamentals, 04-web-security, 21-adr, 22-security-thinking и т.д.) продолжают работать. Новая структура — это логическая группировка, а не замена существующих файлов.

---

## Формат каждой темы

Каждый конспект строится по принципу **инженерного документа**:

```
1. Теория — что это, как работает
2. Почему разработчики допускают эту ошибку
3. Как это выглядит в коде (уязвимый пример)
4. Как найти на Code Review
5. Как найти с помощью SAST/DAST
6. Threat Modeling — как это может быть атаковано
7. Возможные последствия
8. Защита — безопасные паттерны
9. Типичные ошибки при защите
10. Интервью-вопросы
11. Практика
12. Lessons Learned
```

---

## 📈 Прогресс

```
OWASP Top 10:          ████████████████████ 85% (11/13)
Web Security:          ████████████████████ 80%
Authentication:        ██████████████░░░░░░ 70%
Authorization:         ██████████░░░░░░░░░░ 50%
Secure SDLC:           ████████░░░░░░░░░░░░ 40%
Cryptography:          ████████░░░░░░░░░░░░ 40%
DevSecOps:             ██████░░░░░░░░░░░░░░ 30%
Career / Interview:    ████████░░░░░░░░░░░░ 30%
Architecture Reviews:  ░░░░░░░░░░░░░░░░░░░░  0%
Security Thinking:     ████████░░░░░░░░░░░░ 40%
```

[Подробный трекер →](00-roadmap/README.md)

---

## Легенда

| Слой | Назначение | Примеры |
|------|-----------|---------|
| 📚 Knowledge | Теория и справочная информация | "Как работает SQL Injection" |
| 🛠️ Engineering | Практические сценарии и шаблоны | "Как провести Security Review" |
| 🎯 Experience | Выполненные работы и опыт | "Как я взломал Juice Shop" |
| 🚀 Career | Развитие и подготовка | "Ответы на вопросы интервью" |
| 🧠 Security Thinking | Мышление и анализ | "Почему BAC сложнее XSS" |

---

## Связанные стандарты и фреймворки

| Стандарт | Как используется |
|----------|-----------------|
| **OWASP Top 10 (2021)** | Основной referer для Knowledge/ |
| **OWASP ASVS** | Чек-листы и security requirements |
| **NIST SSDF (SP 800-218)** | SDLC compliance |
| **BSIMM** | Benchmarking AppSec программы |
| **OWASP SAMM** | Maturity roadmap |
| **STRIDE (Microsoft)** | Threat Modeling методология |
| **OWASP API Security Top 10** | API Security coverage |
| **CWE / CVE** | База уязвимостей |

> ⚡ **Принцип:** репозиторий растёт эволюционно. Ничего не удаляется — только добавляется и реорганизуется. Новые разделы создаются, когда появляется потребность.
