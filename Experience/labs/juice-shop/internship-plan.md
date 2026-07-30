#  Juice Shop

> **Формат:** 22 модуля, 5 фаз
> **Цель:** Аудит веб-приложений

---

## Прогресс

```
Фаза 1: Recon & Architecture    [██████████] 100%  — Модули 1-3 готовы
Фаза 2: Threat Modeling          [██████████] 100%  — Модуль 4 готов
Фаза 3: Security Testing         [██████████] 100%  — Модули 5-16 готовы
Фаза 4: DevSecOps & Automation   [████░░░░░░]  17%  — Модули 15-17 готовы
Фаза 5: Reporting & Architecture [░░░░░░░░░░]   0%
─────────────────────────────────────────────
Total:                            [███████░░░]  74%
```

---

# Фаза 1: Recon & Architecture

> Цель: Научиться быстро понимать архитектуру незнакомого приложения

## Модуль 1 — Recon и знакомство с системой

**Цель:** Исследовать все страницы, построить карту приложения

**Что уже сделано:**
- [OK] Нашли через curl: `/api/Users`, `/rest/products/search`, `/ftp/`, `/api-docs`, `/rest/user/login`
- [OK] Определили роли: Anonymous, Customer, Admin, Deluxe Customer (из JWT)
- [OK] Нашли админ-панель: `/administration`
- [OK] Нашли Swagger: `/api-docs`
- [OK] Базовая карта эндпоинтов
- [OK] Прошлись по всем страницам в браузере (UI)
- [OK] Составили mindmap приложения (все страницы и связи)
- [OK] Заполнили таблицу эндпоинтов в `module-01-recon/report.md`

- [x] Пройтись по всем страницам в браузере (UI)
- [x] Составить mindmap приложения (все страницы и связи)
- [x] Заполнить таблицу эндпоинтов в `module-01-recon/report.md`

**Результат:** [OK] `module-01-recon/report.md` — карта приложения

## Модуль 2 — Assets

**Цель:** Определить все активы и их критичность

**Что уже сделано:**
- [OK] Составили список активов: User data, JWT, Basket/Orders, Products, Admin panel
- [OK] Оценили критичность: High / Medium / Low
- [OK] Нашли через практику: утечка всех пользователей через `/api/Users`, JWT `alg:none`
- [OK] Заполнили CIA для каждого актива (Confidentiality, Integrity, Availability)
- [OK] Оформили таблицу в `module-02-assets/report.md`

- [x] Для каждого актива дозаполнить CIA (Confidentiality, Integrity, Availability)
- [x] Оформить таблицу в `module-02-assets/report.md`

**Результат:** [OK] `module-02-assets/report.md` — таблица активов с CIA (самостоятельно)

## Модуль 3 — Trust Boundaries

**Цель:** Найти границы доверия и построить DFD

**Что уже сделано:**
- [OK] Определили External Entities (Пользователь, Админ, Платёжка, LLM)
- [OK] Определили Processes (11 процессов Juice Shop)
- [OK] Определили Data Stores (SQLite, File System)
- [OK] Нарисовали DFD с 3 Trust Boundaries
- [OK] Описали, где и почему меняется уровень доверия

- [x] Нарисовать Data Flow Diagram (DFD)
- [x] Отметить External Entities
- [x] Отметить Processes
- [x] Отметить Data Stores
- [x] Выделить Trust Boundaries
- [x] Описать, где меняется уровень доверия

**Результат:** [OK] `module-03-boundaries/report.md` — DFD + Trust Boundaries

# Фаза 2: Threat Modeling

## Модуль 4 — STRIDE

**Цель:** Провести полноценный Threat Modeling

**Что уже сделано:**
- [OK] **Spoofing:** JWT `alg:none` — проверили на практике [OK]
- [OK] **Tampering:** Mass Assignment (role + deluxeToken) — проверили [OK]
- [OK] **Tampering:** SQL Injection — проверили [OK]
- [OK] **Information Disclosure:** /ftp/ открыт, утечка пользователей через `/api/Users` [OK]
- [OK] **Elevation of Privilege:** Mass Assignment → admin, админка без RBAC [OK]
- [OK] **Repudiation:** проверили failed login — логов нет [OK]
- [OK] **Denial of Service:** проверили rate limiting — отсутствует [OK]
- [OK] DFD + Trust Boundaries нарисованы
- [OK] 11 угроз идентифицированы (7 Critical, 2 High, 2 Medium)
- [OK] Оформили отчёт в `module-04-threat-model/report.md`

**Результат:** [OK] `module-04-threat-model/report.md` — полный STRIDE-анализ (7 Critical, 2 High, 2 Medium)

