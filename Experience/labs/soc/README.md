# Лабораторная: SOC Lab (Wazuh + Elastic + Sigma)

Цель: поднять домашний SOC-полигон на базе Wazuh/Elastic, подключить Windows/Linux хосты, прогнать атаки (Atomic Red Team), построить правила детектирования (Sigma/Wazuh) и обработать инциденты по методологии SOC L1.

## Архитектура

```
+-----------------------+          +--------------------------------+
|  Windows 10           | Wazuh    |  Elastic Stack (Wazuh Manager) |
|  + Sysmon             | Agent    |  - Elasticsearch (индекс)     |
|  + Winlogbeat         | -------> |  - Kibana (UI, Discover,      |
|  + Atomic Red Team    |          |    Dashboards, Alerts)        |
|                       |          |  - Wazuh Manager (rules,      |
+-----------------------+          |    alerts)                    |
                                   |  - TheHive (тикеты, опц.)     |
+-----------------------+          +--------------------------------+
|  Ubuntu Server        | Wazuh    |
|  + auditd             | Agent    |
|  + Filebeat           | -------> |
+-----------------------+          |
```

## Что разворачиваем

1. **Wazuh** (open source SIEM + XDR): manager, indexer, dashboard.
2. **Elastic Stack**: Elasticsearch + Kibana (входит в Wazuh).
3. **Windows 10**: Wazuh Agent + Sysmon.
4. **Ubuntu**: Wazuh Agent + auditd.
5. **Atomic Red Team**: симуляция атак.

## Развёртывание Wazuh (Docker Compose)

```yaml
# docker-compose.yml (узлы Wazuh)
services:
  wazuh-manager:
    image: wazuh/wazuh-manager:4.9.0
    hostname: wazuh-manager
    restart: unless-stopped
    ports:
      - "1514:1514/udp"
      - "1515:1515/tcp"
      - "55000:55000/tcp"
    environment:
      - INDEXER_URL=https://wazuh-indexer:9200
      - INDEXER_USERNAME=admin
      - INDEXER_PASSWORD=SecretPassword
    volumes:
      - wazuh-manager:/var/ossec/data

  wazuh-indexer:
    image: wazuh/wazuh-indexer:4.9.0
    hostname: wazuh-indexer
    restart: unless-stopped
    ports:
      - "9200:9200"
    environment:
      - "OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - wazuh-indexer:/var/lib/wazuh-indexer

  wazuh-dashboard:
    image: wazuh/wazuh-dashboard:4.9.0
    hostname: wazuh-dashboard
    restart: unless-stopped
    ports:
      - "443:443"
    environment:
      - INDEXER_URL=https://wazuh-indexer:9200
      - INDEXER_USERNAME=admin
      - INDEXER_PASSWORD=SecretPassword
    depends_on:
      - wazuh-indexer
    volumes:
      - wazuh-dashboard:/usr/share/wazuh-dashboard/data

volumes:
  wazuh-manager:
  wazuh-indexer:
  wazuh-dashboard:
```

Запуск:

```
docker compose up -d
```

Доступ: `https://localhost:443` (admin / SecretPassword).

## Установка агента Windows

На Windows 10 (PowerShell, от администратора):

```powershell
Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.9.0-1.msi -OutFile wazuh-agent.msi
msiexec /i wazuh-agent.msi /quiet WAZUH_MANAGER='10.0.0.10' WAZUH_REGISTRATION_SERVER='10.0.0.10'
```

## Настройка Sysmon на Windows

Скачать Sysmon + конфиг SwiftOnSecurity:

```powershell
Invoke-WebRequest -Uri https://download.sysinternals.com/files/Sysmon.zip -OutFile Sysmon.zip
Expand-Archive Sysmon.zip -DestinationPath .\Sysmon

Invoke-WebRequest -Uri https://raw.githubusercontent.com/SwiftOnSecurity/sysmon-config/master/sysmonconfig-export.xml -OutFile sysmonconfig.xml

.\Sysmon\Sysmon64.exe -accepteula -i sysmonconfig.xml
```

Проверка Sysmon:

```
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -MaxEvents 10
```

## Настройка auditd на Ubuntu

```
apt install auditd -y

# Правила
auditctl -w /etc/passwd -p wa -k passwd_change
auditctl -a always,exit -F arch=b64 -S execve -k execve_log
auditctl -a always,exit -F arch=b64 -S connect -k network_connect
```

Проверка:

```
ausearch -k execve_log -i | tail -20
```

## Симуляция атак: Atomic Red Team

