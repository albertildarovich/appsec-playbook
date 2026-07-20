# Architecture Reviews

> Шаблоны security review для типовых компонентов. Готовые сценарии: какие вопросы задать, что проверить, какие угрозы искать.

---

## Содержание

| Компонент | Описание | Статус |
|-----------|----------|--------|
| [Password Reset Flow](./password-reset.md) | Сброс пароля: токены, timing, enumeration | ❌ |
| [OAuth / Social Login](./oauth-login.md) | OAuth 2.0, OIDC, PKCE, redirect_uri validation | ❌ |
| [Payments Integration](./payments.md) | Stripe/Adyen: idempotency, webhooks, refunds | ❌ |
| [File Upload](./file-upload.md) | Validation, storage, malware scanning, CDN | ❌ |
| [Webhook Handling](./webhooks.md) | Signature verification, retry, idempotency, replay | ❌ |
| [Email / Notifications](./notifications.md) | Email injection, rate limiting, spam | ❌ |
| [CI/CD Pipeline](./cicd-pipeline.md) | Pipeline security, secret scanning, artifact signing | ❌ |
| [Internal API](./internal-api.md) | Service-to-service auth, mTLS, rate limiting | ❌ |
| [Public API](./public-api.md) | Auth, rate limiting, input validation, CORS | ❌ |
| [Admin Panel](./admin-panel.md) | MFA, IP restriction, audit log, session management | ❌ |

---

## Формат каждого review

```
# Security Review: [Компонент]

## Контекст
[Для чего этот компонент, какие данные обрабатывает]

## Угрозы (STRIDE)
- S: ...
- T: ...
- R: ...
- I: ...
- D: ...
- E: ...

## Чек-лист проверок
[ ] Проверка 1
[ ] Проверка 2
[ ] Проверка 3

## Типичные ошибки
1. ...
2. ...

## Безопасный паттерн
[Как должно быть реализовано]

## Примеры
[Хороший пример / Плохой пример]

## Вопросы к команде
- [Вопрос 1]
- [Вопрос 2]
```

---

> ⚡ **Принцип:** каждый review — это готовый сценарий. Открыл, прочитал, пошёл задавать вопросы команде.
