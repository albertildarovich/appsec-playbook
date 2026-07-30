# Pod Security Standards / Pod Security Admission

> Как запретить запуск привилегированных подов, ограничить volumes, capabilities и другие опасные настройки через встроенный механизм Kubernetes.

## Контекст

Pod Security Standards — это набор требований безопасности к подам, определённых Kubernetes upstream. Pod Security Admission (PSA) — встроенный admission controller, который с Kubernetes 1.25+ пришёл на смену устаревшему PodSecurityPolicy (PSP). PSA применяет один из трёх уровней к namespace'ам через label.

**Почему это важно для AppSec:**
- Privileged-поды в Kubernetes — это аналог `docker run --privileged`. Компрометация такого пода = компрометация узла
- Без PSA разработчик может случайно задеплоить под с `hostNetwork: true`, `hostPID: true` или `privileged: true`
- PSA — это **первая линия защиты**, которая предотвращает опасную конфигурацию до того, как под попадёт в кластер

## Три уровня Pod Security Standards

```
┌─────────────────────────────────────────────────────────────┐
│                     Pod Security Levels                      │
├──────────────┬──────────────────┬───────────────────────────┤
│              │                  │                           │
│  Privileged  │    Baseline      │     Restricted            │
│              │                  │                           │
│  Без         │  Минимальные     │  Жёсткие                  │
│  ограничений │  ограничения     │  ограничения              │
│              │                  │                           │
│  • Всё       │  • Запрещены     │  • Всё из Baseline +      │
│    разрешено │    hostPath,     │  • Только              │
│              │    hostNetwork,  │    capabilities          │
│              │    hostPID,      │  • Запрещён              │
│              │    privileged    │    privilege escalation   │
│              │                  │  • Seccomp/AppArmor       │
│              │                  │  • runAsNonRoot           │
│              │                  │  • readOnlyRootFilesystem│
└──────────────┴──────────────────┴───────────────────────────┘
```

| Уровень | Целевая нагрузка | Пример |
|---------|-----------------|--------|
| **Privileged** | Системные компоненты, CNI, мониторинг узлов | kube-proxy, Calico, Fluentd (агент) |
| **Baseline** | Большинство приложений, не требующих повышения прав | API-сервисы, бэкенды, фронтенды |
| **Restricted** | Высокочувствительные нагрузки, multi-tenant кластеры | SaaS-платформа с tenant isolation, финансовые сервисы |

## Что конкретно запрещает/требует каждый уровень

### Privileged

Никаких ограничений. Под может использовать **всё**, включая `privileged: true`, `hostNetwork`, `hostPID`, `hostIPC`, `hostPath` volumes, любые capabilities.

**Когда использовать:** только для системных компонентов, которым действительно нужен доступ к хосту. **Никогда** для прикладных сервисов.

### Baseline

Запрещает **известные опасные практики**:

```
[NO] ЗАПРЕЩЕНО:
  hostProcess           — Windows-контейнеры с доступом к хосту
  hostNetwork           — доступ к сетевому стеку узла
  hostPID               — видимость процессов хоста
  hostIPC               — доступ к IPC-ресурсам хоста
  hostPath volumes      — монтирование файловой системы узла
  privileged containers — запуск с --privileged
  CAP_SYS_ADMIN         — почти эквивалент root на узле (можно замаунтить /)
  CAP_NET_RAW           — raw sockets (сниффинг трафика)
  CAP_SYS_PTRACE        — ptrace других процессов
  procMount: Unmasked   — доступ к /proc хоста
```

Пример пода, который **пройдёт Baseline**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: baseline-ok
spec:
  containers:
  - name: app
    image: nginx:1.25
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
        add: ["NET_BIND_SERVICE"]  # Разрешено: порты < 1024
    ports:
    - containerPort: 8080
```

Пример пода, который **не пройдёт Baseline**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: baseline-blocked
spec:
  hostNetwork: true       # [NO] запрещено Baseline
  containers:
  - name: app
    image: nginx:1.25
    securityContext:
      capabilities:
        add: ["SYS_ADMIN"]  # [NO] запрещено Baseline
```

