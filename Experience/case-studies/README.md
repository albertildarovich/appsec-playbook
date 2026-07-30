# Case Studies

Разбор реальных инцидентов: CVE, Bug Bounty, Postmortems.

## Содержание

| # | Кейс | Формат | Статус |
|---|------|--------|--------|
| 01 | Опыт автора: Code Review, Keycloak, Linux, Docker | [OK] Done | [`case01.md`](case01.md) |
| 02 | Auth0 JWT `alg:none` + RS256/HS256 confusion (2017-2020) | [OK] Done | [`case02-auth0-jwt.md`](case02-auth0-jwt.md) |
| 03 | Capital One SSRF (2019) — 106M записей | [OK] Done | [`case03-capital-one-ssrf.md`](case03-capital-one-ssrf.md) |

---

## Как анализировать — шаблон для новых кейсов

Каждый CVE-разбор следует структуре:

1. **Описание** — что произошло, масштаб, ущерб
2. **Уязвимые компоненты** — таблица: компонент → проблема
3. **Proof of Concept / Kill Chain** — пошаговая эксплуатация с кодом
4. **Root Cause** — почему каждый слой защиты не сработал
5. **Fix** — код/конфигурация, которые предотвратили бы атаку
6. **Prevention** — чек-лист для предотвращения в будущем
7. **Уроки** — ключевые выводы для AppSec-инженера
8. **Источники** — ссылки на первоисточники (CVE, NVD, OCC orders, etc.)
