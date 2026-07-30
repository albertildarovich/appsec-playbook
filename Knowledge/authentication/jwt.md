# JWT (JSON Web Token)

> **Суть:** Компактный, URL-safe формат для передачи claims между сторонами. Самодостаточный — не требует обращения к БД для валидации.
>
> **Главный риск:** Неправильная валидация подписи, слабый алгоритм, утечка токена.

---

## Структура JWT

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
|_____________ HEADER ______________|____________________ PAYLOAD _______________________|___________________ SIGNATURE ____________________|
```

### Header

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "2025-01-key-1"
}
```

| Поле | Назначение |
|------|------------|
| `alg` | Алгоритм подписи (HS256, RS256, ES256, ...) |
| `typ` | Тип токена — всегда `JWT` |
| `kid` | Key ID — какой ключ использовать для проверки |

### Payload (Claims)

```json
{
  "sub": "1234567890",         // Subject — идентификатор пользователя
  "iss": "https://auth.example.com",  // Issuer — кто выдал токен
  "aud": "api.example.com",    // Audience — для кого токен
  "iat": 1516239022,           // Issued At — когда выдан
  "nbf": 1516239022,           // Not Before — недействителен до
  "exp": 1516242622,           // Expiration — срок действия
  "jti": "unique-token-id",    // JWT ID — уникальный идентификатор (для отзыва)
  "role": "user",              // Custom claim
  "scope": "read:orders write:cart"
}
```

---

## Алгоритмы подписи

| Семейство | Алгоритм | Тип ключа | Использование |
|-----------|----------|-----------|---------------|
| **HMAC** | HS256, HS384, HS512 | Symmetric (shared secret) | Внутренние микросервисы. Не для публичных клиентов! |
| **RSA** | RS256, RS384, RS512 | Asymmetric (private → public) | Распределённые системы, несколько consumer'ов |
| **ECDSA** | ES256, ES384, ES512 | Asymmetric (EC) | Лучшая производительность при меньшем размере подписи |
| **EdDSA** | EdDSA | Asymmetric (Ed25519) | Самая быстрая проверка, компактная подпись |

### HS256 vs RS256 — ключевое отличие

```
HS256:  sign(payload, secret)      — один ключ для подписи и проверки
RS256:  sign(payload, privateKey)  — подписываем приватным, проверяем публичным
```

**Почему HS256 через API опасно:** клиент, которому вы отдали JWT, может извлечь `secret` (он же проверяет подпись) и подделать токены.

---

## Критические уязвимости JWT

### 1. `alg: none`

Злоумышленник меняет `alg` на `none` и удаляет подпись. Многие библиотеки (старые версии) принимают такой токен как валидный.

```
[ATTACK]
Header:  {"alg": "none", "typ": "JWT"}
Payload: {"sub": "admin", "role": "admin"}
Signature: (empty)

[FIX] Явно указать допустимые алгоритмы: algorithms=["RS256", "ES256"]
```

### 2. Confusion Attack: HS256 вместо RS256

Если сервер использует RSA, но не проверяет `alg` — злоумышленник подписывает токен HS256, используя **публичный ключ** как секрет.

```
[ATTACK]
1. Достаём публичный ключ (он часто публичный, лежит в JWKS endpoint)
2. Создаём JWT с alg=HS256
3. Подписываем публичным ключом (как HMAC-secret)
4. Сервер проверяет HS256 тем же публичным ключом → ОК

[FIX] Явно проверять alg: если ожидается RS256, не принимать HS256
```

```python
# Правильная валидация (PyJWT)
import jwt

payload = jwt.decode(
    token,
    public_key,
    algorithms=["RS256"],           # <--- явный allowlist
    audience="api.example.com",      # <--- проверка aud
    issuer="https://auth.example.com" # <--- проверка iss
)
```

### 3. Weak HMAC Secret

HS256 с секретом `secret` или `password` ломается брутфорсом за секунды.

```bash
# Hashcat брутфорсит HS256
hashcat -m 16500 jwt.txt rockyou.txt
```

