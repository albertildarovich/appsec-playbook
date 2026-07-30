# securityContext: полный разбор

> Как настроить `securityContext` на уровне Pod и Container, чтобы контейнер не мог эскалировать привилегии, даже если злоумышленник получит RCE.

## Контекст

`securityContext` — это основная точка контроля безопасности контейнера в Kubernetes. Все настройки: от пользователя, от которого запускается процесс, до capabilities и seccomp-профилей — задаются здесь.

**Почему это важно для AppSec:**
- Контейнер без `securityContext` запускается от root (UID 0) с широким набором capabilities — **стандартное поведение Docker/Kubernetes**
- Если злоумышленник проэксплуатирует уязвимость в приложении (RCE), его возможности внутри контейнера определяются именно `securityContext`
- Правильный `securityContext` делает RCE **бесполезной** — злоумышленник не сможет установить инструменты, прочитать чувствительные файлы или выйти на узел
- `securityContext` — это **последний рубеж обороны** в модели Defense in Depth для контейнеров

## Два уровня securityContext

```
┌─────────────────────────────────────────────────────┐
│                    Pod                              │
│  ┌───────────────────────────────────────────────┐  │
│  │  spec.securityContext (уровень Pod)            │  │
│  │                                               │  │
│  │  • runAsUser / runAsGroup                     │  │
│  │  • fsGroup                                     │  │
│  │  • seccompProfile                              │  │
│  │  • sysctls                                     │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  containers[].securityContext            │  │  │
│  │  │  (уровень Container — переопределяет Pod)│  │  │
│  │  │                                          │  │  │
│  │  │  • runAsUser / runAsGroup                │  │  │
│  │  │  • runAsNonRoot                          │  │  │
│  │  │  • readOnlyRootFilesystem                │  │  │
│  │  │  • allowPrivilegeEscalation              │  │  │
│  │  │  • capabilities (drop/add)               │  │  │
│  │  │  • privileged                            │  │  │
│  │  │  • seccompProfile                        │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Правило:** Container-level `securityContext` переопределяет Pod-level для пересекающихся параметров. Настройки, специфичные для контейнера (capabilities, privileged), задаются только на уровне Container.

## Разбор каждого параметра

### runAsNonRoot: true

**Самый важный параметр.** Запрещает запуск контейнера от UID 0 (root).

```
Угроза:  Контейнер от root → процесс имеет UID 0 внутри контейнера →
         при RCE злоумышленник может:
         • Установить пакеты (apt, apk, yum)
         • Записать в любую директорию
         • Использовать любые capabilities, которые не были сброшены
         • При пробросе сокета Docker — выйти на узел

Фикс:    runAsNonRoot: true + runAsUser: 1001
         Процесс работает от UID 1001.
         При RCE злоумышленник ограничен правами пользователя 1001.
```

**Пример:**

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      runAsNonRoot: true    # Под не запустится, если образ требует root
      runAsUser: 1001       # Явно задаём UID
      runAsGroup: 1001      # Явно задаём GID
```

**Проверка в Pod Security Standards:** Restricted требует `runAsNonRoot: true`.

### readOnlyRootFilesystem: true

Монтирует корневую файловую систему контейнера в режиме read-only.

```
Угроза:  Злоумышленник с RCE может:
         • Записать webshell в /app/static/
         • Модифицировать бинарники в /usr/bin/
         • Создать cron-задачу в /etc/cron.d/
         • Установить rootkit

Фикс:    readOnlyRootFilesystem: true
         Запись возможна только в явно смонтированные emptyDir/PVC.
```

**Пример с директориями для записи:**

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      readOnlyRootFilesystem: true
    volumeMounts:
    - name: tmp
      mountPath: /tmp              # Для временных файлов
    - name: app-cache
      mountPath: /app/cache        # Для кеша приложения
    - name: nginx-run
      mountPath: /var/run          # Для pid-файлов (nginx)
  volumes:
  - name: tmp
    emptyDir: {}
  - name: app-cache
    emptyDir: {}
  - name: nginx-run
    emptyDir: {}
```

**NB:** Некоторые приложения (например, nginx) ожидают возможность записи в `/var/run` для pid-файла. Нужно проверить и предоставить `emptyDir` для таких путей.

### allowPrivilegeEscalation: false

Запрещает процессу повышать привилегии через setuid-бинарники или добавление capabilities.

```
Угроза:  Без этого флага злоумышленник может:
         • Использовать setuid-бинарник (например, /usr/bin/sudo)
         • Выполнить newuidmap/newgidmap в user namespace
         • Получить capabilities, которые родительский процесс не имел

