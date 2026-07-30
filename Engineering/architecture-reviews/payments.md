# Security Review: Payments Integration

## Контекст

Платёжная интеграция — компонент, отвечающий за взаимодействие с внешними платёжными шлюзами (CloudPayments, ЮKassa, СБП, карточные эквайринги). Обрабатывает пополнение счетов, выплаты займов, рекуррентные списания по графику, возвраты.

**Обрабатываемые данные:**
- П платёжные реквизиты (номера карт, токены карт, номера счетов)
- Суммы транзакций, комиссии
- Идемпотентные ключи (idempotency keys)
- Подписи вебхуков (webhook signatures)
- Статусы платежей (pending, succeeded, failed, refunded)

**Поток платежа (упрощённо):**
```
Client → API Gateway → Payment Service → External Payment Gateway
                              │
                              ├── Idempotency Store (Redis/DB)
                              ├── Transaction Log (DB, append-only)
                              ├── Reconciliation Job (сверка)
                              └── Webhook Handler (callback от gateway)
```

**Ключевые свойства безопасности (CIA):**
- **Confidentiality:** PAN (номер карты) не хранится, только токен от шлюза; данные в transit — TLS
- **Integrity:** каждая транзакция имеет идемпотентный ключ; вебхуки проверяются по HMAC/асимметричной подписи
- **Availability:** деградация при недоступности шлюза (retry с exponential backoff, очередь), мониторинг webhook-ов

---

## Угрозы (STRIDE)

### Spoofing (Подмена личности)

| Угроза | Описание |
|--------|----------|
| S1 | Подделка вебхука от платёжного шлюза (нет проверки подписи, слабый секрет) |
| S2 | Spoofing IP платёжного шлюза — атакующий обходит IP-whitelist |
| S3 | MITM между Payment Service и External Gateway (TLS не enforced, certificate not validated) |
| S4 | Подделка callback URL — атакующий инициирует платёж с подменённым callback'ом |

### Tampering (Подмена данных)

| Угроза | Описание |
|--------|----------|
| T1 | Модификация суммы платежа между клиентом и бэкендом (если цена считается на клиенте) |
| T2 | Race condition: два параллельных запроса с одним idempotency key, но разными суммами |
| T3 | Подмена статуса платежа в БД в обход сервиса (прямой доступ к БД из другого микросервиса) |
| T4 | Модификация idempotency key — злоумышленник подбирает чужой ключ и меняет параметры |
| T5 | Подмена суммы в ответе от шлюза (TLS downgrade, lack of response integrity check) |

### Repudiation (Отказ от действия)

| Угроза | Описание |
|--------|----------|
| R1 | Пользователь оспаривает платёж — нет достаточного аудита для proof of transaction |
| R2 | Платёжный шлюз не прислал вебхук — нет механизма обнаружения «зависших» платежей |
| R3 | Оператор вручную изменил статус платежа — нет audit trail |

### Information Disclosure (Раскрытие информации)

| Угроза | Описание |
|--------|----------|
| I1 | Номера карт (PAN) в логах приложения, ошибок, отладочных сообщениях |
| I2 | API-ключи платёжного шлюза в коде, конфигах, CI/CD логах |
| I3 | Детализация транзакций через публичное API без аутентификации |
| I4 | Утечка сумм/статусов платежей через timing side-channel (разное время ответа для валидного/невалидного id) |

### Denial of Service (Отказ в обслуживании)

| Угроза | Описание |
|--------|----------|
| D1 | Исчерпание идемпотентных ключей — атакующий генерирует миллионы ключей, заполняя хранилище |
| D2 | Retry storm: шлюз недоступен, все запросы уходят в retry queue, каскадный рост нагрузки |
| D3 | Webhook flood: атакующий шлёт поддельные вебхуки, перегружая обработчик |
| D4 | Отказ reconciliation job — незамеченные расхождения между системой и шлюзом |

### Elevation of Privilege (Повышение привилегий)

| Угроза | Описание |
|--------|----------|
| E1 | Пользователь инициирует платёж от имени другого пользователя (BOLA в payment endpoint) |
| E2 | Пользователь меняет amount в запросе: должен заплатить 1000 RUB, отправляет amount=1 RUB |
| E3 | Оператор поддержки с правом «просмотр» инициирует возврат (недостаточное разделение ролей) |
| E4 | Эксплуатация coupon/discount logic — злоумышленник применяет чужой промокод или stack'ает скидки |

---

## Чек-лист проверок

### Идемпотентность