**Требования к HMAC-секрету:**
- Минимум 256 бит случайных данных
- Хранить в Vault/K8s Secret, не в коде

### 4. `kid` Injection

`kid` (Key ID) используется для выбора ключа проверки. Если сервер не санитизирует `kid`, возможна path traversal или SQLi.

```
[ATTACK] kid: "../../../../etc/shadow"
[ATTACK] kid: "1' UNION SELECT 'secret_key' --"
```

### 5. `jku` / `x5u` Header Injection

`jku` (JWK Set URL) и `x5u` (X.509 URL) указывают серверу, откуда брать ключ. Если сервер загружает ключ по указанному URL — SSRF / blind trust.

```
[FIX]
- Не использовать jku/x5u
- Если необходимо — allowlist доверенных URL
- Проверить, что URL не указывает на internal network
```

---

## Проблема отзыва (Revocation)

JWT stateless → нельзя «отозвать» токен, пока не истечёт `exp`. Это фундаментальное ограничение.

### Решения

| Подход | Описание | Недостаток |
|--------|----------|------------|
| **Short-lived tokens** | `exp = 5-15 минут` + refresh token | Частые обновления |
| **Token blacklist** | Redis/DynamoDB с `jti` отозванных токенов | Теряется stateless, нужен общий сторадж |
| **Token version** | `token_version` в БД пользователя, проверяется при каждом запросе | Дополнительный запрос к БД |
| **Refresh token rotation** | При использовании refresh токена — старый инвалидируется | Сложная реализация, race conditions |

---

## Безопасность на клиенте

| Куда сохранять | Риск | Рекомендация |
|----------------|------|--------------|
| `localStorage` | XSS — любой скрипт читает токен | Не использовать для access-токенов |
| `sessionStorage` | XSS, но очищается при закрытии вкладки | Лучше localStorage, но всё ещё уязвим к XSS |
| `httpOnly; Secure; SameSite=Strict` cookie | CSRF (если SameSite не Strict) | Наилучший вариант для веб-приложений |
| BFF (Backend For Frontend) | Сложнее архитектура | Токен хранится на BFF, клиент через session cookie |

```
# Рекомендуемый cookie для access-токена
Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=900
```

---

## Полный процесс валидации JWT (серверная сторона)

```
1. [x] Разобрать токен, проверить структуру (3 части через '.')
2. [x] Проверить alg — входит ли в allowlist?
3. [x] Если kid — провалидировать, что это не path traversal / injection
4. [x] Проверить подпись (RS256/ES256 public key, HS256 secret)
5. [x] Проверить iss (issuer) — совпадает с ожидаемым?
6. [x] Проверить aud (audience) — этот сервис в списке?
7. [x] Проверить exp (expiration) — не истёк?
8. [x] Проверить nbf (not before) — уже действует?
9. [x] Проверить iat (issued at) — не из будущего? (clock skew tolerance)
10. [x] Проверить jti по blacklist'у (если используется)
11. [x] Проверить custom claims (role, scope) — соответствуют бизнес-логике
```

---

## JWT vs Session — когда что использовать

| Критерий | JWT | Server-side Sessions |
|----------|-----|----------------------|
| Масштабирование | Stateless, не нужен общий сторадж | Нужен Redis/DB для хранения сессий |
| Отзыв | Только через blacklist / short-lived | Мгновенный — удалил сессию |
| Размер запроса | ~1-2 KB в заголовке | ~40 байт (cookie) |
| Микросервисы | Каждый может проверять сам | Нужен общий session store |
| Чувствительные данные в токене | Видны всем (если не шифровать) | Данные на сервере, клиент видит только ID |

---

## Полезные ссылки

- [RFC 7519 — JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 7515 — JSON Web Signature](https://datatracker.ietf.org/doc/html/rfc7515)
- [RFC 7517 — JSON Web Key](https://datatracker.ietf.org/doc/html/rfc7517)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0: JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [PortSwigger: JWT Attacks](https://portswigger.net/web-security/jwt)