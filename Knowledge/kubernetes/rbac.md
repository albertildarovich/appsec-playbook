# RBAC: Least Privilege для доступа к API Kubernetes

> Как настроить Role-Based Access Control, чтобы скомпрометированный под не мог прочитать Secrets, создать привилегированный под или удалить весь кластер.

## Контекст

RBAC (Role-Based Access Control) в Kubernetes контролирует, **кто и что может делать с API Kubernetes**. Это не про доступ к приложению (это аутентификация/авторизация внутри приложения), а про доступ к **объектам кластера**: Pods, Secrets, ConfigMaps, Deployments, Services и т.д.

**Почему это важно для AppSec:**
- Если под имеет RBAC-доступ к Secrets — злоумышленник с RCE может прочитать **все** секреты в namespace
- Если под может создавать Deployments — он может задеплоить криптомайнер
- Если под может читать ConfigMaps — он может получить конфигурацию БД, токены API
- RBAC — это **контроль доступа к панели управления** кластером. Компрометация RBAC = компрометация кластера
- В отличие от NetworkPolicy (сетевой доступ) и securityContext (доступ внутри контейнера), RBAC защищает **доступ к Kubernetes API**

## Модель RBAC: 4 сущности

```
┌──────────────────────────────────────────────────────────────┐
│                        RBAC Model                            │
│                                                              │
│  Who?              What?              Where?                 │
│  ─────             ──────             ──────                 │
│  Subject     →     Role         →    RoleBinding            │
│                                                              │
│  • User            • Rules:          Привязывает             │
│  • Group             apiGroups,      Role к Subject          │
│  • ServiceAccount    resources,      в namespace             │
│                      verbs                                  │
│                                                              │
│  ClusterRole + ClusterRoleBinding = на весь кластер         │
└──────────────────────────────────────────────────────────────┘
```

| Сущность | Уровень | Описание |
|----------|---------|----------|
| **Role** | Namespace | Набор правил: к каким ресурсам и какие операции разрешены |
| **RoleBinding** | Namespace | Привязывает Role к пользователю/группе/ServiceAccount в namespace |
| **ClusterRole** | Cluster | То же, что Role, но для кластерных ресурсов (nodes, PV, namespaces) |
| **ClusterRoleBinding** | Cluster | Привязывает ClusterRole на уровне всего кластера |

### ServiceAccount — ключевая абстракция для подов

```
Пользователь (человек) → kubeconfig → User/Group
Под (приложение)        → ServiceAccount → Pod
```

Каждый под имеет **ровно один** ServiceAccount. Если не указан явно — используется `default` ServiceAccount в namespace. Именно ServiceAccount определяет, какие RBAC-права есть у пода.

## Как разработчик может ошибиться

### Ошибка 1: default ServiceAccount с правами

```yaml
# [NO] ПЛОХО: даём права default ServiceAccount.
# Теперь КАЖДЫЙ под в namespace может читать Secrets.
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: default-can-read-secrets
  namespace: production
subjects:
- kind: ServiceAccount
  name: default        # default SA в namespace
roleRef:
  kind: Role
  name: secret-reader
```

**Последствия:** любой скомпрометированный под (даже тот, которому права не нужны) может читать все Secrets в namespace.

**Исправление:** создавать отдельный ServiceAccount для каждого пода/Deployment, давать права только ему.

### Ошибка 2: ClusterRole привязана через RoleBinding (эскалация прав)

```yaml
# [NO] ОПАСНО: ClusterRole (кластерная) + RoleBinding (namespace-wide)
# Даёт права на чтение Secrets ВО ВСЕХ namespace (не только в текущем!)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-secrets-all-ns
  namespace: production
subjects:
- kind: ServiceAccount
  name: my-app
roleRef:
  kind: ClusterRole
  name: view              # Встроенная ClusterRole: read-only на всё
```

**Последствия:** ServiceAccount `my-app` получает read-only доступ ко всем namespace, а не только к `production`.

**Правило:** Никогда не используй ClusterRole с RoleBinding без аудита. Создавай отдельную Role в namespace.

### Ошибка 3: wildcard в resources или verbs

```yaml
# [NO] КАТАСТРОФА: "*" на resources и verbs = полный доступ к API
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: god-mode
  namespace: production
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
```

**Последствия:** под может создавать/удалять любые объекты, читать Secrets, создавать привилегированные поды, выполнять команды в других подах (через `pods/exec`).

### Ошибка 4: права на pods/exec

```yaml
# [NO] ОПАСНО: разрешает exec в другие поды
rules:
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
```

**Последствия:** злоумышленник может выполнить команду в любом поде, включая поды БД с mounted secrets.

### Ошибка 5: право на создание Role/RoleBinding (эскалация RBAC)

```yaml
# [NO] КРИТИЧНО: право на создание RoleBinding = можно дать себе любые права
rules:
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings"]
  verbs: ["*"]
```

**Последствия:** под может создать себе Role с `resources: ["*"]` и `verbs: ["*"]` — полный контроль над namespace/кластером.

## Как AppSec обнаружит: аудит RBAC

### Проверка прав конкретного ServiceAccount

