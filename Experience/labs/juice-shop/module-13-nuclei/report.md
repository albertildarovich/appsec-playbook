# Nuclei — Automation & Template Writing

> **Цель:** Научиться использовать Nuclei для автоматизированного сканирования и писать свои шаблоны.

---

## Что такое Nuclei?

**Nuclei** — это DAST-инструмент для автоматизированного поиска уязвимостей по шаблонам (templates). Он отправляет HTTP-запросы к целевым эндпоинтам и проверяет ответы по заданным правилам (matchers).

- **Тип:** DAST (Dynamic Application Security Testing)
- **Язык:** Go-бинарник, лёгкий (~40MB)
- **Формат:** YAML-шаблоны
- **Автор:** ProjectDiscovery

---

## Установка

```bash
brew install nuclei
```

Nuclei v3.11.0 установлен.

---

## Сканирование

### 1. Только Critical/High/Medium (6,318 шаблонов)

```bash
nuclei -u http://localhost:3000 -severity critical,high,medium -o scan-medium.txt
```

Найдено: **1 finding**

| Шаблон | Severity | Эндпоинт |
|--------|----------|----------|
| `prometheus-metrics` | medium | `GET /metrics` |

### 2. Все severity (10,477 шаблонов)

```bash
nuclei -u http://localhost:3000 -severity critical,high,medium,low,info -o scan-full.txt
```

Найдено: **21 finding**

**Medium (1):**
| Шаблон | Описание |
|--------|----------|
| `prometheus-metrics` | `/metrics` открыт для всех |

**Info (20):**
- `swagger-api` — Swagger/API-docs доступен без авторизации
- `robots-txt` — `/robots.txt` раскрывает `/ftp`
- `security-txt` — контакт для репорта
- `http-missing-security-headers` — **8 заголовков** отсутствуют:
  - Cross-Origin-Resource-Policy
  - Strict-Transport-Security
  - Content-Security-Policy
  - Permissions-Policy
  - X-Permitted-Cross-Domain-Policies
  - Referrer-Policy
  - Cross-Origin-Embedder-Policy
  - Cross-Origin-Opener-Policy
- `tech-detect` — Google Fonts API fingerprint
- `fingerprinthub` — QM System fingerprint
- `owasp-juice-shop-detect` — идентификация приложения
- `x-recruiting-header` — заголовок `/recruiting`
- `deprecated-feature-policy` — устаревший Feature-Policy
- `addeventlistener-detect` — использование addEventListener
- `dameng-detect`, `snmpv3-detect` — false positive (порт open)

---

## Сравнение: Nuclei vs ручной аудит

| Уязвимость | Nuclei | Ручной аудит |
|------------|--------|--------------|
| Mass Assignment (role→admin) | ❌ Не нашёл | ✅ Нашли |
| JWT `alg:none` | ❌ Не нашёл | ✅ Нашли |
| SQLi в `/rest/products/search` | ❌ Не нашёл | ✅ Нашли |
| BOLA на `/api/BasketItems/1` | ❌ Не нашёл | ✅ Нашли |
| `/ftp/` открыт | ❌ Не нашёл (нет такого шаблона) | ✅ Нашли |
| Prometheus `/metrics` | ✅ Нашёл | — |
| Missing Security Headers (8 шт) | ✅ Нашёл (info) | — |

**Вывод:** Nuclei — это стартовая точка, но не замена ручному анализу.

---

## Свой шаблон Nuclei

Создал шаблон для поиска **открытого `/ftp/` directory listing**:

```yaml
# File: ftp-exposure.yaml

id: juice-shop-ftp-exposure

info:
  name: Juice Shop - FTP Directory Exposure
  author: albert
  severity: medium
  description: OWASP Juice Shop exposes /ftp/ directory listing
  classification:
    cvss-metrics: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N
    cvss-score: 5.3
    cwe-id: CWE-200
  tags: juice-shop,ftp,exposure,misconfiguration

http:
  - method: GET
    path:
      - '{{BaseURL}}/ftp/'

    matchers-condition: and
    matchers:
      - type: word
        part: body
        words:
          - "index"
      - type: status
        status:
          - 200
```

### Структура шаблона:

| Поле | Описание |
|------|----------|
| `id` | Уникальный ID шаблона |
| `info` | Метаданные: name, severity, CWE, CVSS |
| `http` | HTTP-секция: метод, path, matchers |
| `matchers` | Правила проверки ответа (word, status, regex, и т.д.) |
| `matchers-condition` | `and` / `or` |

### Запуск шаблона:

```bash
nuclei -u http://localhost:3000 -t ftp-exposure.yaml
```

**Результат:** ✅ Шаблон сработал — обнаружен `/ftp/` со статусом 200 и словом "index".

---

## Выводы

1. **Nuclei — это только типовые CVE и миссконфиги.** Бизнес-логику, Mass Assignment, JWT уязвимости он не находит.
2. **10,477 шаблонов ≠ 10,477 уязвимостей.** Большинство — fingerprinting и info-уровень.
3. **Свой шаблон писать просто.** Можно быстро автоматизировать проверку, найденную руками.
4. **Место в pipeline:** DAST запускается после деплоя на staging/prod, после SAST и SCA.

---

## Статус: ✅ Завершено