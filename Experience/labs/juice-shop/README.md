# OWASP Juice Shop Lab

> 🧪 Лабораторный стенд: intentionally vulnerable application для практики AppSec

## Статус

🟢 **Развёрнут** через Docker на `http://localhost:3000`

## Контекст

OWASP Juice Shop — самый современный и сложный intentionally vulnerable веб-сайт. Написан на Node.js/Express + Angular, содержит более 100 уязвимостей из OWASP Top 10 и не только.

## Быстрый старт

```bash
docker pull bkimminich/juice-shop
docker run -d --name juice-shop -p 3000:3000 bkimminich/juice-shop
```

Открыть: http://localhost:3000

## Архитектура

| Компонент | Технология | Описание |
|-----------|------------|----------|
| Frontend | Angular (SPA) | SPA с Material Design |
| Backend | Node.js + Express | REST API + WebSocket |
| Database | SQLite (по умолчанию) | Встроенная БД |
| Auth | JWT | Токены доступа |
| API Docs | Swagger | `/api-docs` |

## Эндпоинты

| Path | Описание |
|------|----------|
| `/` | Фронтенд (Angular SPA) |
| `/api/` | API (Swagger docs) |
| `/rest/` | REST API |
| `/api-docs` | Swagger UI |
| `/ftp/` | FTP-подобный доступ |
| `/assets/` | Статические файлы |

## 🎓 Стажировка AppSec-инженера

Весь процесс разбит на **22 модуля в 5 фазах** — от разведки до финального отчёта.

👉 **[➡️ Открыть план стажировки](./internship-plan.md)**

```
Фаза 1: Recon & Architecture    [██░░░░░░░░]  15%  (модули 1-3)
Фаза 2: Threat Modeling          [██████████] 100%  (модуль 4)
Фаза 3: Security Testing         [██████████] 100%  (модули 5-14)
Фаза 4: DevSecOps & Automation   [░░░░░░░░░░]   0%  (модули 15-20)
Фаза 5: Reporting & Architecture [░░░░░░░░░░]   0%  (модули 21-23)
```

### Пройденные модули

- [x] Модуль 0: Развёртывание Juice Shop в Docker
- [x] Модуль 1: Recon (начат, частично)
- [x] Модуль 4: Threat Modeling (начат, 7 уязвимостей найдено)

