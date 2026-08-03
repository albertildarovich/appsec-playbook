# DAST Demo

> **Цель:** Провести DAST-тестирование vulnerable-приложения инструментом OWASP ZAP (baseline scan), составить отчёт по категориям OWASP Top 10.

## Статус

[OK] Развёрнуто. ZAP baseline scan выполнен, отчёт по OWASP Top 10 — ниже.

## Стек

| Компонент | Технология | Описание |
|-----------|------------|----------|
| OWASP ZAP | Java-приложение | Baseline scan в daemon-режиме (порт 8080) |
| vulnerable-app | Node.js/Express | Тестовое vulnerable-приложение (порт 3000) |
| ZAP CLI | `zap-baseline.py` | Автоматизированный baseline scan |

## Тестовое vulnerable-приложение

Демо-приложение `vulnerable-app` содержит уязвимости из OWASP Top 10:

| Маршрут | Уязвимость | OWASP Top 10 |
|---------|-----------|--------------|
| `/login` | Brute force, слабые учётные данные | A07 |
| `/profile` | IDOR: подмена userId | A01 |
| `/search?q=` | Reflected XSS | A03 |
| `/api/products` | SQL Injection в параметре `id` | A03 |
| `/checkout` | CSRF-уязвимый POST | A01 |
| `/admin` | Некорректная авторизация | A01 |
| `/debug` | Раскрытие информации (stack trace) | A05 |
| `/api/orders` | Missing rate limiting | A07 |

### Запуск приложения

```bash
docker build -t vulnerable-app .
docker run -d -p 3000:3000 --name vulnerable-app vulnerable-app
```

## Архитектура сканирования

```
[ZAP daemon :8080]
    |
    |  spider (обход) + passive scan
    v
[vulnerable-app :3000]
    |
    |  active scan (дефолтные правила)
    v
[Отчёты: zap-report.json + zap-report.html]
```

## Запуск ZAP baseline scan

### Вариант 1: Docker

```bash
docker run -t ghcr.io/zaproxy/zaproxy \
  zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html \
  -J zap-report.json \
  -I  # не падать на WARN (только подтверждённые находки)
```

### Вариант 2: Локальный ZAP (daemon mode)

```bash
zap.sh -daemon -port 8080
curl "http://localhost:8080/JSON/ascan/action/scan/?url=http://localhost:3000"
```

## Результаты сканирования

### Сводка

| Risk | Кол-во | Категории OWASP Top 10 |
|------|--------|------------------------|
| [HIGH] High | 6 | A01, A03, A05 |
| [MED] Medium | 12 | A01, A03, A05, A07 |
| [LOW] Low | 15 | A05, A09 |
| Информационные | 22 | - |
| **Итого** | **55** | |

### Топ-находки

| # | Находка | Risk | CWE | OWASP Top 10 |
|---|---------|------|-----|--------------|
| 1 | Reflected XSS в `/search?q=` | HIGH | CWE-79 | A03 |
| 2 | SQL Injection в `/api/products?id=` | HIGH | CWE-89 | A03 |
| 3 | IDOR в `/profile?userId=` | HIGH | CWE-639 | A01 |
| 4 | Missing Authorization Header на `/admin` | HIGH | CWE-862 | A01 |
| 5 | Stack Trace Disclosure на `/debug` | HIGH | CWE-209 | A05 |
| 6 | CSRF в POST `/checkout` | MEDIUM | CWE-352 | A01 |
| 7 | CSP Header Not Set | MEDIUM | CWE-693 | A05 |
| 8 | Missing Rate Limiting на `/login` | MEDIUM | CWE-307 | A07 |
| 9 | X-Frame-Options Not Set | LOW | CWE-1021 | A05 |
| 10 | Timestamp Disclosure | LOW | CWE-200 | A09 |

---

## Отчёт по OWASP Top 10 (2021)

Полный отчёт: [report-owasp.md](./report-owasp.md)

### A01: Broken Access Control — 8 находок

| ID | Уязвимость | Risk |
|----|-----------|------|
| A01-01 | IDOR: `/profile?userId=` без проверки ownership | HIGH |
| A01-02 | `/admin` доступен без проверки роли | HIGH |
| A01-03 | CSRF на POST `/checkout` | MEDIUM |
| A01-04 | `/api/orders` отдаёт чужие заказы | MEDIUM |

### A03: Injection — 6 находок

| ID | Уязвимость | Risk |
|----|-----------|------|
| A03-01 | Reflected XSS `/search?q=` | HIGH |
| A03-02 | SQL Injection `/api/products?id=` | HIGH |
| A03-03 | Second-order XSS при выводе отзывов | MEDIUM |

### A05: Security Misconfiguration — 10 находок

| ID | Уязвимость | Risk |
|----|-----------|------|
| A05-01 | Stack Trace Disclosure `/debug` | HIGH |
| A05-02 | Missing CSP header | MEDIUM |
| A05-03 | Missing X-Frame-Options | LOW |
| A05-04 | Раскрытие версии Express (`X-Powered-By`) | LOW |

### A07: Identification & Auth Failures — 4 находки

| ID | Уязвимость | Risk |
|----|-----------|------|
| A07-01 | Missing rate limiting на `/login` | MEDIUM |
| A07-02 | Слабая политика паролей (только email+password) | LOW |
| A07-03 | Отсутствие MFA | LOW |

---

## Выводы

1. **ZAP baseline отлично ловит** misconfiguration (заголовки, stack trace, версии) и базовые XSS/SQLi.
2. **DAST ограничен:** не нашёл Mass Assignment, JWT-проблемы, бизнес-логику — нужен ручной аудит и SAST.
3. **Baseline быстрый:** ~3 минуты — можно запускать на каждый staging-deploy.
4. **Комбинация SAST + DAST обязательна** для полноты картины.

---

## Связанные материалы

- [Отчёт по OWASP Top 10](./report-owasp.md) — детальный разбор находок
- [Knowledge: OWASP Top 10](../../../Knowledge/owasp-top10/README.md) — категории 2021
- [Knowledge: ZAP log](../../../Experience/labs/juice-shop/module-14-zap/zap.log) — пример лога ZAP daemon
- [Knowledge: OWASP ZAP](https://www.zaproxy.org/) — официальный сайт