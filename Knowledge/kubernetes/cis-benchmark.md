# CIS Kubernetes Benchmark

> Краткий чек-лист CIS Kubernetes Benchmark с практическими командами для проверки. Как использовать kube-bench для автоматизации аудита.

## Контекст

CIS (Center for Internet Security) Kubernetes Benchmark — это набор рекомендаций по безопасной конфигурации Kubernetes. Бенчмарк покрывает все компоненты: API server, controller manager, scheduler, etcd, kubelet, worker nodes и политики (RBAC, NetworkPolicy, Pod Security).

**Почему это важно для AppSec:**
- CIS Benchmark — это **индустриальный стандарт** харденинга Kubernetes. «Мы следуем CIS Benchmark» — это конкретный, измеримый ответ на вопрос «как вы защищаете кластер?»
- Большинство пентестов кластеров проверяют кластер именно по CIS-контролям
- kube-bench автоматизирует проверку, но **нужно понимать, что именно он проверяет** и как интерпретировать результаты
- Многие CIS-контроли реализуются через механизмы, которые мы разобрали в предыдущих разделах (Pod Security, RBAC, NetworkPolicy)

## Структура CIS Benchmark

CIS Kubernetes Benchmark v1.8 (актуальный для K8s 1.27+) состоит из 7 разделов:

| Раздел | Компонент | Ключевые темы |
|--------|----------|--------------|
| **1** | Control Plane Components | Конфигурация API server, etcd, controller manager, scheduler |
| **2** | etcd | TLS, аутентификация, peer communication |
| **3** | Control Plane Configuration | Файловая система, права доступа к конфигам |
| **4** | Worker Node Configuration | Kubelet, kube-proxy |
| **5** | Policies | RBAC, ServiceAccounts, Pod Security, NetworkPolicy, Secrets |
| **6** | Managed Services (EKS/AKS/GKE) | Cloud-специфичные контроли |
| **7** | Runtime Security | AppArmor, seccomp, Falco |

## Как проверять: kube-bench

### Установка и запуск

```bash
# Запуск как Job в кластере (рекомендуется)
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
kubectl logs -f job/kube-bench

# Запуск как Pod (интерактивный)
kubectl run kube-bench --rm -it --restart=Never \
  --image=aquasec/kube-bench:latest \
  --overrides='{"spec":{"hostPID":true}}' \
  -- check --targets master,node

# Локально через Docker
docker run --rm -v /etc:/etc:ro -v /var:/var:ro \
  aquasec/kube-bench:latest \
  check --targets master
```

### Фильтрация результатов

```bash
# Только FAIL
kube-bench check --targets master 2>/dev/null | grep FAIL

# Только по конкретному разделу (например, раздел 5 — Policies)
kube-bench check --targets master --check 5

# JSON-вывод для автоматизации
kube-bench check --targets master --json | jq '
  .Controls[] |
  select(.total_fail > 0) |
  {id: .id, description: .description, fail: .total_fail}
'
```

### Интерпретация результатов

```
[PASS] — контроль выполнен. Хорошо.
[FAIL] — контроль не выполнен. Требует исправления.
[WARN] — контроль не применим или требует ручной проверки.
[INFO] — информационное сообщение, не требует действия.
```

## Ключевые контроли (чек-лист для AppSec)

### Раздел 1: Control Plane (самое важное для аудита)

```
[ ] 1.1.1   У API server нет анонимного доступа (--anonymous-auth=false)
[ ] 1.1.2   API server использует RBAC (--authorization-mode=Node,RBAC)
[ ] 1.1.6   API server не использует небезопасный порт (--insecure-port=0)
[ ] 1.1.8   API server использует TLS 1.2+ (--tls-min-version=VersionTLS12)
[ ] 1.1.11  API server использует AlwaysPullImages admission plugin
[ ] 1.1.13  API server использует NodeRestriction admission plugin
[ ] 1.1.17  API server включает audit logging (--audit-log-path задан)
[ ] 1.1.21  API server включает PodSecurity admission plugin
[ ] 1.2.x   Scheduler и Controller Manager доступны только с localhost
[ ] 1.2.2   Controller Manager не использует небезопасный порт
```

**Как проверить API server вручную:**

```bash
# Если есть доступ к мастер-узлу:
ps aux | grep kube-apiserver

# Или через kubectl (если API server позволяет читать свои же настройки):
kubectl get pod -n kube-system kube-apiserver-master -o json | jq '
  .spec.containers[0].command
' | grep -E 'anonymous-auth|authorization-mode|tls-min-version|audit-log'
```

