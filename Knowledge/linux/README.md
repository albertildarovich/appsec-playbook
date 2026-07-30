# Linux Security (AppSec-релевантный минимум)

> **Контекст:** Набор команд и практик Linux, необходимых AppSec-инженеру для инцидент-респонса, пентеста, разбора уязвимостей и работы с серверами.

---

## Инцидент-респонс: первые команды на скомпрометированном хосте

```bash
# КТО на хосте
who; w; last -20                    # Текущие сессии + история входов

# ЧТО запущено
ps auxf                              # Дерево процессов
ss -tlnp                             # Открытые TCP-порты (современная замена netstat)
lsof -i -P -n                        # Процессы с сетевыми соединениями

# Аномалии
find / -type f -perm -4000 2>/dev/null    # SUID-бинарники (эскалация привилегий)
find / -type f -perm -2000 2>/dev/null    # SGID-бинарники
find / -type d -perm -2 -o -perm -20 2>/dev/null  # Директории с правом записи для всех

# Crontab / автозагрузка
crontab -l -u root
cat /etc/crontab
ls -la /etc/cron.*
systemctl list-timers --all

# Сетевые соединения
ss -tunap                             # Все TCP/UDP соединения с PID
netstat -tunap (legacy)
arp -a                                # ARP-таблица (поиск ARP-spoofing)

# Модифицированные файлы за последние 24 часа
find / -type f -mtime -1 2>/dev/null | grep -v '^/proc\|^/sys\|^/run'

# История команд пользователей
cat /home/*/.bash_history
cat /root/.bash_history
```

---

## systemd / journalctl

```bash
# Просмотр логов сервиса
journalctl -u nginx -n 100 --no-pager
journalctl -u sshd --since "2025-01-15 10:00" --until "2025-01-15 12:00"

# Логи с приоритетом ERR и выше
journalctl -p err -n 50

# Поиск failed-попыток входа
journalctl -u sshd | grep "Failed password"

# Статус и перезапуск сервиса
systemctl status nginx
systemctl restart nginx
systemctl enable --now nginx     # Включить автозапуск + стартовать

# Список всех юнитов
systemctl list-units --type=service --state=running
```

---

## auditd (аудит событий)

```bash
# Поиск по ключевым словам
ausearch -k auth                  # События аутентификации
ausearch -sc execve               # Запуск процессов
ausearch -ui $(id -u alice)       # Действия пользователя alice

# Правила аудита (/etc/audit/rules.d/)
# Мониторинг изменений /etc/shadow
-w /etc/shadow -p wa -k passwd_changes

# Мониторинг выполнения подозрительных бинарников
-w /usr/bin/nc -p x -k nc_exec
-w /usr/bin/wget -p x -k wget_exec

# Мониторинг записи в автозагрузку
-w /etc/crontab -p wa -k crontab_edit
-w /etc/cron.hourly -p wa -k cron_edit

# Перезагрузка правил без перезапуска
auditctl -R /etc/audit/rules.d/my.rules
```

---

## iptables / nftables (минимум)

```bash
# Посмотреть все правила
iptables -L -n -v
nft list ruleset

# Default-deny для INPUT
iptables -P INPUT DROP
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Rate limiting SSH (6 попыток в минуту)
iptables -A INPUT -p tcp --dport 22 -m recent --set --name ssh
iptables -A INPUT -p tcp --dport 22 -m recent --update --seconds 60 --hitcount 6 \
  --name ssh -j DROP
```

---

## OpenSSL (проверка TLS)

```bash
# Проверить сертификат домена
openssl s_client -connect example.com:443 -servername example.com </dev/null

# Извлечь информацию о сертификате
echo | openssl s_client -connect example.com:443 2>/dev/null | \
  openssl x509 -noout -dates -subject -issuer

# Проверить поддерживаемые TLS-версии
openssl s_client -connect example.com:443 -tls1_2 </dev/null   # TLS 1.2
openssl s_client -connect example.com:443 -tls1_1 </dev/null   # Должно FAIL

# Сгенерировать самоподписной сертификат (для тестов)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem
```

---

## SSH Hardening (/etc/ssh/sshd_config)

```bash
# Минимальный hardening SSH
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers alice bob
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 0
X11Forwarding no
AllowAgentForwarding no

# Проверить конфигурацию
sshd -t

# После изменения — перезагрузить
systemctl reload sshd
```

---

## AppSec-полезные однострочники

```bash
# Поиск секретов в истории команд
cat ~/.bash_history | grep -E 'password|secret|token|API_KEY|DATABASE_URL'

# Поиск JWT в логах
grep -rP 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' /var/log/

# Поиск IP-адресов в логах (сортировка по частоте)
grep -oP '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# Проверка открытых портов локально
ss -tlnp | awk '{print $4}' | grep -oP ':\d+'

# Сканирование на уязвимость DirtyCow (CVE-2016-5195) — пример проверки
grep -q dirtycow /proc/self/maps 2>/dev/null && echo "MAYBE VULNERABLE" || echo "OK"

# Поиск файлов, доступных на запись всем
find / -type f -perm -2 -not -path '/proc/*' -not -path '/sys/*' 2>/dev/null
```

---

## Права доступа (AppSec-важные проверки)

```bash
# Проверка прав на чувствительные файлы
stat /etc/shadow        # Должен быть root:root, 600 или 000
stat /etc/passwd        # Должен быть root:root, 644
stat /etc/ssh/ssh_host_*_key   # Должны быть root:root, 600

# Поиск файлов с SUID-битом (эскалация привилегий)
find / -type f -perm -4000 -ls 2>/dev/null

# Поиск файлов, владелец которых не существует
find / -nouser -o -nogroup 2>/dev/null

# Проверка capabilities файла (Linux capabilities вместо SUID)
getcap /usr/bin/ping     # Должен иметь cap_net_raw, а не SUID root
```

---

## Полезные ссылки

- [Linux Auditd Quick Start](https://linux.die.net/man/8/auditd)
- [CIS Distribution Independent Linux Benchmark](https://www.cisecurity.org/benchmark/distribution_independent_linux)
- [OWASP Linux Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Linux_Cheat_Sheet.html)