```bash
# Посмотреть все RoleBindings/ClusterRoleBindings для ServiceAccount
kubectl auth can-i --list --as=system:serviceaccount:production:my-app

# Проверить конкретное действие
kubectl auth can-i get secrets \
  --as=system:serviceaccount:production:my-app
# Ответ: yes или no

# Проверить во всех namespace
kubectl auth can-i get secrets \
  --as=system:serviceaccount:production:my-app --all-namespaces
```

### Найти все поды с доступом к Secrets

```bash
# Найти ServiceAccount, которые могут читать Secrets
kubectl get rolebindings,clusterrolebindings -A -o json | jq -r '
  .items[] |
  select(.roleRef.name == "view" or .roleRef.name == "edit" or .roleRef.name == "cluster-admin") |
  "\(.metadata.namespace)/\(.metadata.name) → \(.subjects[]?.name)"
'

# Проверить, какие поды используют эти ServiceAccount
kubectl get pods -A -o json | jq -r '
  .items[] |
  "\(.metadata.namespace)/\(.metadata.name): SA=\(.spec.serviceAccountName)"
' | grep -v "SA=$"  # Пустой = default SA
```

### Найти опасные ClusterRoleBinding

```bash
# ClusterRoleBindings с cluster-admin
kubectl get clusterrolebindings -o json | jq -r '
  .items[] |
  select(.roleRef.name == "cluster-admin") |
  "\(.metadata.name): subjects=\(.subjects)"
'

# ClusterRoleBinding на system:anonymous (неаутентифицированные пользователи)
kubectl get clusterrolebindings -o json | jq -r '
  .items[] |
  select(.subjects[]?.name == "system:anonymous") |
  "\(.metadata.name) → anonymous users!"
'

# ClusterRoleBinding на system:unauthenticated
kubectl get clusterrolebindings -o json | jq -r '
  .items[] |
  select(.subjects[]?.name == "system:unauthenticated") |
  "\(.metadata.name) → unauthenticated users!"
'
```

### Найти поды с привилегированными ServiceAccount

```bash
# Поды, использующие ServiceAccount с RBAC-правами (кроме default)
kubectl get pods -A -o json | jq -r '
  .items[] |
  select(.spec.serviceAccountName != null and .spec.serviceAccountName != "default") |
  "\(.metadata.namespace)/\(.metadata.name): SA=\(.spec.serviceAccountName)"
'
```

## Как исправить: шаблон безопасной Role

### Шаг 1: Создать отдельный ServiceAccount для приложения

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-app
  namespace: production
  annotations:
    description: "ServiceAccount для backend-сервиса"
```

### Шаг 2: Создать минимальную Role (Least Privilege)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-role
  namespace: production
rules:
  # Чтение ConfigMap с настройками приложения
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["backend-config"]   # Только конкретный ConfigMap
    verbs: ["get"]

  # Чтение Secret с учётными данными БД
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["db-credentials"]   # Только конкретный Secret
    verbs: ["get"]

  # Запись в ConfigMap для leader election
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["backend-leader"]
    verbs: ["get", "update"]
```

### Шаг 3: Привязать Role к ServiceAccount

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: backend-app
roleRef:
  kind: Role
  name: backend-role
  apiGroup: rbac.authorization.k8s.io
```

### Шаг 4: Указать ServiceAccount в Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: production
spec:
  template:
    spec:
      serviceAccountName: backend-app   # Не default!
      automountServiceAccountToken: true
      containers:
      - name: backend
        image: backend:1.0
```

## Принцип Least Privilege для RBAC

```
Чек-лист для каждой Role:
  [ ] Только конкретные resources, не "*"
  [ ] Только конкретные resourceNames, где возможно
  [ ] Только нужные verbs (get, list, watch — read; create, update, patch — write)
  [ ] Никаких escalate, bind, impersonate verbs
  [ ] Никакого доступа к secrets без явной необходимости
  [ ] Никакого доступа к pods/exec (если не нужно)
  [ ] Никакого доступа к RBAC-объектам (roles, rolebindings)
  [ ] Role (не ClusterRole) для namespace-ограниченных прав
  [ ] Отдельный ServiceAccount на каждое приложение
  [ ] automountServiceAccountToken: false, если API-доступ не нужен
```

## Как предотвратить: инструменты и CI/CD

### kube-bench: CIS-контроли для RBAC

```bash
# Проверить RBAC-контроли (CIS 5.1.x)
kube-bench run --targets master --check 5.1

# CIS 5.1.1: Не использовать default ServiceAccount
# CIS 5.1.2: Минимизировать доступ к Secrets
# CIS 5.1.3: Минимизировать использование wildcard в RBAC
# CIS 5.1.4: Не использовать ClusterAdmin роль без необходимости
```

### kubectl-who-can: кто что может?

```bash
# Установка: kubectl krew install who-can

# Кто может читать Secrets в namespace production?
kubectl who-can get secrets -n production

# Кто может создавать Deployments?
kubectl who-can create deployments -A

# Кто может выполнять exec в поды?
kubectl who-can create pods/exec -A
```

### RBAC Audit в CI/CD пайплайне

