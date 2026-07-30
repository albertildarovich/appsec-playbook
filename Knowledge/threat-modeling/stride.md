# STRIDE

> **Главная идея:** Не искать уязвимости, а думать — каким образом систему могут атаковать.

**Уровень:** Threat Modeling (Tier 4)

---

##  Содержание

1. [Что такое STRIDE?](#1-что-такое-stride)
2. [S — Spoofing](#2-s--spoofing)
3. [T — Tampering](#3-t--tampering)
4. [R — Repudiation](#4-r--repudiation)
5. [I — Information Disclosure](#5-i--information-disclosure)
6. [D — Denial of Service](#6-d--denial-of-service)
7. [E — Elevation of Privilege](#7-e--elevation-of-privilege)
8. [Как STRIDE связан с OWASP](#8-как-stride-связан-с-owasp)
9. [Как применять STRIDE к DFD](#9-как-применять-stride-к-dfd)
10. [Чек-лист применения](#10-чек-лист-применения)
11. [Формат записи угрозы](#11-формат-записи-угрозы)
12. [Interview Questions](#12-interview-questions)

---

## 1. Что такое STRIDE?

**STRIDE** — это методология **Microsoft** для систематического поиска угроз безопасности ещё до написания кода.

### Зачем нужен STRIDE?

Допустим, команда говорит: *"Мы сделали новый API."*

AppSec не спрашивает: *"Где SQL Injection?"*

Он спрашивает:

| Вопрос | Категория STRIDE |
|--------|------------------|
| Как можно подделать пользователя? | **S**poofing |
| Можно ли изменить данные? | **T**ampering |
| Можно ли отказаться от совершённых действий? | **R**epudiation |
| Можно ли увидеть лишнюю информацию? | **I**nformation Disclosure |
| Можно ли положить сервис? | **D**enial of Service |
| Можно ли повысить привилегии? | **E**levation of Privilege |

### Полная расшифровка

| Буква | Угроза | Нарушение | Главный вопрос |
|-------|--------|-----------|----------------|
| **S** | Spoofing | Аутентификация | Можно ли выдать себя за другого? |
| **T** | Tampering | Целостность | Можно ли изменить данные? |
| **R** | Repudiation | Неотказуемость | Можно ли отказаться от своих действий? |
| **I** | Information Disclosure | Конфиденциальность | Можно ли увидеть лишнюю информацию? |
| **D** | Denial of Service | Доступность | Можно ли сделать сервис недоступным? |
| **E** | Elevation of Privilege | Авторизация | Можно ли получить больше прав? |

---

## 2. S — Spoofing

### Что это?

**Подмена личности.** Система думает, что перед ней один пользователь, а на самом деле это злоумышленник.

### Примеры

- кража JWT;
- кража Session Cookie;
- кража API Key;
- фишинг;
- подмена сервисной учётной записи.

### Защита

| Защита | Описание |
|--------|----------|
| **MFA** | Многофакторная аутентификация |
| **Короткие Access Token** | Минимизация окна атаки |
| **Отзыв Refresh Token** | Возможность завершить сессию |
| **HttpOnly Cookie** | Защита от XSS кражи |
| **Secure Cookie** | Передача только по HTTPS |
| **Device Binding** | Привязка к устройству |

### Связь с OWASP

- **Authentication Failures (A07)**
- **Session Management**

---

## 3. T — Tampering

### Что это?

**Несанкционированное изменение данных.**

### Примеры

```json
// Изменение JSON-запроса
{ "price": 1 }

// Подмена роли
{ "role": "admin" }

// Подмена статуса оплаты
{ "paid": true }
```

### Защита

| Защита | Описание |
|--------|----------|
| **Never Trust the Client** | Сервер сам определяет цену, роль, статус |
| **Проверка входных данных** | Валидация на сервере |
| **Цифровые подписи** | HMAC, JWT signature |
| **Контроль целостности** | Подписи на передаваемых данных |
| **DTO** | Маппинг в DTO, исключение лишних полей |

### Связь с OWASP

- **Mass Assignment**
- **Insecure Design (A04)**
- **Broken Access Control (A01)**
- **Cryptographic Failures (A02)**

---

## 4. R — Repudiation

### Что это?

Пользователь **отказывается** от совершённых действий.

> *"Я этого не делал."*

### Главная задача системы

Уметь **доказать**:
- **кто**;
- **когда**;
- **что** сделал.

### Что должно храниться в Audit Logs

| Поле | Описание |
|------|----------|
| User ID | Кто совершил действие |
| Timestamp | Когда |
| IP Address | Откуда |
| Session ID | Какая сессия |
| Action | Что сделано |
| Result | Успех / ошибка |
| MFA Status | Подтверждено ли MFA |

### Для критичных операций

Желательно:
- повторный ввод пароля;
- MFA;
- подтверждение действия.

### Защита

| Защита | Описание |
|--------|----------|
| **Audit Logs** | Логирование всех действий |
| **Append-only журналы** | Запрет на удаление/изменение логов |
| **Неизменяемые журналы** | Immutable storage (e.g., AWS S3 Object Lock) |
| **Цифровые подписи** | Подпись логов для проверки целостности |

### Связь с OWASP

- **Security Logging & Monitoring (A09)**

---

## 5. I — Information Disclosure

### Что это?

Раскрытие информации, которая не должна быть доступна.

### Пример

```json
// API возвращает:
{
    "name": "Ivan",
    "salary": 250000,
    "passwordHash": "...",
    "internalNotes": "VIP"
}

// Хотя фронтенду нужен только:
{
    "name": "Ivan"
}
```

### Почему это плохо

Даже если данные **не отображаются** на UI, их можно увидеть через:
- DevTools;
- Burp Suite;
- Postman.

### Защита

| Защита | Описание |
|--------|----------|
| **DTO** | Не отдавать Entity наружу |
| **Минимально необходимые данные** | Отдавать только то, что нужно UI |
| **Скрытие внутренних полей** | @JsonIgnore, @JsonProperty(access = WRITE_ONLY) |

### Связь с OWASP

- **Cryptographic Failures (A02)**
- **Excessive Data Exposure**
- **IDOR**
- **Broken Access Control (A01)**

---

## 6. D — Denial of Service

### Что это?

Сделать сервис **недоступным**.

### Пример

```http
POST /login
```

Каждый запрос запускает **Argon2** (500 мс).

Злоумышленник отправляет:
```
1000 запросов/сек
```

**Результат:**
- CPU перегружен;
- память заканчивается;
- пользователи не могут войти.

> **Интересная особенность:** Argon2 увеличивает безопасность, но при неправильной настройке может помочь провести DoS.

### Защита

| Защита | Описание |
|--------|----------|
| **Rate Limiting** | N запросов в минуту |
| **CAPTCHA** | После N попыток |
| **WAF** | Фильтрация на уровне Gateway |
| **Backoff** | Увеличивающаяся задержка |
| **Cooldown** | Пауза между запросами |
| **IP лимит** | N запросов с одного IP |
| **User лимит** | N запросов на пользователя |

### Связь с OWASP

- **Insecure Design (A04)**
- **Rate Limiting**
- **Availability**

---

## 7. E — Elevation of Privilege

### Что это?

Получение возможностей, которых пользователь иметь **не должен**.

### Пример

```
User → Admin
```

### Виды

| Вид | Описание | Пример |
|-----|----------|--------|
| **Вертикальное повышение** | User → Admin | Обычный пользователь получает админку |
| **Горизонтальное повышение** | User A → User B | Один пользователь видит данные другого |

### Защита

| Защита | Описание |
|--------|----------|
| **RBAC** | Role-Based Access Control |
| **ABAC** | Attribute-Based Access Control |
| **Централизованная авторизация** | OPA, Cedar, SpiceDB |
| **Principle of Least Privilege** | Минимально необходимые права |
| **Проверка каждой операции** | На уровне сервиса, не только UI |

### Связь с OWASP

- **Broken Access Control (A01)**
- **IDOR**
- **BOLA**
- **Vertical Privilege Escalation**
- **Horizontal Privilege Escalation**

---

## 8. Как STRIDE связан с OWASP

| STRIDE | OWASP Top 10 / API Security |
|--------|-----------------------------|
| **S**poofing | Authentication Failures (A07) |
| **T**ampering | Mass Assignment, Insecure Design (A04) |
| **R**epudiation | Security Logging & Monitoring (A09) |
| **I**nformation Disclosure | Cryptographic Failures (A02), IDOR, Excessive Data Exposure |
| **D**enial of Service | Insecure Design (A04), Rate Limiting |
| **E**levation of Privilege | Broken Access Control (A01), IDOR, BOLA |

---

## 9. Как применять STRIDE к DFD

### Матрица применимости STRIDE к элементам DFD

| Элемент DFD | S | T | R | I | D | E |
|-------------|---|---|---|---|---|---|
| **External Entity** | [OK] Да | [NO] Нет | [NO] Нет | [NO] Нет | [NO] Нет | [NO] Нет |
| **Process** | [OK] Да | [OK] Да | [OK] Да | [OK] Да | [OK] Да | [OK] Да |
| **Data Store** | [NO] Нет | [OK] Да | [NO] Нет | [OK] Да | [NO] Нет | [NO] Нет |
| **Data Flow** | [OK] Да | [OK] Да | [NO] Нет | [OK] Да | [OK] Да | [NO] Нет |

### Пример применения к банковскому переводу

```
Пользователь (External Entity)
    │
    │ Data Flow (S - перехват сессии, T - изменение суммы)
    ▼
API Gateway (Process)
    │
    │ Data Flow (T - модификация запроса)
    ▼
Payment Service (Process)
    │
    ├── Data Store: База пользователей (T - изменение баланса, I - утечка)
    └── Data Store: Audit Log (R - отсутствие логов)
```

---

## 10. Чек-лист применения

Когда появляется новая функция, пройдись по чек-листу:

```
[ ] S — Можно ли выдать себя за другого пользователя?
[ ] T — Можно ли изменить данные?
[ ] R — Сможет ли пользователь отрицать свои действия?
[ ] I — Не раскрываем ли мы лишнюю информацию?
[ ] D — Можно ли перегрузить сервис?
[ ] E — Можно ли получить больше прав?
```

### Типичные ошибки по категориям

| Категория | Ошибка разработчика | Как AppSec обнаружит |
|-----------|-------------------|---------------------|
| **S**poofing | JWT без проверки signature | Code Review |
| **T**ampering | Отсутствие HMAC для cookies | Code Review + SAST |
| **R**epudiation | Нет audit логов | Review архитектуры |
| **I**nformation Disclosure | Stack trace в ответе | DAST + Code Review |
| **D**enial of Service | Нет rate limiting | Load testing + DAST |
| **E**levation of Privilege | IDOR | Manual testing |

---

## 11. Формат записи угрозы

```markdown
# Threat Model: Feature X

## Context
[Описание фичи]

## DFD
[Диаграмма]

## Threats

| ID | STRIDE | Threat | Risk | Control | Status |
|----|--------|--------|------|---------|--------|
| TM-001 | S | Spoofing user | High | MFA + JWT validation | Mitigated |
| TM-002 | T | Tampering amount | High | Server-side validation | In progress |
| TM-003 | R | No audit log | Medium | Add append-only log | Open |
| TM-004 | I | Stack trace leak | Low | Generic error messages | Mitigated |
| TM-005 | D | Rate limit missing | Medium | Add rate limiter | In progress |
| TM-006 | E | IDOR on user list | High | Ownership check | In progress |
```

---

## 12. Interview Questions

### Базовые вопросы

| Вопрос | Ответ |
|--------|-------|
| **Что такое STRIDE?** | Методология Microsoft для Threat Modeling. 6 категорий: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege. |
| **Чем STRIDE отличается от списка уязвимостей?** | STRIDE — это модель мышления. Она применяется на этапе проектирования, а не после написания кода. |
| **Когда применяется STRIDE?** | На этапе проектирования, до написания кода. |
| **Может ли одна атака относиться к нескольким категориям?** | Да. Например, кража сессии = Spoofing + Information Disclosure. |

### Продвинутые вопросы

| Вопрос | Ответ |
|--------|-------|
| **Как STRIDE связан с OWASP?** | Каждая категория STRIDE маппится на категории OWASP. STRIDE — это "почему", OWASP — "как". |
| **Как применять STRIDE к DFD?** | S — External Entity, T — Data Store/Data Flow, R — Process, I — Data Store, D — Process, E — Process. |
| **Что такое Trust Boundary?** | Граница между зонами с разным уровнем доверия. Пересечение trust boundary = потенциальная угроза. |
| **STRIDE vs Attack Trees?** | STRIDE — категоризация угроз, Attack Trees — детализация конкретной угрозы. STRIDE отвечает "что?", Attack Trees отвечает "как?". |

### Как отвечать на интервью

> **STRIDE** — это методология Microsoft для Threat Modeling. Она помогает систематически анализировать систему по шести категориям угроз: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service и Elevation of Privilege. Главная цель — обнаружить потенциальные угрозы на этапе проектирования и заложить защитные механизмы до начала разработки.

---

##  Связанные темы

- [Insecure Design (A04)](../web-security/insecure-design.md) — Abuse Cases, Never Trust the Client
- [Broken Access Control (A01)](../authorization/broken-access-control.md) — EoP, IDOR, BOLA
- [Identification & Authentication Failures (A07)](../authentication/identification-authentication-failures.md) — Spoofing, session management
- [Cryptographic Failures (A02)](../cryptography/cryptographic-failures.md) — Information Disclosure, Tampering
- [Security Logging & Monitoring (A09)](../web-security/security-misconfiguration.md) — Repudiation
- [Интерпретаторы](../fundamentals/interpreters.md) — фундаментальная концепция

---

> **Оценка:** STRIDE — это не список уязвимостей, а модель мышления, позволяющая систематически искать угрозы безопасности на этапе проектирования системы. Следующий логичный шаг — **Data Flow Diagrams (DFD)** и **Trust Boundaries**.
