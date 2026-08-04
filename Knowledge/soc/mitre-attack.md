# MITRE ATT&CK + Cyber Kill Chain

## Зачем это SOC-аналитику

MITRE ATT&CK — база знаний тактик, техник и процедур (TTP) атакующих. SOC-аналитик использует её для:

- Понимания логики атаки: не отдельное событие, а цепочка шагов.
- Написания правил корреляции (Sigma, Splunk, KQL).
- Классификации инцидентов (какая тактика/техника).
- Привязки детекта к конкретной технике (T8xxx).

БДУ ФСТЭК — российский аналог-дополнение: банк данных угроз безопасности информации (https://bdu.fstec.ru/). Содержит описание угроз с идентификаторами вида "УБИ.xxx".

## Cyber Kill Chain (Lockheed Martin)

Семь этапов атаки:

```
1. Reconnaissance     Разведка: сбор информации о цели
        |
2. Weaponization     Создание эксплойта/вредоносного документа
        |
3. Delivery          Доставка: фишинг, USB, веб
        |
4. Exploitation      Использование уязвимости
        |
5. Installation      Установка вредоносного ПО (persistence)
        |
6. Command & Control Управление через C2-сервер
        |
7. Actions on Objectives  Достижение цели: кража, шифрование
```

Соответствие Kill Chain и ATT&CK:

| Kill Chain | ATT&CK Тактика |
|------------|----------------|
| Reconnaissance | Reconnaissance (TA0043) |
| Weaponization + Delivery | Initial Access (TA0001) |
| Exploitation | Execution (TA0002) |
| Installation | Persistence (TA0003), Privilege Escalation (TA0004), Defense Evasion (TA0005) |
| Command & Control | Command and Control (TA0011) |
| Actions on Objectives | Credential Access (TA0006), Collection (TA0009), Exfiltration (TA0010), Impact (TA0040) |

## Тактики MITRE ATT&CK Enterprise

| ID | Тактика | Суть |
|----|---------|------|
| TA0043 | Reconnaissance | Сбор информации о цели (активный/пассивный) |
| TA0042 | Resource Development | Подготовка инфраструктуры: C2, ресурсы, аккаунты |
| TA0001 | Initial Access | Первичное проникновение: phishing, vuln, внешние сервисы |
| TA0002 | Execution | Запуск кода: командная оболочка, скрипты, планировщик |
| TA0003 | Persistence | Закрепление: службы, автозагрузка, планировщик |
| TA0004 | Privilege Escalation | Повышение прав: UAC bypass, уязвимости, легитимные привилегии |
| TA0005 | Defense Evasion | Обход защит: обфускация, отключение AV/EDR, удаление логов |
| TA0006 | Credential Access | Получение учётных данных: memory dump, credential dumping, кейлоггер |
| TA0007 | Discovery | Разведка внутри сети: enum пользователей, серверов, AD |
| TA0008 | Lateral Movement | Горизонтальное перемещение: RDP, PsExec, SMB, WinRM |
| TA0009 | Collection | Сбор данных: clipboard, screen capture, базы данных |
| TA0011 | Command and Control | C2: каналы связи с управляющим сервером |
| TA0010 | Exfiltration | Вынос данных: сеть, облако, физический носитель |
| TA0040 | Impact | Воздействие: шифрование (ransomware), уничтожение, DoS |

## Ключевые техники (для L1)

### Initial Access (TA0001)

| Техника | ID | Как выглядит в логах |
|---------|----|-----------------------|
| Phishing | T1566 | Письмо с вредоносной ссылкой/вложением; запуск Office/script от пользователя |
| Exploit Public-Facing App | T1190 | Аномальные запросы к веб-приложению, 4xx/5xx серии, известные CVE |
| Valid Accounts | T1078 | Вход легитимной учёткой через RDP/VPN в нерабочее время |
| External Remote Services | T1133 | Вход через VPN/RDP/VNC/RDP извне |

### Persistence (TA0003)

| Техника | ID | Как выглядит в логах |
|---------|----|-----------------------|
| Create Account | T1136 | Event 4720 (новый пользователь) |
| Registry Run Keys / Startup Folder | T1547.001 | Запись в HKCU\...\Run, автозагрузка; Sysmon Event 13 (CreateKey) |
| Scheduled Task | T1053.005 | Event 4698/106 (планировщик), новые задачи |
| Windows Service | T1543.003 | Event 7045 (новая служба) |
| Boot/Logon Autostart | T1547 | Изменение автозагрузки |

### Privilege Escalation (TA0004)

| Техника | ID | Как выглядит в логах |
|---------|----|-----------------------|
| Access Token Manipulation | T1134 | Token Impersonation, SeDebugPrivilege |
| Bypass UAC | T1548.002 | Аномальные процессы с повышением, Event 4688 с Integrity Level |
| Abuse Elevation Control Mechanism | T1548 | Прогон через легитимные утилиты (cmstp, msiexec) |

### Credential Access (TA0006)

| Техника | ID | Как выглядит в логах |
|---------|----|-----------------------|
| OS Credential Dumping (Mimikatz) | T1003.001 | lsass.exe доступ; Sysmon Event 10 с доступом к lsass |
| Brute Force | T1110 | Event 4625 (много неудачных входов) |
| Kerberoasting | T1558.003 | Запросы TGS с SPN; Event 4769 с RC4/HMAC-SHA1 |
| Credentials in Files | T1552 | Поиск файлов с паролями; чтение чувствительных файлов |

### Lateral Movement (TA0008)

| Техника | ID | Как выглядит в логах |
|---------|----|-----------------------|
| Remote Desktop Protocol | T1021.001 | Event 4624 Logon Type 10 (RDP) |
| SMB/Windows Admin Shares | T1021.002 | Подключение к ADMIN$/C$; Event 5140 (сетевой доступ) |
| Windows Remote Management (WinRM) | T1021.006 | Вход через 5985/5986; Event 4624 Logon Type 3 |
| Pass the Hash | T1550.002 | Вход без пароля (NTLM hash); аномальные Logon Type 3 |

### Defense Evasion (TA0005)

| Техника | ID | Как выглядит в логах |
|---------|----|-----------------------|
| Impair Defenses (попытка отключить AV/EDR) | T1562 | Остановка служб, удаление ПО; Event 7036, изменения Microsoft Defender |
| Obfuscated Files | T1027 | Скрипты с base64/обфускацией; powershell -enc |
| Deobfuscate/Decode Files | T1140 | Запуск закодированных payload, использование certutil, mshta |
| Indicator Removal (чистка логов) | T1070 | wevtutil cl, Delete Volume Shadow Copies |

### Command and Control (TA0011)

| Техника | ID | Как выглядит в логах |
|---------|----|-----------------------|
| Application Layer Protocol | T1071 | HTTP/HTTPS/DNS C2-каналы; аномальная периодичность запросов |
| Web Service | T1102 | C2 через легитимные веб-сервисы |
| Non-Standard Port | T1571 | Трафик не по стандартным портам |
| Data Encoding/Exfil | T1132/T1041 | Base64-потоки, большие объёмы трафика в нерабочее время |

## Пример цепочки атаки (детект)

Сценарий: фишинг -> PowerShell -> Mimikatz -> Lateral Movement -> Exfil.

```
[1] T1566 Phishing
    Event: письмо пришло, пользователь открыл вложение (Office)
    Детект: почтовый шлюз (SPF/DKIM/DMARC), AV-сигнатура

[2] T1059.001 PowerShell
    Event: powershell.exe с -enc, /c, скрытые окна
    Детект: Sysmon Event 1 (ProcessCreate) с командной строкой

[3] T1003.001 Credential Dumping
    Event: необычный процесс читает lsass.exe
    Детект: Sysmon Event 10 (ProcessAccess), Event 4656 (Handle)

[4] T1021.002 Lateral Movement
    Event: вход на другой хост с использованием захваченных учёток
    Детект: Event 4624 Logon Type 3 с аномального источника

[5] T1041 Exfiltration
    Event: большой исходящий трафик
    Детект: NetFlow/прокси-логи, правила SIEM по объёму
```

## Приоритизация для L1

Вопросы при анализе события:

1. Какая тактика? (что атакующий пытается сделать)
2. Какая техника? (как именно)
3. Это TP (истинное срабатывание) или FP (ложное)?
4. Какова критичность? (учётка администратора/сервис/обычный пользователь)
5. Какие следующие шаги атакующего? (что ожидать дальше)
6. Эскалация: какой уровень, в каком виде докладывать?

## БДУ ФСТЭК

Российский банк данных угроз: https://bdu.fstec.ru/

- Идентификаторы угроз: УБИ.001, УБИ.002 и т.д.
- Каждая угроза содержит: описание, источник, объект воздействия, последствия.
- Для российских заказчиков требуется маппинг на БДУ ФСТЭК.
- Пример: УБИ.203 — угроза внедрения вредоносного ПО.

## Sigma Rules

Sigma — открытый формат правил детектирования (SIEM-агностик).

Пример правила (PowerShell с закодированной командой):

```yaml
title: PowerShell Encoded Command
id: 8f3c7c0e-1b6c-4c0e-9a1b-2c3d4e5f6a7b
status: experimental
description: Обнаружение powershell.exe с закодированной командой (T1059.001)
references:
  - https://attack.mitre.org/techniques/T1059/001/
tags:
  - attack.execution
  - attack.t1059.001
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\powershell.exe'
    CommandLine|contains|all:
      - '-enc'
      - 'SQBFAFgA'
  condition: selection
falsepositives:
  - Легитимные скрипты администрирования
level: high
```

## Практика

- TryHackMe: MITRE room, SOC Level 1, Cyber Kill Chain.
- CyberDefenders: расследования с привязкой к ATT&CK.
- Поднять Wazuh/Elastic и перехватить Mitre Caldera / Atomic Red Team.

## Связанные материалы

- Knowledge/soc/windows-event-logs.md
- Knowledge/soc/siem-basics.md
- Knowledge/soc/active-directory.md
- Experience/labs/soc/