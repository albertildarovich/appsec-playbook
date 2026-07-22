# A10 — Server-Side Request Forgery (SSRF)

> **Суть:** Злоумышленник заставляет сервер выполнять HTTP-запросы к произвольным адресам.
>
> **Главная опасность:** Доступ к внутренней сети, localhost, облачным metadata.

---

## Быстрый чек-лист

- [ ] Зачем пользователю указывать произвольный URL? (первый вопрос AppSec)
- [ ] Используется Allowlist (не Blacklist)?
- [ ] Проверка после DNS Resolve? (домен может указывать на 127.0.0.1)
- [ ] Проверка после каждого редиректа?
- [ ] Ответы от внутренних сервисов не возвращаются пользователю?

---

## Цели SSRF

| Цель | Пример |
|------|--------|
| **Cloud Metadata** | `http://169.254.169.254/latest/meta-data/` (AWS) |
| **Internal Services** | `http://localhost:8080/actuator` |
| **Internal APIs** | `http://internal-api.company/admin/delete-user` |
| **File Protocol** | `file:///etc/passwd` |
| **Port Scanning** | Перебор портов для разведки |

---

## Защита

| Метод | Описание |
|-------|----------|
| **Allowlist** | Только разрешённые домены/IP (лучше Blacklist) |
| **Проверка после DNS Resolve** | Домен → IP → проверка по allowlist |
| **Проверка редиректов** | Каждый редирект — новая проверка |
| **Отключить ненужные протоколы** | `file://`, `gopher://`, `dict://` |
| **Network Segmentation** | Сервер не имеет доступа к внутренним сервисам без необходимости |
| **Outbound Firewall** | Ограничить исходящий трафик |

---

## 🔗 Полная версия

👉 [`web-security/ssrf.md`](./web-security/ssrf.md) — Blind SSRF, защита на DNS уровне, metadata атаки, схемы атак
