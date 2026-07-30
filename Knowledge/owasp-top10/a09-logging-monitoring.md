# A09 — Security Logging and Monitoring Failures

> **Суть:** Недостаточное логирование, мониторинг и оповещение позволяют злоумышленнику действовать незамеченным — дни, недели, месяцы.
>
> **Главная опасность:** Нарушение не детектируется вовремя. Среднее время обнаружения breach без мониторинга — **212 дней** (IBM Cost of a Data Breach 2023).

---

## Быстрый чек-лист

- [ ] Все события аутентификации логируются (успех, неудача)?
- [ ] Изменения прав доступа (role escalation, permission grants) логируются?
- [ ] Попытки доступа к запрещённым ресурсам (403, 401) логируются?
- [ ] Валидационные ошибки на серверной стороне логируются с контекстом?
- [ ] Логи содержат: timestamp, user ID, source IP, action, result?
- [ ] Логи НЕ содержат: пароли, токены, PII в открытом виде?
- [ ] Настроены алерты на критические события (multiple failed logins, privilege change)?
- [ ] Логи хранятся в защищённом от модификации виде (append-only, WORM)?
- [ ] Время хранения логов соответствует регуляторным требованиям?
- [ ] Есть процедура реагирования на алерты (playbook)?

---

## Что логировать

### События, обязательные к логированию

| Категория | События | Формат лога |
|-----------|---------|-------------|
| **Authentication** | Login success/failure, logout, password change, MFA setup/reset | `timestamp, user_id, ip, event, result, reason` |
| **Authorization** | Access denied (403), privilege escalation, role change | `timestamp, user_id, resource, action, result` |
| **Data access** | Чтение/изменение чувствительных данных (PII, платежи) | `timestamp, user_id, data_type, record_id, action` |
| **Configuration** | Изменение security-настроек, CORS, CSP, rate limits | `timestamp, admin_id, setting, old_value, new_value` |
| **Input validation** | Серверные ошибки валидации (возможная попытка инъекции) | `timestamp, ip, endpoint, payload_hash, rule_triggered` |
| **Rate limiting** | Срабатывание rate limit, блокировка IP | `timestamp, ip, endpoint, threshold, action` |

### Чего НЕ должно быть в логах

```
[ANTI-PATTERN] 2025-01-15 10:23:45 User alice logged in with password: P@ssw0rd123
[ANTI-PATTERN] 2025-01-15 10:24:00 Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
[ANTI-PATTERN] 2025-01-15 10:25:00 Credit card: 4532-1234-5678-9012 processed

[CORRECT]      2025-01-15 10:23:45 auth.login user_id=12345 ip=10.0.1.5 result=success
[CORRECT]      2025-01-15 10:24:00 api.request user_id=12345 token_id=abc123 endpoint=/api/orders
[CORRECT]      2025-01-15 10:25:00 payment.process user_id=12345 card_hash=sha256:abc... amount=150.00
```

---

## Структура лога

Минимальный набор полей security-лога (на основе OWASP Logging Cheat Sheet):

```json
{
  "timestamp": "2025-01-15T10:23:45.123Z",
  "level": "WARN",
  "event": "auth.login_failure",
  "source_ip": "10.0.1.5",
  "user_id": null,
  "session_id": "sess_abc123",
  "target": "/api/login",
  "result": "failure",
  "reason": "invalid_password",
  "attempt": 5,
  "user_agent_fingerprint": "moz_chrome_120_win10",
  "trace_id": "abc-def-123",
  "geo": { "country": "XX", "city": "Unknown" }
}
```

### Дополнительные поля для расследования

| Поле | Назначение |
|------|------------|
| `trace_id` | Сквозная трассировка запроса (OpenTelemetry) |
| `session_id` | Привязка к сессии для построения цепочки событий |
| `user_agent_fingerprint` | Поиск аномальных смен User-Agent в рамках сессии |
| `geo` | Геолокация IP для детектирования impossible travel |
| `correlation_id` | Связка событий между микросервисами |

---

## Мониторинг и алертинг

### Уровни критичности алертов

| Уровень | Пример | Канал оповещения | SLA реакции |
|---------|--------|------------------|-------------|
| **CRITICAL** | Массовая утечка данных, компрометация админ-аккаунта | PagerDuty / OpsGenie / Телефон | 15 минут |
| **HIGH** | Multiple failed logins → блокировка, privilege escalation | Slack + PagerDuty | 30 минут |
| **MEDIUM** | Новый админ-аккаунт, изменение security-настроек | Slack | 4 часа |
| **LOW** | Необычный User-Agent, geo-anomaly | Dashboard / Weekly report | 24 часа |

### Правила детектирования (примеры)

