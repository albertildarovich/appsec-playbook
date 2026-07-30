# Kubernetes Security

Безопасность Kubernetes на всех уровнях: Pod, Network, RBAC, Runtime, Compliance.

## Структура раздела

| Файл | Что внутри |
|------|------------|
| [pod-security.md](pod-security.md) | Pod Security Standards (Privileged/Baseline/Restricted), Pod Security Admission, постепенное внедрение (warn -> audit -> enforce), YAML-примеры для CI/CD |
| [security-context.md](security-context.md) | Полный разбор `securityContext`: `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation`, `capabilities.drop`, `seccompProfile`, `privileged` |
| [network-policies.md](network-policies.md) | NetworkPolicy: default-deny ingress/egress, микросементация, DNS-egress, типовые ошибки, YAML-шаблоны |
| [rbac.md](rbac.md) | RBAC: Role/ClusterRole/Binding, Least Privilege, аудит (`kubectl auth can-i`, `kubectl-who-can`), запрет опасных verbs |
| [cis-benchmark.md](cis-benchmark.md) | CIS Kubernetes Benchmark v1.8, kube-bench, приоритеты исправлений (P0/P1/P2), managed K8s-нюансы |
| [runtime-security.md](runtime-security.md) | Falco: eBPF-пробы, правила для reverse shell и криптомайнеров, Falcosidekick, интеграция с SIEM |

## Чек-лист самопроверки

- [ ] Pod Security Admission включён (минимум Baseline, цель Restricted)
- [ ] `securityContext` заполнен в каждом Pod/Deployment (не просто в документации)
- [ ] NetworkPolicy default-deny висит на каждом namespace
- [ ] RBAC: RoleBinding только на уровне namespace, ClusterRoleBinding — по исключению
- [ ] kube-bench запущен, критические CIS-контроли закрыты
- [ ] Falco установлен, алерты идут в SIEM/чат

## Связанные разделы

- [DevSecOps](../devsecops/README.md) — встраивание проверок в CI/CD
- [Security Misconfiguration](../web-security/security-misconfiguration.md) — общая тема misconfiguration
- [Threat Modeling](../threat-modeling/README.md) — модель угроз для Kubernetes-кластера