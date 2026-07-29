# 🎓 Juice Shop

> **Формат:** 22 модуля, 5 фаз
> **Цель:** Аудит веб-приложений

---

## Прогресс

```
Фаза 1: Recon & Architecture    [██████████] 100%  — Модули 1-3 готовы
Фаза 2: Threat Modeling          [██████████] 100%  — Модуль 4 готов
Фаза 3: Security Testing         [███░░░░░░░]  33%  — Модули 5-7 готовы
Фаза 4: DevSecOps & Automation   [░░░░░░░░░░]   0%
Фаза 5: Reporting & Architecture [░░░░░░░░░░]   0%
─────────────────────────────────────────────
Total:                            [████░░░░░░]  32%
```

---

# Фаза 1: Recon & Architecture

> Цель: Научиться быстро понимать архитектуру незнакомого приложения

## Модуль 1 — Recon и знакомство с системой

**Цель:** Исследовать все страницы, построить карту приложения

**Что уже сделано:**
- ✅ Нашли через curl: `/api/Users`, `/rest/products/search`, `/ftp/`, `/api-docs`, `/rest/user/login`
- ✅ Определили роли: Anonymous, Customer, Admin, Deluxe Customer (из JWT)
- ✅ Нашли админ-панель: `/administration`
- ✅ Нашли Swagger: `/api-docs`
- ✅ Базовая карта эндпоинтов
- ✅ Прошлись по всем страницам в браузере (UI)
- ✅ Составили mindmap приложения (все страницы и связи)
- ✅ Заполнили таблицу эндпоинтов в `module-01-recon/report.md`

- [x] Пройтись по всем страницам в браузере (UI)
- [x] Составить mindmap приложения (все страницы и связи)
- [x] Заполнить таблицу эндпоинтов в `module-01-recon/report.md`

**Результат:** ✅ `module-01-recon/report.md` — карта приложения

## Модуль 2 — Assets

**Цель:** Определить все активы и их критичность

**Что уже сделано:**
- ✅ Составили список активов: User data, JWT, Basket/Orders, Products, Admin panel
- ✅ Оценили критичность: High / Medium / Low
- ✅ Нашли через практику: утечка всех пользователей через `/api/Users`, JWT `alg:none`
- ✅ Заполнили CIA для каждого актива (Confidentiality, Integrity, Availability)
- ✅ Оформили таблицу в `module-02-assets/report.md`

- [x] Для каждого актива дозаполнить CIA (Confidentiality, Integrity, Availability)
- [x] Оформить таблицу в `module-02-assets/report.md`

**Результат:** ✅ `module-02-assets/report.md` — таблица активов с CIA (самостоятельно)

## Модуль 3 — Trust Boundaries

**Цель:** Найти границы доверия и построить DFD

**Что уже сделано:**
- ✅ Определили External Entities (Пользователь, Админ, Платёжка, LLM)
- ✅ Определили Processes (11 процессов Juice Shop)
- ✅ Определили Data Stores (SQLite, File System)
- ✅ Нарисовали DFD с 3 Trust Boundaries
- ✅ Описали, где и почему меняется уровень доверия

- [x] Нарисовать Data Flow Diagram (DFD)
- [x] Отметить External Entities
- [x] Отметить Processes
- [x] Отметить Data Stores
- [x] Выделить Trust Boundaries
- [x] Описать, где меняется уровень доверия

**Результат:** ✅ `module-03-boundaries/report.md` — DFD + Trust Boundaries

# Фаза 2: Threat Modeling

## Модуль 4 — STRIDE

**Цель:** Провести полноценный Threat Modeling

**Что уже сделано:**
- ✅ **Spoofing:** JWT `alg:none` — проверили на практике ✅
- ✅ **Tampering:** Mass Assignment (role + deluxeToken) — проверили ✅
- ✅ **Tampering:** SQL Injection — проверили ✅
- ✅ **Information Disclosure:** /ftp/ открыт, утечка пользователей через `/api/Users` ✅
- ✅ **Elevation of Privilege:** Mass Assignment → admin, админка без RBAC ✅
- ✅ **Repudiation:** проверили failed login — логов нет ✅
- ✅ **Denial of Service:** проверили rate limiting — отсутствует ✅
- ✅ DFD + Trust Boundaries нарисованы
- ✅ 11 угроз идентифицированы (7 Critical, 2 High, 2 Medium)
- ✅ Оформили отчёт в `module-04-threat-model/report.md`

**Результат:** ✅ `module-04-threat-model/report.md` — полный STRIDE-анализ (7 Critical, 2 High, 2 Medium)

---

# Фаза 3: Security Testing

## Модуль 5 — Authentication

**Цель:** Проверить механизмы аутентификации

