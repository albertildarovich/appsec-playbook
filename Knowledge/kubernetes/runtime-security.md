# Runtime Security: Falco

> Как обнаружить атаку в реальном времени: Falco для обнаружения подозрительной активности внутри контейнеров и на узлах Kubernetes.

## Контекст

Pod Security Standards, securityContext, NetworkPolicy и RBAC — это **preventive controls** (предотвращение). Но ни один preventive control не даёт 100% гарантии. Runtime security — это **detective control**: обнаружение атаки, которая уже происходит.

Falco — это CNCF-проект (graduated), который мониторит системные вызовы (syscalls) ядра Linux и Kubernetes Audit Events в реальном времени. Он использует eBPF-модуль (предпочтительно) или kernel module для перехвата syscalls с минимальным overhead.

**Почему это важно для AppSec:**
- Если злоумышленник обошёл все preventive controls (например, через 0-day в ядре или неправильно настроенный securityContext) — только runtime security заметит атаку
- Falco видит то, что не видят логи приложения: запуск shell'а в контейнере, запись в `/etc/`, чтение секретных файлов, неожиданные сетевые соединения
- Falco может интегрироваться с SIEM (Splunk, ELK), отправлять алерты в Slack/Telegram/PagerDuty, или напрямую убивать поды через Kubernetes API
- Это последний рубеж обороны в модели Defense in Depth для Kubernetes

## Как работает Falco

```
┌──────────────────────────────────────────────────────────────┐
│                         Falco                               │
│                                                             │
│  Kernel Space:                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  eBPF probe / Kernel module                          │   │
│  │  Перехватывает системные вызовы (syscalls)            │   │
│  │  с минимальным overhead (~2-3% CPU)                  │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │ syscall stream                         │
│                     ▼                                        │
│  User Space:                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Falco engine (libsinsp + libscap)                    │   │
│  │  • Парсит syscalls в high-level события               │   │
│  │  • Обогащает метаданными (контейнер, под, namespace)  │   │
│  │  • Применяет правила (rules)                          │   │
│  │  • Генерирует алерты                                 │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │ alert                                  │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Outputs: stdout, syslog, HTTP(S), gRPC,             │   │
│  │           Slack, PagerDuty, Webhook, Falcosidekick   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Установка

### Через Helm (рекомендуется)

```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

# Установка с eBPF-драйвером (предпочтительно, не требует kernel headers)
helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set falco.driver.kind=ebpf \
  --set falco.json_output=true \
  --set falco.file_output.keep_alive=false \
  --set falcosidekick.enabled=true \
  --set falcosidekick.webui.enabled=true

# Проверить, что поды запущены
kubectl get pods -n falco
```

### Через DaemonSet вручную

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: falco
  namespace: falco
spec:
  selector:
    matchLabels:
      app: falco
  template:
    metadata:
      labels:
        app: falco
    spec:
      hostPID: true
      containers:
      - name: falco
        image: falcosecurity/falco:latest
        securityContext:
          privileged: true      # Нужен для загрузки eBPF/kernel module
        args:
          - /usr/bin/falco
          - --cri
          - /run/containerd/containerd.sock
          - -K
          - /var/run/secrets/kubernetes.io/serviceaccount/token
        volumeMounts:
        - mountPath: /host/var/run/docker.sock
          name: docker-socket
        - mountPath: /host/dev
          name: dev-fs
          readOnly: true
        - mountPath: /host/proc
          name: proc-fs
          readOnly: true
        - mountPath: /host/boot
          name: boot-fs
          readOnly: true
        - mountPath: /host/usr
          name: usr-fs
          readOnly: true
      volumes:
      - name: docker-socket
        hostPath:
          path: /var/run/docker.sock
      - name: dev-fs
        hostPath:
          path: /dev
      - name: proc-fs
        hostPath:
          path: /proc
      - name: boot-fs
        hostPath:
          path: /boot
      - name: usr-fs
        hostPath:
          path: /usr
```

## Ключевые правила (из коробки)

Falco поставляется с набором правил по умолчанию. Вот что они обнаруживают:

### 1. Запуск shell'а в контейнере

```
Правило: Terminal shell in container

Что ловит: Любой процесс bash, sh, zsh внутри контейнера.
Почему важно: Приложения не должны запускать shell. Если shell запущен —
               это либо разработчик дебажит (нарушение процесса), либо атакующий.

Алерт:
  "Terminal shell in container (user=<NA> container_id=<id>
   container_name=<name> shell=bash parent=<process>)"
```

**Пример: злоумышленник получает RCE через SQLi и запускает shell:**

```bash
# Злоумышленник в контейнере:
curl http://target/login -d "user=' OR 1=1--"
# RCE получен, запускаем shell:
/bin/bash -i
# Falco немедленно генерирует алерт
```

### 2. Запись в системные директории

```
Правило: Write below binary dir / Write below etc

Что ловит: Запись в /bin, /sbin, /usr/bin, /etc.
Почему важно: Атакующий может модифицировать бинарники (backdoor) или
               системную конфигурацию (cron, pam.d).

Алерт:
  "File below /etc opened for writing (user=root container=myapp)"
```