### etcd (раздел 2)

```
[ ] 2.1   etcd использует TLS для client connections (--cert-file, --key-file)
[ ] 2.2   etcd использует TLS для peer connections (--peer-cert-file)
[ ] 2.3   etcd не доступен снаружи (слушает только localhost)
```

### Worker Node (раздел 4 — kubelet)

```
[ ] 4.1.1   Kubelet использует TLS (--tls-cert-file, --tls-private-key-file)
[ ] 4.1.2   Kubelet отключает анонимный доступ (--anonymous-auth=false)
[ ] 4.1.5   Kubelet включает защиту от обхода авторизации (--authorization-mode=Webhook)
[ ] 4.1.8   Kubelet включает ротацию сертификатов (--rotate-certificates=true)
[ ] 4.2.6   Kubelet отключает read-only порт (--read-only-port=0)
[ ] 4.2.7   Kubelet использует защищённый порт (--port=10250)
[ ] 4.2.9   Kubelet включает защиту от модификации конфигурации ядра
```

**Как проверить kubelet на worker-узлах:**

```bash
# На узле:
ps aux | grep kubelet

# Или через kubectl (удалённый доступ к логам):
kubectl logs -n kube-system kubelet-<node> 2>/dev/null || \
  journalctl -u kubelet --no-pager | head -20
```

### Policies (раздел 5 — ключевой для AppSec)

```
[ ] 5.1.1   Ни один под не использует default ServiceAccount
[ ] 5.1.2   Минимизирован доступ к Secrets через RBAC
[ ] 5.1.3   Нет wildcard "*" в RBAC rules
[ ] 5.1.4   ClusterAdmin роль используется минимально
[ ] 5.2.1   Pod Security Admission включён (enforce=restricted)
[ ] 5.2.2   Минимизировано использование привилегированных контейнеров
[ ] 5.2.3   Минимизировано использование hostPath volumes
[ ] 5.2.5   Минимизировано использование hostNetwork/hostPID
[ ] 5.3.1   CNI поддерживает NetworkPolicy
[ ] 5.3.2   default-deny NetworkPolicy во всех namespace
[ ] 5.4.1   Secrets не хранятся в переменных окружения (предпочтительно mounted volumes)
[ ] 5.4.2   Secrets зашифрованы в etcd (encryption at rest)
```

**Как проверить encryption at rest для Secrets:**

```bash
# Проверить, что encryption configuration задана
kubectl get pod -n kube-system kube-apiserver-master -o json | jq '
  .spec.containers[0].command
' | grep encryption-provider-config

# Создать тестовый секрет и проверить, что в etcd он зашифрован
kubectl create secret generic test-encryption --from-literal=key=value

# На мастер-узле:
ETCDCTL_API=3 etcdctl --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  get /registry/secrets/default/test-encryption

# Если секрет в открытом виде — encryption at rest не работает
# Если бинарные данные — зашифрован
```

## Приоритизация: с чего начать

Если кластер в состоянии «как есть» и CIS показывает 100+ FAIL, вот порядок исправления по приоритетам:

```
P0 (немедленно):
  [ ] 1.1.1   anonymous-auth=false           — анонимный доступ к API
  [ ] 1.1.21  PodSecurity admission plugin    — без него нет защиты подов
  [ ] 2.3     etcd на localhost               — etcd доступен снаружи = катастрофа
  [ ] 5.1.4   Минимизировать ClusterAdmin     — избыточные права
  [ ] 5.3.2   default-deny NetworkPolicy      — плоская сеть

P1 (в течение недели):
  [ ] 1.1.8   TLS 1.2+                        — защита API server
  [ ] 1.1.17  Audit logging                   — без логов не видно атак
  [ ] 5.2.1   Pod Security Admission          — enforce restricted
  [ ] 5.4.2   Encryption at rest для Secrets  — защита секретов в etcd
  [ ] 4.1.2   kubelet anonymous-auth=false    — защита kubelet

P2 (в течение месяца):
  [ ] 4.2.6   kubelet read-only-port=0        — убираем небезопасный порт
  [ ] 5.1.1   Убрать default ServiceAccount   — изоляция подов
  [ ] 5.4.1   Secrets через mounted volumes   — безопасное хранение
  [ ] 5.2.3   Минимизировать hostPath         — изоляция от узла
  [ ] 5.2.5   Минимизировать hostNetwork      — изоляция сети
```