- [ ] Каждая платёжная операция имеет уникальный идемпотентный ключ, генерируемый на клиенте (UUID v4)
- [ ] Идемпотентный ключ проверяется на сервере **до** отправки в шлюз
- [ ] Первый ответ шлюза сохраняется и возвращается для повторных запросов с тем же ключом (не создаётся новый платёж)
- [ ] Идемпотентность работает в рамках окна >= 24 часа
- [ ] Ключи хранятся с привязкой к user_id (злоумышленник не может подобрать чужой ключ)

### Аутентификация и авторизация

- [ ] Эндпоинты платежей требуют аутентификации + MFA (подтверждение платежа через SMS/push)
- [ ] Сумма платежа **не принимается** с клиента — вычисляется на сервере из заказа/договора
- [ ] Проверка, что user_id в токене совпадает с user_id в платёжной операции (BOLA)
- [ ] Возвраты инициируются только авторизованными операторами с ролью `finance.write`, с 4-eyes подтверждением для сумм > N

### Вебхуки

- [ ] Каждый вебхук проверяется на подпись: HMAC-SHA256 или RSA
- [ ] Секрет вебхука ротируется, не хранится в коде (env / vault / secrets manager)
- [ ] Проверяется timestamp вебхука для защиты от replay (допустимое отклонение <= 5 минут)
- [ ] IP входящего вебхука проверяется против documented IP ranges шлюза (как defence-in-depth, не как единственная защита)
- [ ] Webhook endpoint rate-limited (защита от flood)

### Безопасность данных (PCI DSS)

- [ ] PAN не хранится в системе — только token от платёжного шлюза
- [ ] PAN не попадает в логи — настроено маскирование (первые 6 + последние 4, остальное `*`)
- [ ] API-ключи шлюза не в коде — получаются из vault/secrets-manager при запуске
- [ ] Все соединения со шлюзом — TLS 1.2+ с certificate pinning или строгой валидацией
- [ ] Данные карт (если вводятся) проходят через hosted fields / SDK шлюза, не через свои поля ввода

### Мониторинг и сверка

- [ ] Каждая транзакция пишется в append-only transaction log (иммутабельный)
- [ ] Автоматическая сверка (reconciliation) с отчётами шлюза каждые N минут
- [ ] Алерт: количество «зависших» платежей (pending > N минут) превышает порог
- [ ] Алерт: расхождение сумм между системой и шлюзом
- [ ] Алерт: рост отказов платежей (failed rate > X%)
- [ ] Алерт: аномальное количество возвратов от пользователя

### Retry и отказоустойчивость

- [ ] Retry на ошибки сети/шлюза с exponential backoff + jitter
- [ ] Максимальное количество retry ограничено (например, 5 попыток)
- [ ] Idempotency key используется для безопасного retry
- [ ] Dead letter queue для платежей, не прошедших после всех retry (ручной разбор)
- [ ] Circuit breaker на шлюз: после N ошибок → пауза → half-open

### Race condition и консистентность

- [ ] Идемпотентный ключ проверяется под блокировкой (SELECT ... FOR UPDATE / Redis SETNX / distributed lock)
- [ ] Статус платежа обновляется атомарно (например, только из pending → succeeded, не из succeeded → failed)
- [ ] Refund проверяет, что оригинальный платёж succeeded и сумма возврата <= сумма платежа

---

## Типичные ошибки

1. **Сумма платежа с клиента.** Клиент отправляет `{"amount": 1000, "currency": "RUB"}` и бэкенд отправляет эту сумму в шлюз без проверки. Злоумышленник меняет на `amount: 1` — платит 1 рубль вместо 1000.
2. **Webhook без подписи.** Обработчик принимает любой POST, злоумышленник отправляет `{"status": "succeeded", "order_id": "..."}` — заказ помечается оплаченным без реальной оплаты.
3. **Идемпотентность без user_id.** Идемпотентный ключ не привязан к пользователю. Злоумышленник подбирает/угадывает чужой ключ и получает результат чужого платежа.
4. **Retry без идемпотентности.** При таймауте от шлюза система делает retry без идемпотентного ключа → двойное списание.
5. **PAN в логах.** При ошибке шлюз возвращает XML/SOAP ответ с полным номером карты, который логируется целиком. Нужно маскировать перед записью в лог.
6. **Отсутствие reconciliation.** П платёж прошёл в шлюзе, но статус не обновился в системе (упал вебхук, сетевой сбой). Месяц спустя клиент жалуется, что деньги списали, а займ не погашен.
7. **Coupon stacking.** Скидочная логика позволяет применить несколько промокодов одновременно или использовать чужой промокод.
8. **Отсутствие MFA для чувствительных операций.** Изменение привязанной карты, вывод средств без второго фактора.