### 3. Чтение секретных файлов

```
Правило: Read sensitive file untrusted

Что ловит: Чтение /etc/shadow, /root/.bashrc, /etc/sudoers и др.
Почему важно: Атакующий пытается украсть credentials или информацию о системе.

Алерт:
  "Sensitive file opened for reading by non-trusted program
   (file=/etc/shadow container=myapp)"
```

### 4. Неожиданные сетевые соединения

```
Правило: Outbound connection to C2 server
         Inbound connection to unexpected port

Что ловит: Сетевые соединения на нестандартные порты,
           соединения с известными C2-серверами (через threat intelligence).
Почему важно: Reverse shell, эксфильтрация данных.

Алерт:
  "Outbound connection to unexpected port
   (container=myapp destination=10.0.0.5:4444)"
```

### 5. Privilege escalation внутри контейнера

```
Правило: Privilege escalation via setuid

Что ловит: Процесс меняет UID через setuid-бинарник.
Почему важно: Атакующий пытается получить права root внутри контейнера.

Алерт:
  "Setuid to root (container=myapp user=1001 became=0)"
```

### 6. Запуск контейнера с привилегиями

```
Правило: Launch privileged container

Что ловит: Kubernetes API Event: создание пода с privileged: true,
           hostNetwork, hostPID, hostIPC, или монтирование чувствительных hostPath.
Почему важно: Обнаруживает попытку обойти Pod Security Admission.

Алерт:
  "Privileged container started (container=bad-pod hostNetwork=true)"
```

### 7. Доступ к Kubernetes Secrets через API

```
Правило: Kubernetes secret accessed

Что ловит: Kubernetes Audit Event: чтение Secret через API.
Почему важно: Обнаруживает lateral movement через скомпрометированный SA.

Алерт:
  "K8s Secret accessed (user=system:serviceaccount:default:bad-sa secret=db-creds)"
```

## Кастомные правила для бизнес-логики

Falco позволяет писать правила под конкретные угрозы. Формат правил — YAML с макросами и условиями.

### Пример: обнаружение reverse shell

```yaml
# /etc/falco/falco_rules.local.yaml

- macro: known_shell_ports
  condition: (fd.sport=80 or fd.sport=443 or fd.sport=22 or fd.sport=8080)

- rule: Reverse Shell Detected
  desc: Outbound connection to unusual port with shell process
  condition: >
    spawned_process
    and container
    and proc.name in (bash, sh, zsh, dash)
    and evt.type = connect
    and fd.typechar = 4
    and not known_shell_ports
  output: >
    [REVERSE SHELL] Shell process %proc.name connected to
    %fd.rip:%fd.rport (container=%container.name pod=%k8s.pod.name
    namespace=%k8s.ns.name)
  priority: CRITICAL
  tags: [network, shell, attack, mitre_execution]
```

### Пример: криптомайнер

```yaml
- rule: Cryptominer Detected
  desc: Process connects to known mining pool
  condition: >
    spawned_process
    and container
    and (
      proc.cmdline contains "stratum+tcp://" or
      proc.cmdline contains "xmrig" or
      proc.cmdline contains "minerd" or
      proc.cmdline contains "cpuminer"
    )
  output: >
    [CRYPTOMINER] Process %proc.cmdline connecting to mining pool
    (container=%container.name pod=%k8s.pod.name)
  priority: CRITICAL
  tags: [crypto, attack, mitre_impact]
```

### Пример: чтение секретного файла не тем процессом

```yaml
- rule: Unauthorized Secret Access
  desc: Non-authorized process reads Kubernetes secret mount
  condition: >
    open_read
    and container
    and fd.name startswith /var/run/secrets/kubernetes.io/
    and not proc.name in (allowed-processes)
  output: >
    [SECRET ACCESS] Process %proc.name read Kubernetes SA token
    (container=%container.name pod=%k8s.pod.name)
  priority: WARNING
  tags: [secret, credential-access]
```

## Интеграция с алертингом

### Falcosidekick — роутер алертов

Falcosidekick — companion-компонент, который принимает алерты от Falco и направляет их в десятки систем: Slack, Teams, PagerDuty, Opsgenie, Datadog, Splunk, ELK, Kafka, AWS SNS/Lambda, Webhook.

```bash
# Helm-установка с настройкой Slack + Webhook
helm install falco falcosecurity/falco \
  --namespace falco \
  --set falcosidekick.enabled=true \
  --set falcosidekick.config.slack.webhookurl="https://hooks.slack.com/..." \
  --set falcosidekick.config.slack.minimumpriority="WARNING" \
  --set falcosidekick.config.webhook.address="http://siem.internal:8080/falco"
```

### Интеграция с реагированием (Response Engine)

Falco может **не только алертить, но и реагировать**:
- **Kill pod:** отправить DELETE на API пода через Kubernetes API
- **Network block:** применить NetworkPolicy, блокирующую egress-трафик пода
- **Node cordon:** отключить узел от планирования новых подов

```bash
# Пример: автоматическое удаление пода с reverse shell
# Настройка в falcosidekick или через кастомный webhook:

# 1. Falco обнаруживает reverse shell
# 2. Falcosidekick отправляет webhook на response-service
# 3. Response-service вызывает kubectl:
kubectl delete pod <detected-pod> -n <namespace> --force --grace-period=0
```

