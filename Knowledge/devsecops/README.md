# DevSecOps

Security as Code: встраивание безопасности в CI/CD на каждом этапе — от pre-commit до production sign-off.

## Структура раздела

| Файл | Что внутри |
|------|------------|
| [devsecops.md](devsecops.md) | Полный обзор: Secret Scanning (gitleaks), SAST (Semgrep), SCA (Trivy), Container Scanning, IaC Scanning (Checkov), DAST (ZAP). Gate policy, чек-лист внедрения, типовые ошибки, interview questions. |
| [banking-standards.md](banking-standards.md) | Российские стандарты: 683-П, 757-П, ГОСТ 57580, ГОСТ Р 56939-2024 (безопасная разработка ПО). |

## Архитектура security-пайплайна

```
Pre-commit (секреты) -> SAST -> SCA -> Container Scan -> IaC Scan -> DAST -> Sign-off
```

## Чек-лист самопроверки

- [ ] Secret Scanning: gitleaks в CI/CD + pre-commit hook
- [ ] SAST: Semgrep/SonarQube на каждом MR, блокировка на CRITICAL
- [ ] SCA: Trivy/Snyk на каждом MR, политика обновления зависимостей
- [ ] Container Scanning: Trivy на каждом билде образа
- [ ] IaC Scanning: Checkov/tfsec на изменениях в k8s/Terraform
- [ ] DAST: ZAP baseline на staging, full scan перед релизом
- [ ] Gate policy задокументирована и согласована с командами

## Связанные разделы

- [Kubernetes Security](../kubernetes/README.md) — hardening K8s, runtime security
- [Secure SDLC](../secure-sdlc/README.md) — процесс внедрения security-практик
- [Module 17 — SSDLС Pipeline](../../Experience/labs/juice-shop/module-17-ssdlc/report.md) — практическая реализация
- [Module 24 — ГОСТ Р 56939-2024](../../Experience/labs/juice-shop/module-24-gost-56939/report.md) — практика: gap analysis по российскому стандарту безопасной разработки ПО
- [Banking Standards](banking-standards.md) — российская регуляторика (683-П, 757-П, ГОСТ 57580, ГОСТ Р 56939)
