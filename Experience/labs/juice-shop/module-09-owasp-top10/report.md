# Модуль 9: OWASP Top 10

> **Цель:** Проверить каждую категорию OWASP Top 10 в Juice Shop

---

## Уже проверено

| Категория | Статус | Где |
|-----------|--------|-----|
| A01: Broken Access Control | ✅ Critical | Mass Assignment, админка без RBAC (Модуль 4, 6) |
| A03: Injection | ✅ Critical | SQL Injection (Модуль 4) |
| A05: Security Misconfiguration | ✅ Critical | /ftp/, JWT alg:none (Модуль 4) |

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
1. Регистрация: ❌ нет верификации email, ❌ нет капчи, ❌ Mass Assignment
2. Логин: ❌ нет rate limiting, ❌ нет блокировки аккаунта
3. Logout: ❌ JWT не инвалидируется на сервере
4. Reset password: UI есть, но сломан (Security Misconfiguration)
5. MFA: ❌ отсутствует

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
1. ❌ Нет аудит-логов failed login
2. ❌ Нет X-Request-Id для трассировки
3. ❌ Невозможно расследовать инциденты
4. ❌ Админ может злоупотреблять правами без доказательств

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
| A01: Broken Access Control | 🔴 Critical |
| A02: Cryptographic Failures | 🔴 Critical |
| A03: Injection | 🔴 Critical |
| A04: Insecure Design | 🔴 Critical |
| A05: Security Misconfiguration | 🔴 Critical |
| A06: Vulnerable Components | 🟡 High |
| A07: Identification & Auth Failures | 🔴 Critical |
| A08: Software & Data Integrity | 🟢 Medium |
| A09: Security Logging & Monitoring | 🟡 High |
| A10: SSRF | 🟢 Medium |
