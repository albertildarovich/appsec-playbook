# Cheatsheet: Insecure Design

## Insecure Design vs Secure Coding

| Secure Coding | Insecure Design |
|---------------|-----------------|
| Ошибки реализации | Ошибки архитектуры |
| SQLi, XSS, XXE, BOF | Нет лимитов, доверие клиенту |
| Код написан неправильно | Архитектура небезопасна |
| Исправляется патчем | Требует перепроектирования |

## Never Trust the Client — что нельзя принимать от клиента

```
[NO] price / amount / total
[NO] role / isAdmin / permissions
[NO] paid / status / isVerified
[NO] discount / coupon (непроверенный)
[NO]任何 identifiers, которые могут повлиять на логику
```

## Password Reset — чек-лист

```
[ ] Token time-to-live ≤ 15 минут
[ ] Token одноразовый (после использования недействителен)
[ ] Новый token инвалидирует старый (один активный)
[ ] После смены пароля:
    [ ] Все сессии завершены
    [ ] Refresh Token инвалидирован
    [ ] Требуется повторный вход
```

## Rate Limiting — Backoff стратегия

| Попытка | Действие |
|---------|----------|
| 1 | Разрешить |
| 2 | Задержка 10 сек |
| 3 | Задержка 30 сек |
| 4 | Задержка 2 мин |
| 5 | CAPTCHA |
| 6+ | Блокировка на 24ч |

## Удаление аккаунта — правильная схема

```
Delete Request
    ↓
Account → DISABLED
    ↓
30 days (можно восстановить)
    ↓
Permanent deletion
```

Перед удалением: пароль + MFA + email confirmation.

## Главные вопросы AppSec-инженера

```
[ ] Что если аккаунт украдут?
[ ] Что если пользователь ошибётся?
[ ] Что если отправить миллион запросов?
[ ] Что если украдут ссылку/токен?
[ ] Что если разработчик забудет?
[ ] Можно ли отменить действие?
```

## Compensating Controls

| Контроль | Пример |
|----------|--------|
| Отмена | "Отменить перевод" в течение 30 мин |
| Grace period | 30 дней после удаления аккаунта |
| Задержка | 24ч для новых получателей |
| MFA | Крупные переводы |
| Лимиты | Максимум в день/транзакцию |
| Audit log | Все операции логируются |

## Interview Quick Cards

- **Insecure Design ≠ Secure Coding** — архитектура, а не код
- **Never Trust the Client** — цена, роль, статус — только от сервера
- **Abuse Cases** — как могут злоупотребить (а не как должна работать система)
- **Human Error** — защищать и от злоумышленников, и от ошибок
- **Compensating Controls** — если нельзя предотвратить, уменьшить последствия
- **Threat Modeling** — методика, объединяющая все эти идеи

## CWE Mapping

| CWE | Описание |
|-----|----------|
| CWE-602 | Client-Side Enforcement of Server-Side Security |
| CWE-603 | Use of Client-Side Authentication |
| CWE-807 | Reliance on Untrusted Inputs in a Security Decision |
| CWE-840 | Business Logic Errors |
| CWE-841 | Improper Enforcement of Behavioral Workflow |
| CWE-1021 | Improper Restriction of Rendered UI Layers |