Фикс:    allowPrivilegeEscalation: false
         Ядро блокирует setuid и capability transitions через execve().
```

```yaml
securityContext:
  allowPrivilegeEscalation: false
```

**Важно:** Если `allowPrivilegeEscalation: false`, но не задан явный `runAsUser`, Kubernetes может не создать под с ошибкой — нужно всегда указывать оба параметра.

### capabilities: drop/add

Linux capabilities разбивают привилегии root на изолированные единицы. По умолчанию Docker/Kubernetes дают контейнеру ограниченный, но всё ещё опасный набор capabilities.

```
Capability              Угроза при наличии
──────────────────────────────────────────────────────
CAP_SYS_ADMIN           Монтирование ФС, namespace operations
CAP_NET_RAW             Raw sockets (сниффинг, ARP spoofing)
CAP_SYS_PTRACE          ptrace других процессов (дамп памяти)
CAP_SYS_MODULE          Загрузка модулей ядра
CAP_SYS_BOOT            Перезагрузка узла
CAP_SYS_TIME            Изменение системного времени
CAP_NET_ADMIN            Настройка сети, iptables
CAP_NET_BIND_SERVICE    Привязка к портам < 1024 (обычно безопасна)
CAP_SYS_CHROOT          chroot (побег из контейнера через /proc)
CAP_DAC_OVERRIDE        Обход проверок DAC (чтение/запись любых файлов)
CAP_DAC_READ_SEARCH     Чтение любых файлов + обход директорий
CAP_FOWNER              Обход проверок владельца файла
CAP_SETUID/CAP_SETGID   Изменение UID/GID (эскалация)
```

**Золотое правило:** `drop: ["ALL"]`, затем `add` только то, что действительно нужно.

```yaml
# Минимальный набор — ничего не добавляем
securityContext:
  capabilities:
    drop: ["ALL"]

# Если приложению нужен NET_BIND_SERVICE (порт < 1024)
securityContext:
  capabilities:
    drop: ["ALL"]
    add: ["NET_BIND_SERVICE"]

# [NO] НИКОГДА не давайте SYS_ADMIN. Если приложение просит — это баг.
# securityContext:
#   capabilities:
#     add: ["SYS_ADMIN"]   # = root на узле, если не включён seccomp
```

**Как определить, какие capabilities нужны приложению:**

```bash
# 1. Запускаем контейнер со strace, сбрасываем все capabilities
docker run --rm --cap-drop=ALL myapp:1.0

# 2. Если приложение падает — смотрим, какой capability нужен
#    Ошибка "cannot bind to port 80" → нужен NET_BIND_SERVICE
#    Ошибка "cannot change hostname" → нужен SYS_ADMIN (избегайте)

