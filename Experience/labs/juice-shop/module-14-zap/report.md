# Модуль 14: ZAP (Zed Attack Proxy)

> **Цель:** Сравнить ZAP (DAST) с Nuclei на Juice Shop, оценить разницу в подходах.

##  Установка

| Шаг | Метод | Результат |
|-----|-------|-----------|
| Попытка 1 | Docker (`zap2docker-stable`) | [NO] — проблемы с сетью на macOS (Docker Desktop не поддерживает `--network host`) |
| Попытка 2 | `brew install --cask zap` | [NO] — блокирован macOS Gatekeeper |
| Решение | System Settings → Privacy & Security → Open Anyway | [OK] |
| Запуск | Java 17 + `zap.sh -daemon -port 8080` | [OK] |

**Version**: ZAP 2.17.0

## 🔍 Сканирование Juice Shop

**Метод**: Spider (обход) → Active scan (Default Policy)

| Этап | Статус |
|------|--------|
| Spider (обход сайта) | [OK] 100% |
| Active scan | [OK] 100% |
| Время выполнения | ~3 мин |

##  Результаты (63 алерта)

| Risk | Count | Название |
|------|-------|----------|
| [MED] **Medium** | 19 | Cross-Domain Misconfiguration (CORS wildcard `*`) |
| [MED] **Medium** | 3 | Content Security Policy (CSP) Header Not Set |
| [LOW] **Low** | 15 | Timestamp Disclosure - Unix |
| 🔵 **Informational** | 24 | User Agent Fuzzer |
| 🔵 **Informational** | 2 | Modern Web Application |

## [WARN] Топ-уязвимости

### 1. Cross-Domain Misconfiguration (Medium) — 19 шт.
- **CWE-264**: Permissions, Privileges, and Access Controls
- **Evidence**: `Access-Control-Allow-Origin: *`
- **Где**: Все статические ресурсы (JS, robots.txt, etc.)
- **Риск**: Атаки с других доменов могут читать ответы
- **Решение**: Убрать CORS заголовки или ограничить белый список доменов

### 2. CSP Not Set (Medium) — 3 шт.
- **Описание**: Content Security Policy не настроен
- **Риск**: XSS-атаки не блокируются на уровне браузера
- **Решение**: Добавить заголовок `Content-Security-Policy`

### 3. Timestamp Disclosure (Low) — 15 шт.
- **Описание**: Утечка Unix timestamps в ответах сервера
- **Риск**: Низкий, может помочь атакующему в fingerprinting

##  Сравнение: ZAP vs Nuclei

| Критерий | ZAP | Nuclei |
|----------|-----|--------|
| **Security Headers** | CSP Not Set (3) | 8 missing headers (Info) |
| **CORS** | Cross-Domain Misconfig (19) | не нашёл |
| **Prometheus /metrics** | не нашёл | [OK] Medium |
| **Swagger /api-docs** | не нашёл | [OK] Info |
| **Timestamp Disclosure** | 15 Low | не проверял |
| **Open /ftp/** | не проверял | [OK] Info |
| **User Agent Fuzzer** | 24 Info | не было |
| **Скорость** | ~3 мин (active scan) | ~30 сек |
| **Простота запуска** | [NO] Java + daemon mode | [OK] один бинарник |
| **Установка (Mac)** | [NO] проблемы с Docker + Gatekeeper | [OK] `brew install` |
| **Обнаружение бизнес-логики** | [NO] не нашёл | [NO] не нашёл |

##  Выводы

1. **ZAP vs Nuclei** — Оба находят разные классы проблем: ZAP — CORS и CSP, Nuclei — missing headers и эндпоинты (Swagger, Prometheus, /ftp). Лучше всего использовать **оба**.
2. **ZAP тяжелее** — требует Java 17+ и ~5-10 сек на старт. Active scan медленнее (~3 мин vs 30 сек у Nuclei).
3. **Бизнес-логику не ловит** — ни ZAP, ни Nuclei не нашли Mass Assignment, JWT, RBAC flaws. Только ручной аудит.
4. **ZAP нативный** — на macOS проще через native app (через Gatekeeper), чем через Docker.
5. **Пайплайн-рекомендация**: Nuclei для быстрых проверок (CI/CD → PR), ZAP — для глубинного сканирования (nightly/scheduled).

##  Артефакты

- `zap.log` — лог демона ZAP
- `report.md` — данный отчёт

##  Ссылки

- [ZAP Download](https://www.zaproxy.org/download/)
- [ZAP API Docs](https://www.zaproxy.org/docs/desktop/addons/api/)
- [OWASP Juice Shop](https://github.com/juice-shop/juice-shop)