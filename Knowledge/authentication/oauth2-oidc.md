# OAuth 2.0 и OpenID Connect (OIDC)

> **Суть:** OAuth 2.0 — протокол **делегирования доступа** (не аутентификации!). OIDC — надстройка над OAuth 2.0, добавляющая **аутентификацию** через ID Token.
>
> **Главный риск:** Неправильная валидация redirect_uri, утечка authorization code / токенов, смешение OAuth и аутентификации без OIDC.

---

## OAuth 2.0 — зачем и когда

| Сценарий | Пример |
|----------|--------|
| **Delegated access** | Пользователь даёт сервису X доступ к своему Google Drive |
| **Third-party login** | «Войти через Google/GitHub» — но это уже OIDC, не чистый OAuth |
| **Service-to-service** | Микросервис A вызывает микросервис B от имени пользователя, используя access token |
| **Mobile / SPA** | Клиент получает токен через Authorization Code + PKCE |

**Что OAuth НЕ делает:** не говорит, кто пользователь. Для этого нужен OIDC.

---

## Роли в OAuth 2.0

```
+----------------+          +-------------------+
| Resource Owner  |          | Authorization     |
| (Пользователь)  |-------->| Server (AuthZ)    |
+----------------+          +-------------------+
        |                            |
        v                            v
+----------------+          +-------------------+
| Client         |-------->| Resource Server   |
| (Приложение)   |          | (API)             |
+----------------+          +-------------------+
```

| Роль | Кто | Пример |
|------|-----|--------|
| **Resource Owner** | Пользователь | Алиса |
| **Client** | Приложение, которому нужен доступ | Веб-приложение «MyApp» |
| **Authorization Server** | Выдаёт токены | Google OAuth, Keycloak, Auth0 |
| **Resource Server** | API, к которому Client хочет доступ | Google Drive API |

---

## Grant Types (потоки OAuth)

### 1. Authorization Code + PKCE (рекомендуемый)

Единственный поток, который следует использовать для публичных клиентов (SPA, mobile, desktop).

```
Шаг 1: Client → Auth Server:  GET /authorize?response_type=code&
                                client_id=myapp&
                                redirect_uri=https://myapp/callback&
                                scope=openid+profile+email&
                                code_challenge=<SHA256(verifier)>&
                                code_challenge_method=S256&
                                state=<random>

Шаг 2: Пользователь логинится, даёт согласие

Шаг 3: Auth Server → Client (через redirect):
        https://myapp/callback?code=AUTH_CODE_123&state=<random>

Шаг 4: Client → Auth Server:  POST /token
                                code=AUTH_CODE_123&
                                code_verifier=<original verifier>&
                                client_id=myapp

Шаг 5: Auth Server → Client:  { access_token, refresh_token, id_token }
```

### 2. Client Credentials (service-to-service)

Для взаимодействия между сервисами без пользователя.

```http
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=service-a&
client_secret=securely_stored_secret&
scope=read:orders
```

### Устаревшие / опасные потоки

| Поток | Проблема | Замена |
|-------|----------|--------|
| **Implicit** | Токен в URL (утекает в browser history, referrer headers) | Authorization Code + PKCE |
| **Resource Owner Password Credentials** | Пользователь отдаёт пароль приложению | Authorization Code + PKCE |
| **Device Code** | Для устройств без браузера (ТВ, принтеры). ОК при корректной реализации | Device Code с интервалами опроса |

---

## OIDC (OpenID Connect) — добавление аутентификации

OIDC добавляет **ID Token** (JWT) и **UserInfo endpoint** поверх OAuth 2.0.

```
OAuth 2.0:  access_token  → доступ к ресурсам
OIDC:       id_token      → информация о пользователе (identity)
```

### ID Token vs Access Token

| | Access Token | ID Token |
|--|-------------|----------|
| **Назначение** | Доступ к API (Resource Server) | Идентификация пользователя |
| **Аудитория (aud)** | Resource Server | Client (приложение) |
| **Формат** | Чаще всего opaque (не JWT), но может быть JWT | Всегда JWT |
| **Проверяет** | Resource Server | Client |
| **Передавать в API** | Да (Authorization: Bearer) | Нет (это не access-токен!) |

### OIDC Flow (надстройка над Authorization Code)

```
1. Client запрашивает scope=openid+profile+email
2. Auth Server возвращает access_token + id_token
3. Client валидирует id_token:
   - Проверяет подпись (RS256/ES256)
   - Проверяет iss (issuer) — совпадает с ожидаемым
   - Проверяет aud (audience) — содержит client_id приложения
   - Проверяет exp, iat, nbf
   - Проверяет nonce (если передавался в запросе) — защита от replay
4. Опционально: Client запрашивает UserInfo endpoint с access_token
```

---

## Критические уязвимости OAuth/OIDC

### 1. Redirect URI Validation (open redirect)

Слабая валидация `redirect_uri` → злоумышленник перехватывает authorization code.

```
[ATTACK]
https://auth.example.com/authorize?
  response_type=code&
  client_id=myapp&
  redirect_uri=https://evil.com/callback  <--- подмена

[FIX]
- Точное совпадение (не startsWith!)
- Allowlist зарегистрированных URI на сервере авторизации
- Не разрешать wildcards в redirect_uri
```