## Как проверить, что Falco работает

### Тест 1: запуск shell'а в контейнере

```bash
# Создать тестовый под
kubectl run test-falco --image=alpine --restart=Never -- sleep 300

# Запустить shell внутри
kubectl exec -it test-falco -- /bin/sh

# Посмотреть алерты Falco
kubectl logs -n falco -l app=falco --tail=20
# Ожидаемый алерт: "Terminal shell in container"
```

### Тест 2: чтение /etc/shadow

```bash
# Внутри пода
kubectl exec -it test-falco -- cat /etc/shadow
# Ожидаемый алерт: "Sensitive file opened for reading"
```

### Тест 3: создание привилегированного пода

```bash
# Попытка создать привилегированный под
kubectl run test-privileged --image=alpine --restart=Never \
  --overrides='{"spec":{"containers":[{"name":"test","image":"alpine",
  "securityContext":{"privileged":true}}]}}'
# Ожидаемый алерт: "Privileged container started"
# NB: PSA должен отклонить этот под ДО Falco, если настроен enforce=restricted
```

## Производительность и overhead

```
eBPF driver (рекомендуется):
  CPU overhead: ~2-3%
  Memory: ~50-100 MB на узел

Kernel module:
  CPU overhead: ~3-5%
  Memory: ~80-150 MB на узел
  Требует kernel headers

Событий в секунду (типичный production-узел):
  ~50,000 - 200,000 syscalls/сек
  Falco обрабатывает ~50,000 events/сек на ядро
```

## Типичные ошибки при внедрении

### Ошибка 1: включить и забыть

Falco без настройки алертинга — бесполезен. Если никто не видит алерты, атака остаётся незамеченной. **Первым делом после установки — настроить Falcosidekick + Slack/PagerDuty.**

### Ошибка 2: все правила включены, шум зашкаливает

В production-кластере на 100 подов Falco с правилами по умолчанию генерирует сотни алертов в минуту. Нужно:
1. Включить мониторинг на неделю в режиме `priority: DEBUG`
2. Проанализировать, какие алерты нормальны (false positives)
3. Добавить исключения (exceptions) для легитимной активности
4. Оставить только CRITICAL/HIGH для алертинга

```yaml
# Пример: исключение CI/CD-джобов из правила "Terminal shell"
- rule: Terminal shell in container
  ...
  exceptions:
  - name: ci_pipelines
    fields: [k8s.pod.label.job-type]
    comps: [=]
    values:
      - [ci]
      - [test]
      - [build]
```

### Ошибка 3: не мониторятся Kubernetes Audit Events

Falco может анализировать не только syscalls, но и Kubernetes Audit Events (запросы к API server). Это отдельный источник данных:

```bash
# Включение Kubernetes Audit Log мониторинга в Falco
helm install falco falcosecurity/falco \
  --namespace falco \
  --set falco.kubernetes.enabled=true \
  --set falco.kubernetes.auditLogPath=/var/log/k8s-audit.log
```

**Что дают Audit Events:**
- `kubectl exec` в поды (кто и когда выполнял команды)
- Создание/удаление ресурсов (кто что создавал)
- Чтение Secrets через API
- Изменение RBAC-правил
- Попытки доступа с некорректными токенами

### Ошибка 4: Falco на том же кластере, который мониторит

Если Falco развёрнут на том же кластере, который он защищает — компрометация кластера может выключить Falco. **Рекомендация:** Falco + Falcosidekick в отдельном management-кластере, или минимум использовать внешний SIEM, куда Falco пишет напрямую.

## Чек-лист для AppSec-инженера

```
[ ] Falco установлен на всех узлах (DaemonSet)
[ ] Используется eBPF-драйвер (не kernel module)
[ ] Falcosidekick настроен для маршрутизации алертов
[ ] Настроен алертинг в Slack/Teams/PagerDuty как минимум для CRITICAL
[ ] Проведён тюнинг правил (исключены false positives)
[ ] Добавлены кастомные правила под бизнес-логику (reverse shell, криптомайнер)
[ ] Kubernetes Audit Events мониторятся (если кластер это позволяет)
[ ] Настроен response engine: автоматическое удаление пода при reverse shell
[ ] Интеграция с SIEM (Splunk/ELK) для корреляции с другими событиями
[ ] Falco работает на отдельном management-кластере или пишет во внешний SIEM
[ ] Раз в квартал — review правил, проверка на пропуск атак (tabletop)
```

## Связь с другими разделами

- [Pod Security Standards](./pod-security.md) — preventive control, который Falco дополняет
- [securityContext](./security-context.md) — если seccomp настроен правильно, Falco видит меньше событий
- [NetworkPolicy](./network-policies.md) — Falco обнаружит попытку обхода
- [CIS Kubernetes Benchmark](./cis-benchmark.md) — CIS раздел 7 (Runtime Security)
- [Threat Modeling](../../Knowledge/threat-modeling/threat-modeling.md) — какие угрозы мы ожидаем обнаружить