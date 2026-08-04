# SIEM Basics для SOC

## Зачем это SOC-аналитику

SIEM (Security Information and Event Management) — центральная платформа мониторинга безопасности. SOC-аналитик L1 проводит в SIEM большую часть рабочего времени: мониторинг, поиск, корреляция, триаж алертов. Нужно:

- Понимать архитектуру SIEM (сбор, нормализация, корреляция, хранение).
- Уметь строить запросы (SPL, KQL, Lucene).
- Понимать логику правил корреляции.
- Различать TI-данные, базовые линии (baseline), аномалии.
- Работать с алертами: триаж, FP/TP, эскалация.

## Архитектура SIEM

```
Источники событий                    SIEM
+----------------+          +---------------------------+
| Windows Hosts  | ---+     |  Collector/Agent          |
| Linux Hosts    | ---|---> |  (Winlogbeat, Auditbeat,  |
| Firewall       | ---|     |   Filebeat, Syslog-NG)    |
| IDS/IPS        | ---|     |       |                   |
| Proxy          | ---|     |  Parse + Normalize        |
| Mail Gateway   | ---|     |       |                   |
| EDR            | ---|     |  Index + Store (Elastic)  |
| Cloud (AWS/AZ) | ---|     |       |                   |
+----------------+     |     |  Correlation Engine      |
                       |     |  (rules, ML, TI)         |
                       |     |       |                   |
                       |     |  Alerting (Kibana/Wazuh) |
                       |     +---------------------------+
                       |                |
                       |                v
                       |     +---------------------+
                       +---->|  SOC Analyst (UI)   |
                             |  Investigation      |
                             |  Ticketing          |
                             +---------------------+
```

Схема работы SIEM:

```
Логи -> Сбор (agents/syslog) -> Парсинг -> Нормализация
  -> Индексация -> Хранение -> Корреляция -> Алерт -> Тикет
```

## Компоненты

| Компонент | Назначение | Примеры |
|-----------|-----------|---------|
| Collector/Agent | Сбор событий с хоста | Winlogbeat, Auditbeat, Filebeat, Wazuh Agent |
| Парсер | Разбор неструктурированных логов | Syslog, JSON, CSV, Windows XML |
| Нормализация | Приведение полей к общему формату | ECS (Elastic Common Schema), CEF, LEEF |
| Хранилище | Индекс событий | Elasticsearch, Splunk index |
| Корреляция | Правила поиска паттернов | Sigma, SPL, KQL, Wazuh rules |
| Threat Intelligence | IoC: IP, domain, hash | MISP, Abuse.ch, AlienVault OTX |
| Тикетирование | Управление инцидентами | TheHive, Jira, ServiceNow |
| Дашборды | Визуализация и мониторинг | Kibana, Splunk Dashboards, Grafana |

## Нормализация и общие стандарты

### ECS (Elastic Common Schema)

Общий формат полей в Elastic. Важные поля:

| Поле | Значение |
|------|----------|
| @timestamp | Время события (UTC) |
| event.category | process / network / authentication / file |
| event.action | created / accessed / deleted |
| event.code | Event ID (4624, 4688 и т.д.) |
| event.outcome | success / failure |
| process.name | Имя процесса (powershell.exe) |
| process.executable | Полный путь |
| process.command_line | Командная строка |
| user.name | Имя пользователя |
| user.id | SID пользователя |
| source.ip | IP источника |
| destination.ip | IP назначения |
| destination.port | Порт назначения |
| file.hash.sha256 | Хеш файла |
| host.name | Имя хоста |

### Событие Windows в ECS (пример)

```json
{
  "@timestamp": "2026-08-03T12:34:56.789Z",
  "event": {
    "code": "4688",
    "category": ["process"],
    "action": "process-created",
    "outcome": "success"
  },
  "process": {
    "name": "powershell.exe",
    "executable": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    "command_line": "powershell.exe -enc SQBFAFgA"
  },
  "user": { "name": "albert" },
  "host": { "name": "WS-001" }
}
```

## Основные SIEM-платформы

| Платформа | Стек | Язык запросов | Когда используется |
|-----------|------|---------------|--------------------|
| Splunk | Splunk (проприетарный) | SPL | Крупный enterprise |
| Elastic SIEM | Elasticsearch + Kibana | KQL, Lucene | Open source, коммерческий |
| Wazuh | Elasticsearch + Kibana + Wazuh | KQL, Kusto-подобный | Open source, идеален для изучения |
| QRadar | IBM | AQL | Enterprise (BI.ZONE в т.ч.) |
| MaxPatrol | Positive Technologies | Query Language | Российские компании |
| ArcSight | Micro Focus | CEF-основанный | Legacy enterprise |
| Microsoft Sentinel | Azure | KQL (Kusto) | Azure-ландшафт |

## Языки запросов

### Splunk SPL (Search Processing Language)

Базовые команды: `index`, `search`, `stats`, `timechart`, `top`, `table`.

Пример: все неудачные входы за 24 часа.

```
index=windows EventCode=4625
| stats count by UserName, Source_Network_Address
| sort - count
| head 20
```

Пример: корреляция — более 5 неудачных входов для пользователя за 15 минут.

```
index=windows EventCode=4625
| bucket _time span=15m
| stats count by _time, UserName, Source_Network_Address
| where count > 5
```

