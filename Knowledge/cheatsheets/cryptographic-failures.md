# Cheatsheet: Cryptographic Failures

## Выбор алгоритма

```
Нужно восстановить данные?
├── НЕТ → Хеширование
│   ├── Пароль/PIN   → Argon2id (+ Salt, + Pepper)
│   ├── Целостность  → SHA-256 / SHA-512
│   └── HMAC         → HMAC-SHA256
│
└── ДА → Шифрование
    ├── Симметричное  → AES-256-GCM
    ├── Асимметричное → RSA-3072 / ECC P-256
    └── Обмен ключей  → ECDHE (PFS)
```

## Password Hashing

| Алгоритм | Статус | Memory Hard | Рекомендация |
|----------|--------|-------------|--------------|
| **Argon2id** | [OK] Современный | [OK] Да | ***** |
| **bcrypt** | [OK] Проверенный | [NO] Нет | **** |
| **scrypt** | [OK] Проверенный | [OK] Да | **** |
| **PBKDF2** | [WARN] Устаревает | [NO] Нет | *** |
| SHA-256 | [NO] Не для паролей | [NO] Нет | [NO] |
| MD5 | [NO] Устарел | [NO] Нет | [NO] |

## Argon2id — рекомендуемые параметры

| Уровень | Memory Cost | Time Cost | Parallelism |
|---------|-------------|-----------|-------------|
| Minimum | 19 MB | 2 | 1 |
| Recommended | 64 MB | 3 | 4 |
| High | 256 MB | 5 | 8 |

## Salt vs Pepper

| | Salt | Pepper |
|---|------|--------|
| Для каждого пользователя | [OK] Да | [NO] Нет (общий) |
| Секрет | [NO] Нет | [OK] Да |
| Хранится | В базе | Vault / Secret Manager |

## Secrets Management — иерархия

```
[NO] Hardcoded в коде      → String apiKey = "..."
[NO] В Git                 → git add secrets.properties
 Environment Variables → System.getenv("DB_PASSWORD")
[OK] Vault / Secrets Mgr   → AWS Secrets Manager, HashiCorp Vault
* Dynamic Secrets       → Vault с TTL и auto-rotation
```

## TLS — что использовать

| Версия | Статус | Cipher Suites |
|--------|--------|---------------|
| TLS 1.0 | [NO] Запрещён | BEAST, POODLE |
| TLS 1.1 | [NO] Запрещён | Слабые |
| **TLS 1.2** | [OK] Рекомендуется | ECDHE + AES-GCM |
| **TLS 1.3** | [OK] Рекомендуется | Быстрее, безопаснее |

## SAST patterns (Semgrep)

```yaml
# Запрет отключения проверки сертификатов
rules:
  - id: cert-validation-disabled
    patterns:
      - pattern: verify=False
      - pattern: NODE_TLS_REJECT_UNAUTHORIZED='0'
      - pattern: trustAllCertificates()

# Запрет слабых алгоритмов
  - id: weak-hash-algorithm
    patterns:
      - pattern: MessageDigest.getInstance("MD5")
      - pattern: MessageDigest.getInstance("SHA-1")
      - pattern: hashlib.md5()
      - pattern: hashlib.sha1()

# Запрет hardcoded secrets
  - id: hardcoded-secret
    patterns:
      - pattern: String $KEY = "sk-..."
      - pattern: String $PASSWORD = "..."
```

## Quick Reference

| Задача | Решение |
|--------|---------|
| Хранение пароля | Argon2id + Salt |
| Хранение PII/card | AES-256-GCM (ключ в Vault) |
| API Key | Vault / Secrets Manager |
| Целостность файла | SHA-256 |
| TLS | 1.2 или 1.3 с ECDHE |
| Цифровая подпись | ECDSA / EdDSA |

## Interview Quick Cards

- **SHA-256 для паролей?** [NO] Слишком быстрый (миллиарды/сек на GPU)
- **AES для паролей?** [NO] Не нужно восстанавливать + ключ компрометирует все
- **Hash vs Encryption?** Если не нужно восстанавливать → Hash, если нужно → Encryption
- **Salt?** Случайный, для каждого пользователя, не секрет, в БД
- **Pepper?** Общий секрет, отдельно от БД (Vault)
- **trustAllCertificates?** [NO] MITM, HTTPS без проверки = шифрование для атакующего
- **TLS 1.0?** [NO] BEAST, POODLE
- **PFS?** Каждая сессия — временный ключ, старый трафик защищён
- **Argon2 vs bcrypt?** Argon2 Memory Hard → усложняет GPU

## CWE Mapping

| CWE | Описание |
|-----|----------|
| CWE-327 | Use of a Broken or Risky Cryptographic Algorithm |
| CWE-328 | Use of Weak Hash |
| CWE-759 | Use of a One-Way Hash without a Salt |
| CWE-916 | Use of Password Hash With Insufficient Computational Effort |
| CWE-295 | Improper Certificate Validation |
| CWE-311 | Missing Encryption of Sensitive Data |
| CWE-312 | Cleartext Storage of Sensitive Data |
| CWE-522 | Insufficiently Protected Credentials |
| CWE-798 | Use of Hard-coded Credentials |
