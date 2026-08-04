# Таблица инцидентов SOC Lab

| ID | Source | Alert | MITRE | Severity | Status | Action |
|---|---|---|---|---|---|---|
| SOC-001 | Windows/Sysmon | Suspicious PowerShell | T1059.001 | Medium | Escalated | Collected command line, parent process, user |
| SOC-002 | Windows Event Log | Failed logon burst | T1110 | High | Closed | Verified brute force pattern |
| SOC-003 | Linux auditd | sudo privilege escalation | T1548 | Medium | Closed | Checked user, command, timestamp |
| SOC-004 | Wazuh FIM | Sensitive file modified | T1565 | High | Escalated | Preserved file hash and timeline |

## Детали инцидентов

### SOC-001: Suspicious PowerShell (T1059.001)

- **Источник:** Sysmon Event ID 1 (Process Creation) на WS-001
- **Событие:** `powershell.exe -enc SQBFAFgA...` — encoded command
- **Parent Process:** `winword.exe`
- **Пользователь:** `WS-001\albert`
- **Результат анализа:** обфусцированная команда PowerShell, запущенная из документа Word. Командная строка извлечена, parent process записан, пользователь идентифицирован. Эскалировано на L2.
- **Правило:** `sigma-powershell-encoded.yml`

### SOC-002: Failed Logon Burst (T1110)

- **Источник:** Windows Security Event ID 4625 на WS-001
- **Событие:** 47 событий failed logon с одного IP за 60 секунд
- **IP-источник:** `185.220.101.2`
- **Целевой аккаунт:** `Administrator`
- **Результат анализа:** подтверждён паттерн brute force. Учётная запись не скомпрометирована (пароль стойкий). IP добавлен в blocklist на firewall. Инцидент закрыт.
- **Правило:** `sigma-brute-force.yml`

### SOC-003: sudo Privilege Escalation (T1548)

- **Источник:** Linux auditd на SRV-01
- **Событие:** `sudo -i` от пользователя `deploy`
- **Timestamp:** 2026-08-03 14:22:33 UTC
- **Результат анализа:** пользователь `deploy` выполнил `sudo -i` без предварительного согласования. Проверена команда, пользователь, timestamp. Подтверждено — легитимная активность (дежурный администратор). Инцидент закрыт с пометкой «проинструктировать о необходимости согласования».
- **Правило:** `sigma-sudo-privesc.yml`

### SOC-004: Sensitive File Modified (T1565)

- **Источник:** Wazuh FIM на SRV-01
- **Событие:** модификация `/etc/passwd`
- **Хеш до:** сохранён
- **Хеш после:** сохранён
- **Результат анализа:** добавлен новый пользователь `backup-svc`. Несанкционированное изменение. Файловый хеш и таймлайн сохранены. Инцидент эскалирован на L2.
- **Правило:** встроенное правило Wazuh FIM (550/553)