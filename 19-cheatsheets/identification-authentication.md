# Identification & Authentication Failures Cheatsheet

> Быстрая справка по аутентификации: что проверять, как защищаться.

---

## Что проверять при Security Review

```bash
# 1. Username Enumeration — проверить ответы
curl -v -X POST https://target.com/login \
  -d 'username=known_user@company.com&password=wrong'
curl -v -X POST https://target.com/login \
  -d 'username=nonexistent@company.com&password=wrong'
# Сравнить: одинаковый ли текст? одинаковое ли время?

# 2. Timing Attack — замерить время
time curl -s -X POST https://target.com/login \
  -d 'username=exists@test.com&password=wrong' > /dev/null
time curl -s -X POST https://target.com/login \
  -d 'username=fake@test.com&password=wrong' > /dev/null

# 3. Forgot Password — проверить ответы
curl -v -X POST https://target.com/forgot-password \
  -d 'email=known@user.com'
curl -v -X POST https://target.com/forgot-password \
  -d 'email=nobody@void.com'

# 4. Session Fixation — проверить Session ID до/после логина
curl -v -c cookies.txt https://target.com/login
# ... залогиниться ...
grep session cookies.txt  # тот же ID?

# 5. Rate Limiting — проверить блокировку
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}" -X POST https://target.com/login \
    -d 'username=admin&password=wrong'$i
  echo ""
done

# 6. Security Headers (аутентификация)
curl -sI https://target.com | grep -i "set-cookie\|strict-transport-security"
```

---

## Чего искать на Code Review

```bash
# Session Fixation — регенерация ID после логина
grep -rn "regenerate\|session_regenerate_id\|regenerateSession" src/ --include="*.java" --include="*.py" --include="*.php" --include="*.js"

# Timing attack — сравнение паролей
grep -rn "password_verify\|password_hash\|bcrypt.check\|Bcrypt\." src/ --include="*.java" --include="*.py" --include="*.php" --include="*.js"

# Username enumeration — разница в ответах
grep -rn "user not found\|UserNotFoundException\|user doesn't exist" src/ --include="*.java" --include="*.py" --include="*.php"

# Password recovery — чувствительные логи
grep -rn "log.*password\|logger.*password\|System.out.*password" src/ --include="*.java"

# Rate limiting
grep -rn "RateLimiter\|@RateLimit\|throttle\|bucket4j\|rate.limit" src/ --include="*.java" --include="*.py" --include="*.js"

# JWT validation
grep -rn "Jwts\|jwt\|JJWT\|io.jsonwebtoken" src/ --include="*.java"
grep -rn "jwt.verify\|jsonwebtoken.verify" src/ --include="*.js"
grep -rn "decode.*jwt\|base64.*decode.*jwt" src/ --include="*.py"  # без verification
```

---

## Безопасные паттерны

### Login — защита от enumeration и timing

```java
// ❌ ОПАСНО — username enumeration
public User login(String username, String password) {
    User user = userRepo.findByUsername(username);
    if (user == null) {
        throw new UserNotFoundException("User not found");
    }
    if (!passwordEncoder.matches(password, user.getHash())) {
        throw new BadCredentialsException("Wrong password");
    }
    return user;
}

// ✅ БЕЗОПАСНО — одинаковый ответ и одинаковое время
public User login(String username, String password) {
    User user = userRepo.findByUsername(username);
    if (user == null) {
        // Всегда считаем hash, даже если пользователя нет
        passwordEncoder.matches(password, "fake_hash_constant_time");
        throw new BadCredentialsException("Invalid credentials");
    }
    if (!passwordEncoder.matches(password, user.getHash())) {
        throw new BadCredentialsException("Invalid credentials");
    }
    return user;
}
```

### Session Fixation

```java
// ✅ После успешной аутентификации — регенерировать Session ID
request.changeSessionId();  // Servlet 3.1+
// или
request.getSession().invalidate();
request.getSession();  // создаётся новая

// ❌ ОПАСНО — не регенерировать
// Session ID остаётся тем же
```

### Password Recovery

```php
// ❌ ОПАСНО — username enumeration
if (userExists($email)) {
    sendResetLink($email);
    return "Email sent";
} else {
    return "User not found";
}

// ✅ БЕЗОПАСНО — одинаковый ответ
sendResetLinkIfExists($email);
return "If the account exists, instructions have been sent.";
```

---

## Типичные ошибки

| Ошибка | Почему плохо |
|--------|-------------|
| Разные ответы при входе («User not found» vs «Wrong password») | Username enumeration |
| Разное время обработки существующего и несуществующего пользователя | Timing attack |
| Блокировка аккаунта после N попыток | DoS — злоумышленник блокирует любого пользователя |
| Session ID не меняется после логина | Session Fixation |
| SMS как единственный MFA | SIM Swapping, SS7 |
| Отсутствие rate limiting | Brute force |
| JWT без возможности отзыва | После увольнения токен работает до `exp` |
| Не инвалидируется Refresh Token при logout | Можно получить новые токены |
| `decode()` без `verify()` для JWT | Подделка токена |

---

## Что должно быть в production

| Компонент | Требование |
|-----------|-----------|
| Login response | Одинаковый для всех случаев |
| Login time | Одинаковое время (~константа) |
| Session ID | Регенерируется после логина |
| Rate limiting | На IP + на аккаунт |
| MFA | Не SMS (TOTP, Push, FIDO2) |
| JWT Access Token | Короткий (5–15 мин) |
| Refresh Token | Инвалидируется при logout |
| Password policy | Min length, complexity (опционально) |
| Password storage | bcrypt / argon2 |

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-287** | Improper Authentication |
| **CWE-307** | Improper Restriction of Excessive Authentication Attempts |
| **CWE-384** | Session Fixation |
| **CWE-208** | Information Exposure Through Timing Discrepancy |
| **CWE-203** | Information Exposure Through Discrepancy During Authentication |
| **CWE-204** | Observable Response Discrepancy |
| **CWE-613** | Insufficient Session Expiration |
| **CWE-620** | Unverified Password Change |
