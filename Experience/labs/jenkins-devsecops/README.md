# Лабораторная: Jenkins DevSecOps Demo

Цель: построить простой Jenkins pipeline с этапами SAST, SCA и DAST. Настроить публикацию отчётов.

## Контекст

Демонстрационный Java-проект `webapp` (Spring Boot):

- REST API с эндпоинтами `/login`, `/order`, `/search`.
- Сборка с Maven.
- Инструменты: Semgrep (SAST), Trivy (SCA), OWASP ZAP (DAST).

```
+---------------------+        +----------------------+
|  GitLab / GitHub    |        |  Jenkins             |
|  webapp (Java)      | push   |                      |
|                     | -----> |  Stage 1: checkout   |
|                     |        |  Stage 2: sast       |
|                     |        |  Stage 3: sca        |
|                     |        |  Stage 4: dast       |
|                     |        |  Stage 5: report     |
+---------------------+        +----------------------+
```

## Jenkinsfile (declarative pipeline)

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        // Токен для API Jenkins (для публикации результатов)
        JENKINS_API_TOKEN = credentials('jenkins-api-token')
        APP_URL = 'http://localhost:8081'
        APP_PORT = '8081'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('SAST: Semgrep') {
            steps {
                sh '''
                    docker run --rm -v "$WORKSPACE:/src" returntocorp/semgrep \
                        --config p/owasp-top-ten \
                        --json \
                        -o /src/reports/semgrep.json \
                        /src
                '''
            }
            post {
                success {
                    archiveArtifacts artifacts: 'reports/semgrep.json'
                }
            }
        }

        stage('SCA: Trivy') {
            steps {
                sh '''
                    docker run --rm -v "$WORKSPACE:/src" aquasec/trivy \
                        fs --scanners vuln,secret,config \
                        --exit-code 0 \
                        --format json \
                        --output /src/reports/trivy.json \
                        /src
                '''
            }
            post {
                success {
                    archiveArtifacts artifacts: 'reports/trivy.json'
                }
            }
        }

        stage('DAST: ZAP') {
            steps {
                sh '''
                    docker run --rm -v "$WORKSPACE:/zap/wrk" \
                        -p 8080:8080 \
                        ghcr.io/zaproxy/zaproxy \
                        zap-baseline.py \
                        -t "$APP_URL" \
                        -r zap-report.html \
                        -J zap-report.json
                '''
            }
            post {
                success {
                    archiveArtifacts artifacts: 'reports/zap-report.html'
                }
            }
        }

        stage('Publish Reports') {
            steps {
                publishHTML(target: [
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports',
                    reportFiles: 'zap-report.html',
                    reportName: 'ZAP Security Report'
                ])
            }
        }
    }

    post {
        always {
            // Очистка временных файлов
            cleanWs()
        }
        failure {
            // Уведомление в Slack / email
            // slackSend channel: '#security', message: "Pipeline failed: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
        }
    }
}
```

## Пояснение по этапам

### Stage 1: Checkout

- Забирает код из SCM (GitLab/GitHub).
- Триггер: push в ветку `main` или pull request.

### Stage 2: SAST – Semgrep

- Запуск в Docker-контейнере `returntocorp/semgrep`.
- Конфигурация: `p/owasp-top-ten` (правила OWASP Top 10).
- Формат вывода: JSON (report JSON).
- Результат архивируется в Jenkins.

Фрагмент отчёта:

```json
{
  "results": [
    {
      "check_id": "semgrep-rules.likely-bugs.unicode",
      "path": "src/main/java/com/shopapp/LoginController.java",
      "start": { "line": 42, "col": 17 },
      "end": { "line": 42, "col": 47 },
      "extra": {
        "message": "Потенциальная SQL-инъекция: строка конкатенации в запросе",
        "severity": "ERROR",
        "metadata": { "cwe": ["CWE-89"] }
      }
    }
  ]
}
```

### Stage 3: SCA – Trivy

- Проверка зависимостей проекта: уязвимости (CVE), секреты, конфигурация.
- Флаг `--exit-code 0`: не блокирует пайплайн при найденных уязвимостях (для демонстрации).
- В реальном проекте использовать `--exit-code 1` с порогом по severity.

### Stage 4: DAST – ZAP

- Запуск `zap-baseline.py`: пассивное сканирование.
- Проверка: `/login`, `/order`, `/search`.
- Результат: HTML + JSON отчёт.

### Stage 5: Publish Reports

- `publishHTML` — публикация HTML-отчёта ZAP.
- `archiveArtifacts` — архивация JSON-отчётов (Semgrep, Trivy) для скачивания.

## Ожидаемый результат

После прогона пайплайна:

- В Jenkins доступны три отчёта:
  - `reports/semgrep.json` (SAST)
  - `reports/trivy.json` (SCA)
  - `reports/zap-report.html` (DAST)
- В веб-интерфейсе Jenkins — раздел "ZAP Security Report" с HTML-отчётом.

```
Stage View:
  Checkout (1s) | Build (25s) | SAST (12s) | SCA (8s) | DAST (30s) | Publish (2s)
```

## Добавление Quality Gate

Для автоматической блокировки сборки при критичных находках:

```groovy
// Quality Gate stage (пример)
stage('Quality Gate') {
    steps {
        script {
            def semgrepReport = readJSON file: 'reports/semgrep.json'
            int critical = semgrepReport.results.count { it.extra.severity == 'ERROR' }

            if (critical > 0) {
                error "SAST: найдено ${critical} критичных ошибок"
            }
        }
    }
}
```

## Интеграция с уведомлениями

- Slack: `slackSend channel: '#security', message: "..."`.
- Email: `mail to: 'security@example.com', subject: "..."`.
- Webhook в тикет-систему (JIRA, YouTrack).

## Связанные материалы

- Knowledge/devsecops/gitlab-ci-cd.md
- Knowledge/devsecops/sast-deep.md
- Knowledge/devsecops/sbom.md
- Knowledge/devsecops/tool-selection.md
- Experience/labs/sast-pipeline/README.md
- Experience/labs/sca-pipeline/README.md
- Experience/labs/dast-zap/README.md