**Что уже сделано:**
- ✅ Регистрация — Mass Assignment (role→admin), ❌ нет верификации email, ❌ нет капчи
- ✅ Логин — ❌ нет rate limiting, ❌ нет блокировки аккаунта
- ✅ Logout — ❌ JWT не инвалидируется (токен живёт вечно)
- ✅ Смена пароля — нет UI для смены
- ✅ Reset password — UI есть, но не работает (нет email-провайдера)
- ✅ MFA — отсутствует (totpSecret есть в JWT, но не используется)

- [x] Регистрация — можно ли создать пользователя с особыми правами?
- [x] Логин — есть ли bruteforce защита?
- [x] Logout — действительно ли завершает сессию?
- [x] Смена пароля — требуется ли старый пароль?
- [x] Reset password — насколько безопасен механизм?
- [x] MFA — есть ли, можно ли обойти?

**Результат:** ✅ `module-05-auth/report.md`

## Модуль 6 — Authorization

**Цель:** Проверить все механизмы авторизации

**Что уже сделано:**
- ✅ Mass Assignment: role (создали админа)
- ✅ Mass Assignment: deluxeToken (подделали премиум)

- [x] RBAC — проверка ролей на каждом endpoint
- [x] BOLA — Broken Object Level Authorization
- [x] BFLA — Broken Function Level Authorization
- [x] IDOR — подмена ID в запросах (чужая корзина по ID)

**Результат:** ✅ `module-06-authorization/report.md`

## Модуль 7 — JWT

**Цель:** Полностью разобрать и протестировать JWT

**Что уже сделано:**
- ✅ Декодировали JWT, изучили payload (role, deluxeToken, bid, iat)
- ✅ Проверили alg:none — **подтвердили уязвимость** ✅
- ✅ Увидели, что JWT хранится в `authentication.token` (localStorage)

- [x] Проверить TTL / Exp
- [x] Проверить Refresh механизм
- [x] Проверить Aud, Iss, Scope

**Результат:** ✅ `module-07-jwt/report.md`

## Модуль 9 — OWASP Top 10

**Цель:** Проверить каждую категорию OWASP Top 10

**Что уже сделано:**
- ✅ A01: Broken Access Control (Mass Assignment, админка без RBAC)
- ✅ A03: Injection (SQL Injection — подтвердили)
- ✅ A05: Security Misconfiguration (/ftp/ открыт, JWT alg:none)

- [ ] ⏳ A02: Cryptographic Failures
- [ ] ⏳ A04: Insecure Design
- [ ] ⏳ A06: Vulnerable Components
- [ ] ⏳ A07: Identification & Auth Failures
- [ ] ⏳ A08: Software & Data Integrity
- [ ] ⏳ A09: Security Logging & Monitoring
- [ ] ⏳ A10: SSRF

**Результат:** `module-09-owasp-top10/report.md`

## Модуль 8 — OWASP API Top 10

**Цель:** Проверить каждую категорию API Top 10

- [ ] ⏳ API1: Broken Object Level Authorization
- [ ] ⏳ API2: Broken Authentication
- [ ] ⏳ API3: Broken Object Property Level Authorization (Mass Assignment)
- [ ] ⏳ API4: Unrestricted Resource Consumption
- [ ] ⏳ API5: Broken Function Level Authorization
- [ ] ⏳ API6: Unrestricted Access to Sensitive Business Flows
- [ ] ⏳ API7: Server Side Request Forgery
- [ ] ⏳ API8: Security Misconfiguration
- [ ] ⏳ API9: Improper Inventory Management
- [ ] ⏳ API10: Unsafe Consumption of APIs

**Результат:** `module-08-api-top10/report.md`

## Модуль 10 — Business Logic

**Цель:** Найти уязвимости бизнес-логики

- [ ] ⏳ Можно ли купить товар бесплатно?
- [ ] ⏳ Можно ли изменить цену в корзине?
- [ ] ⏳ Можно ли использовать купон дважды?
- [ ] ⏳ Можно ли оформить миллион заказов?
- [ ] ⏳ Можно ли создать миллион аккаунтов?
- [ ] ⏳ Можно ли получить скидку без прав?

**Результат:** `module-10-business-logic/report.md`

## Модуль 11 — Anti-Fraud

**Цель:** Подумать как защитник, а не как атакующий

- [ ] ⏳ Какие фрод-сценарии возможны в Juice Shop?
- [ ] ⏳ Какие проверки нужно добавить?
- [ ] ⏳ Написать рекомендации по anti-fraud

**Результат:** `module-11-anti-fraud/report.md`

## Модуль 12 — Burp Suite

**Цель:** Освоить базовые и продвинутые функции Burp