### Elastic KQL (Kibana Query Language)

Пример: поиск процессов PowerShell.

```
process.name : "powershell.exe"
```

Пример: неудачные входы.

```
event.code : "4625"
```

Пример: закодированная PowerShell команда.

```
process.name : "powershell.exe" AND process.command_line : ("-enc" OR "-encodedcommand")
```

Пример: сложное условие.

```
(event.code : "4625" AND source.ip : "10.0.0.0/8") OR (event.code : "4688" AND process.name : "cmd.exe")
```

### Kusto (Microsoft Sentinel / Azure Monitor)

Пример: неудачные входы с одного IP, более 10 раз.

```kusto
SecurityEvent
| where EventID == "4625"
| summarize FailedCount = count() by Account, IpAddress, LogonType
| where FailedCount > 10
```

## Правила корреляции

### Как строится правило

Правило корреляции отвечает на вопрос: "какая последовательность событий указывает на атаку?"

Типы правил:

| Тип | Пример |
|-----|--------|
| Одиночное событие | Один Event 4720 (создание пользователя) |
| Порог | 10+ Event 4625 за 15 минут |
| Последовательность | 4624 -> 5140 -> 4656 (вход -> шары -> файлы) |
| Окно времени | N событий за окно |
| Ансамбль | Исключение допустимых пользователей/хостов |
| Baseline | Аномальное поведение от базовой линии |

Пример правила Wazuh (несколько неудачных входов Windows).

```xml
<rule id="100001" level="10">
  <if_sid>5726</if_sid> <!-- Windows Login Failure (4625) -->
  <same_source_ip />
  <match>Audit Failure</match>
  <description>Multiple Windows login failures from same source IP</description>
  <group>authentication_failures,</group>
  <frequency>10</frequency>
  <timeframe>300</timeframe>
</rule>
```

### Метрики качества

| Метрика | Формула | Цель |
|---------|---------|------|
| True Positive (TP) | Алерт, подтверждённый инцидент | Выше |
| False Positive (FP) | Алерт, ошибся | Ниже |
| False Negative (FN) | Инцидент, который пропущен | Как можно ниже |
| Покрытие | Детектированные атаки / все атаки | Высокое |
| Время реакции (MTTR) | Время от алерта до решения | Меньше |

Задача L1: снижать FP через исключения, точные правила, фильтрацию легитимного поведения.

## Триаж алерта (процесс)

```
1. Получение алерта в очереди
        |
2. Сбор контекста:
   - Что за событие? (event.code, process, user, host)
   - Источник и назначение (IP, порт, гео)
   - Время события
   - Предшествующие/последующие события (timeline)
        |
3. Проверка:
   - Легитимная активность? (известный процесс, админ)
   - Известный IoC? (TI-проверка)
   - Аналогичное событие было раньше? (baseline)
        |
4. Решение:
   - TP -> открыть инцидент, эскалировать
   - FP -> закрыть с комментарием, можно исключение
   - Сомнительно -> углубить анализ
        |
5. Документирование:
   - ticket: алерт, анализ, решение, рекомендации
```

## Baseline и аномалии

Baseline — нормальное поведение пользователя/хоста/сети за период.

Что фиксировать в baseline:

```
Пользователь: обычные часы работы, обычные хосты, обычные IP, обычные приложения.
Хост: обычные процессы, сетевые подключения, авторизации.
Сеть: объёмы трафика, сервисы, протоколы.

Аномалия: отклонение от baseline
- Вход в 03:00 из страны, где пользователь не бывает
- Первый вход пользователя на сервер баз данных
- Большой исходящий объём в нерабочее время
```

## Threat Intelligence в SIEM

IoC (Indicators of Compromise):

| Тип | Пример | Источники |
|-----|--------|-----------|
| IP | 185.220.101.2 | AlienVault OTX, Abuse.ch, Spamhaus |
| Domain | evil.example.com | URLhaus, PhishTank |
| Hash | SHA256 | MalwareBazaar, VirusTotal |
| URL | http://evil/... | URLhaus |

Работа: SIEM получает фиды TI, обогащает события: если IP/domen/hash совпал — алерт с пометкой TI.

Пример поиска в Elastic по TI-полю:

```kql
threat.indicator.type : "ipv4" AND threat.indicator.ip : "185.220.101.*"
```

## Типовые дашборды SOC

| Дашборд | Что показывает |
|---------|----------------|
| Обзор алертов | Количество по severity, типы, тренд |
| Аутентификация | Успешные/неудачные, Logon Types, гео |
| Процессы | Новые процессы, cmd/powershell, аномалии |
| Сеть | Внешние соединения, порты, объёмы |
| Вредонос | AV/EDR-алерты, hash, детонация |
| Почта | Фишинг, SPF/DKIM/DMARC fail |

## Практика

1. Поднять Wazuh (Elasticsearch + Kibana + Wazuh Manager).
2. Подключить Windows-хост с Sysmon.
3. Прогнать атаки (Atomic Red Team) и посмотреть алерты.
4. Построить собственные правила (Sigma/Wazuh).
5. Познакомиться с SPL (Splunk Free) или KQL (Elastic).

## Связанные материалы

- Knowledge/soc/linux-logs.md
- Knowledge/soc/windows-event-logs.md
- Knowledge/soc/mitre-attack.md
- Experience/labs/soc/