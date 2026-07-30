# Case 03 — Capital One SSRF (2019)

> **Формат:** CVE-style разбор. Описание → уязвимые компоненты → PoC → root cause → fix → prevention.
>
> **Связь с playbook:** [A10 SSRF](../../Knowledge/owasp-top10/a10-ssrf.md), [Security Misconfiguration](../../Knowledge/owasp-top10/a05-security-misconfiguration.md), [Defense in Depth](../../Knowledge/secure-design/defense-in-depth.md)

---

## Описание

В марте 2019 года злоумышленник Пейдж Томпсон (Paige Thompson) обнаружила SSRF-уязвимость в WAF-сервисе Capital One, размещённом в AWS. Через неправильно сконфигурированный mod_proxy на EC2-инстансе она получила доступ к AWS metadata endpoint (`169.254.169.254`), извлекла IAM-временные креды (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`), и через них — выгрузила **106 миллионов записей** клиентов (SSN, банковские счета, кредитные заявки) из S3-бакета.

**Ущерб:** $190M штраф + $80M на исправление + репутационные потери.

---

## Уязвимые компоненты

| Компонент | Проблема |
|-----------|----------|
| EC2 instance (WAF) | Миссконфигурация mod_proxy, позволяющая SSRF |
| AWS metadata endpoint | Доступен с EC2 без аутентификации |
| IAM role (прикреплённая к EC2) | Чрезмерные права: полный доступ к S3 |
| S3 bucket | Нет защиты от эксфильтрации (VPC endpoint policy, CloudTrail alerting) |
| Мониторинг | Атака не была замечена 4 месяца |

---

## Цепочка эксплуатации (kill chain)

```
1. Разведка
   Злоумышленник сканирует GitHub на предмет IAM-ключей в открытых репозиториях
   (НЕ нашёл, но нашёл информацию о структуре инфраструктуры Capital One)

2. Обнаружение SSRF
   WAF (ModSecurity + Apache mod_proxy) на EC2 неправильно обрабатывает
   POST-запросы к определённому endpoint'у
   → SSRF: злоумышленник может заставить сервер выполнить HTTP-запрос к произвольному URL

3. Доступ к metadata endpoint
   POST /vulnerable-endpoint HTTP/1.1
   Host: waf.capitalone.com
   Content-Length: ...

   target=http://169.254.169.254/latest/meta-data/iam/security-credentials/s3-role

   EC2 делает запрос к metadata → возвращает временные креды:
   {
     "AccessKeyId": "ASIA...",
     "SecretAccessKey": "wJalrXUtnFEMI/...",
     "Token": "FQoGZXIvYXdz...",
     "Expiration": "2019-03-22T15:00:00Z"
   }

4. Доступ к S3 через украденные креды
   aws s3 ls s3://capitalone-customer-data --profile stolen
   aws s3 sync s3://capitalone-customer-data ./loot --profile stolen

5. Эксфильтрация
   106M записей скопированы на внешний сервер
   Данные опубликованы на GitHub (gist) и в Slack-канале злоумышленника
```

---

## Root Cause: три слоя защиты, которые не сработали

### Слой 1: SSRF в WAF

```apache
# Уязвимая конфигурация mod_proxy (упрощённо)
<Location /vulnerable-endpoint>
    ProxyPass http://${target}    # <--- пользователь контролирует target
    ProxyPassReverse http://${target}
</Location>

# Сервер делает запрос к http://169.254.169.254/... по команде злоумышленника
```

**Root cause:** Отсутствие валидации URL. Allowlist разрешённых хостов не настроен. После DNS resolve не проверялось, что IP не из `169.254.0.0/16`.

### Слой 2: IAM-роль с избыточными правами

```json
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "arn:aws:s3:::capitalone-customer-data/*"
}
```

**Root cause:** EC2, выполняющий роль WAF, имел полный доступ к S3 с клиентскими данными. Должен был иметь доступ только к логам WAF.

### Слой 3: Отсутствие мониторинга аномалий

- CloudTrail записывал API-вызовы, но не было алертов на массовое чтение S3
- Не было VPC Endpoint policy, ограничивающей доступ к S3 только с определённых ролей
- S3 access logs не анализировались на предмет аномального объёма

---

## Fix: что следовало сделать

### 1. SSRF Protection на уровне приложения

```python
# Вместо прямого проксирования — валидация URL
import ipaddress
import socket
from urllib.parse import urlparse