## Интеграция kube-bench в CI/CD

### GitLab CI: периодический аудит production-кластера

```yaml
# .gitlab-ci.yml: еженедельный запуск kube-bench на production-кластере
kube-bench-audit:
  stage: security
  image: aquasec/kube-bench:latest
  script:
    # Запуск kube-bench и сохранение отчёта
    - kube-bench check --targets master,node --json > kube-bench-report.json

    # Проверка: нет ли новых FAIL по сравнению с baseline
    - |
      NEW_FAILS=$(jq '[.Controls[] | select(.total_fail > 0)] | length' kube-bench-report.json)
      if [ "$NEW_FAILS" -gt "$BASELINE_FAILS" ]; then
        echo "[NO] New CIS failures detected: $NEW_FAILS (baseline: $BASELINE_FAILS)"
        echo "Check kube-bench-report.json for details"
        exit 1
      fi
      echo "[OK] CIS failures within baseline: $NEW_FAILS"

    # Публикация отчёта как артефакт
    - kube-bench check --targets master,node > kube-bench-report.txt
  artifacts:
    paths:
      - kube-bench-report.json
      - kube-bench-report.txt
    expire_in: 30 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"  # Только по расписанию
  variables:
    BASELINE_FAILS: "25"  # Текущий baseline — уменьшать со временем
```

### Prometheus-метрики из kube-bench

kube-bench может экспортировать результаты в формате Prometheus для Grafana-дашборда:

```bash
# Запуск kube-bench как DaemonSet с экспортом метрик
# Результат: метрика kube_bench_fail_total по каждому контролю
# Можно отслеживать динамику в Grafana
```

## CIS для managed Kubernetes (EKS/AKS/GKE)

В managed-кластерах часть контролей неприменима (control plane управляется провайдером). kube-bench умеет это учитывать:

```bash
# Для EKS
kube-bench check --targets master --benchmark eks-1.3

# Для AKS
kube-bench check --targets master --benchmark aks-1.3

# Для GKE
kube-bench check --targets master --benchmark gke-1.3

# Только worker-ноды (для managed кластеров)
kube-bench check --targets node
```

**Что остаётся на стороне клиента в managed-кластерах:**

```
[ ] RBAC (раздел 5.1)          — ваша ответственность
[ ] Pod Security (раздел 5.2)  — ваша ответственность
[ ] NetworkPolicy (раздел 5.3) — ваша ответственность
[ ] Secrets management (5.4)   — ваша ответственность
[ ] Node security (раздел 4)   — частично ваша (если managed node groups)
[ ] Control Plane (раздел 1-3) — ответственность провайдера
```

## Типичные ошибки при работе с CIS

### Ошибка 1: гнаться за 100% PASS

Некоторые контроли CIS неприменимы к конкретной архитектуре. Например, `1.1.11 AlwaysPullImages` может быть избыточным, если используется подпись образов. Не нужно исправлять WARN, которые не релевантны.

### Ошибка 2: исправлять только критические, игнорировать остальные

CIS — это не чек-лист «сделал/не сделал», а модель зрелости. Даже если P0 закрыты, P1 и P2 добавляют защиту от более сложных атак.

### Ошибка 3: не проверять после обновления кластера

При обновлении версии Kubernetes CIS-контроли могут измениться. После каждого обновления — прогонять kube-bench заново.

## Чек-лист для AppSec-инженера

```
[ ] kube-bench настроен и запускается (Job или CronJob)
[ ] Определён baseline количества FAIL (не гнаться за 0)
[ ] P0-контроли закрыты (anonymous-auth, etcd, PodSecurity, NetworkPolicy)
[ ] Encryption at rest работает для Secrets
[ ] Audit logging включён и пишет в защищённое хранилище
[ ] Кластер проверяется после каждого обновления версии
[ ] Результаты kube-bench экспортируются в мониторинг (Grafana)
[ ] Managed-кластеры проверяются с правильным benchmark-ом
```

## Связь с другими разделами

- [Pod Security Standards](./pod-security.md) — CIS 5.2.x
- [securityContext](./security-context.md) — CIS 5.2.x (capabilities, privileged)
- [NetworkPolicy](./network-policies.md) — CIS 5.3.x
- [RBAC](./rbac.md) — CIS 5.1.x
- [Runtime security (Falco)](./runtime-security.md) — CIS 7.x