```yaml
# .gitlab-ci.yml: проверка RBAC-манифестов перед деплоем
rbac-audit:
  stage: security
  script:
    - echo "=== RBAC Security Audit ==="

    # 1. Нет default ServiceAccount в RoleBinding
    - |
      if grep -r "name: default" k8s/rbac/; then
        echo "[NO] BLOCKED: RoleBinding uses default ServiceAccount"
        exit 1
      fi

    # 2. Нет wildcard resources "*"
    - |
      if yq eval '.rules[].resources[]' k8s/rbac/*.yaml | grep -q '^\*$'; then
        echo "[NO] BLOCKED: Rule uses resources: [\"*\"]"
        exit 1
      fi

    # 3. Нет wildcard verbs "*"
    - |
      if yq eval '.rules[].verbs[]' k8s/rbac/*.yaml | grep -q '^\*$'; then
        echo "[NO] BLOCKED: Rule uses verbs: [\"*\"]"
        exit 1
      fi

    # 4. Нет ClusterRole с RoleBinding (эскалация)
    - |
      for rb in k8s/rbac/rolebinding-*.yaml; do
        if yq eval '.roleRef.kind' "$rb" | grep -q ClusterRole; then
          echo "[WARN] $rb uses ClusterRole with RoleBinding (potential escalation)"
        fi
      done

    # 5. Нет доступа к secrets без resourceNames
    - |
      if yq eval '.rules[] | select(.resources[] == "secrets")' k8s/rbac/*.yaml | grep -v resourceNames; then
        echo "[WARN] Role has access to ALL secrets (no resourceNames restriction)"
      fi

    echo "[OK] RBAC audit passed"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Разбор опасных прав

| Право | Почему опасно | Альтернатива |
|-------|--------------|-------------|
| `secrets: ["*"]` | Чтение всех секретов, включая токены других SA | `secrets: ["get"]` + `resourceNames: ["my-secret"]` |
| `pods/exec: ["create"]` | Выполнение команд в любом поде | Не давать без крайней необходимости |
| `roles/rolebindings: ["*"]` | Можно дать себе cluster-admin | Никогда не давать прикладным SA |
| `nodes: ["*"]` | Доступ к метаданным узлов, cloud credentials | Никогда не давать прикладным SA |
| `namespaces: ["create"]` | Создание namespace и эксплуатация прав в нём | Не давать без необходимости |
| `clusterroles: ["bind"]` | Привязка ClusterRole = эскалация до cluster-admin | Никогда не давать прикладным SA |
| `*: ["impersonate"]` | Выполнение действий от имени другого пользователя/SA | Никогда не давать прикладным SA |
| `*: ["escalate"]` | Создание Role с правами выше своих | Никогда не давать прикладным SA |

## automountServiceAccountToken: когда отключать

Если поду **не нужен доступ к API Kubernetes**, отключи automountServiceAccountToken. Это предотвращает компрометацию токена SA.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend-app
  namespace: production
automountServiceAccountToken: false  # Токен не монтируется в под

---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      serviceAccountName: frontend-app
      # automountServiceAccountToken уже false на уровне SA,
      # но можно переопределить:
      # automountServiceAccountToken: false
      containers:
      - name: frontend
        image: frontend:1.0
```

**Проверка:** токен SA монтируется в `/var/run/secrets/kubernetes.io/serviceaccount/token`. Если поду не нужен API-доступ — этого файла быть не должно.

```bash
# Проверить, у каких подов есть токен SA
kubectl exec -it <pod> -- ls /var/run/secrets/kubernetes.io/serviceaccount/

# Найти все поды с automountServiceAccountToken: true (явно или неявно)
kubectl get pods -A -o json | jq -r '
  .items[] |
  select(.spec.automountServiceAccountToken != false) |
  "\(.metadata.namespace)/\(.metadata.name)"
'
```

## Чек-лист для AppSec-инженера

```
[ ] Ни один под не использует default ServiceAccount
[ ] Каждое приложение имеет отдельный ServiceAccount
[ ] Каждая Role ограничена конкретными resources и resourceNames
[ ] Ни одна Role не использует wildcard "*" в resources или verbs
[ ] Ни одна Role не даёт доступ ко всем secrets
[ ] Ни одна прикладная Role не даёт pods/exec
[ ] Ни одна прикладная Role не даёт доступ к RBAC-объектам
[ ] Ни одна прикладная Role не использует escalate/bind/impersonate
[ ] ClusterRole используется только для кластерных ресурсов
[ ] ClusterRoleBinding только для системных компонентов
[ ] automountServiceAccountToken: false для подов без API-доступа
[ ] Проверка RBAC в CI/CD (yq + grep по манифестам)
[ ] Периодический аудит через kubectl-who-can
[ ] kube-bench CIS 5.1 все пункты PASS
```

## Связь с другими разделами

- [Pod Security Standards](./pod-security.md) — что под может делать после запуска
- [securityContext](./security-context.md) — ограничения внутри контейнера
- [NetworkPolicy](./network-policies.md) — ограничения сетевого доступа
- [CIS Kubernetes Benchmark](./cis-benchmark.md) — CIS 5.1 (RBAC and Service Accounts)