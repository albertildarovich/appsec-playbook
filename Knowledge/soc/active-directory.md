# Active Directory для SOC

## Зачем это SOC-аналитику

Active Directory (AD) — центральная система аутентификации и авторизации в корпоративной сети Windows. Большинство атакующих целей — учётные данные и доступ к AD. SOC-аналитик обязан:

- Понимать структуру домена (OU, пользователи, группы, компьютеры, GPO).
- Различать протоколы аутентификации: Kerberos vs NTLM.
- Знать типовые атаки: brute force, pass-the-hash, Kerberoasting, Golden/Silver Ticket, DCSync.
- Уметь находить следы атак в Windows Event Logs.

## Структура домена

```
Forest (лес) - корневой контейнер
  |
  +-- Domain (домен) - адм. граница безопасности
       |
       +-- OU (Organizational Unit)
       |    |
       |    +-- Users (пользователи)
       |    +-- Groups (группы)
       |    +-- Computers (компьютеры)
       |    +-- GPO (Group Policy Objects)
       |
       +-- Builtin (встроенное)
       +-- Computers
       +-- Domain Controllers (контроллеры домена)
       +-- Users / Groups
```

Ключевые компоненты:

| Компонент | Описание |
|-----------|----------|
| Domain Controller (DC) | Сервер, хранящий базу AD (ntds.dit), выполняющий аутентификацию |
| OU | Организационная единица для делегирования прав и применения GPO |
| GPO | Групповые политики: параметры безопасности, скрипты, ограничения программ |
| SPN | Service Principal Name: идентификатор службы для Kerberos |
| DNS | Тесная интеграция: `_msdcs`, SRV-записи для поиска DC |
| Kerberos | Основной протокол аутентификации |
| NTLM | Легаси-протокол, используется как fallback |

## Протоколы аутентификации

### Kerberos

```
Клиент                          DC (KDC)                        Целевой сервер
  |                                 |                                |
  |--- 1. AS-REQ (login) --------->|                                |
  |<-- 2. AS-REP (TGT) ------------|                                |
  |                                 |                                |
  |--- 3. TGS-REQ (TGT + SPN) ---->|                                |
  |<-- 4. TGS-REP (TGS/ST) --------|                                |
  |                                 |                                |
  |--- 5. AP-REQ (ST) --------------------------------------------->|
  |                                 |                                |
  |<-- 6. AP-REP ---------------------------------------------------|
```

Этапы:

1. AS-REQ/AS-REP: клиент получает TGT (Ticket Granting Ticket), зашифрованный ключом krbtgt.
2. TGS-REQ/TGS-REP: клиент запрашивает TGS (Ticket Granting Service) для службы по SPN.
3. AP-REQ/AP-REP: TGS предъявляется целевой службе, проводится взаимная аутентификация.

Связанные события:

| Событие | Описание |
|---------|----------|
| 4768 | Выдан TGT (AS-REQ успешен) |
| 4769 | Выдан TGS (TGS-REQ успешен) |
| 4770 | Обновлён TGT |
| 4771 | Kerberos пред-аутентификация не удалась |
| 4776 | Проверка учётных данных (DC) — NTLM |

### NTLM

Классическая схема challenge/response:

```
1. Клиент -> сервер: запрос аутентификации
2. Сервер -> клиент: challenge (8 байт)
3. Клиент -> сервер: response = hash(NTLM) + challenge
4. Сервер проверяет через DC (Netlogon)
```

Связанные события:

| Событие | Описание |
|---------|----------|
| 4624 | Успешный вход (Logon Type 3 = сетевой) |
| 4625 | Неудачный вход |
| 4776 | Проверка учётных данных на DC (NTLM) |

## Logon Types (для Event 4624/4625)

| Logon Type | Описание | Что означает |
|------------|----------|--------------|
| 2 | Interactive | Локальный вход с клавиатуры |
| 3 | Network | Сетевой доступ (SMB, RPC, net use) |
| 4 | Batch | Служба заданий/планировщик |
| 5 | Service | Запуск службы |
| 7 | Unlock | Разблокировка рабочей станции |
| 8 | NetworkCleartext | Сетевая передача plaintext пароля (IIS, FTP) |
| 9 | NewCredentials | Запуск от другого пользователя (runas /netonly) |
| 10 | RemoteInteractive | RDP-вход |
| 11 | CachedInteractive | Вход с кэшированными учётными данными |

## Ключевые учётные объекты

| Объект | Описание |
|--------|----------|
| krbtgt | Учётная запись KDC; компрометация = весь домен |
| Domain Admins | Полный доступ ко всем DC |
| Enterprise Admins | Полный доступ ко всему лесу |
| Administrators | Локальные администраторы хоста |
| SERVICE$ | Учётные записи сервисов (условно) |
| Machine$ | Учётная запись компьютера |

## Типовые атаки на AD

### 1. Brute Force / Password Spraying (T1110)

