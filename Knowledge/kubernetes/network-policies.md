# NetworkPolicy: default-deny и микросегментация

> Как ограничить сетевой доступ между подами и изолировать скомпрометированный сервис с помощью NetworkPolicy.

## Контекст

По умолчанию **в Kubernetes разрешён весь трафик между всеми подами во всех namespace**. Это означает: если злоумышленник получит RCE в одном поде, он может атаковать базу данных, Redis, внутренние API и другие сервисы по сети — без каких-либо ограничений.

NetworkPolicy — это встроенный firewall L3/L4, который ограничивает трафик на уровне IP-адресов и портов. Он требует **CNI-плагин с поддержкой NetworkPolicy** (Calico, Cilium, Weave, Antrea; **Flannel без дополнений не поддерживает**).

**Почему это важно для AppSec:**
- Без NetworkPolicy кластер — это **плоская сеть**, где любой скомпрометированный под может сканировать и атаковать все остальные
- NetworkPolicy реализует принцип **Least Privilege на сетевом уровне**: поду разрешено общаться только с теми, кто ему нужен
- Это ключевой элемент микросегментации и защиты от lateral movement

## Ментальная модель: от разрешённого всего к default-deny

```
Без NetworkPolicy:
  ┌─────┐     ┌─────┐     ┌─────┐
  │ Pod │────▶│ Pod │────▶│ Pod │    Всё разрешено
  │  A  │◀────│  B  │◀────│  C  │    между всеми
  └─────┘     └─────┘     └─────┘

С default-deny + явными разрешениями:
  ┌─────┐         ┌─────┐         ┌─────┐
  │ Pod │────────▶│ Pod │         │ Pod │
  │  A  │   :8080 │  B  │         │  C  │    Только явно
  └─────┘         └─────┘         └─────┘    разрешённый трафик
       │               ▲
       │    ┌─────┐    │ :5432
       └───▶│ DB  │────┘
            └─────┘
```

## Структура NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: my-policy
  namespace: my-app
spec:
  podSelector:        # К каким подам применяется политика
    matchLabels:
      app: backend
  policyTypes:        # Ingress, Egress, или оба
    - Ingress
    - Egress
  ingress:            # Кто может подключаться К этим подам
    - from: ...
      ports: ...
  egress:             # Куда эти поды могут подключаться
    - to: ...
      ports: ...
```

## Default-deny — первый и обязательный шаг

### Default-deny: запретить весь ingress-трафик

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}      # Пустой селектор = все поды в namespace
  policyTypes:
    - Ingress
  # ingress не указан = никто не может подключиться
```

### Default-deny: запретить весь egress-трафик

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  # egress не указан = поды не могут никуда подключиться
```

### Default-deny: полный (ingress + egress)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

**Стратегия внедрения default-deny:**

```
День 1:   Включаем default-deny-ingress для production namespace
          Сразу видим, что ломается — добавляем разрешающие правила

День 2-3: Добавляем конкретные ingress-правила для каждого сервиса

День 4:   Включаем default-deny-egress для production
          Сразу видим, какие внешние API/DNS нужны — добавляем правила

Неделя 2: Применяем ту же стратегию к staging, dev namespace
```

## Ingress-правила: кто может подключаться к поду

### Разрешить доступ от подов с определённым label

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend        # Применяется к backend-подам
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend   # Разрешён доступ ОТ frontend-подов
      ports:
        - protocol: TCP
          port: 8080          # Только на порт 8080
```

### Разрешить доступ из другого namespace

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-monitoring
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring    # Разрешён доступ из namespace monitoring
      ports:
        - protocol: TCP
          port: 9090             # Prometheus metrics
```

### Разрешить доступ с определённых IP-блоков (админы, VPN, офис)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-office
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: admin-panel
  policyTypes:
    - Ingress
  ingress:
    - from:
        - ipBlock:
            cidr: 10.0.0.0/8      # Офисная сеть
            except:
              - 10.0.0.0/24       # Кроме гостевого WiFi
      ports:
        - protocol: TCP
          port: 443
```

### Комбинированное правило: frontend ИЛИ monitoring

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-multiple-sources
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    # Правило 1: от frontend
    - from:
        - podSelector:
            matchLabels:
              role: frontend
      ports:
        - protocol: TCP
          port: 8080
    # Правило 2: от monitoring (отдельное правило = OR)
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
      ports:
        - protocol: TCP
          port: 9090
```

**Важно про логику OR/AND в NetworkPolicy:**

```
Правила внутри одного from: объединяются через AND
  from:
    - podSelector: {app: frontend}
      namespaceSelector: {name: production}
  # = под должен быть И в production, И иметь label app=frontend

Разные элементы в массиве ingress: объединяются через OR
  ingress:
    - from: [...]  # Правило 1
    - from: [...]  # Правило 2
  # = трафик разрешён, если подходит Правило 1 ИЛИ Правило 2
```

## Egress-правила: куда под может подключаться

### Разрешить DNS-запросы (без них ничего не работает)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    # DNS на UDP 53 (kube-dns/CoreDNS)
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    # DNS на TCP 53 (для ответов > 512 байт)
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: TCP
          port: 53
```

### Разрешить доступ к конкретной базе данных

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-to-database
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Egress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
```

### Разрешить доступ к внешним API (по IP или CIDR)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-to-external-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 203.0.113.0/24    # Внешний API-провайдер
      ports:
        - protocol: TCP
          port: 443
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0          # Весь интернет (для HTTPS)
            except:
              - 10.0.0.0/8           # Кроме внутренней сети
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - protocol: TCP
          port: 443
```

