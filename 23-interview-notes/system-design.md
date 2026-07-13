# System Design Interview Notes (Security Focus)

---

### 🎯 Спроектируй безопасную систему аутентификации

**💡 Концепция:** JWT + MFA + Session management.

**📝 Ответ:**
```
Client ── HTTPS ──▶ Auth Service ──▶ User DB
  │                      │
  │                      ▼
  │                  Token Store (Redis)
  │                      │
  │                      ▼
  │                  API Gateway
```

**Ключевые решения:**
1. JWT с RS256 (не HS256) для микросервисов
2. Access token: 15 min, Refresh token: 7 days
3. Refresh token rotation (каждый раз новый)
4. MFA через OTP/TOTP
5. Rate limiting на login (10/min per IP)
6. Brute force protection: блокировка после 5 попыток

---

### 🎯 Как защитить API от массовых атак?

**💡 Концепция:** Rate limiting + WAF + Monitoring.

**📝 Ответ:**
```
Internet ──▶ CloudFlare ──▶ WAF ──▶ API Gateway ──▶ Services
                │                │         │
            DDoS保护         Rate        Auth
            Geo blocking     Limiting    RBAC
```

**Rate limiting:**
```
Per user:    100 req/min
Per IP:      1000 req/min
Per endpoint: varies (login: 10/min)
```

**Дополнительно:**
- WAF (ModSecurity, CloudFlare)
- IP blacklisting
- CAPTCHA для подозрительных запросов
- Anomaly detection

---

### 🎯 Спроектируй pipeline безопасной CI/CD

**💡 Концепция:** Security by default + Gates.

**📝 Ответ:**
```
Developer ──▶ Pre-commit ──▶ PR ──▶ Build ──▶ Staging ──▶ Production
                 │            │       │          │            │
             Secret       SAST +  Container  DAST +      Sign-off
             Scan         SCA     Scan       API Scan
```

**Security Gates:**
```
PR: SAST CRITICAL → block
Build: SCA CRITICAL → block  
Staging: DAST XSS/SQLi → block
Production: manual sign-off
```

**Monitoring:**
- Runtime: WAF + RASP
- Logs: centralized (ELK)
- Alerts: Slack/PagerDuty