---

# Фаза 3: Security Testing

## Модуль 5 — Authentication

**Цель:** Проверить механизмы аутентификации

**Что уже сделано:**
- [OK] Регистрация — Mass Assignment (role→admin), [NO] нет верификации email, [NO] нет капчи
- [OK] Логин — [NO] нет rate limiting, [NO] нет блокировки аккаунта
- [OK] Logout — [NO] JWT не инвалидируется (токен живёт вечно)
- [OK] Смена пароля — нет UI для смены
- [OK] Reset password — UI есть, но не работает (нет email-провайдера)
- [OK] MFA — отсутствует (totpSecret есть в JWT, но не используется)

- [x] Регистрация — можно ли создать пользователя с особыми правами?
- [x] Логин — есть ли bruteforce защита?
- [x] Logout — действительно ли завершает сессию?
- [x] Смена пароля — требуется ли старый пароль?
- [x] Reset password — насколько безопасен механизм?
- [x] MFA — есть ли, можно ли обойти?

**Результат:** [OK] `module-05-auth/report.md`

## Модуль 6 — Authorization

**Цель:** Проверить все механизмы авторизации

**Что уже сделано:**
- [OK] Mass Assignment: role (создали админа)
- [OK] Mass Assignment: deluxeToken (подделали премиум)

- [x] RBAC — проверка ролей на каждом endpoint
- [x] BOLA — Broken Object Level Authorization
- [x] BFLA — Broken Function Level Authorization
- [x] IDOR — подмена ID в запросах (чужая корзина по ID)

**Результат:** [OK] `module-06-authorization/report.md`

## Модуль 7 — JWT

**Цель:** Полностью разобрать и протестировать JWT

**Что уже сделано:**
- [OK] Декодировали JWT, изучили payload (role, deluxeToken, bid, iat)
- [OK] Проверили alg:none — **подтвердили уязвимость** [OK]
- [OK] Увидели, что JWT хранится в `authentication.token` (localStorage)

- [x] Проверить TTL / Exp
- [x] Проверить Refresh механизм
- [x] Проверить Aud, Iss, Scope

**Результат:** [OK] `module-07-jwt/report.md`

## Модуль 9 — OWASP Top 10

**Цель:** Проверить каждую категорию OWASP Top 10

**Что уже сделано:**
- [OK] A01: Broken Access Control (Mass Assignment, админка без RBAC)
- [OK] A03: Injection (SQL Injection — подтвердили)
- [OK] A05: Security Misconfiguration (/ftp/ открыт, JWT alg:none)

- [x] A02: Cryptographic Failures
- [x] A04: Insecure Design
- [x] A06: Vulnerable Components
- [x] A07: Identification & Auth Failures
- [x] A08: Software & Data Integrity
- [x] A09: Security Logging & Monitoring
- [x] A10: SSRF

**Результат:** [OK] `module-09-owasp-top10/report.md` — 6 Critical, 2 High, 2 Medium

## Модуль 8 — OWASP API Top 10

**Цель:** Проверить каждую категорию API Top 10

- [x] API1: Broken Object Level Authorization
- [x] API2: Broken Authentication
- [x] API3: Broken Object Property Level Authorization (Mass Assignment)
- [x] API4: Unrestricted Resource Consumption
- [x] API5: Broken Function Level Authorization
- [x] API6: Unrestricted Access to Sensitive Business Flows
- [x] API7: SSRF (частично)
- [x] API8: Security Misconfiguration
- [x] API9: Improper Inventory Management
- [x] API10: Unsafe Consumption of APIs

**Результат:** [OK] `module-08-api-top10/report.md` — 5 Critical, 3 High, 2 Medium

## Модуль 10 — Business Logic

**Цель:** Найти уязвимости бизнес-логики

- [x] Можно ли купить товар бесплатно? — [WARN] Цена защищена
- [x] Можно ли изменить цену в корзине? — [WARN] Цена защищена
- [x] Можно ли использовать купон дважды? — [MED] API недоступен
- [x] Можно ли оформить миллион заказов? — [MED] Ограничение 5 шт/товар
- [x] Можно ли создать миллион аккаунтов? — [NO] Нет капчи/rate limiting
- [x] Можно ли получить скидку без прав? — [NO] deluxeToken проверяется сервером

**Результат:** [OK] `module-10-business-logic/report.md`

## Модуль 11 — Anti-Fraud

**Цель:** Подумать как защитник, а не как атакующий

- [x] Какие фрод-сценарии возможны в Juice Shop?
- [x] Какие проверки нужно добавить?
- [x] Написать рекомендации по anti-fraud

