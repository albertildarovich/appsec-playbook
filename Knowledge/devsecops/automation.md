# Automation — Bash и Python для DevSecOps

> **Контекст:** DevSecOps-инженер постоянно автоматизирует: парсит отчёты сканеров, считает метрики, отправляет уведомления, triage-ит находки. Нужен минимум — Bash для скриптов и Python для сложной логики.

---

## 1. Bash — базовый набор

### grep — поиск по содержимому

```bash
# Найти все упоминания API key в коде
grep -rn "api_key" src/ --include="*.py" --include="*.js"

# Только уникальные значения (для анализа утечек)
grep -rhoE "sk-[a-zA-Z0-9]{20,}" . | sort -u

# Контекст вокруг совпадения
grep -rn -B2 -A2 "eval(" src/
```

### awk — обработка колонок

```bash
# Вывести второй столбец из CSV отчёта
awk -F',' '{print $2}' semgrep-results.csv

# Посчитать количество CRITICAL в trivy report
awk -F',' '$4 == "CRITICAL" {count++} END {print count}' trivy-report.csv

# Сумма по колонке (например, время исправления)
awk -F',' '{sum += $5} END {print sum/NR}' metrics.csv
```

### sed — замена текста

```bash
# Заменить в отчёте старый статус на новый
sed -i 's/pending/reviewed/g' findings.json

# Удалить строки с тестовыми файлами из отчёта
sed -i '/test_/d' semgrep-results.json
```

### find — поиск файлов

```bash
# Все Dockerfile в проекте
find . -name "Dockerfile*" -not -path "*/node_modules/*"

# Все файлы с секретами (по расширению)
find . -name ".env*" -o -name "*.pem" -o -name "*.key"

# Файлы, изменённые за последний день
find . -mtime -1 -type f
```

### curl — HTTP-запросы

```bash
# Получить JSON с API GitHub
curl -s https://api.github.com/repos/gitleaks/gitleaks/releases/latest | jq .tag_name

# Отправить уведомление в Slack
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"text":"Semgrep: 2 CRITICAL findings"}' \
  "$SLACK_WEBHOOK_URL"

# Проверить статус сервиса (для DAST)
curl -s -o /dev/null -w "%{http_code}" http://staging.app:3000/health
```

### jq — работа с JSON

```bash
# Извлечь severity всех находок Semgrep
cat semgrep.json | jq '.results[].extra.severity'

# Сгруппировать по severity и посчитать
cat semgrep.json | jq -r '.results[].extra.severity' | sort | uniq -c

# Извлечь CVE из trivy report
cat trivy.json | jq -r '.Results[].Vulnerabilities[]?.VulnerabilityID'

# Фильтр: только high/critical, без тестовых файлов
cat semgrep.json | jq -r '
  .results[]
  | select(.extra.severity == "ERROR")
  | select(.path | contains("test") | not)
  | "\(.path):\(.start.line) \(.check_id)"'
```

### Полный скрипт: проверка пайплайна

```bash
#!/bin/bash
# gate-check.sh — блокировка при CRITICAL в semgrep.json
set -euo pipefail

REPORT="${1:-semgrep.json}"

if [ ! -f "$REPORT" ]; then
  echo "[!] Отчёт не найден: $REPORT"
  exit 1
fi

CRITICAL_COUNT=$(jq '[.results[] | select(.extra.severity == "ERROR")] | length' "$REPORT")

echo "[*] CRITICAL находок: $CRITICAL_COUNT"

if [ "$CRITICAL_COUNT" -gt 0 ]; then
  echo "[!] Security gate не пройден"
  exit 1
fi

echo "[OK] Security gate пройден"
```

---

## 2. Python — автоматизация

### Чтение JSON-отчёта Semgrep

```python
import json

with open("semgrep.json") as f:
    report = json.load(f)

findings = []
for result in report.get("results", []):
    findings.append({
        "rule": result["check_id"],
        "severity": result["extra"]["severity"],
        "path": result["path"],
        "line": result["start"]["line"],
        "message": result["extra"]["message"][:100],
    })

critical = [f for f in findings if f["severity"] == "ERROR"]
print(f"Всего: {len(findings)}, CRITICAL: {len(critical)}")
```

### REST-запрос к API (GitHub)