**NB:** `ipBlock: 0.0.0.0/0 except внутренние сети` — распространённый паттерн, который разрешает выход в интернет, но блокирует доступ к внутренним сервисам. Это предотвращает SSRF-атаки на внутренние сервисы.

## Реальный пример: микросегментация трёхзвенного приложения

```
Архитектура:
  frontend (port 80) → backend (port 8080) → postgres (port 5432)
                                    ↓
                              redis (port 6379)
```

### Шаг 1: default-deny для namespace

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: app
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### Шаг 2: разрешить ingress от ingress-controller к frontend

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-frontend
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 80
```

### Шаг 3: frontend → backend

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
```

### Шаг 4: backend egress к postgres и redis

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-egress
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Egress
  egress:
    # DNS (обязательно для разрешения имён)
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
    # К postgres
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    # К redis
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

### Шаг 5: ingress к postgres и redis только от backend

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-db
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 5432
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-redis
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 6379
```

## Как проверить работающие NetworkPolicy

```bash
# Все NetworkPolicy в namespace
kubectl get networkpolicies -n production

# Детальный просмотр конкретной политики
kubectl describe networkpolicy allow-frontend-to-backend -n production

# Найти namespace БЕЗ default-deny
kubectl get networkpolicies -A -o json | jq -r '
  .items |
  group_by(.metadata.namespace) |
  .[] |
  {
    ns: .[0].metadata.namespace,
    has_deny_all: (map(select(.spec.podSelector == {} and .spec.ingress == null)) | length > 0)
  } |
  select(.has_deny_all == false) |
  .ns
'

# Проверить связность: может ли под A достучаться до пода B
kubectl exec -it pod-a -- curl -m 2 http://pod-b-ip:8080
# Если default-deny работает, curl должен упасть с timeout
```

## Инструменты для тестирования NetworkPolicy

### netcat/nc — простой тест связности

```bash
# Создаём временный под для тестов
kubectl run test-pod --rm -it --image=alpine -- sh

# Внутри пода:
nc -zv backend-service 8080    # TCP на 8080
nc -zvu kube-dns 53            # UDP на 53
wget -O- http://internal-api   # HTTP-запрос
```

### NetworkPolicy Editor (визуальный)

Интерактивный редактор для визуализации NetworkPolicy:
https://editor.networkpolicy.io/

Позволяет нарисовать мапу подов и связей, сгенерировать YAML.

## Типичные ошибки

### Ошибка 1: забыли DNS egress с default-deny

```yaml
# Симптом: включили default-deny-egress, всё перестало работать.
# Причина: поды не могут разрешать DNS-имена.
# Фикс: добавить egress-правило для DNS в kube-system.
```

См. правило «allow-dns» выше. Это самая частая ошибка при внедрении NetworkPolicy.

### Ошибка 2: порты для DNS только UDP, забыли TCP

```
DNS использует UDP 53 для обычных запросов,
но TCP 53 для ответов > 512 байт (DNSSEC, большие ответы).
Если разрешить только UDP — будут загадочные сбои резолвинга.
```

### Ошибка 3: IP-блоки без except внутренних сетей

```yaml
# [NO] ОПАСНО: разрешает доступ ко всем внутренним сервисам по HTTPS
egress:
  - to:
      - ipBlock:
          cidr: 0.0.0.0/0
    ports:
      - protocol: TCP
        port: 443

# [OK] Безопасно: доступ в интернет, но не к внутренним сервисам
egress:
  - to:
      - ipBlock:
          cidr: 0.0.0.0/0
          except:
            - 10.0.0.0/8
            - 172.16.0.0/12
            - 192.168.0.0/16
    ports:
      - protocol: TCP
        port: 443
```

### Ошибка 4: не учтены readiness/liveness probes от kubelet

```
kubelet выполняет health checks С УЗЛА, не из пода.
Эти проверки не проходят через NetworkPolicy.
Но если используется сервисная сетка (Istio/Linkerd), probes могут идти
через sidecar и тогда NetworkPolicy на них влияет.
```

### Ошибка 5: парный default-deny-ingress, но забыли про egress

```
Ingress защищает ОТ внешних атак на под.
Egress защищает ОТ lateral movement ИЗ пода.
Если злоумышленник получил RCE — egress-политики не дадут ему
подключиться к БД, Redis, или скачать вредоносный payload.
```

## Чек-лист для AppSec-инженера

```
[ ] CNI плагин поддерживает NetworkPolicy (Calico, Cilium, Weave)
[ ] default-deny-ingress для каждого прикладного namespace
[ ] default-deny-egress для каждого прикладного namespace
[ ] Явные ingress-правила для каждого сервиса (кто может подключиться)
[ ] Правило для DNS egress (UDP + TCP 53 на kube-dns/CoreDNS)
[ ] Явные egress-правила для внешних API (через ipBlock с except)
[ ] Ingress от ingress-controller только на нужные порты
[ ] БД/Redis доступны только от backend (не от фронтенда, не от всех)
[ ] Monitoring namespace имеет явный доступ к metrics-портам
[ ] Ни одного правила с podSelector: {} без явных ingress/egress (это default-deny)
```

## Связь с другими разделами

- [Pod Security Standards](./pod-security.md) — ограничения на уровне пода
- [securityContext](./security-context.md) — ограничения на уровне контейнера
- [RBAC](./rbac.md) — контроль доступа к API Kubernetes
- [CIS Kubernetes Benchmark](./cis-benchmark.md) — CIS 5.3 (Network Policies)
- [Threat Modeling: STRIDE](../../Knowledge/threat-modeling/stride.md) — Information Disclosure, Elevation of Privilege