**Результат:** [OK] `module-11-anti-fraud/report.md`

## Модуль 12 — Burp Suite

**Цель:** Освоить базовые и продвинутые функции Burp

- [x] Proxy — перехват и модификация запросов
- [x] Repeater — повторная отправка запросов
- [x] Intruder — автоматизированный перебор
- [x] Decoder — кодирование/декодирование
- [x] Comparer — сравнение ответов
- [x] Logger — анализ всех запросов

**Результат:** [OK] `module-12-burp/report.md`

## Модуль 13 — Nuclei (DAST)

**Цель:** Научиться запускать DAST-сканирование через Nuclei, писать custom templates

**Что уже сделано:**
- [OK] Установлен Nuclei (3.4.9)
- [OK] Запущен cloud-шаблон (nuclei -t cloud) — 15 находок
- [OK] Prometheus /metrics (Medium), Swagger /api-docs (Medium), Full Path Disclosure (Medium)
- [OK] Написан свой шаблон для /ftp/ (ftp-exposure.yaml)
- [OK] Сравнение с Burp и ZAP

- [x] Установить Nuclei
- [x] Запустить стандартные cloud-шаблоны
- [x] Проанализировать результаты
- [x] Написать свой шаблон (/ftp/ exposure)
- [x] Сравнить с Burp Suite

**Результат:** [OK] `module-13-nuclei/report.md`

## Модуль 14 — ZAP (Zed Attack Proxy)

**Цель:** Сравнить ZAP (DAST) с Nuclei, понять разницу в подходах

- [x] [OK] Установить ZAP (native Mac, через brew cask)
- [x] [OK] Установить Java 17 (требуется для ZAP)
- [x] [OK] Запустить ZAP в daemon-режиме
- [x] [OK] Запустить spider + active scan на Juice Shop
- [x] [OK] Проанализировать результаты (63 алерта)
- [x] [OK] Сравнить с Nuclei

**Результат:** [OK] `module-14-zap/report.md`

---

# Фаза 4: DevSecOps & Automation

## Модуль 15 — Semgrep

**Цель:** Научиться писать свои SAST-правила

**Что уже сделано:**
- [OK] Semgrep установлен (1.168.0)
- [OK] Запущены стандартные правила (p/default) — 71 finding
- [OK] Найдены: SQLi (6), hardcoded JWT secret, eval(), open redirect
- [OK] Сравнение SAST vs DAST (Semgrep vs ZAP/Nuclei)
- [OK] Написано своё правило для Mass Assignment (`rules/mass-assignment.yaml`)
- [OK] Написано своё правило для SQLi (`rules/sqli-concat.yaml`)

- [x] Установить Semgrep
- [x] Запустить стандартные правила
- [x] Проанализировать результаты
- [x] Написать своё правило для поиска Mass Assignment
- [x] Написать своё правило для поиска SQLi

**Результат:** [OK] `module-15-semgrep/report.md`

## Модуль 16 — Security Review

**Цель:** Провести ручной обзор кода

**Что уже сделано:**
- [OK] Прочитаны файлы аутентификации (routes/login.ts, lib/insecurity.ts, models/user.ts)
- [OK] Прочитаны файлы корзины/заказов (routes/basket.ts, routes/order.ts)
- [OK] Прочитаны файлы search.ts, redirect.ts, currentUser.ts
- [OK] Найдено 20 уязвимостей (4 Critical, 5 High, 11 Medium)
- [OK] Сравнение SAST vs DAST vs Manual Review
- [OK] Ключевые находки: SQLi (2), hardcoded RSA key, eval(), MD5 passwords, coupon forgery, negative order
- [OK] Приоритизация исправлений (P0-P3)

- [x] Открыть исходники Juice Shop (GitHub)
- [x] Прочитать файл аутентификации
- [x] Прочитать файл корзины/заказов
- [x] Найти плохие практики
- [x] Задокументировать findings (20 finding, 4 Critical, 5 High, 11 Medium)

**Результат:** [OK] `module-16-security-review/report.md`

## Модуль 17 — SSDLC

**Цель:** Встроить безопасность в процесс разработки

**Что уже сделано:**
- [OK] Описан pipeline безопасности (SAST → SCA → DAST → Sign-off)
- [OK] Определены проверки в PR (4 gates: secrets, SAST, SCA, tests)
- [OK] Определены gates перед деплоем (L1-L4)
- [OK] Написаны Security Requirements (25 требований)
- [OK] Практика с `act` — запущен GitHub Actions pipeline локально:
  - **L1 (pre-commit):** Нашёл RSA private key в `lib/insecurity.ts` [OK]
  - **L2 (SAST):** Нашёл SQLi (3 файла: loginAdminChallenge, loginJimChallenge, dbSchema) [OK]
  - **L3 (SCA):** Проверил зависимости — jsonwebtoken OK [OK]
  - **L4 (DAST):** Проверен план DAST-сканирования [OK]