ALLOWED_HOSTS = ["api.internal.capitalone.com", "logs.capitalone.com"]
BLOCKED_RANGES = [
    ipaddress.ip_network("169.254.0.0/16"),    # AWS metadata
    ipaddress.ip_network("127.0.0.0/8"),       # Localhost
    ipaddress.ip_network("10.0.0.0/8"),        # Internal
    ipaddress.ip_network("172.16.0.0/12"),     # Internal
    ipaddress.ip_network("192.168.0.0/16"),    # Internal
]

def validate_url(target_url: str) -> bool:
    parsed = urlparse(target_url)

    # Проверка схемы
    if parsed.scheme not in ("https",):
        return False

    # Проверка hostname по allowlist
    if parsed.hostname not in ALLOWED_HOSTS:
        return False

    # DNS resolve + проверка IP
    ip = ipaddress.ip_address(socket.gethostbyname(parsed.hostname))
    for blocked in BLOCKED_RANGES:
        if ip in blocked:
            return False

    # Проверка на редиректы (после каждого редиректа — повторная валидация)
    return True
```

### 2. IAM Least Privilege

```json
// БЫЛО (чрезмерные права)
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "arn:aws:s3:::capitalone-customer-data/*"
}

// СТАЛО (минимальные права для WAF)
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:PutObjectAcl"
  ],
  "Resource": "arn:aws:s3:::capitalone-waf-logs/*"
}
```

### 3. IMDSv2 (Metadata Service v2)

```bash
# IMDSv1 (уязвимая) — любой GET-запрос
curl http://169.254.169.254/latest/meta-data/

# IMDSv2 (защищённая) — требует PUT с токеном
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/
```

AWS с 2020 года позволяет требовать IMDSv2 на уровне EC2.

### 4. VPC Endpoint Policy для S3

```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::capitalone-customer-data/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::123456789012:role/authorized-reader"
        }
      }
    }
  ]
}
```

### 5. CloudTrail Alert на массовое чтение S3

```yaml
# AWS Config Rule: s3-bucket-public-read-prohibited
# + CloudWatch Alarm на S3 GetObject > 1000/час с одного IP/роли
- metric: S3.GetObject.Count
  threshold: 1000
  window: 1h
  action: SNS → PagerDuty
```

---

## Хронология инцидента

| Дата | Событие |
|------|---------|
| 22.03.2019 | Злоумышленник получает доступ через SSRF |
| 22-23.03.2019 | Эксфильтрация 106M записей |
| 17.07.2019 | Белый хакер сообщает Capital One об утечке (данные на GitHub) |
| 19.07.2019 | Capital One подтверждает взлом |
| 29.07.2019 | Арест Пейдж Томпсон (FBI) |
| 06.08.2020 | Capital One оштрафован на $80M (OCC) |
| 09.12.2021 | Дополнительный штраф $190M (FTC) |

**Общее время обнаружения (detection gap):** 117 дней (22 марта — 17 июля).

---

## Уроки

1. **SSRF — это не только чтение internal API.** SSRF → metadata endpoint → IAM creds → S3 — цепочка из 4 шагов, каждый из которых можно было разорвать.
2. **Defense in depth — не лозунг, а архитектурное требование.** WAF-сервер не должен иметь доступ к S3 с клиентскими данными. Период.
3. **IMDSv2 обязателен.** IMDSv1 (простой GET) — legacy, который должен быть отключён на всех production EC2.
4. **IAM Least Privilege — аудит каждые 3 месяца.** Роли имеют свойство «разрастаться» со временем.
5. **Detection gap в 117 дней — провал мониторинга.** Массовое чтение S3 должно тригерить алерт мгновенно.

---

## Prevention (чек-лист)

- [ ] Все URL, передаваемые в HTTP-клиенты/прокси, проходят allowlist-валидацию
- [ ] После DNS resolve проверяется, что IP не из запрещённых диапазонов (169.254/16, 127/8, 10/8, ...)
- [ ] Каждый HTTP-редирект вызывает повторную валидацию URL
- [ ] IMDSv2 обязателен на всех EC2 (`MetadataOptions.HttpTokens: required`)
- [ ] IAM-роли проходят ежеквартальный аудит на least privilege (IAM Access Analyzer)
- [ ] VPC Endpoint policy для S3 ограничивает доступ конкретными ролями
- [ ] CloudTrail + CloudWatch Alarm на массовые S3-операции
- [ ] S3 Protection: включено шифрование SSE-KMS с отдельным KMS-ключом (не даёт читать даже с s3:GetObject без доступа к KMS)

---

## Источники

- [Capital One Data Breach — OCC Consent Order (2020)](https://www.occ.gov/static/enforcement-actions/ea2020-083.pdf)
- [AWS IMDSv2 Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MITRE ATT&CK T1190: Exploit Public-Facing Application](https://attack.mitre.org/techniques/T1190/)