```
[BAD]   redirect_uri.startsWith("https://myapp.com")  → https://myapp.com.evil.com
[GOOD]  registered_uris = ["https://myapp.com/callback", "myapp://callback"]
        if redirect_uri not in registered_uris: reject
```

### 2. CSRF через `state` parameter

Без `state` злоумышленник может инициировать OAuth-поток и заставить жертву использовать его токен.

```
[ATTACK]
1. Атакующий начинает OAuth-поток с https://attacker-site.com как redirect_uri
2. Перехватывает redirect с authorization code
3. Отправляет жертве ссылку: https://myapp.com/callback?code=VICTIM_CODE
4. Жертва переходит → приложение завершает OAuth-поток
5. Access-токен атакующего привязан к сессии жертвы

[FIX] Параметр state — случайное значение, которое клиент проверяет при возврате
```

```python
# Генерация state
state = secrets.token_urlsafe(32)
session["oauth_state"] = state

# Проверка при возврате
received_state = request.args.get("state")
if not secrets.compare_digest(session.pop("oauth_state", ""), received_state):
    abort(403, "Invalid state parameter")
```

### 3. Authorization Code Injection

Перехват authorization code (если нет PKCE) → злоумышленник обменивает на access-токен.

```
[ATTACK]
- Приложение перехватывает code из колбэка (если redirect_uri не HTTPS или схема не private)
- Обменивает code на токен от своего имени

[FIX] PKCE (Proof Key for Code Exchange)
```

### 4. PKCE Bypass (если не проверяется code_challenge_method)

```
[FIX] Требовать S256 (SHA256). Plain — небезопасен.
```

### 5. Client Secret в публичных клиентах

SPA, mobile, desktop приложения НЕ могут безопасно хранить `client_secret`. Поэтому они:
- Не используют `client_secret`
- Используют Authorization Code + PKCE
- В идеале — BFF (Backend For Frontend), который держит секрет

```
[ANTI-PATTERN]
const CLIENT_SECRET = "supersecret";  // В JS-бандле SPA — видно всем

[PATTERN]
SPA → BFF (Backend for Frontend) → Authorization Server
BFF хранит client_secret, SPA общается с BFF через session cookie
```

---

## Token Storage и Handling

### Access Token

| Хранилище | Риск | Рекомендация |
|-----------|------|--------------|
| SPA memory (переменная JS) | XSS — украдёт | Короткий срок жизни (5-15 мин) |
| SPA cookie httpOnly | CSRF (если SameSite=Lax) | SameSite=Strict + CSRF-токен |
| BFF (серверная сессия) | Нет прямого доступа из браузера | Наилучший вариант |

### Refresh Token

| Хранилище | Требование |
|-----------|------------|
| Cookie `HttpOnly; Secure; SameSite=Strict` | Недоступен из JS |
| `Path=/token/refresh` | Только для эндпоинта обновления |
| Rotation | При каждом использовании — новый refresh, старый инвалидируется |
| Reuse Detection | Если использован старый refresh → отозвать всю семью токенов |

---

## Scope Validation

```
# Минимальный scope
openid    — OIDC, обязателен для ID Token
profile   — имя, фамилия, картинка, locale
email     — email, email_verified
address   — почтовый адрес
phone     — телефон, phone_verified

# Пользовательские scopes
read:orders   write:orders
read:profile  admin:users
```

| Правило | Пояснение |
|---------|-----------|
| Принцип least privilege | Запрашивать минимально необходимый scope |
| Не доверять scope из токена | Проверять на сервере: scope соответствует action |
| Постепенное повышение (step-up) | Для админ-операций — запросить дополнительную MFA, даже если токен валидный |

---

## Чек-лист безопасности OAuth/OIDC

### Для Authorization Server
- [ ] Все registered redirect_uri проходят точное сравнение (не startsWith/contains)
- [ ] Wildcards в redirect_uri запрещены
- [ ] PKCE обязателен для public clients (SPA, mobile, desktop)
- [ ] `code_challenge_method=S256` обязателен (plain — нет)
- [ ] Authorization code — одноразовый, короткий срок жизни (30-60 секунд)
- [ ] Refresh token — rotation + reuse detection
- [ ] `state` обязателен для Authorization Code flow
- [ ] `nonce` обязателен для OIDC (защита от replay)
- [ ] ID Token подписан RS256/ES256 (не HS256, не none)
- [ ] Client secret не выдаётся public clients

### Для Client (RP — Relying Party)
- [ ] ID Token валидируется: подпись, iss, aud, exp, nbf, nonce
- [ ] Access token не используется для идентификации пользователя
- [ ] Refresh token хранится в httpOnly cookie, не в localStorage
- [ ] После логаута — токены инвалидируются на серверной стороне
- [ ] `state` проверяется при каждом колбэке
- [ ] Используется BFF-паттерн для SPA/mobile

### Для Resource Server
- [ ] Access token валидируется локально (JWT) или через introspection endpoint
- [ ] Проверяется scope токена перед выполнением действия
- [ ] Проверяется, что токен не отозван (если используется blacklist)
- [ ] Audience (aud) проверяется — токен для этого сервиса?

---

## Полезные ссылки

- [RFC 6749 — OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 for Browser-Based Applications (Best Current Practice)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OWASP OAuth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)