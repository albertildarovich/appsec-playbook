# A06 — Vulnerable & Outdated Components

> **Суть:** Использование библиотек, фреймворков и зависимостей с известными уязвимостями.
>
> **Ключевое:** CVE ≠ Risk. Оценивай контекст, а не только CVSS.

---

## Быстрый чек-лист

- [ ] SCA настроен в CI/CD (Trivy, Snyk, Dependabot)?
- [ ] Triage проводится по каждому CVE: FP, reachability, KEV, Internet Facing?
- [ ] SBOM генерируется для каждого артефакта?
- [ ] Для критических CVE есть план remediation?
- [ ] Если обновить нельзя — есть compensating controls?

---

## Процесс SCA

```
SCA → CVE → Triage → Risk Assessment → Remediation / Acceptance
```

### Triage — что проверять

| Фактор | Что выясняем |
|--------|-------------|
| **False Positive** | Действительно ли CVE затрагивает эту версию? |
| **Reachability** | Используется ли уязвимый код в приложении? |
| **KEV** | Есть ли в Known Exploited Vulnerabilities (CISA)? |
| **Internet Facing** | Доступен ли сервис извне? |
| **Public PoC** | Есть ли публичный эксплойт? |

### Если обновить нельзя

| Компенсирующая мера | Пример |
|---------------------|--------|
| WAF | Блокировать на уровне HTTP |
| Network Segmentation | Ограничить доступ к сервису |
| Least Privilege | Минимизировать права процесса |
| Sandbox | Изолировать контейнер |
| Feature Disable | Отключить уязвимую функцию |

---

## SBOM vs SCA

| | SBOM | SCA (Trivy, Snyk) |
|---|------|-------------------|
| **Отвечает на вопрос** | «Что входит в приложение?» | «Что уязвимо?» |
| **Форматы** | SPDX, CycloneDX, SWID | — |
| **Показывает CVE** | ❌ Нет | ✅ Да |

---

## 🔗 Полная версия

👉 [`04-web-security/vulnerable-components.md`](./web-security/vulnerable-components.md) — подробно о reachability, triage, SBOM, Trivy, CI/CD, стратегии управления рисками
