# CSRF Cheatsheet

> Быстрая справка по Cross-Site Request Forgery.

---

## Как проверить защиту от CSRF

```bash
# 1. Проверить SameSite Cookie
curl -sI "https://target.com/login" | grep -i set-cookie
# Ищи: SameSite=Lax или SameSite=Strict

# 2. Проверить CSRF-токен
# Отправить POST без CSRF-токена
curl -X POST "https://target.com/api/transfer" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}' \
  -v
# Должен вернуть 403

# 3. Проверить Origin/Referer заголовки (если используется)
curl -X POST "https://target.com/api/transfer" \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}' \
  -v
```

---

## Защита

### 1. SameSite Cookies (рекомендуется)

```
Set-Cookie: session=abc123; SameSite=Lax; HttpOnly; Secure
Set-Cookie: session=abc123; SameSite=Strict; HttpOnly; Secure
```

| Значение | Поведение |
|----------|-----------|
| `Lax` | Cookie не отправляется на POST из другого Origin (защита от CSRF) |
| `Strict` | Cookie не отправляется вообще из другого Origin |
| `None` | Cookie отправляется всегда (нужен `Secure`) |

### 2. CSRF Token (Synchronizer Token Pattern)

```html
<form action="/transfer" method="POST">
  <input type="hidden" name="csrf_token" value="randombase64token">
  <input type="text" name="amount">
</form>
```

```javascript
// Проверка на backend
if (request.body.csrf_token !== session.csrf_token) {
    return 403;
}
```

### 3. Custom Header (Double Submit Cookie)

```javascript
// Сервер устанавливает CSRF-токен в Cookie
Set-Cookie: csrf_token=abc123; SameSite=Lax; HttpOnly; Secure

// JavaScript читает и отправляет в заголовке
fetch('/api/transfer', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': 'abc123'
    }
});

// Сервер проверяет: Cookie.csrf_token === Header.X-CSRF-Token
```

### 4. Origin / Referer Header Check

```python
# Проверка Origin (предпочтительнее)
allowed_origins = ["https://bank.com", "https://www.bank.com"]
if request.headers.get("Origin") not in allowed_origins:
    return 403

# Fallback на Referer
referer = request.headers.get("Referer")
if referer and not referer.startswith("https://bank.com"):
    return 403
```

---

## JWT в localStorage vs Cookie

```javascript
// ❌ Cookie без SameSite — уязвимо к CSRF
fetch('/api/transfer', {
    method: 'POST',  // Cookie отправится автоматически
    body: JSON.stringify({ amount: 100 })
});

// ✅ JWT в localStorage — CSRF не работает (HTML-форма не добавит Authorization)
const token = localStorage.getItem('jwt');
fetch('/api/transfer', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount: 100 })
});
```

---

## Современная схема SPA

```
Access Token (5-15 min) → Memory
Refresh Token (7-30 days) → HttpOnly + Secure + SameSite Cookie
```

```javascript
// Login
const login = async (email, password) => {
    const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        credentials: 'include'  // для Refresh Cookie
    });
    const { accessToken } = await res.json();
    sessionStorage.setItem('access_token', accessToken);
};

// Запрос с Access Token
const apiCall = async (url, options = {}) => {
    const token = sessionStorage.getItem('access_token');
    const res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
    if (res.status === 401) {
        // Refresh Token автоматически в Cookie
        const refresh = await fetch('/api/refresh', {
            method: 'POST',
            credentials: 'include'
        });
        const { accessToken } = await refresh.json();
        sessionStorage.setItem('access_token', accessToken);
        return apiCall(url, options);  // retry
    }
    return res;
};
```

---

## Типичные ошибки

| Ошибка | Почему не работает |
|--------|-------------------|
| Только проверка `Referer` | Referer может отсутствовать (HTTP→HTTPS) |
| CORS вместо CSRF-защиты | CORS не блокирует отправку запросов |
| `SameSite=None` без необходимости | Отключает защиту браузера |
| CSRF-токен в Cookie без Double Submit | Cookie отправится автоматически, как и токен |
| Нет проверки Content-Type | JSON API без CSRF-токена уязвим через `<form>` c `text/plain` |

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-352** | Cross-Site Request Forgery |
| **CWE-784** | Reliance on Cookies without Validation |
| **CWE-1275** | Sensitive Cookie in HTTPS Session Without SameSite |