- [OK] Практика с `gitlab-ci-local@4.35.0` — запущен GitLab CI pipeline локально:
  - **L1 (pre-commit):** Нашёл RSA private key — блокирован [OK]
  - **L2 (SAST):** Нашёл `eval()` в `/routes/captcha.ts` и `/routes/userProfile.ts` — блокирован [OK]
  - **L3-L5 (SCA/DAST/Sign-off):** Заблокированы из-за L2 [OK]
- [OK] Сравнение GitHub Actions vs GitLab CI (синтаксис, скорость, плюсы/минусы)
- [OK] `.gitlab-ci.yml` сохранён в module-17-ssdlc/

- [x] Описать pipeline безопасности для Juice Shop
- [x] Какие проверки добавить в PR?
- [x] Какие gates поставить перед деплоем?
- [x] Написать Security Requirements
- [x] Запустить pipeline через act (GitHub Actions)
- [x] Запустить pipeline через gitlab-ci-local (GitLab CI)
- [x] Сравнить оба инструмента

**Результат:** [OK] `module-17-ssdlc/report.md`

## Модуль 18 — Docker

**Цель:** Проанализировать безопасность Docker-контейнера

- [ ] ⏳ Изучить Dockerfile Juice Shop
- [ ] ⏳ Проверить права в контейнере
- [ ] ⏳ Проверить секреты в образе
- [ ] ⏳ Написать рекомендации по hardening

**Результат:** `module-18-docker/report.md`

## Модуль 19 — Kubernetes

**Цель:** Представить Juice Shop в K8s и найти проблемы

- [ ] ⏳ Какие K8s resources нужны?
- [ ] ⏳ Network Policies
- [ ] ⏳ Pod Security
- [ ] ⏳ Secrets Management

**Результат:** `module-19-kubernetes/report.md`

## Модуль 20 — Monitoring

**Цель:** Определить, какие события нужно логировать

- [ ] ⏳ Список событий для аудита
- [ ] ⏳ login / logout / failed login
- [ ] ⏳ reset password
- [ ] ⏳ privilege escalation
- [ ] ⏳ admin actions
- [ ] ⏳ coupon abuse
- [ ] ⏳ mass assignment attempts

**Результат:** `module-20-monitoring/report.md`

---

# Фаза 5: Reporting & Architecture

## Модуль 21 — Отчёт

**Цель:** Оформить настоящий Pentest Report

- [ ] ⏳ Executive Summary
- [ ] ⏳ Scope & Methodology
- [ ] ⏳ Each finding: Title, CWE, OWASP, Risk, Impact, PoC, Recommendation
- [ ] ⏳ Risk Matrix
- [ ] ⏳ Приоритеты исправления

**Результат:** `module-21-report/pentest-report.md`

## Модуль 22 — Архитектурные улучшения

**Цель:** Предложить архитектурные изменения для предотвращения уязвимостей

- [ ] ⏳ Не просто "исправить XSS", а "изменить архитектуру, чтобы XSS не появился"
- [ ] ⏳ Security design review
- [ ] ⏳ Рекомендации по изоляции компонентов
- [ ] ⏳ Threat model v2 (после исправлений)

**Результат:** `module-22-architecture/report.md`

## Модуль 23 — Финальный экзамен

**Цель:** Провести аудит нового приложения без подсказок

- [ ] ⏳ Получить новое приложение (vulnerable-by-design)
- [ ] ⏳ Самостоятельно провести полный аудит
- [ ] ⏳ Оформить отчёт
- [ ] ⏳ Защитить результаты

**Результат:** `module-23-exam/report.md`

---

## [OK] Легенда статусов

| Статус | Значение |
|--------|----------|
| ⏳ | Не начато |
| 🔄 | В работе |
|  | На ревью у Senior |
| [OK] | Зачтено |

---

##  Структура папок

```
Experience/labs/juice-shop/
├── README.md                    # Описание лабы
├── internship-plan.md           # ← этот файл (трекер)
├── threat-model.md              # Threat model (начатая)
├── module-01-recon/
│   └── report.md                # Твой отчёт по модулю 1
├── module-02-assets/
│   └── report.md
├── ... и т.д.
└── module-22-exam/
    └── report.md