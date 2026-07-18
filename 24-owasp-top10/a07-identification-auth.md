# A07 — Identification & Authentication Failures

> **Суть:** Уязвимости в идентификации и аутентификации пользователей. Не только проверка логина/пароля, а весь жизненный цикл учётной записи.

---

## Быстрый чек-лист

- [ ] Username Enumeration — одинаковые ответы + время обработки?
- [ ] Rate Limiting / Backoff / CAPTCHA на логине?
- [ ] Session ID регенерируется после логина? (Session Fixation)
- [ ] JWT проверяет `exp`, `nbf`, `aud`, `iss`?
- [ ] Refresh Token инвалидируется при logout / disable user?
- [ ] MFA настроено? TOTP / Push / FIDO2, не SMS?
- [ ] Процессы восстановления защищены?

---

## Username Enumeration

```http
# ❌ Плохо — раскрывает существование пользователя
POST /login → "User not found"
POST /login → "Wrong password"

# ✅ Хорошо — одинаковый ответ
POST /login → "Invalid credentials"
```

Даже одинаковый текст не спасает от **Timing Attack**: существующий пользователь → проверка hash (250ms), несуществующий → сразу ошибка (20ms).

---

## Session Fixation

```
До логина:    SessionID = ABC123
После логина: SessionID = ABC123   ← НЕ ИЗМЕНИЛСЯ — УЯЗВИМОСТЬ!
```

**Защита:** Всегда регенерировать Session ID после аутентификации.

---

## JWT — проблемы отзыва

| Проблема | Решение |
|----------|---------|
| **Logout** — удалили токен из браузера, но украденный JWT жив | Короткий Access Token (5-15 мин) |
| **User disabled** — пользователя уволили, но токен ещё действителен | Инвалидировать Refresh Token |
| **Stateless** — как отозвать без хранилища? | Blacklist / Token Version |

---

## MFA

| Метод | Надёжность | Проблемы |
|-------|-----------|----------|
| **SMS** | Низкая | SIM Swapping, SS7, перехват |
| **TOTP** | Высокая | Код генерируется на устройстве |
| **Push Auth** | Высокая | MFA Fatigue (спам уведомлениями) |
| **FIDO2 / WebAuthn** | Очень высокая | Устойчив к phishing |

---

## Risk-Based Authentication

```python
if risk_score > THRESHOLD:
    require_mfa()
else:
    allow_login()
```

**Факторы:** Device Fingerprint, геолокация, IP, ASN, история входов, часовой пояс, скорость перемещения.

---

## 🔗 Полная версия

👉 [`06-authentication/identification-authentication-failures.md`](../06-authentication/identification-authentication-failures.md) — Brute Force, блокировка аккаунта vs DoS, JWT trade-offs, Refresh Token, Risk-Based Auth, interview questions
