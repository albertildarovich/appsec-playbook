# Модуль 9: OWASP Top 10

> **Цель:** Проверить каждую категорию OWASP Top 10 в Juice Shop

---

## Уже проверено

| Категория | Статус | Где |
|-----------|--------|-----|
| A01: Broken Access Control | [OK] Critical | Mass Assignment, админка без RBAC (Модуль 4, 6) |
| A03: Injection | [OK] Critical | SQL Injection (Модуль 4) |
| A05: Security Misconfiguration | [OK] Critical | /ftp/, JWT alg:none (Модуль 4) |

## A02: Cryptographic Failures

**Что нашли:**
1. MD5 хеш пароля в JWT payload — устаревший алгоритм (подтвердили: `12345` → `827ccb0eea8a...`)
2. Пароль в payload JWT — не должен быть в токене вообще
3. JWT `alg:none` — подпись RS256 не проверяется

**Риск:** Critical

## A04: Insecure Design

**Что нашли (архитектурные проблемы):**
1. Mass Assignment — API принимает любые поля без фильтрации
2. Отсутствие RBAC — роль в JWT есть, но не проверяется на сервере
3. JWT без Exp / без инвалидации — токен живёт вечно
4. Нет rate limiting — любой endpoint можно брутфорсить

**Риск:** Critical

## A07: Identification & Auth Failures

**Что нашли (из Модуля 5):**
1. Регистрация: [NO] нет верификации email, [NO] нет капчи, [NO] Mass Assignment
2. Логин: [NO] нет rate limiting, [NO] нет блокировки аккаунта
3. Logout: [NO] JWT не инвалидируется на сервере
4. Reset password: UI есть, но сломан (Security Misconfiguration)
5. MFA: [NO] отсутствует

**Риск:** Critical

## A06: Vulnerable Components

**Что проверили:**
- Express ^4.22.1 (из error page)
- Juice Shop — intentionally vulnerable application
- Многие уязвимости заложены намеренно в зависимости

**Риск:** High

## A08: Software & Data Integrity

**Что проверили:**
- Нет механизма проверки целостности обновлений
- Нет подписи пакетов
- CI/CD pipeline отсутствует

**Риск:** Medium

## A09: Security Logging & Monitoring

**Что нашли (из Модуля 4 — Repudiation):**
1. [NO] Нет аудит-логов failed login
2. [NO] Нет X-Request-Id для трассировки
3. [NO] Невозможно расследовать инциденты
4. [NO] Админ может злоупотреблять правами без доказательств

**Риск:** High

## A10: SSRF

**Что проверили:**
- В Juice Shop нет явных endpoint'ов, принимающих URL
- Chatbot использует LLM API — потенциал есть
- Требуется дополнительное тестирование

**Риск:** Medium

## Итог: OWASP Top 10

| Категория | Риск |
|-----------|------|
| A01: Broken Access Control | [CRIT] Critical |
| A02: Cryptographic Failures | [CRIT] Critical |
| A03: Injection | [CRIT] Critical |
| A04: Insecure Design | [CRIT] Critical |
| A05: Security Misconfiguration | [CRIT] Critical |
| A06: Vulnerable Components | [MED] High |
| A07: Identification & Auth Failures | [CRIT] Critical |
| A08: Software & Data Integrity | [LOW] Medium |
| A09: Security Logging & Monitoring | [MED] High |
| A10: SSRF | [LOW] Medium |