# 3. Альтернативно: используем --cap-add по одному, пока не заработает
docker run --rm --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp:1.0
```

### privileged: true/false

`privileged: true` даёт контейнеру **все** capabilities и доступ ко всем устройствам хоста. Это эквивалентно `docker run --privileged`.

```
[NO] privileged: true — ЭТО КАТАСТРОФА:

  • Все capabilities (включая CAP_SYS_ADMIN)
  • Доступ ко всем устройствам хоста (/dev/*)
  • Отключение защиты через AppArmor/SELinux
  • Отключение seccomp
  • Доступ к cgroups хоста

  Результат: компрометация контейнера = компрометация узла.
```

**Единственные легитимные случаи:** системные демоны (Docker-in-Docker, некоторые CNI-плагины). И то, лучше использовать `CAP_SYS_ADMIN` + конкретные устройства, а не `privileged: true`.

```yaml
# [NO] ТАК НЕ ДЕЛАТЬ:
securityContext:
  privileged: true

# [OK] Если действительно нужен доступ к устройствам — точечно:
securityContext:
  capabilities:
    add: ["SYS_ADMIN"]  # Всё равно опасно, но хотя бы не всё сразу
  # + конкретные устройства через volumes
```

### seccompProfile

Seccomp (Secure Computing Mode) — механизм ядра Linux, который фильтрует системные вызовы, доступные процессу. Seccomp-профиль определяет, какие syscalls разрешены, а какие — нет.

```
Без seccomp:  300+ системных вызовов доступны
  ↓
C RuntimeDefault: ~300 → ~60 опасных заблокированы
  (clone, mount, ptrace, reboot, kexec_load, ...)
  ↓
Custom профиль: только те syscalls, которые реально нужны приложению
```

**Рекомендация:** как минимум `RuntimeDefault` для всех контейнеров.

```yaml
# Минимальный уровень — RuntimeDefault
securityContext:
  seccompProfile:
    type: RuntimeDefault

# Для максимальной изоляции — Localhost с кастомным профилем
securityContext:
  seccompProfile:
    type: Localhost
    localhostProfile: profiles/myapp-seccomp.json
```

**Пример кастомного seccomp-профиля (минимальный для nginx):**

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    { "names": ["accept", "bind", "listen", "connect", "socket"],
      "action": "SCMP_ACT_ALLOW" },
    { "names": ["read", "write", "close", "openat", "stat"],
      "action": "SCMP_ACT_ALLOW" },
    { "names": ["epoll_create1", "epoll_ctl", "epoll_wait"],
      "action": "SCMP_ACT_ALLOW" },
    { "names": ["futex", "mprotect", "brk", "mmap"],
      "action": "SCMP_ACT_ALLOW" },
    { "names": ["exit_group", "exit"],
      "action": "SCMP_ACT_ALLOW" }
  ]
}
```

### runAsUser / runAsGroup / fsGroup

Явно задают UID/GID, от которых работает процесс, и группу для томов.

```yaml
spec:
  # Pod-level: общие настройки для всех контейнеров
  securityContext:
    runAsUser: 1001      # UID процесса (не 0!)
    runAsGroup: 1001      # GID процесса
    fsGroup: 1001         # Группа-владелец для монтируемых томов

  containers:
  - name: app
    # Container-level: можно переопределить
    securityContext:
      runAsUser: 1001
      runAsGroup: 1001
      runAsNonRoot: true
```

**Зачем нужен fsGroup:** Если под запускается от UID 1001, а том смонтирован с правами root:root — приложение не сможет писать. `fsGroup: 1001` рекурсивно меняет владельца всех файлов в томе на GID 1001.

## Полный hardened securityContext (шаблон для копирования)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hardened-app
spec:
  securityContext:          # Pod-level
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault

  containers:
  - name: app
    image: myapp:1.0
    securityContext:        # Container-level
      # Пользователь
      runAsNonRoot: true
      runAsUser: 1001
      runAsGroup: 1001

      # Файловая система
      readOnlyRootFilesystem: true

      # Защита от эскалации
      allowPrivilegeEscalation: false
      privileged: false

      # Capabilities
      capabilities:
        drop: ["ALL"]
        # add: ["NET_BIND_SERVICE"]  # только если нужен порт < 1024

      # Seccomp (если не задан на Pod-level)
      seccompProfile:
        type: RuntimeDefault

    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: cache
      mountPath: /app/cache

  volumes:
  - name: tmp
    emptyDir: {}
  - name: cache
    emptyDir: {}
```

## Как проверить securityContext у работающих подов

```bash
# Посмотреть настройки всех контейнеров в поде
kubectl get pod <pod-name> -o json | jq '
  .spec.containers[].securityContext
'

# Найти все поды с privileged: true
kubectl get pods -A -o json | jq -r '
  .items[] |
  select(.spec.containers[].securityContext.privileged == true) |
  "\(.metadata.namespace)/\(.metadata.name)"
'

# Найти поды без runAsNonRoot
kubectl get pods -A -o json | jq -r '
  .items[] |
  select(.spec.containers[].securityContext.runAsNonRoot != true) |
  "\(.metadata.namespace)/\(.metadata.name) (runAsNonRoot missing)"
'

# Найти поды без readOnlyRootFilesystem
kubectl get pods -A -o json | jq -r '
  .items[] |
  select(.spec.containers[].securityContext.readOnlyRootFilesystem != true) |
  "\(.metadata.namespace)/\(.metadata.name) (readOnlyRootFS missing)"
'

# Найти поды, где не сброшены все capabilities
kubectl get pods -A -o json | jq -r '
  .items[] |
  select(.spec.containers[].securityContext.capabilities.drop | index("ALL") == null) |
  "\(.metadata.namespace)/\(.metadata.name) (capabilities ALL not dropped)"
'
```

## Интеграция в CI/CD

### Проверка через kubeconform/kube-linter

```bash
# kube-linter — проверяет манифесты на best practices
kube-linter lint pod.yaml

# Типичные warnings, которые должен блокировать CI:
# - "runAsNonRoot is not set to true"
# - "readOnlyRootFilesystem is not set to true"
# - "capabilities.drop does not include ALL"
# - "container is privileged"
```

### GitLab CI: валидация securityContext в пайплайне

```yaml
# .gitlab-ci.yml
validate-k8s-security:
  stage: security
  script:
    # Проверка всех манифестов на обязательные securityContext
    - |
      for file in k8s/*.yaml; do
        echo "=== Checking $file ==="

        # runAsNonRoot: true
        if ! yq eval '.spec.containers[].securityContext.runAsNonRoot' "$file" | grep -q true; then
          echo "[NO] BLOCKED: $file missing runAsNonRoot: true"
          exit 1
        fi

        # readOnlyRootFilesystem: true
        if ! yq eval '.spec.containers[].securityContext.readOnlyRootFilesystem' "$file" | grep -q true; then
          echo "[NO] BLOCKED: $file missing readOnlyRootFilesystem: true"
          exit 1
        fi

        # allowPrivilegeEscalation: false
        if ! yq eval '.spec.containers[].securityContext.allowPrivilegeEscalation' "$file" | grep -q false; then
          echo "[NO] BLOCKED: $file missing allowPrivilegeEscalation: false"
          exit 1
        fi

        # capabilities.drop: ["ALL"]
        if ! yq eval '.spec.containers[].securityContext.capabilities.drop' "$file" | grep -q ALL; then
          echo "[NO] BLOCKED: $file missing capabilities.drop: [ALL]"
          exit 1
        fi

        # privileged: true (должно быть false или отсутствовать)
        if yq eval '.spec.containers[].securityContext.privileged' "$file" | grep -q true; then
          echo "[NO] BLOCKED: $file has privileged: true"
          exit 1
        fi
      done
      echo "[OK] All securityContext checks passed"
    - kube-linter lint k8s/
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Типичные ошибки

### Ошибка: задали securityContext на Pod, но не на Container

```yaml
# [NO] ПЛОХО: runAsNonRoot на Pod не защищает контейнеры,
#            которые переопределяют securityContext
spec:
  securityContext:
    runAsNonRoot: true
  containers:
  - name: app
    # securityContext не задан → унаследует Pod-level? НЕТ!
    # Контейнер без явного securityContext может иметь
    # allowPrivilegeEscalation: true по умолчанию!
```

**Исправление:** всегда задавать `securityContext` на обоих уровнях. Pod-level для общих настроек, Container-level — для обязательных.

### Ошибка: drop ALL, но add содержит опасный capability

```yaml
# [NO] ПЛОХО: формально drop ALL, но ADD переопределяет
securityContext:
  capabilities:
    drop: ["ALL"]
    add: ["ALL"]   # Это добавляет ВСЕ capabilities обратно!
```

### Ошибка: не задан seccompProfile

```yaml
# [NO] ПЛОХО: без seccomp доступно 300+ системных вызовов
#             clone(), mount(), ptrace() — всё работает
securityContext:
  runAsNonRoot: true
  capabilities:
    drop: ["ALL"]
  # seccompProfile отсутствует
```

## Чек-лист

```
[ ] runAsNonRoot: true
[ ] runAsUser задан явно (не 0)
[ ] readOnlyRootFilesystem: true
[ ] emptyDir/PVC для путей, куда приложению нужно писать
[ ] allowPrivilegeEscalation: false
[ ] privileged: false (или параметр опущен)
[ ] capabilities.drop: ["ALL"]
[ ] capabilities.add только то, что реально нужно (NET_BIND_SERVICE макс.)
[ ] seccompProfile: RuntimeDefault на Pod или Container
[ ] fsGroup задан, если используются тома на запись
[ ] Проверка в CI/CD через kube-linter или yq
```

## Связь с другими разделами

- [Pod Security Standards](./pod-security.md) — как PSA требует эти настройки на уровне namespace
- [Docker security](../../Knowledge/docker-security/README.md) — создание образов с non-root пользователем
- [CIS Kubernetes Benchmark](./cis-benchmark.md) — полный чек-лист CIS 5.2