```yaml
# 1. Brute-force: >5 failed logins за 5 минут с одного IP
- rule: brute_force_detection
  condition: count(auth.login_failure) by source_ip > 5
  window: 5m
  severity: HIGH
  action: block_ip_10min + alert

# 2. Impossible travel: логин из двух стран за 1 час
- rule: impossible_travel
  condition: auth.login_success with different geo.country
  window: 1h
  severity: HIGH
  action: force_logout + alert

# 3. Privilege escalation: не-админ получил роль admin
- rule: privilege_escalation
  condition: role_change.new_role == "admin" AND user.current_role != "admin"
  severity: CRITICAL
  action: revert_role + alert + page_oncall

# 4. Credential stuffing: много разных username с одного IP
- rule: credential_stuffing
  condition: count(distinct user_id) by source_ip > 20
  window: 5m
  severity: HIGH
  action: block_ip_10min + alert
```

---

## Инструменты стека мониторинга

| Слой | Инструменты |
|------|-------------|
| **Collection** | Fluentd, Logstash, Vector, OpenTelemetry Collector |
| **Storage** | Elasticsearch, Loki, ClickHouse (логи); Prometheus, VictoriaMetrics (метрики) |
| **Visualization** | Kibana, Grafana |
| **Alerting** | Prometheus AlertManager, Grafana Alerts, PagerDuty, OpsGenie |
| **SIEM** | Wazuh (Open Source), ELK + ElastAlert, Splunk (Enterprise), Microsoft Sentinel |
| **Trace** | Jaeger, Tempo, OpenTelemetry |

---

## Защита логов от модификации

### Принципы

1. **Append-only** — логи нельзя изменить или удалить
2. **WORM-хранилище** (Write Once Read Many) — S3 Object Lock, immudb
3. **Отправка в отдельный log-кластер** — приложение не имеет доступа к логам
4. **Целостность** — подпись каждого события (HMAC, blockchain-подобные цепочки хешей)

### Пример: защита логов в AWS

```hcl
# S3 bucket с WORM-защитой через Object Lock
resource "aws_s3_bucket" "logs" {
  bucket = "security-logs-2025"
  object_lock_enabled = true
}

resource "aws_s3_bucket_object_lock_configuration" "logs_lock" {
  bucket = aws_s3_bucket.logs.id
  rule {
    default_retention {
      mode = "COMPLIANCE"  # Даже root не может удалить
      days = 365
    }
  }
}
```

---

## Чек-лист соответствия NIST SP 800-92 / PCI DSS

- [ ] Логи всех административных действий сохраняются минимум 12 месяцев
- [ ] Логи отправляются в централизованный SIEM/SOAR в реальном времени
- [ ] Синхронизация времени по NTP на всех узлах (timestamp consistency)
- [ ] Алерты на отключение/перезагрузку агента логирования
- [ ] Quarterly review правил детектирования и порогов
- [ ] Ежегодный пентест на обход логирования
- [ ] Процедура escalation при критическом алерте задокументирована

---

## Антипаттерны логирования

| Антипаттерн | Почему плохо | Как исправить |
|-------------|--------------|---------------|
| `console.log(password)` | Пароль в stdout → утечка через CI/CD логи, ошибки | Логировать хеш события, не пароль |
| Логи только на уровне INFO | Нет severity-градации для фильтрации алертов | Использовать structured logging с `level: ERROR/WARN/INFO/DEBUG` |
| `try { ... } catch (e) { /* пусто */ }` | Silent failure — никто не узнает об ошибке | Логировать `e.message` + `e.stack` + `trace_id` |
| Логи в локальный файл | Потеря при падении контейнера/пода | stdout/stderr → Fluentd/Vector → центральное хранилище |
| Логи без контекста | Невозможно восстановить цепочку событий | `trace_id`, `user_id`, `session_id` в каждом логе |
| `console.log(JSON.stringify(req.body))` | PII/токены утекают в логи | Маскировать чувствительные поля перед логированием |

---

## Полная версия

| Тема | Конспект |
|------|----------|
| Security Misconfiguration (WAF-логи, debug mode) | [`owasp-top10/a05-security-misconfiguration.md`](../owasp-top10/a05-security-misconfiguration.md) |
| Интерпретаторы (объединяющая концепция) | [`fundamentals/interpreters.md`](../fundamentals/interpreters.md) |

---

## Полезные ссылки

- [OWASP A09: Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP Application Logging Vocabulary Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html)
- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)
- [PCI DSS v4.0 Requirement 10: Log and Monitor All Access](https://listings.pcisecuritystandards.org/documents/PCI_DSS_v4-0.pdf)
- [IBM Cost of a Data Breach Report 2023](https://www.ibm.com/reports/data-breach)