### Restricted

Всё из Baseline + жёсткие требования к изоляции:

```
[OK] ТРЕБУЕТСЯ:
  runAsNonRoot: true              — запуск от non-root пользователя
  readOnlyRootFilesystem: true    — read-only корневая ФС
  seccompProfile: RuntimeDefault  — seccomp-профиль (блокирует опасные системные вызовы)
  allowPrivilegeEscalation: false — запрет privilege escalation (setuid, capabilities)
  capabilities.drop: ["ALL"]      — сброс всех capabilities

[NO] ЗАПРЕЩЕНО (в дополнение к Baseline):
  Любые capabilities (кроме NET_BIND_SERVICE, если явно разрешены)
  Volumes кроме: configMap, csi, downwardAPI, emptyDir, ephemeral,
                 persistentVolumeClaim, projection, secret
  Изменение /proc через securityContext
```

Пример пода, совместимого с **Restricted**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: restricted-ok
spec:
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      runAsNonRoot: true
      runAsUser: 1001
      runAsGroup: 1001
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
      seccompProfile:
        type: RuntimeDefault
    volumeMounts:
    - name: tmp
      mountPath: /tmp        # Единственное место для записи
    - name: config
      mountPath: /app/config
      readOnly: true
  volumes:
  - name: tmp
    emptyDir: {}              # Разрешённый тип volume
  - name: config
    configMap:
      name: app-config        # Разрешённый тип volume
```

## Как включить Pod Security Admission

### Применение к namespace через label

```bash
# Restricted — самый строгий уровень (рекомендуется для большинства)
kubectl label namespace my-app \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest

# Baseline — для приложений, которым нужны нестандартные capabilities
kubectl label namespace monitoring \
  pod-security.kubernetes.io/enforce=baseline \
  pod-security.kubernetes.io/enforce-version=latest

# Privileged — только для системных компонентов
kubectl label namespace kube-system \
  pod-security.kubernetes.io/enforce=privileged \
  pod-security.kubernetes.io/enforce-version=latest
```

### Три режима работы PSA

| Label | Назначение | Поведение |
|-------|-----------|-----------|
| `pod-security.kubernetes.io/enforce` | Принудительное применение | Под **отклоняется**, если нарушает политику |
| `pod-security.kubernetes.io/audit` | Аудит | Под создаётся, нарушение пишется в audit log |
| `pod-security.kubernetes.io/warn` | Предупреждение | Под создаётся, разработчик видит warning |

**Стратегия внедрения PSA в компании:**

```
Неделя 1-2:   warn=restricted   — мониторим, какие поды нарушают
Неделя 3-4:   audit=restricted  — добавляем аудит
Неделя 5-6:   enforce=baseline  — включаем минимальные ограничения
Неделя 7-8:   enforce=restricted — полный enforce для новых namespace
Месяц 3+:     enforce=restricted — для всех namespace (кроме системных)
```

### Пример: пошаговое ужесточение

```bash
# Шаг 1: Включаем warn-режим, смотрим логи
kubectl label namespace production \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/warn-version=latest

# Шаг 2: Проверяем предупреждения при создании пода
kubectl run test --image=nginx --dry-run=server 2>&1 | grep Warning

# Шаг 3: После исправления всех подов — включаем enforce
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  --overwrite
```

## Валидация через утилиты

### kube-bench проверка CIS-контролов PSA

```bash
# Проверить, что PSA включён (CIS 5.2.1-5.2.4)
kube-bench run --targets master --check 5.2

# Проверить все namespace на соответствие restricted
kubectl get ns -o json | jq '.items[] | {
  name: .metadata.name,
  enforce: .metadata.labels["pod-security.kubernetes.io/enforce"],
  audit: .metadata.labels["pod-security.kubernetes.io/audit"]
}'
```

### Проверка текущих подов на соответствие Restricted

```bash
# Найти поды, которые не пройдут Restricted
kubectl get pods -A -o json | jq -r '
  .items[] |
  select(.spec.containers[].securityContext.runAsNonRoot != true or
         .spec.containers[].securityContext.readOnlyRootFilesystem != true) |
  "\(.metadata.namespace)/\(.metadata.name)"