На Windows (PowerShell):

```powershell
# Установка проекта
IEX (IWR https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1 -UseBasicParsing)
Install-AtomicRedTeam

# Запуск атак (technique ID по MITRE)
Invoke-AtomicTest T1059.001   # PowerShell
Invoke-AtomicTest T1110.001   # Brute Force
Invoke-AtomicTest T1003.001   # Credential Dumping (lsass)
Invoke-AtomicTest T1021.001   # RDP Lateral Movement
Invoke-AtomicTest T1547.001   # Registry Run Keys (persistence)
```

## Задание: детект атак в Wazuh

### Задание 1: Брутфорс

Прогнать (изолированно) hydra по SSH и увидеть алерт в Wazuh:

```
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://10.0.0.20
```

Ожидание: Wazuh правило "Multiple SSH failed logins from same IP".

### Задание 2: Mimikatz (T1003.001)

Прогнать атаку Atomic, найти:

- Сигнатуру процесса mimikatz (ProcessCreate).
- Доступ к lsass (Sysmon Event 10).
- Рекомендацию по эскалации.

### Задание 3: PowerShell -enc (T1059.001)

Прогнать PS-команду с закодированным payload (Arsenal или руками), найти в Discover Kibana:

```
powershell.exe -enc <base64>
```

### Задание 4: Свой правило

Написать правило Wazuh для события (например, создание задачи планировщика) и проверить.

### Задание 5: Инцидент по методологии

Обработать любой алерт по шаблону из Knowledge/soc/incident-response.md и заполнить тикет.

## Структура отчёта

```
Цель:
  Отрабатываем мониторинг, детект и реагирование.

Ход работы:
  1. Развёрнут Wazuh
  2. Подключены Windows + Ubuntu
  3. Настроен Sysmon / auditd
  4. Прогнаны атаки: T1059.001, T1003.001, T1110
  5. Построен алерт и обработан инцидент

Результат:
  - Отчёт инцидента (шаблон в Knowledge/soc/incident-response.md)

Выводы:
  - Как работает SIEM, правила, эскалация
  - Какие события искать в Windows/Linux
```

## Скриншоты Kibana/Wazuh

### 1. Dashboard Overview

![Wazuh Dashboard Overview](screenshots/dashboard-overview.png)
*Общий вид Wazuh Dashboard: Security Events, FIM, аудит агентов.*

### 2. Alert Details

![Wazuh Alert Details](screenshots/alert-details.png)
*Детали алерта: rule id 100011 (Suspicious PowerShell), severity, описание, MITRE mapping.*

### 3. Sysmon Event

![Sysmon Event in Kibana](screenshots/sysmon-event.png)
*Sysmon Event ID 1 в Kibana Discover: Process Creation, powershell.exe -enc, parent winword.exe.*

### 4. Linux auditd Event

![Linux auditd Event in Kibana](screenshots/auditd-event.png)
*Linux auditd событие в Kibana: EXECVE a0=sudo, user deploy, host SRV-01.*

### 5. Detection Rule

![Detection Rule](screenshots/detection-rule.png)
*Sigma-правило sigma-brute-force.yml (id:100013) в Wazuh Rules: Multiple Failed Logons.*

### 6. Incident Ticket

![Incident Ticket](screenshots/incident-ticket.png)
*Заполненный тикет инцидента SOC-2026-0001: summary, MITRE mapping, escalation decision.*

> Примечание: скриншоты — с реального стенда Wazuh/Elastic. Заменить на собственные при развёртывании.

## Артефакты SOC

| Артефакт | Файл | Описание |
|---|---|---|
| Таблица инцидентов | [incidents.md](incidents.md) | 4 обработанных инцидента (SOC-001 – SOC-004) |
| Шаблон тикета L1 | [ticket-template.md](ticket-template.md) | Поля тикета + пример заполнения |
| FP-тюнинг | [false-positive-tuning.md](false-positive-tuning.md) | 3 кейса фильтрации ложных срабатываний |
| Шаблон отчёта | [incident-report-template.md](incident-report-template.md) | Полный шаблон отчёта об инциденте |
| Sigma-правила (5 шт.) | [rules/](rules/) | PowerShell, DCSync, Brute Force, New Admin, sudo |

## Связанные материалы

- Knowledge/soc/siem-basics.md
- Knowledge/soc/mitre-attack.md
- Knowledge/soc/windows-event-logs.md
- Knowledge/soc/linux-logs.md
- Knowledge/soc/incident-response.md
