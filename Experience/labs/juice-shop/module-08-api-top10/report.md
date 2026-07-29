# Модуль 8: OWASP API Top 10

> **Цель:** Проверить каждую категорию API Top 10 в Juice Shop

---

| # | Категория | Статус | Риск |
|---|-----------|--------|------|
| API1 | Broken Object Level Authorization | ✅ Проверено (Модуль 6 — BOLA/IDOR) | Critical |
| API2 | Broken Authentication | ✅ Проверено (Модуль 5) | Critical |
| API3 | Broken Object Property Level Authorization | ✅ Проверено (Mass Assignment — Модуль 4, 6) | Critical |
| API4 | Unrestricted Resource Consumption | ✅ Проверено (rate limiting — Модуль 4) | High |
| API5 | Broken Function Level Authorization | ✅ Проверено (BFLA — Модуль 6) | Critical |
| API6 | Unrestricted Access to Sensitive Business Flows | ✅ Массовая регистрация без капчи, ограничение 5 шт/товар (но можно обходить через разных пользователей) | High |
| API7 | Server Side Request Forgery | 🟡 Частично (Модуль 9) | Medium |
| API8 | Security Misconfiguration | ✅ Проверено (/ftp/, CORS — Модуль 4) | Critical |
| API9 | Improper Inventory Management | ✅ Публичный Swagger, нет версионирования API, все эндпоинты открыты | High |
| API10 | Unsafe Consumption of APIs | ✅ Chatbot использует LLM API без проверки ответа | Medium |
