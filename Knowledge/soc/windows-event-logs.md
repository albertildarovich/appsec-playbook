# Windows Event Logs + Sysmon

## Зачем это SOC-аналитику

Windows Event Logs — основной источник информации о событиях безопасности в среде Windows. SOC-аналитик должен:

- Понимать структуру и категории журналов.
- Знать ключевые event ID наизусть.
- Уметь строить запросы в SIEM по событиям.
- Различать критические события от рутины.
- Использовать Sysmon для глубокого мониторинга.

## Структура журналов Windows

```
Windows Logs
  - Application   (приложения)
  - Security      (безопасность: входы, доступы, аудит)
  - System        (службы, драйверы, система)

Applications and Services Logs
  - Microsoft-Windows-Sysmon/Operational
  - Microsoft-Windows-PowerShell/Operational
  - Microsoft-Windows-TaskScheduler/Operational
  - Microsoft-Windows-TerminalServices-*
  - Microsoft-Windows-DNS-Server/Analytical
```

## Ключевые журналы

| Журнал | Что содержит |
|--------|--------------|
| Security | Аутентификация, доступ, изменение объектов, аудит |
| System | Службы, драйверы, ошибки системы |
| Application | События приложений |
| PowerShell Operational | ScriptBlock logging, модуль, pipeline |
| Sysmon Operational | Глубокий мониторинг: процессы, сеть, файлы, реестр |
| TaskScheduler | Создание/изменение задач планировщика |
| Audit (Advanced) | Object Access, Handle, Token |

## Ключевые Event ID — Security Log

### Вход в систему (Logon/Logoff)

| Event ID | Название | Что означает |
|----------|----------|--------------|
| 4624 | An account was successfully logged on | Успешный вход (смотреть Logon Type) |
| 4625 | An account failed to log on | Неудачный вход |
| 4634 | An account was logged off | Выход из системы |
| 4647 | User initiated logoff | Пользователь инициировал выход |
| 4672 | Special privileges assigned to new logon | Вход с привилегиями администратора/аккаунт sensitive |
| 4776 | DC: credential validation | Проверка учётных данных (NTLM) на DC |
| 4778 | Session reconnected to Window Station | Переподключение RDP |
| 4779 | Session disconnected | Отключение RDP-сессии |
| 4800 | Workstation locked | Рабочая станция заблокирована |
| 4801 | Workstation unlocked | Рабочая станция разблокирована |

### Kerberos

| Event ID | Название | Что означает |
|----------|----------|--------------|
| 4768 | Kerberos TGT requested | Выдан TGT (AS-REQ) |
| 4769 | Kerberos service ticket requested | Выдан TGS (TGS-REQ) |
| 4770 | Kerberos ticket renewed | Обновлён TGT |
| 4771 | Kerberos pre-auth failed | Пред-аутентификация не удалась (неверный пароль) |
| 4772 | Kerberos ticket deleted | Удалён билет |

### Учётные записи и группы

| Event ID | Название | Что означает |
|----------|----------|--------------|
| 4720 | User account created | Создан пользователь |
| 4722 | User account enabled | Пользователь включён |
| 4723 | Password change attempt | Попытка смены пароля |
| 4724 | Password reset attempt | Сброс пароля (высокая привилегия) |
| 4725 | User account disabled | Пользователь отключён |
| 4726 | User account deleted | Пользователь удалён |
| 4728 | Member added to security group | Добавлен в группу безопасности |
| 4729 | Member removed from security group | Удалён из группы |
| 4732 | Member added to local group | Добавлен в локальную группу (важно: Administrators) |
| 4738 | User account changed | Изменена учётная запись |
| 4740 | Account locked out | Учётная запись заблокирована |
| 4741 | Computer account created | Создана учётная запись компьютера |
| 4765 | SID History added | Добавление SID History (подозрительно) |
| 4766 | SID History added (fail) | Ошибка SID History |

### Процессы и планировщик

| Event ID | Название | Что означает |
|----------|----------|--------------|
| 4688 | New process created | Создан процесс (включить CommandLine) |
| 4689 | A process has exited | Процесс завершён |
| 4698 | Scheduled task created | Создана задача планировщика |
| 4699 | Scheduled task deleted | Удалена задача |
| 4700 | Scheduled task enabled | Задача включена |
| 4701 | Scheduled task disabled | Задача отключена |
| 4702 | Scheduled task updated | Задача обновлена |

### Объекты и доступ

| Event ID | Название | Что означает |
|----------|----------|--------------|
| 4656 | Handle to object requested | Запрошен дескриптор объекта |
| 4658 | Handle to object closed | Дескриптор закрыт |
| 4662 | Operation performed on object | Операция с объектом (важно для репликации) |
| 4663 | Access to object attempted | Попытка доступа к объекту |
| 5140 | Network share object accessed | Доступ к сетевой шаре |
| 5145 | Detailed network share access | Подробно: к какому файлу на шаре |

### Политики и изменения

| Event ID | Название | Что означает |
|----------|----------|--------------|
| 4719 | Audit policy changed | Изменена политика аудита (подозрительно) |
| 4739 | Domain policy changed | Изменена доменная политика |
| 4648 | Logon with explicit credentials | Вход с явными учётными данными (runas) |
| 4670 | Object permissions changed | Изменены права объекта |

## Sysmon