---

## Безопасный паттерн

### Процессинг платежа (полный flow)

```
1. Клиент инициирует платёж
   └─ POST /api/v1/payments
   └─ Body: { "idempotency_key": "uuid-v4", "order_id": "uuid" }
   └─ Сумма НЕ передаётся — вычисляется на сервере из заказа
   └─ Заголовок: Authorization: Bearer <access_token>

2. Payment Service
   ├─ Проверка access_token (JWT валидация)
   ├─ Проверка user_id из токена == user_id заказа (BOLA check)
   ├─ Проверка статуса заказа (только APPROVED → можно платить)
   ├─ Вычисление суммы из заказа (из БД, не из запроса!)
   │
   ├─ Блокировка по idempotency_key (Redis SETNX, TTL 24h)
   │   └─ Если ключ уже существует → вернуть сохранённый ответ (200 OK + cached response)
   │
   ├─ Создание записи транзакции: статус = PENDING
   │   └─ INSERT INTO transactions (id, order_id, user_id, amount, idempotency_key, status, created_at)
   │
   ├─ Отправка в External Payment Gateway
   │   └─ TLS 1.2+, certificate validation
   │   └─ API key из vault (не из env/кода)
   │   └─ Timeout: connect=5s, read=30s
   │
   ├─ Обработка ответа шлюза
   │   ├─ SUCCEEDED → обновить статус: PENDING → PAID
   │   │   └─ Отправить событие: PaymentCompleted (для заказа, уведомлений)
   │   ├─ PENDING → оставить PENDING, запланировать проверку статуса через N минут
   │   └─ FAILED → обновить: PENDING → FAILED, сохранить error_code
   │
   ├─ Сохранить идемпотентный ответ в кеш (TTL 24h)
   │
   └─ Вернуть ответ клиенту

3. Webhook Handler (асинхронное подтверждение от шлюза)

   └─ POST /api/internal/webhooks/payment-gateway
      ├─ Проверка подписи: HMAC-SHA256(secret, raw_body) == X-Signature
      ├─ Проверка timestamp: abs(now - webhook_timestamp) <= 5 min
      ├─ Проверка IP (optional, defence-in-depth): IP in [gateway_ip_ranges]
      │
      ├─ Поиск транзакции по order_id / transaction_id
      │   └─ Если не найдена → 404 (возможно, другой environment)
      │
      ├─ Обновление статуса:
      │   ├─ PENDING → PAID (success)
      │   ├─ PENDING → FAILED (failure)
      │   ├─ PAID + refund webhook → PENDING_REFUND
      │   └─ Переходы валидируются (state machine, не любой статус в любой)
      │
      ├─ Логирование: webhook_id, event_type, transaction_id, signature_valid, processing_time_ms
      │
      └─ Ответ: 200 OK (до проверки подписи — 200, чтобы шлюз не ретраил бесконечно при плохой подписи)

4. Reconciliation Job (периодическая сверка)

   └─ Каждые N минут (cron / scheduled job)
      ├─ Запрос отчёта из шлюза за последние N+5 минут
      ├─ Сравнение с локальными транзакциями за тот же период
      ├─ Расхождения:
      │   ├─ Есть в шлюзе, нет у нас → ALERT (пропущен вебхук)
      │   └─ Есть у нас (PENDING > threshold), нет в шлюзе → ALERT (платёж не дошёл)
      └─ Запись результата сверки в audit log
```

### Пример кода (концептуальный, Go-style)