'
```

### OPA/Gatekeeper как альтернатива PSA

Если нужно больше гибкости, чем даёт PSA, можно использовать OPA Gatekeeper:

```rego
# Пример: запрет подов без runAsNonRoot через Gatekeeper
package k8srunasnonroot

violation[{"msg": msg}] {
  container := input.review.object.spec.containers[_]
  not container.securityContext.runAsNonRoot == true
  msg := sprintf("Container %v must set runAsNonRoot: true", [container.name])
}
```

## Типичные ошибки и как исправлять

### Ошибка 1: «Под требует SYS_ADMIN или привилегий»

**Симптом:** PSA отклоняет под с `capabilities.add: [SYS_ADMIN]`.

**Анализ:** В 90% случаев приложению не нужен `SYS_ADMIN`. Обычно это следствие копирования Docker Compose или устаревшей документации.

**Исправление:**

```yaml
# Было (плохо):
securityContext:
  capabilities:
    add: ["SYS_ADMIN"]

# Стало (хорошо):
securityContext:
  capabilities:
    drop: ["ALL"]
  # Если приложению нужен конкретный capability — добавляем только его
  # add: ["NET_BIND_SERVICE"]
```

### Ошибка 2: «ReadOnlyRootFilesystem ломает приложение»

**Симптом:** Приложение падает, потому что не может писать в `/tmp`, `/var/log`, или рабочий каталог.

**Исправление:** Монтируем `emptyDir` туда, куда приложению нужно писать:

```yaml
spec:
  containers:
  - name: app
    securityContext:
      readOnlyRootFilesystem: true
    volumeMounts:
    - name: tmp
      mountPath: /tmp          # Временные файлы
    - name: cache
      mountPath: /app/cache    # Кеш приложения
    - name: logs
      mountPath: /var/log      # Логи (если не stdout/stderr)
  volumes:
  - name: tmp
    emptyDir: {}
  - name: cache
    emptyDir: {}
  - name: logs
    emptyDir: {}
```

### Ошибка 3: «Контейнер запускается от root»

**Симптом:** `runAsNonRoot` блокирует под, потому что образ по умолчанию запускается от `root` (UID 0).

**Исправление:** Создать `Dockerfile` с non-root пользователем:

```dockerfile
# Multi-stage build — минимизируем attack surface
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /app/server /server
USER 65532:65532       # nonroot user в distroless
ENTRYPOINT ["/server"]
```

Или через securityContext в манифесте (если образ менять нельзя):

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      runAsNonRoot: true
      runAsUser: 1001
      runAsGroup: 1001
```

## Чек-лист для AppSec-инженера

```
[ ] Все прикладные namespace помечены enforce=restricted
[ ] Системные namespace (kube-system, monitoring) — enforce=baseline минимум
[ ] Ни один прикладной namespace не использует enforce=privileged
[ ] Включён audit-режим для обнаружения нарушений до enforce
[ ] runAsNonRoot: true на всех прикладных контейнерах
[ ] readOnlyRootFilesystem: true (с emptyDir для путей на запись)
[ ] allowPrivilegeEscalation: false
[ ] capabilities.drop: ["ALL"] во всех SecurityContext
[ ] Seccomp профиль RuntimeDefault (или AppArmor)
[ ] Проверка через kube-bench / OPA / Kyverno
```

## Связь с другими разделами

- [securityContext](../kubernetes/security-context.md) — детальный разбор securityContext
- [CIS Kubernetes Benchmark](../kubernetes/cis-benchmark.md) — полный чек-лист CIS
- [Docker security](../../Knowledge/docker-security/README.md) — hardened Dockerfile + CIS Docker