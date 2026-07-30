# Cryptography (OWASP A02)

> [LOW] **Статус:** Cryptographic Failures — готово

## Содержание

| Тема | Статус | Файл |
|------|--------|------|
| **Cryptographic Failures (A02)** | [OK] Готово | [`cryptographic-failures.md`](cryptographic-failures.md) |
| Symmetric Encryption (AES) |  В работе | — |
| Asymmetric Encryption (RSA, ECC) |  В работе | — |
| Hashing (SHA, HMAC) |  В работе | — |
| TLS |  В работе | — |
| Key Management |  В работе | — |

## Ключевые тезисы

1. **Пароли никогда не шифруются** — они хешируются (Argon2id).
2. **Argon2id** — современный стандарт хранения паролей (Memory Hard, защита от GPU).
3. **Salt** — уникален для каждого пользователя, не является секретом.
4. **Pepper** — общий секрет, хранится отдельно от базы (Vault/HSM).
5. **HTTPS бесполезен** без проверки сертификатов — MITM.
6. **TLS 1.2/1.3** — современный стандарт, TLS 1.0/1.1 — устарели.
7. **PFS** — защищает старый трафик даже после компрометации ключа сервера.
8. **Secrets Management** — Vault > Environment Variables > Hardcoded.
9. **Dynamic Secrets** — пароль существует только пока используется.
10. **Главный вопрос:** *"Нужно ли восстанавливать данные?"* — определяет выбор между хешем и шифрованием.
