# Security Requirements

## Определение

Security Requirements — это функциональные и нефункциональные требования к системе, которые описывают, как должна быть реализована безопасность.

## Уровни требований

### 1. Организационные
- Политики безопасности компании
- Compliance (GDPR, PCI DSS, 152-ФЗ)
- Стандарты (ISO 27001, NIST)

### 2. Продуктовые
- Аутентификация
- Авторизация
- Шифрование
- Аудит и логирование

### 3. Технические
- Input validation
- Output encoding
- Rate limiting
- Session management

## Примеры Security Requirements

### Authentication
```
REQ-AUTH-01: Система должна поддерживать MFA
REQ-AUTH-02: Пароль должен быть не менее 8 символов
REQ-AUTH-03: После 5 неудачных попыток — блокировка на 15 минут
REQ-AUTH-04: JWT должен проверять exp, nbf, aud, iss
```

### Authorization
```
REQ-AUTHZ-01: Доступ проверяется на сервере, не на клиенте
REQ-AUTHZ-02: Default deny для всех ресурсов
REQ-AUTHZ-03: Ownership проверяется для всех user-specific данных
```

### Cryptography
```
REQ-CRYPTO-01: Пароли хэшируются bcrypt/Argon2id
REQ-CRYPTO-02: Все данные в транзите — TLS 1.2+
REQ-CRYPTO-03: API keys хранятся в Vault, не в коде
```

### Logging
```
REQ-LOG-01: Все sensitive действия логируются
REQ-LOG-02: Логи не содержат PII
REQ-LOG-03: Логи хранятся минимум 90 дней
```

## Как формулировать Security Requirements

### Формат: User Story
```gherkin
Feature: Authentication
  As a user
  I want to authenticate with MFA
  So that my account is protected

  Scenario: Successful MFA login
    Given I have valid credentials
    When I submit login form
    Then I should be prompted for MFA
    And after entering valid OTP, I am logged in
```

### Acceptance Criteria
```markdown
AC-1: JWT содержит claims: sub, exp, iat, aud, iss
AC-2: JWT подписан RS256 (не HS256)
AC-3: exp проверяется на каждом request
AC-4: Refresh token rotation реализован
```

## Security Requirements по типу данных

| Тип данных | Минимальные требования |
|------------|----------------------|
| PII | Шифрование в покое, контроль доступа, аудит |
| Payment data | PCI DSS compliance, tokenization |
| Credentials | Bcrypt/Argon2id, MFA, rate limiting |
| Health data | HIPAA compliance, audit trail |
| Internal business data | Access control, encryption |

## Как интегрировать в процесс

```
Product Manager ──▶ User Stories ──▶ Security Review
                       │
                       ▼
            Security Requirements
                       │
                       ▼
                 Sprint Planning
                       │
                       ▼
                 Development
                       │
                       ▼
                 Security Validation
                       │
                       ▼
                 Definition of Done
```

## Чек-лист для Security Requirements

### Authentication
- [ ] MFA для admin/sensitive действий
- [ ] Rate limiting на login
- [ ] Session invalidation на logout
- [ ] Secure password recovery

### Authorization
- [ ] RBAC/ABAC реализован
- [ ] Ownership проверяется
- [ ] Default deny

### Input Validation
- [ ] All input validated на сервере
- [ ] Allowlist, где возможно
- [ ] No eval() с пользовательским вводом

### Output Encoding
- [ ] Context-aware encoding
- [ ] No innerHTML с пользовательским вводом
- [ ] CSP настроен

### Cryptography
- [ ] Passwords: bcrypt/Argon2id
- [ ] TLS 1.2+
- [ ] Secrets in Vault

### Logging
- [ ] Sensitive actions logged
- [ ] No PII in logs
- [ ] Audit trail

## Ключевые тезисы

- Security Requirements — это требования, а не guidelines
- Должны быть измеримыми и проверяемыми
- Интегрируются в user stories
- Могут быть автоматизированы (SAST rules)
- Разные типы данных требуют разных требований
- Acceptance criteria — ключ к проверке выполнения