```go
// ProcessPayment — обработка входящего платёжного запроса.
// Сумма вычисляется из заказа, не принимается от клиента.
func (s *PaymentService) ProcessPayment(ctx context.Context, req ProcessPaymentRequest) (*ProcessPaymentResponse, error) {
    // 1. Проверка access_token (выполняется на gateway, здесь — defence-in-depth)
    userID := auth.UserIDFromContext(ctx)
    if userID == "" {
        return nil, ErrUnauthenticated
    }

    // 2. Загружаем заказ, проверяем владельца (BOLA)
    order, err := s.orderRepo.GetByID(ctx, req.OrderID)
    if err != nil {
        return nil, fmt.Errorf("order not found: %w", err)
    }
    if order.UserID != userID {
        s.auditLog.Warn(ctx, "bola_attempt", "user_id", userID, "order_id", req.OrderID)
        return nil, ErrForbidden // 403 — не раскрываем, что заказ существует
    }
    if order.Status != OrderStatusApproved {
        return nil, ErrOrderNotPayable
    }

    // 3. Сумма — из заказа, не из запроса
    amount := order.TotalAmount

    // 4. Проверка идемпотентности
    cached, err := s.idempotency.Get(ctx, req.IdempotencyKey)
    if err != nil && !errors.Is(err, ErrNotFound) {
        return nil, fmt.Errorf("idempotency check: %w", err)
    }
    if cached != nil {
        return cached, nil // повторный запрос — возвращаем сохранённый ответ
    }

    // 5. Блокировка по идемпотентному ключу
    locked, err := s.idempotency.Lock(ctx, req.IdempotencyKey, 24*time.Hour)
    if err != nil {
        return nil, fmt.Errorf("idempotency lock: %w", err)
    }
    if !locked {
        // другой конкурентный запрос уже обрабатывается
        return nil, ErrConflict
    }
    defer s.idempotency.Unlock(ctx, req.IdempotencyKey)

    // 6. Создание транзакции
    txn := &Transaction{
        ID:             uuid.New(),
        OrderID:        req.OrderID,
        UserID:         userID,
        Amount:         amount,
        IdempotencyKey: req.IdempotencyKey,
        Status:         StatusPending,
        CreatedAt:      time.Now(),
    }
    if err := s.txnRepo.Create(ctx, txn); err != nil {
        return nil, fmt.Errorf("create transaction: %w", err)
    }

    // 7. Отправка в платёжный шлюз
    gwResp, err := s.gateway.CreatePayment(ctx, &GatewayRequest{
        TransactionID:   txn.ID.String(),
        Amount:          amount,
        Description:     order.Description,
        CallbackURL:     s.webhookURL,
    })
    if err != nil {
        // Шлюз недоступен или вернул ошибку
        s.txnRepo.UpdateStatus(ctx, txn.ID, StatusFailed, err.Error())
        // Планируем retry в фоне
        s.retryQueue.Enqueue(txn.ID, exponentialBackoff())
        return nil, ErrPaymentGatewayUnavailable
    }

    // 8. Обработка ответа шлюза
    if gwResp.Status == "succeeded" {
        s.txnRepo.UpdateStatus(ctx, txn.ID, StatusPaid, "")
        s.eventBus.Publish(ctx, PaymentCompletedEvent{TxnID: txn.ID})
    }

    // 9. Сохраняем идемпотентный ответ
    response := &ProcessPaymentResponse{
        TransactionID: txn.ID.String(),
        Status:        gwResp.Status,
    }
    s.idempotency.Set(ctx, req.IdempotencyKey, response, 24*time.Hour)

    return response, nil
}
```

### Ключевые свойства безопасного паттерна

| Свойство | Реализация |
|----------|------------|
| Никакой суммы от клиента | Сумма из заказа/договора в БД |
| Идемпотентность + блокировка | Redis SETNX + сохранение ответа на 24h |
| BOLA-защита | user_id из токена сравнивается с user_id заказа |
| Безопасный retry | Идемпотентный ключ + exponential backoff |
| Webhook verification | HMAC-SHA256 + timestamp check |
| State machine статусов | Только разрешённые переходы (PENDING→PAID, PENDING→FAILED, PAID→REFUNDED) |
| Reconciliation | Автоматическая сверка каждые N минут |
| Отсутствие PAN в логах | Маскирование, только токены |

---

## Вопросы к команде

- [ ] Как платёжный шлюз аутентифицирует вебхуки? HMAC, RSA, API key? Как хранится секрет?
- [ ] Как обрабатывается сценарий «шлюз подтвердил платёж, но вебхук не дошёл до нас»? Есть ли reconciliation? С какой периодичностью?
- [ ] Как тестируется платёжная интеграция? Есть ли sandbox-окружение? Используются ли реальные карты для тестирования?
- [ ] Кто имеет доступ к продакшн API-ключам шлюза? Как происходит ротация?
- [ ] Как происходит возврат? Кто может инициировать, какие лимиты, нужен ли второй approving?
- [ ] Есть ли мониторинг аномалий: резкий рост возвратов от конкретного пользователя, подозрительно маленькие платежи (card testing), необычная география?
- [ ] Как обрабатываются chargeback'и? Есть ли процесс диспутов?
- [ ] Соответствует ли платёжный flow PCI DSS SAQ? Проходили ли аудит/self-assessment?
- [ ] Как обрабатываются ошибки округления при конвертации валют (если применимо)?
- [ ] Есть ли механизм блокировки пользователя после N failed payment attempts (anti-fraud)?

---

> **Приоритет критичности:** Tampering суммы (T1, E2) = Spoofing вебхука (S1) > Идемпотентность (T2, T4) > Reconciliation (D4, R2) > Information disclosure (I1, I2)