```python
import requests
import os

TOKEN = os.environ["GITHUB_TOKEN"]
HEADERS = {"Authorization": f"token {TOKEN}", "Accept": "application/vnd.github+json"}

resp = requests.get(
    "https://api.github.com/repos/albertildarovich/appsec-playbook/releases",
    headers=HEADERS,
    timeout=10,
)
resp.raise_for_status()

for release in resp.json():
    print(release["tag_name"], release["published_at"])
```

### Отправка результатов в Mattermost/Slack

```python
import requests

def send_to_chat(text: str, webhook_url: str) -> None:
    """Отправка текста в Slack/Mattermost через webhook."""
    requests.post(webhook_url, json={"text": text}, timeout=5)
```

### Обработка результатов Trivy

```python
import json
import sys
from collections import Counter

def parse_trivy(path: str) -> Counter:
    """Подсчёт уязвимостей по severity из отчёта Trivy."""
    with open(path) as f:
        report = json.load(f)

    severities = Counter()
    for result in report.get("Results", []):
        for vuln in result.get("Vulnerabilities", []):
            severities[vuln["Severity"]] += 1
    return severities

if __name__ == "__main__":
    stats = parse_trivy(sys.argv[1])
    print("Распределение по severity:", dict(stats))
```

### Автоматический подсчёт MTTR

```python
import json
from datetime import datetime

def mttr_days(findings_path: str) -> float:
    """Среднее время исправления: (fixed - created) в днях."""
    with open(findings_path) as f:
        findings = json.load(f)

    deltas = []
    for f in findings:
        created = datetime.fromisoformat(f["created_at"])
        fixed = datetime.fromisoformat(f["fixed_at"])
        deltas.append((fixed - created).days)

    return sum(deltas) / len(deltas) if deltas else 0.0
```

### Скрипт для security gate на Python (SARIF)

```python
import json
import sys

def check_sarif_gate(path: str, block_on: set[str]) -> tuple[int, int]:
    """Проверка SARIF-отчёта. Возвращает (найдено, блокирующих)."""
    with open(path) as f:
        sarif = json.load(f)

    count = 0
    blocking = 0
    for run in sarif.get("runs", []):
        for result in run.get("results", []):
            count += 1
            level = result.get("level", "warning")
            if level in block_on:
                blocking += 1

    return count, blocking

if __name__ == "__main__":
    total, blocker = check_sarif_gate(sys.argv[1], {"error"})
    print(f"Всего находок: {total}, блокирующих: {blocker}")
    sys.exit(1 if blocker else 0)
```

---

## 3. Что важно для интервью

| Задача | Инструмент |
|--------|-----------|
| Быстрая фильтрация логов | grep, awk |
| Замена в отчётах | sed |
| HTTP-запрос к API | curl |
| Работа с JSON | jq |
| Сложная логика и интеграции | Python |
| Автоматизация пайплайна | Python + GitLab API |

### Паттерн «прочитал отчёт — принял решение»

```
Сканер -> JSON/SARIF -> jq/Python -> Gate/Уведомление/Ticket
```

---

## 4. Interview Questions

| Вопрос | Ответ |
|--------|-------|
| Как посчитать CRITICAL в trivy.json? | `cat trivy.json \| jq -r '.Results[].Vulnerabilities[]?.Severity' \| grep -c CRITICAL` или Python-скрипт с json. |
| Как автоматически заблокировать деплой? | Джоба gate: парсим SARIF/JSON, exit code 1 при блокирующих severity. |
| Как отправить уведомление о находках? | curl POST в webhook Slack/Mattermost с JSON-телом: severity, путь, ссылка на MR. |
| Как обработать результат Semgrep? | `semgrep --json` -> Python/json: фильтр по severity, путь, rule. |
| Чем jq отличается от grep для JSON? | grep — текст без структуры, легко ломается на отступах. jq — понимает структуру JSON, корректно работает с массивами, вложенностью, null. |

---

## Связанные разделы

- [DevSecOps overview](devsecops.md) — инструменты и gate policy
- [GitLab CI/CD](gitlab-ci-cd.md) — джобы в пайплайне, куда встраиваются скрипты
- [Secure SDLC metrics](../secure-sdlc/09-security-metrics.md) — MTTR, FP-rate, подсчёт метрик