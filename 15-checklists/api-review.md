# API Review Checklist

## Authentication
- [ ] JWT validation: `exp`, `aud`, `iss`, `alg` — все проверяются
- [ ] `alg: none` запрещён
- [ ] Rate limiting на login / sensitive endpoints
- [ ] API keys не в URL / body, а в Authorization header

## Authorization
- [ ] Ownership проверяется на сервере
- [ ] ID из JWT, не из URL
- [ ] RBAC проверяется на каждом endpoint
- [ ] Horizontal access control: user A ≠ user B

## Input Validation
- [ ] **SQL Injection**: все запросы через PreparedStatement / ORM
- [ ] **Dynamic SQL**: нет конкатенации, нет `createNativeQuery`
- [ ] **ORDER BY / GROUP BY**: allowlist допустимых колонок
- [ ] **NoSQL Injection**: нет `$where`, `$regex` с пользовательским вводом
- [ ] **Mass assignment**: DTO / whitelist для изменяемых полей
- [ ] **Schema validation**: JSON Schema / Pydantic для всех request body
- [ ] **Размер запроса**: ограничен
- [ ] **Content-Type**: строгий (не принимаем XML если ожидаем JSON)

## Rate Limiting
- [ ] Per user + Per IP
- [ ] Настроены retry-after headers
- [ ] 429 для превышения лимита

## Configuration
- [ ] CORS: не `*`, конкретные origin
- [ ] Security headers: CSP, HSTS, X-Content-Type-Options
- [ ] Error messages не раскрывают детали
- [ ] Debug / dev endpoints отключены
- [ ] Swagger / OpenAPI — не в production (или с auth)

## Logging & Monitoring
- [ ] Audit log для sensitive операций
- [ ] No secrets / PII в логах
- [ ] Alerts на подозрительную активность

## Dependencies
- [ ] SCA scan — нет known vulnerabilities
- [ ] API gateway / WAF настроен

