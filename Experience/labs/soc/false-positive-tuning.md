# False Positive Tuning (SOC L1)

Документирование процесса фильтрации ложных срабатываний и улучшения качества детектирования.
Соответствует требованию: «участие в улучшении качества детектирования: регистрация задач на доработку и фильтрацию правил корреляции, снижение количества ложных срабатываний, создание исключающей логики».

## Принцип

Каждый FP (False Positive) — это не просто «закрыть и забыть», а сигнал к улучшению правила.
После triage L1-аналитик:

1. Фиксирует правило-источник шума.
2. Анализирует причину FP.
3. Предлагает exception (исключающую логику).
4. Проверяет, что exception не убивает detection coverage.
5. Регистрирует задачу на доработку правила.

---

## Пример 1: PowerShell encoded command — FP на легитимный скрипт развёртывания

### Правило

`sigma-powershell-encoded.yml` (id: 100011) — детект `powershell.exe -enc <base64>`.

### Симптом

Алерт срабатывал 3–5 раз в день на хосте SRV-DEPLOY. Команда:
```
powershell.exe -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AZABlAHAAbABvAHkALQBpAG4AdABlAHIAbgBhAGwALgBjAG8AcgBwAC8AcwBjAHIAaQBwAHQALgBwAHMAMQAnACkA
```

### Анализ

Декодированная команда:
```powershell
IEX (New-Object Net.WebClient).DownloadString('http://deploy-internal.corp/script.ps1')
```

- Parent process: `jenkins-slave.exe`
- Пользователь: `NT AUTHORITY\SYSTEM`
- Хост: `SRV-DEPLOY` (сервер развёртывания)
- Источник URL: внутренний корпоративный сервер `deploy-internal.corp`

**Вывод:** легитимный CI/CD сценарий развёртывания. Jenkins-agent загружает скрипт с внутреннего сервера. True Positive исключён.

### Exception (исключающая логика)

Добавить фильтр в правило:

```yaml
filter_ci:
  ParentImage|endswith: '\jenkins-slave.exe'
  CommandLine|contains: 'deploy-internal.corp'
condition: selection_img and selection_flags and not filter_ci
```

### Проверка Detection Coverage

| Сценарий | До exception | После exception |
|---|---|---|
| Файловый (PowerShell из Word/Outlook) | Детектится | Детектится |
| Фишинг (PowerShell из вредоносного PDF) | Детектится | Детектится |
| CI/CD Jenkins-деплой | FP-алерт | Отфильтрован |
| Интерактивный PowerShell (пользователь) | Детектится | Детектится |

**Покрытие не потеряно.** Исключён только известный легитимный шаблон CI/CD.

### Задача на доработку

```
Task:        FP-TUNE-001
Rule:        sigma-powershell-encoded.yml (id: 100011)
Issue:       FP на CI/CD деплой через Jenkins
Resolution:  Добавлен filter_ci по ParentImage и URL
Status:      Resolved
```

---

## Пример 2: Multiple Failed Logons — FP на сервисный аккаунт

### Правило

`sigma-brute-force.yml` (id: 100013) — детект >10 событий EventID 4625 за 60 секунд с одного IP.

### Симптом

Алерт срабатывал каждое утро в 06:00 UTC на хосте `SRV-SQL`. Целевой аккаунт: `svc-backup`. IP-источник: `10.0.0.50` (сервер бэкапов).

### Анализ

- 12 событий EventID 4625 за 45 секунд.
- Статус: `0xC000006A` (user name is correct but password is wrong).
- User: `svc-backup`.
- Source IP: `10.0.0.50` (SRV-BACKUP01).
- Периодичность: каждое утро в 06:00.

**Вывод:** сервисный аккаунт `svc-backup` с истёкшим паролем. Бэкап-сервер пытается аутентифицироваться с устаревшими учётными данными. Не атака. Создан тикет на обновление пароля сервисного аккаунта.

### Exception

Добавить фильтр по доверенному IP источника и имени сервисного аккаунта:

```yaml
filter_service_account:
  TargetUserName: 'svc-backup'
  IpAddress: '10.0.0.50'
condition: selection | count() by TargetUserName, IpAddress > 10 and not filter_service_account
```

### Проверка Detection Coverage

| Сценарий | До exception | После exception |
|---|---|---|
| Brute force с внешнего IP | Детектится | Детектится |
| Password spray изнутри сети | Детектится | Детектится |
| Сервисный аккаунт svc-backup с SRV-BACKUP01 | FP-алерт | Отфильтрован |
| Brute force на другой сервисный аккаунт | Детектится | Детектится |

### Задача на доработку

```
Task:        FP-TUNE-002
Rule:        sigma-brute-force.yml (id: 100013)
Issue:       FP на сервисный аккаунт svc-backup с истёкшим паролем
Resolution:  Добавлен filter_service_account. Параллельно создан тикет на смену пароля.
Status:      Resolved
```

---

## Пример 3: New Local Admin — FP на легитимный GPO

### Правило

`sigma-new-local-admin.yml` (id: 100014) — детект EventID 4732 (добавление в Administrators).

### Симптом

Алерт срабатывал еженедельно по вторникам в 02:00. Субъект: `SYSTEM` (уже отфильтрован базовым filter_system, но событие пришло от `DOMAIN\GPO-SVC`).

### Анализ

- EventID 4732, TargetUserName: `Administrators`.
- SubjectUserName: `DOMAIN\GPO-SVC`.
- MemberSid: `S-1-5-21-...-500` (встроенный Administrator).
- Расписание: каждый вторник 02:00.

**Вывод:** групповая политика (GPO) добавляет доменного Administrator в локальную группу Administrators на всех рабочих станциях. Это ожидаемое поведение корпоративной политики. Не атака.

### Exception

Добавить фильтр по доверенному субъекту GPO:

```yaml
filter_gpo:
  SubjectUserName: 'DOMAIN\GPO-SVC'
  MemberSid|endswith: '-500'
condition: selection and not filter_system and not filter_gpo
```

### Проверка Detection Coverage

| Сценарий | До exception | После exception |
|---|---|---|
| Злоумышленник добавляет пользователя в Administrators | Детектится | Детектится |
| GPO добавляет доменного Administrator | FP-алерт | Отфильтрован |
| Добавление через net localgroup (ручное) | Детектится | Детектится |

### Задача на доработку

```
Task:        FP-TUNE-003
Rule:        sigma-new-local-admin.yml (id: 100014)
Issue:       FP на GPO добавление Administrator через GPO-SVC
Resolution:  Добавлен filter_gpo по SubjectUserName и MemberSid
Status:      Resolved
```

---

## Сводная таблица FP-тюнинга

| ID | Правило | Причина FP | Exception | Coverage сохранён |
|---|---|---|---|---|
| FP-TUNE-001 | sigma-powershell-encoded | Jenkins CI/CD деплой | filter_ci по ParentImage + URL | Да |
| FP-TUNE-002 | sigma-brute-force | Сервисный аккаунт с истёкшим паролем | filter_service_account по TargetUserName + IpAddress | Да |
| FP-TUNE-003 | sigma-new-local-admin | GPO добавление Administrator | filter_gpo по SubjectUserName + MemberSid | Да |

## Процесс работы с FP (L1)

```
1. Получен алерт
       |
2. Triage: похоже на FP?
       |
   [Нет] --> Эскалация как инцидент
       |
   [Да]
       |
3. Анализ причины (почему правило сработало легитимно)
       |
4. Формулирование exception (исключающая логика)
       |
5. Проверка: не теряем ли detection coverage?
       |
6. Регистрация задачи на доработку правила (FP-TUNE-XXXX)
       |
7. Закрытие алерта как FP с пометкой о тюнинге
```

## Ключевая мысль

> FP-тюнинг — это не «убрать шум», а «сделать правило точнее, не потеряв обнаружение».
> Каждый FP должен порождать задачу на доработку. Без этого SIEM деградирует в генератор белого шума.