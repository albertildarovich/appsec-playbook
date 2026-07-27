# 🎓 Juice Shop

> **Формат:** 22 модуля, 5 фаз
> **Цель:** Аудит веб-приложений

---

## Прогресс

```
Фаза 1: Recon & Architecture    [████░░░░░░]  40%  — Модули 1-2 частично
Фаза 2: Threat Modeling          [██████░░░░]  60%  — Модуль 4 частично
Фаза 3: Security Testing         [░░░░░░░░░░]   0%
Фаза 4: DevSecOps & Automation   [░░░░░░░░░░]   0%
Фаза 5: Reporting & Architecture [░░░░░░░░░░]   0%
─────────────────────────────────────────────
Total:                            [██░░░░░░░░]  15%
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

- [ ] ⏳ Пройтись по всем страницам в браузере (UI)
- [ ] ⏳ Составить mindmap приложения (все страницы и связи)
- [ ] ⏳ Заполнить таблицу эндпоинтов в `module-01-recon/report.md`

**Результат:** `module-01-recon/report.md` — карта приложения

## Модуль 2 — Assets

**Цель:** Определить все активы и их критичность

**Что уже сделано:**
- ✅ Составили список активов: User data, JWT, Basket/Orders, Products, Admin panel
- ✅ Оценили критичность: High / Medium / Low
- ✅ Нашли через практику: утечка всех пользователей через `/api/Users`, JWT `alg:none`

- [ ] ⏳ Для каждого актива дозаполнить CIA (Confidentiality, Integrity, Availability)
- [ ] ⏳ Оформить таблицу в `module-02-assets/report.md`

**Результат:** `module-02-assets/report.md` — таблица активов с CIA

## Модуль 3 — Trust Boundaries

**Цель:** Найти границы доверия и построить DFD

- [ ] ⏳ Нарисовать Data Flow Diagram (DFD)
- [ ] ⏳ Отметить External Entities
- [ ] ⏳ Отметить Processes
- [ ] ⏳ Отметить Data Stores
- [ ] ⏳ Выделить Trust Boundaries
- [ ] ⏳ Описать, где меняется уровень доверия

**Результат:** `module-03-boundaries/report.md` — DFD + Trust Boundaries

---

# Фаза 2: Threat Modeling

## Модуль 4 — STRIDE

**Цель:** Провести полноценный Threat Modeling

**Что уже сделано:**
- ✅ **Spoofing:** JWT `alg:none` — проверили на практике ✅
- ✅ **Tampering:** Mass Assignment (role + deluxeToken) — проверили ✅
- ✅ **Tampering:** SQL Injection — проверили ✅
- ✅ **Information Disclosure:** /ftp/ открыт, утечка пользователей через `/api/Users` ✅
- ✅ **Elevation of Privilege:** Mass Assignment → admin, админка без RBAC ✅
- ✅ DFD + Trust Boundaries нарисованы
- ✅ 23 угрозы идентифицированы (12 High, 10 Medium, 3 Low)

- [ ] ⏳ **Repudiation:** проверить аудит-логи (нет ли logging?)
- [ ] ⏳ **Denial of Service:** проверить rate limiting
- [ ] ⏳ Оформить всё как отдельный отчёт в `module-04-threat-model/report.md`

**Результат:** `module-04-threat-model/report.md` — полный STRIDE-анализ

---

# Фаза 3: Security Testing

## Модуль 5 — Authentication

**Цель:** Проверить механизмы аутентификации

- [ ] ⏳ Регистрация — можно ли создать пользователя с особыми правами?
- [ ] ⏳ Логин — есть ли bruteforce защита?
- [ ] ⏳ Logout — действительно ли завершает сессию?
- [ ] ⏳ Смена пароля — требуется ли старый пароль?
- [ ] ⏳ Reset password — насколько безопасен механизм?
- [ ] ⏳ MFA — есть ли, можно ли обойти?

**Результат:** `module-05-auth/report.md`

## Модуль 6 — Authorization

**Цель:** Проверить все механизмы авторизации

**Что уже сделано:**
- ✅ Mass Assignment: role (создали админа)
- ✅ Mass Assignment: deluxeToken (подделали премиум)

- [ ] ⏳ RBAC — проверка ролей на каждом endpoint
- [ ] ⏳ BOLA — Broken Object Level Authorization
- [ ] ⏳ BFLA — Broken Function Level Authorization
- [ ] ⏳ IDOR — подмена ID в запросах (начали — получили чужую корзину через alg:none)

**Результат:** `module-06-authorization/report.md`

## Модуль 7 — JWT

**Цель:** Полностью разобрать и протестировать JWT

**Что уже сделано:**
- ✅ Декодировали JWT, изучили payload (role, deluxeToken, bid, iat)
- ✅ Проверили alg:none — **подтвердили уязвимость** ✅
- ✅ Увидели, что JWT хранится в `authentication.token` (localStorage)

- [ ] ⏳ Проверить TTL / Exp
- [ ] ⏳ Проверить Refresh механизм
- [ ] ⏳ Проверить Aud, Iss, Scope

**Результат:** `module-07-jwt/report.md`

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