- [ ] ⏳ Proxy — перехват и модификация запросов
- [ ] ⏳ Repeater — повторная отправка запросов
- [ ] ⏳ Intruder — автоматизированный перебор
- [ ] ⏳ Decoder — кодирование/декодирование
- [ ] ⏳ Comparer — сравнение ответов
- [ ] ⏳ Logger — анализ всех запросов

**Результат:** `module-12-burp/report.md`

## Модуль 13 — Nuclei

**Цель:** Научиться использовать Nuclei для автоматизированного сканирования

- [ ] ⏳ Установить Nuclei
- [ ] ⏳ Запустить базовое сканирование Juice Shop
- [ ] ⏳ Проанализировать результаты
- [ ] ⏳ Написать/найти свой шаблон

**Результат:** `module-13-nuclei/report.md`

---

# Фаза 4: DevSecOps & Automation

## Модуль 14 — Semgrep

**Цель:** Научиться писать свои SAST-правила

- [ ] ⏳ Установить Semgrep
- [ ] ⏳ Запустить стандартные правила
- [ ] ⏳ Проанализировать результаты
- [ ] ⏳ Написать своё правило для поиска Mass Assignment
- [ ] ⏳ Написать своё правило для поиска SQLi

**Результат:** `module-14-semgrep/report.md`

## Модуль 15 — Security Review

**Цель:** Провести ручной обзор кода

- [ ] ⏳ Открыть исходники Juice Shop (GitHub)
- [ ] ⏳ Прочитать файл аутентификации
- [ ] ⏳ Прочитать файл корзины/заказов
- [ ] ⏳ Найти плохие практики
- [ ] ⏳ Задокументировать findings

**Результат:** `module-15-security-review/report.md`

## Модуль 16 — SSDLC

**Цель:** Встроить безопасность в процесс разработки

- [ ] ⏳ Описать pipeline безопасности для Juice Shop
- [ ] ⏳ Какие проверки добавить в PR?
- [ ] ⏳ Какие gates поставить перед деплоем?
- [ ] ⏳ Написать Security Requirements

**Результат:** `module-16-ssdlc/report.md`

## Модуль 17 — Docker

**Цель:** Проанализировать безопасность Docker-контейнера

- [ ] ⏳ Изучить Dockerfile Juice Shop
- [ ] ⏳ Проверить права в контейнере
- [ ] ⏳ Проверить секреты в образе
- [ ] ⏳ Написать рекомендации по hardening

**Результат:** `module-17-docker/report.md`

## Модуль 18 — Kubernetes

**Цель:** Представить Juice Shop в K8s и найти проблемы

- [ ] ⏳ Какие K8s resources нужны?
- [ ] ⏳ Network Policies
- [ ] ⏳ Pod Security
- [ ] ⏳ Secrets Management

**Результат:** `module-18-kubernetes/report.md`

## Модуль 19 — Monitoring

**Цель:** Определить, какие события нужно логировать

- [ ] ⏳ Список событий для аудита
- [ ] ⏳ login / logout / failed login
- [ ] ⏳ reset password
- [ ] ⏳ privilege escalation
- [ ] ⏳ admin actions
- [ ] ⏳ coupon abuse
- [ ] ⏳ mass assignment attempts

**Результат:** `module-19-monitoring/report.md`

---

# Фаза 5: Reporting & Architecture

## Модуль 20 — Отчёт

**Цель:** Оформить настоящий Pentest Report

- [ ] ⏳ Executive Summary
- [ ] ⏳ Scope & Methodology
- [ ] ⏳ Each finding: Title, CWE, OWASP, Risk, Impact, PoC, Recommendation
- [ ] ⏳ Risk Matrix
- [ ] ⏳ Приоритеты исправления

**Результат:** `module-20-report/pentest-report.md`

## Модуль 21 — Архитектурные улучшения

**Цель:** Предложить архитектурные изменения для предотвращения уязвимостей

- [ ] ⏳ Не просто "исправить XSS", а "изменить архитектуру, чтобы XSS не появился"
- [ ] ⏳ Security design review
- [ ] ⏳ Рекомендации по изоляции компонентов
- [ ] ⏳ Threat model v2 (после исправлений)

**Результат:** `module-21-architecture/report.md`

## Модуль 22 — Финальный экзамен

**Цель:** Провести аудит нового приложения без подсказок

- [ ] ⏳ Получить новое приложение (vulnerable-by-design)
- [ ] ⏳ Самостоятельно провести полный аудит
- [ ] ⏳ Оформить отчёт
- [ ] ⏳ Защитить результаты

**Результат:** `module-22-exam/report.md`

---

## ✅ Легенда статусов

| Статус | Значение |
|--------|----------|
| ⏳ | Не начато |
| 🔄 | В работе |
| 👀 | На ревью у Senior |
| ✅ | Зачтено |

---

## 🔗 Структура папок

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