Описание: перебор паролей по списку пользователей.

Как выглядит в логах:

- Event 4625 — множество неудачных входов с одного IP.
- Event 4771 — Kerberos пред-аутентификация не удалась.
- Аномальные вхождения в нерабочее время.

Детект (Sigma):

```yaml
title: Password Spraying - Many Failed Logons
id: 1f4f7a60-9e3d-4f1a-8b9c-2d3e4f5a6b7c
status: experimental
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4625
    LogonType: 3
  timeframe: 15m
  condition: selection | count() by TargetUserName > 10
level: high
```

### 2. Pass-the-Hash (T1550.002)

Описание: использование NTLM-хеша без пароля.

Как выглядит в логах:

- Event 4624 Logon Type 3 с необычного источника.
- Вход с хешем вместо пароля.
- Аномальные сетевые подключения ADMIN$/C$.

### 3. Kerberoasting (T1558.003)

Описание: запрос TGS для сервисной учётной записи, затем brute-force офлайн по RC4/AES ключу.

Как выглядит в логах:

- Event 4769 — много запросов TGS к одному SPN.
- TGS с типом шифрования RC4_HMAC_MD5 (0x17).
- Запросы TGS без предшествующего легитимного использования службы.

### 4. Golden Ticket (T1558.001)

Описание: подделка TGT с помощью хеша krbtgt.

Как выглядит в логах:

- Event 4768 — TGT от имени доменного администратора с неизвестного хоста.
- TGT с аномальным временем жизни (по умолчанию 10 часов).
- Использование с непредвиденного устройства.

### 5. Silver Ticket (T1558.002)

Описание: подделка TGS для конкретной службы с хешем учётной записи службы.

Как выглядит:

- Event 4769 — TGS для службы, которую пользователь не использует обычно.
- Аннормальные попытки доступа к службе.

### 6. DCSync (T1003.006)

Описание: имитация DC через репликацию (MS-DRSR) для получения хешей из ntds.dit.

Как выглядит в логах:

- Event 4662 — операции репликации каталога с не-DC источника.
- Подключения по порту 135/445 к DC от необычных хостов.
- Использование привилегий Replicating Directory Changes.

Детект (Sigma):

```yaml
title: DCSync - Replication Request
id: 2f5a8b10-8e2f-4c1a-9b8d-6e7f8a9b0c1d
status: experimental
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4662
    Properties|contains:
      - '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2'  # DS-Replication-Get-Changes
      - '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'  # DS-Replication-Get-Changes-All
  filter:
    SubjectUserName|endswith: '$'  # реальный DC
  condition: selection and not filter
level: critical
```

### 7. LLMNR/NBT-NS Poisoning (T1557.001)

Описание: перехват запросов на разрешение имён, подмена, получение хешей NTLMv2.

Как выглядит:

- Ответы на мультикаст-запросы от не-DC хостов.
- Аномальные NTLMv2-попытки к несуществующим именам.

## Признаки атак в Event Logs (быстрая шпаргалка)

| Атака | Event ID | Ключевые поля |
|-------|----------|---------------|
| Brute Force | 4625, 4771 | Source Network Address, Logon Type 3, много раз |
| Password Spraying | 4625 | Один пароль, многие пользователи, 1 попытка/пользователя |
| Pass-the-Hash | 4624 | Logon Type 3, NTLM, источник — необычный хост |
| Kerberoasting | 4769 | SPN, Encryption Type 0x17, много запросов |
| Golden Ticket | 4768 | SID S-1-5-21...(512), аномальный источник/время |
| DCSync | 4662 | Привилегии репликации у не-DC |
| Skeleton Key | 4769/4771 | Массовые аномальные Kerberos-запросы |
| New Admin User | 4720, 4728 | Создание пользователя, добавление в группу Admins |

## Утилиты для атак (что искать в процессах)

| Утилита | Что делает | Сигнатура |
|---------|-----------|-----------|
| mimikatz | Credential dumping, Golden Ticket | lsass.exe доступ, sekurlsa |
| BloodHound | Анализ путей атак в AD | Граф-запросы, SharpHound.exe |
| Rubeus | Kerberos-атаки | TGT/TGS запросы |
| kerberoast | Kerberoasting | Много TGS-запросов |
| impacket-secretsdump | DCSync | Репликация каталога |
| CrackMapExec | Сетевые атаки | Много SMB-подключений |

## Практика

- Поднять домашний AD (Windows Server + клиенты).
- Перехватить атаки: Mimikatz, Kerberoast, DCSync через Wazuh/Elastic.
- TryHackMe: Active Directory rooms (AD basics, attack paths).
- CyberDefenders: Blue Team labs по AD.

## Связанные материалы

- Knowledge/soc/windows-event-logs.md
- Knowledge/soc/mitre-attack.md
- Knowledge/soc/siem-basics.md
- Experience/labs/soc/