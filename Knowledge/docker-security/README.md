# Docker Security

> Безопасная настройка Docker-контейнеров: best practices, CIS Benchmark, интеграция Trivy в CI/CD.

---

## Содержание

- [Проблема](#проблема)
- [Hardened Dockerfile](#hardened-dockerfile)
- [CIS Docker Benchmark — чек-лист](#cis-docker-benchmark--чек-лист)
- [Сканирование образов (Trivy)](#сканирование-образов-trivy)
- [Runtime-защита](#runtime-защита)
- [Secrets в образах](#secrets-в-образах)
- [Ссылки](#ссылки)

---

## Проблема

По данным отчётов (Sysdig, Aqua, Datadog):
- ~70% образов содержат уязвимости уровня HIGH/CRITICAL
- ~50% образов запускаются от root
- ~30% образов содержат секреты (API-ключи, токены, пароли)

Базовые практики закрывают большинство проблем:
1. **Не root** — `USER 1000` и проверка `securityContext` в Kubernetes
2. **Минимальный базовый образ** — distroless, scratch или alpine (с оговорками)
3. **Сканирование** — Trivy/Snyk/Grype в CI/CD
4. **Secrets** — не копировать в образ, монтировать через volumes/secrets

---

## Hardened Dockerfile

### Плохой пример (типичный)

```dockerfile
FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

**Проблемы:**
- `node:latest` — floating tag, сборка невоспроизводима; образ огромный (~1 GB)
- `COPY . .` — копирует всё, включая `.git`, `.env`, тесты, инструменты
- `npm install` — тянет devDependencies в продакшн
- Запуск от root (по умолчанию в большинстве образов)
- Нет healthcheck
- Нет сигналов для graceful shutdown

### Хороший пример (production-grade)

```dockerfile
# Stage 1: сборка
FROM node:20.11-alpine@sha256:a1b2c3d4e5f6... AS build
WORKDIR /app

# Копируем только манифесты — используем кеш слоёв
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Копируем исходники и собираем
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build && npm prune --production

# Stage 2: production runtime
FROM node:20.11-alpine@sha256:a1b2c3d4e5f6... AS runtime

# Создаём непривилегированного пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Копируем только production-зависимости и собранный код
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Меняем владельца на appuser
RUN chown -R appuser:appgroup /app

# Переключаемся на непривилегированного пользователя (ДОЛЖНО быть в конце,
# после всех RUN-команд, требующих root)
USER appuser

EXPOSE 3000

# Healthcheck для оркестратора (K8s, Docker Compose)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Запуск через exec form (получает SIGTERM, а не shell)
CMD ["node", "dist/server.js"]
```

### Что исправлено

| Проблема | Решение |
|----------|---------|
| Floating tag | Pinned digest (`@sha256:...`) |
| Огромный образ | Multi-stage build — в runtime только dist + prod deps |
| Копирование лишнего | `.dockerignore` + копирование конкретных файлов |
| devDependencies в проде | `npm prune --production` после сборки |
| Запуск от root | `USER appuser` |
| Нет healthcheck | `HEALTHCHECK` с endpoint `/health` |
| Shell form CMD | Exec form `CMD ["node", ...]` — получает SIGTERM |
| Невоспроизводимость | Фиксированные версии (`node:20.11-alpine`) + digest |

### .dockerignore

```dockerignore
# Зависимости
node_modules/
npm-debug.log

# Окружение
.env
.env.*
*.local

# Git
.git/
.gitignore
.gitattributes

# Тесты
__tests__/
*.test.ts
*.spec.ts
tests/
coverage/

# CI/CD
.gitlab-ci.yml
.github/
Dockerfile
docker-compose.yml

# Документация
docs/
README.md
CHANGELOG.md

# Системное
.DS_Store
Thumbs.db
.vscode/
.idea/
```

### Дополнительные практики

```dockerfile
# distroless — ещё меньше атакующей поверхности (нет shell, нет пакетного менеджера)
FROM gcr.io/distroless/nodejs20-debian12@sha256:...

# Чтение секретов через Docker BuildKit secrets (не копируются в слой)
# RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

# Установка только нужных пакетов (alpine)
# RUN apk add --no-cache ca-certificates tzdata && \
#     apk del --no-cache <build-deps>
```

---

## CIS Docker Benchmark — чек-лист

> На основе CIS Docker Benchmark v1.6.0. Категории: Host, Docker Daemon, Container Images, Container Runtime, Docker Swarm, Kubernetes.

### Host Configuration

- [ ] 1.1.1 — Удостовериться, что используется отдельная партиция для контейнеров (`/var/lib/docker`)
- [ ] 1.1.2 — Удостовериться, что только доверенные пользователи могут управлять Docker daemon (группа `docker` контролируется)
- [ ] 1.1.3 — Аудит файлов и директорий Docker (`/var/lib/docker`, `/etc/docker`, `docker.service`, `docker.socket`, `/etc/default/docker`, `/etc/sysconfig/docker`)
- [ ] 1.1.4-1.1.18 — Расширенный аудит (сети, registry, плагины)

### Docker Daemon Configuration

- [ ] 2.1 — Запускать Docker daemon с `--iptables=true` и `--ip6tables=true`
- [ ] 2.2 — Не использовать experimental features в продакшене
- [ ] 2.3 — `--insecure-registry` не должен использоваться (или строго ограничен)
- [ ] 2.4 — `--live-restore` включён для сохранения контейнеров при перезапуске daemon
- [ ] 2.5 — `--userland-proxy=false` (если возможно в вашей сети)
- [ ] 2.6-2.17 — TLS-аутентификация, авторизация, логирование на centralised log server

### Container Images and Build Files

- [ ] 4.1 — Создать пользователя для контейнера (`USER <uid>`)
- [ ] 4.2 — Использовать доверенные базовые образы (проверенные, официальные, pinned)
- [ ] 4.3 — Не устанавливать unnecessary packages (`--no-install-recommends` для apt)
- [ ] 4.4 — Сканировать образы на уязвимости (Trivy, Snyk, Grype) и пересобирать при новых
- [ ] 4.5 — Включить Content Trust (`DOCKER_CONTENT_TRUST=1`)
- [ ] 4.6 — Добавить HEALTHCHECK в Dockerfile
- [ ] 4.7 — Не использовать `ADD` (только `COPY`) когда нет необходимости в авто-распаковке
- [ ] 4.8 — Не копировать секреты в образ (использовать BuildKit secrets / монтирование)
- [ ] 4.9 — Не устанавливать `docker`/`docker-compose` внутрь контейнера
- [ ] 4.10 — Не использовать последние (`latest`) теги в продакшене

### Container Runtime

- [ ] 5.1 — AppArmor / SELinux / seccomp профиль включён для каждого контейнера
- [ ] 5.2 — Linux kernel capabilities ограничены (минимум: `NET_BIND_SERVICE`, убрать `SYS_ADMIN`, `NET_RAW`)
- [ ] 5.3 — Не использовать привилегированные контейнеры (`--privileged=false`)
- [ ] 5.4 — Не монтировать sensitive host-директории (`/`, `/boot`, `/dev`, `/etc`, `/proc`, `/sys`)
- [ ] 5.5 — Не открывать привилегированные порты (< 1024) без необходимости
- [ ] 5.6 — Не использовать `--net=host` (контейнер разделяет сетевой namespace хоста)
- [ ] 5.7 — Не использовать `--pid=host` (контейнер разделяет PID namespace хоста)
- [ ] 5.8 — Не использовать `--ipc=host` (контейнер разделяет IPC namespace хоста)
- [ ] 5.9 — Не монтировать Docker socket (`/var/run/docker.sock`) внутрь контейнера
- [ ] 5.10 — Ограничить память и CPU (`--memory`, `--cpus`)
- [ ] 5.11 — Read-only root filesystem (`--read-only`) с `tmpfs` для временных директорий
- [ ] 5.12 — Не использовать `--uts=host` (контейнер разделяет UTS namespace хоста)
- [ ] 5.13 — Не использовать `--privileged`, `--cap-add=ALL`, `--security-opt label:disable`
- [ ] 5.14 — Перезапуск политика: `on-failure:5` (не `always` кроме специфичных случаев)
- [ ] 5.15 — Не делить пространство имён процессов с хостом (`--pid=host`)
- [ ] 5.20-5.31 — Сетевые ограничения, логирование, своп

### Как проверять

```bash
# Автоматическая проверка — docker-bench-security (CIS)
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /usr/bin/docker-containerd:/usr/bin/docker-containerd:ro \
    -v /usr/bin/docker-runc:/usr/bin/docker-runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security

# Результат: PASS / WARN / NOTE по каждому пункту
# Фокус на WARN — это нарушения, которые нужно исправить
```

---

## Сканирование образов (Trivy)

### Интеграция в CI/CD (GitLab CI)

```yaml
# .gitlab-ci.yml — job для сканирования образов

trivy-container-scan:
  stage: security-test
  image:
    name: aquasec/trivy:0.50.1
    entrypoint: [""]
  variables:
    TRIVY_EXIT_CODE: "1"         # падать при CRITICAL
    TRIVY_SEVERITY: "CRITICAL,HIGH"
    TRIVY_IGNORE_UNFIXED: "true"  # игнорировать, если нет фикса
  script:
    - trivy image
        --severity $TRIVY_SEVERITY
        --exit-code $TRIVY_EXIT_CODE
        --ignore-unfixed=$TRIVY_IGNORE_UNFIXED
        --format json
        --output trivy-results.json
        $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  artifacts:
    reports:
      container_scanning: trivy-results.json  # GitLab Ultimate показывает в MR
    paths:
      - trivy-results.json
    expire_in: 30 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
  allow_failure:
    exit_codes: 1  # CRITICAL — блокировка, HIGH — warning (настраивается)
```

### Trivy CLI — локальное использование

```bash
# Сканирование образа
trivy image myapp:latest

# Сканирование с фильтром по severity
trivy image --severity CRITICAL,HIGH myapp:latest

# Сканирование Dockerfile (мисконфигурации)
trivy config ./Dockerfile

# Сканирование файловой системы (IaC, зависимости)
trivy fs --scanners vuln,secret,misconfig ./project/

# Сканирование Git-репозитория (секреты, мисконфигурации)
trivy repo https://github.com/user/repo.git

# Сканирование Kubernetes-манифестов
trivy k8s --namespace production all
```

### Trivy `.trivyignore` — исключение false positives

```text
# Формат: VulnerabilityID
# Причина: FP — уязвимость в dev-зависимости, не используется в рантайме
CVE-2023-XXXXX

# Причина: низкий риск, исправление в следующем релизе базового образа
CVE-2024-YYYYY exp:2025-01-01
```

### Gate Policy (когда падать)

| Severity | Fixed Available | Action |
|----------|----------------|--------|
| CRITICAL | Yes | **BLOCK** — исправить до мёрджа |
| CRITICAL | No | **BLOCK** — оценить risk acceptance или найти workaround |
| HIGH | Yes | **BLOCK** — исправить до мёрджа |
| HIGH | No | **WARN** — создать тикет, не блокировать пайплайн |
| MEDIUM | Any | **WARN** — backlog |
| LOW | Any | **IGNORE** — информационно |

---

## Runtime-защита

### Docker-уровень

```bash
# Запуск контейнера с минимальными правами
docker run \
    --rm \
    --name myapp \
    --user 1000:1000 \                    # не root
    --read-only \                          # read-only root fs
    --tmpfs /tmp:rw,noexec,nosuid,size=256M \  # временные файлы
    --security-opt no-new-privileges:true \     # запрет повышения привилегий
    --security-opt seccomp=/path/to/seccomp.json \  # кастомный seccomp-профиль
    --cap-drop ALL \                       # сбросить все capabilities
    --cap-add NET_BIND_SERVICE \           # добавить только нужные
    --memory 256m \                        # лимит памяти
    --cpus 1 \                             # лимит CPU
    --pids-limit 100 \                     # лимит процессов
    --restart on-failure:5 \               # не рестартить бесконечно
    myapp:latest
```

### Kubernetes-уровень (securityContext)

```yaml
# См. Knowledge/kubernetes/security-context.md для полного разбора
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
    add:
      - NET_BIND_SERVICE
  seccompProfile:
    type: RuntimeDefault
```

### Falco-правило для обнаружения аномалий контейнера

```yaml
# /etc/falco/falco_rules.local.yaml
- rule: Container Running as Root
  desc: Запуск контейнера от root
  condition: >
    container_started and
    container.image.repository != "docker.io/library/alpine" and
    jevt.value[/proc/self/status, "Uid"] = "0\t0\t0\t0"
  output: >
    Контейнер запущен от root (user=%container.user.name
    image=%container.image.repository cmdline=%proc.cmdline)
  priority: WARNING
  tags: [container, cis]

- rule: Privileged Container Started
  desc: Запуск привилегированного контейнера
  condition: container_started and container.privileged=true
  output: >
    Привилегированный контейнер запущен (image=%container.image.repository)
  priority: CRITICAL
  tags: [container, cis]
```

---

## Secrets в образах

### Антипаттерны

```dockerfile
# НИКОГДА ТАК НЕ ДЕЛАЙТЕ
ENV DATABASE_URL=postgres://user:password@host/db
COPY .env /app/.env
RUN echo "$API_KEY" > /app/secrets.txt
ARG GITHUB_TOKEN
RUN curl -H "Authorization: token $GITHUB_TOKEN" ...
```

Переменные окружения и ARG сохраняются в слоях образа. Даже если удалить файл в следующей команде, он всё равно доступен в истории слоёв (`docker history`).

### Правильные подходы

```dockerfile
# 1. BuildKit secrets (не сохраняется в слоях)
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci

# Сборка: DOCKER_BUILDKIT=1 docker build --secret id=npmrc,src=$HOME/.npmrc -t myapp .

# 2. Монтирование в рантайме (Kubernetes Secrets / Docker secrets)
# Не в Dockerfile. В Kubernetes:
#   envFrom:
#     - secretRef:
#         name: app-secrets
#   volumeMounts:
#     - name: secrets
#       mountPath: /etc/secrets
#       readOnly: true

# 3. External Secrets Operator / Vault Sidecar
# Секреты инжектируются в контейнер через sidecar, не хранятся в образе
```

### Проверка на секреты в образах

```bash
# Trivy — поиск секретов
trivy image --secret-config trivy-secret.yaml myapp:latest

# truffleHog — поиск в Git-истории (случайно закоммиченные ключи)
trufflehog git file://. --only-verified

# git-secrets (pre-commit hook)
git secrets --register-aws
git secrets --scan-history
```

---

## Ссылки

- [CIS Docker Benchmark v1.6.0](https://www.cisecurity.org/benchmark/docker)
- [Docker Security Best Practices (официальная документация)](https://docs.docker.com/develop/security-best-practices/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [docker-bench-security (CIS-сканер)](https://github.com/docker/docker-bench-security)
- [OWASP Docker Top 10](https://owasp.org/www-project-docker-top-10/)
- [Falco — Container Runtime Security](https://falco.org/docs/)

---

> **Ключевой принцип:** образ — это immutable артефакт. Он должен быть минимальным, сканированным, запускаться без привилегий и не содержать секретов. Все три слоя (build-image, scan-image, runtime-security) обязательны.