### Что такое Sysmon

Sysmon — системная служба Windows (Sysinternals), логирующая события глубже стандартных журналов: процессы, сетевые подключения, изменения файлов/реестра, загрузку драйверов.

Установка:

```
Sysmon64.exe -accepteula -i sysmon-config.xml
```

### Ключевые Event ID Sysmon

| Event ID | Название | Что детектит |
|----------|----------|--------------|
| 1 | ProcessCreate | Создание процесса (с полной командой строкой) |
| 2 | FileChangeTime | Изменение времени файла (timestomp) |
| 3 | NetworkConnect | Сетевые подключения процесса |
| 4 | SysmonServiceStateChanged | Изменение состояния службы Sysmon |
| 5 | ProcessTerminate | Завершение процесса |
| 6 | DriverLoad | Загрузка драйвера |
| 7 | ImageLoad | Загрузка DLL/модуля |
| 8 | CreateRemoteThread | Удалённый поток в другом процессе (инъекция) |
| 9 | RawAccessRead | Прямое чтение диска (Mimikatz/raw access) |
| 10 | ProcessAccess | Доступ к процессу (lsass dumping) |
| 11 | FileCreate | Создание файла |
| 12 | RegistryEvent | Создание/удаление ключа реестра |
| 13 | RegistryValueSet | Установка значения реестра (persistence) |
| 14 | RegistryKeyRename | Переименование ключа реестра |
| 15 | FileCreateStreamHash | Альтернативные потоки NTFS (ADS) |
| 17/18 | PipeEvent | Подключение к именованному каналу |
| 22 | DNSQuery | DNS-запросы (C2, DGA) |
| 23 | FileDelete | Удаление файла (сигнатура) |
| 25 | ProcessTampering | Изменение/замена процесса (process hollowing) |
| 26 | FileDeleteDetected | Файл удалён |

### Ключевые техники MITRE -> Sysmon Event ID

| Атака | Sysmon | Event ID Windows |
|-------|--------|------------------|
| Mimikatz (lsass dump) | Event 10 ProcessAccess, Event 9 RawAccessRead | 4656, 4688 |
| PowerShell -enc | Event 1 ProcessCreate | 4688 |
| Persistence в реестре | Event 13 RegistryValueSet | 4657 |
| New service | Event 1 ProcessCreate (sc.exe/service) | 7045, 4688 |
| C2 DNS | Event 22 DNSQuery | - |
| Process hollowing | Event 25 ProcessTampering, 8 CreateRemoteThread | 4688 |
| Lateral movement SMB | Event 3 NetworkConnect | 5140, 5145 |

## Пример аналитики: детект Mimikatz

Признаки:

```
1. Sysmon Event 10: lsass.exe <- winlogon.exe/mimikatz.exe (ProcessAccess)
2. Sysmon Event 1: процесс mimikatz.exe (имя + args 'sekurlsa::logonpasswords')
3. Sysmon Event 3: сетевые подключения процесса (C2/вынос)
4. Event 4656: открытие дескриптора lsass с запросом ReadProcessMemory
```

Пример запроса KQL (Elastic):

```kql
event.code: 10 AND process.name: lsass.exe
AND source.process.name: (winlogon.exe OR lsass.exe OR csrss.exe)
AND NOT source.process.name: ("svchost.exe" OR "services.exe")
```

## Сбор логов: включение аудита

Важные политики аудита (для инфраструктуры):

```
Security
  - Audit Logon Events: Success, Failure
  - Audit Account Logon Events: Success, Failure
  - Audit Account Management: Success
  - Audit Process Creation: Success
  - Audit Object Access: Success
  - Audit Directory Service Access: Success

Advanced (для Process Creation, включить командную строку)
  - Computer Configuration -> Administrative Templates
    -> System -> Audit Process Creation -> Include command line in process creation events: Enabled

PowerShell
  - Script Block Logging: Enabled
  - Module Logging: Enabled
```

## Шпаргалка: приоритетные события для мониторинга

| Сигнал | Event ID | Комментарий |
|--------|----------|-------------|
| Вход с RDP от Domain Admin | 4624 + LogonType 10 | Проверять источник, время |
| 20+ неудачных входа за 15 мин | 4625 | Password spraying / brute force |
| Создание пользователя | 4720 | Редкое событие |
| Добавление в Administrators | 4728/4732 | Немедленная проверка |
| Новая служба | 7045, Sysmon 1 | Реже бывает легитимной |
| Задача планировщика | 4698, Sysmon 1 | Persistence |
| Сброс пароля | 4724 | Атакующий часто сбрасывает пароль жертвы |
| Изменение политики аудита | 4719 | Отключение аудита |
| Process create с -enc / powershell | 4688, Sysmon 1 | Обфускация |
| Доступ к lsass | Sysmon 10 | Credential dumping |
| DNS на известные DGA | Sysmon 22 | C2 |

## Практика

- Настроить домашний Windows + Sysmon (конфиг SwiftOnSecurity).
- Построить аналитику в Wazuh/Elastic.
- TryHackMe: Windows Event Logs, Sysmon room.
- CyberDefenders: Windows-расследования.

## Связанные материалы

- Knowledge/soc/active-directory.md
- Knowledge/soc/mitre-attack.md
- Knowledge/soc/siem-basics.md
- Experience/labs/soc/