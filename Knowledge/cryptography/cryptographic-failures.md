# Cryptographic Failures — OWASP A02

> **Ключевая идея:** Большинство криптографических уязвимостей возникают не потому, что алгоритм плохой, а потому что его используют не по назначению.

**Уровень:** Fundamental (Tier 1)

---

##  Содержание

1. [Главная идея](#1-главная-идея)
2. [Хеширование vs Шифрование](#2-хеширование-vs-шифрование)
3. [Почему SHA-256 нельзя использовать для хранения паролей?](#3-почему-sha-256-нельзя-использовать-для-хранения-паролей)
4. [Argon2](#4-argon2)
5. [Salt](#5-salt)
6. [Pepper](#6-pepper)
7. [Secrets Management](#7-secrets-management)
8. [Почему AES нельзя использовать для хранения паролей?](#8-почему-aes-нельзя-использовать-для-хранения-паролей)
9. [TLS](#9-tls)
10. [Почему нельзя отключать проверку сертификатов?](#10-почему-нельзя-отключать-проверку-сертификатов)
11. [TLS 1.0 vs TLS 1.2 vs TLS 1.3](#11-tls-10-vs-tls-12-vs-tls-13)
12. [Perfect Forward Secrecy (PFS)](#12-perfect-forward-secrecy-pfs)
13. [Практические сценарии](#13-практические-сценарии)
14. [Interview Questions](#14-interview-questions)
15. [Шпаргалка](#15-шпаргалка)

---

## 1. Главная идея

**Cryptographic Failures** (ранее — Sensitive Data Exposure) — это уязвимости, связанные с неправильным использованием криптографии.

### Типичные ошибки

| Ошибка | Чем опасно |
|--------|-----------|
| Хранение паролей через SHA-256 | Быстрый перебор на GPU |
| Использование AES для хранения паролей | Не нужно — пароль не восстанавливается |
| Хранение секретов в Git | Публичный доступ |
| Отключение проверки сертификатов TLS | MITM |
| Использование устаревших TLS | Известные атаки |
| Слабые алгоритмы (MD5, SHA-1, RC4, DES) | Коллизии, перебор |
| Отсутствие управления секретами | Hardcoded credentials |

### Правильный подход

**Сначала задача — потом алгоритм.** Не наоборот.

```text
Анализ задачи (нужно ли восстанавливать данные?)
    │
    ├── Нет → Хеширование (Argon2id для паролей)
    │
    └── Да → Шифрование (AES-256-GCM)
```

---

## 2. Хеширование vs Шифрование

> Это самый популярный вопрос на интервью.

### Хеширование

**Односторонняя функция.**

```
Password  →  Argon2  →  Hash
```

Назад получить пароль **нельзя**.

| Используется когда | Примеры |
|-------------------|---------|
| Не нужно восстанавливать данные | Пароли, PIN-коды |
| Нужна проверка целостности | Контрольные суммы файлов |

### Шифрование

**Обратимое преобразование.**

```
Card Number  →  AES  →  Ciphertext  →  AES Decrypt  →  Card Number
```

| Используется когда | Примеры |
|-------------------|---------|
| Данные необходимо получить обратно | Номера банковских карт, паспортные данные, медицинская информация, API Keys, приватные сообщения |

### Как отвечать на интервью

> Если данные **не нужно** восстанавливать — используем **хеширование**.
> Если данные **нужно** восстановить — используем **шифрование**.

---

## 3. Почему SHA-256 нельзя использовать для хранения паролей?

SHA-256 — **отличный криптографический алгоритм**. Но...

### Проблема

Он **слишком быстрый**.

Современная GPU способна считать **миллиарды SHA-256 в секунду**.

После утечки базы злоумышленник может быстро подобрать пароль.

### Что использовать вместо SHA-256?

| Алгоритм | Рейтинг | Особенность |
|----------|---------|-------------|
| **Argon2id** | ***** | Современный стандарт, Memory Hard |
| **bcrypt** | **** | Проверенный временем |
| **scrypt** | **** | Memory Hard, сложнее настройка |
| **PBKDF2** | *** | Только CPU-intensive, без памяти |

Потому что они специально:
- **медленные**;
- **дорогие по памяти**;
- **затрудняют brute force**.

### Демонстрация на Java

```java
// [NO] ПЛОХО: SHA-256 — слишком быстрый
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] hash = md.digest(password.getBytes());

// [OK] ХОРОШО: Argon2id — Password Hashing Competition winner
Argon2 argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);
String hash = argon2.hash(
    2,      // Time Cost
    65536,  // Memory Cost (64 MB)
    1       // Parallelism
);
```

### Демонстрация на Python

```python
import hashlib
from argon2 import PasswordHasher

# [NO] ПЛОХО: SHA-256 — миллиарды в секунду на GPU
hash = hashlib.sha256(password.encode()).hexdigest()

# [OK] ХОРОШО: Argon2id
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4
)
hash = ph.hash(password)
```

### Демонстрация на JavaScript (Node.js)

```javascript
const crypto = require('crypto');

// [NO] ПЛОХО: SHA-256
const hash = crypto.createHash('sha256').update(password).digest('hex');

// [OK] ХОРОШО: bcrypt
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);  // cost factor = 12
```

---

## 4. Argon2

> Современный алгоритм хранения паролей. Рекомендуется OWASP.

### Варианты Argon2

| Вариант | Защита от | Когда использовать |
|---------|-----------|-------------------|
| **Argon2d** | GPU/ASIC атаки | Только от side-channel не защищён |
| **Argon2i** | Side-channel | Data-independent memory access |
| **Argon2id** | GPU + Side-channel | [OK] **Лучший выбор по умолчанию** |

**Рекомендация:** Всегда используйте **Argon2id**.

### Основные параметры

| Параметр | Что означает | Пример |
|----------|-------------|--------|
| **Memory Cost** | Сколько памяти использовать | 64 MB, 128 MB, 256 MB |
| **Time Cost** | Сколько проходов выполнять | 3, 5, 10 |
| **Parallelism** | Количество потоков | 1, 4, 8 |

### Почему нельзя поставить Time Cost = 1000?

Потому что:
- пользователи будут ждать логин **десятки секунд**;
- сервер будет **перегружен**;
- злоумышленник сможет организовать **DoS-атаку** через дорогие вычисления.

**Всегда нужен баланс между:**
- безопасностью;
- производительностью;
- UX.

### Рекомендуемые параметры (2024)

| Уровень | Memory Cost | Time Cost | Parallelism |
|---------|-------------|-----------|-------------|
| Минимальный | 19 MB | 2 | 1 |
| Рекомендуемый | 64 MB | 3 | 4 |
| Высокий | 256 MB | 5 | 8 |

### Что такое Memory Hard?

Главная особенность Argon2.

Он требует:
- **много памяти**;
- **много времени**.

Из-за этого GPU теряет своё главное преимущество — **массовый параллелизм**.

Именно поэтому подбор становится **значительно дороже**.

---

## 5. Salt

### Что такое Salt?

**Salt** — случайная строка. Генерируется для каждого пользователя отдельно.

```
Password123 + Random Salt → Argon2 → Hash
```

### Где хранится Salt?

**В базе данных.** Он **не является секретом**.

### Что решает Salt?

**Без Salt:**

```
Password123 → Hash A
```

У двух пользователей получится **одинаковый Hash**.

**С Salt:**

```
Password123 + Salt1 → Hash1
Password123 + Salt2 → Hash2
```

Получаются **разные хеши**.

### От чего защищает Salt?

| Угроза | Как защищает |
|--------|-------------|
| Одинаковые хеши | Разные соли → разные хеши даже для одинаковых паролей |
| Rainbow Tables | Предвычисленные таблицы бесполезны — соль уникальна |
| Массовый подбор | Каждый пароль нужно подбирать отдельно |

### Пример на Java

```java
import java.security.SecureRandom;
import java.util.Base64;

// [OK] Генерация соли
SecureRandom random = new SecureRandom();
byte[] salt = new byte[16];
random.nextBytes(salt);
String saltString = Base64.getEncoder().encodeToString(salt);

// [OK] Хеширование с солью
Argon2 argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);
String hash = argon2.hash(3, 65536, 1, password.toCharArray(), salt);
```

### Пример на Python

```python
import secrets
from argon2 import PasswordHasher

# [OK] Генерация соли (Argon2 делает это автоматически)
ph = PasswordHasher()
hash = ph.hash(password)
# Salt встроен в hash — отдельно хранить не нужно
```

---

## 6. Pepper

### Что такое Pepper?

**Pepper** — дополнительный секрет.

| В отличие от Salt | Salt | Pepper |
|-------------------|------|--------|
| Значение | Для каждого пользователя | **Общий секрет** |
| Хранится | В базе | **Отдельно** (Vault, Secret Manager) |
| Секретность | Не секрет | **Секрет** |

### Где хранить Pepper?

```
Vault
AWS Secrets Manager
Azure Key Vault
HSM (Hardware Security Module)
```

### Как работает Pepper?

```
Password + Salt + Pepper → Argon2 → Hash
```

### Что защищает Pepper?

Если злоумышленник украл:
- [OK] базу;
- [OK] Salt;

ему всё ещё нужен **Pepper**.

То есть необходимо скомпрометировать сразу **два независимых хранилища**.

### Пример на Python

```python
import os
from argon2 import PasswordHasher

# Pepper читается из защищённого хранилища (не из кода!)
pepper = os.environ.get("PASSWORD_PEPPER")

# Pepper добавляется к паролю перед хешированием
ph = PasswordHasher()
hash = ph.hash(pepper + password)  # Pepper + Password + Salt
```

### Salt vs Pepper — сводка

| Характеристика | Salt | Pepper |
|---------------|------|--------|
| Для каждого пользователя | [OK] Да | [NO] Нет (общий) |
| Секрет | [NO] Нет | [OK] Да |
| Хранится | В базе | Vault / Secret Manager |
| Защищает от Rainbow Tables | [OK] | [OK] |
| Требует компрометации 2х хранилищ | [NO] | [OK] |

---

## 7. Secrets Management

> Очень популярная тема на интервью.

### [NO] ПЛОХО

```java
// application.properties
db.password=123456
```

```java
// Hardcoded в коде
String apiKey = "sk-...";
```

```bash
# Git
git add application.properties
git commit -m "add config"
```

###  ПРИЕМЛЕМО

```bash
# Environment Variables
export DB_PASSWORD=...
```

```java
System.getenv("DB_PASSWORD");
```

### [OK] ЛУЧШИЙ ВАРИАНТ

```
Vault
Secrets Manager (AWS)
Key Vault (Azure)
HSM
```

### Environment Variables — ограничения

| Риск | Описание |
|------|----------|
| Логи | Переменная может попасть в логи приложения |
| Heap Dump | Видна в дампах памяти |
| CI/CD | Видна в логах CI |
| /proc | Доступна через процессы ОС |
| Kubernetes | Видна при `kubectl describe pod` |
| Компрометация хоста | Видна при любом доступе к хосту |

**Переменные окружения — это не полноценный Secret Management.**

### Dynamic Secrets

Современный подход. Приложение **не знает** пароль заранее.

```
Application → Vault → Получает пароль → Использует → Через 15 минут пароль автоматически меняется
```

**Преимущества:**
- пароль существует только когда используется;
- автоматическая ротация;
- нет hardcoded credentials;
- компрометация одного сервиса не ведёт к компрометации других.

### Пример интеграции с Vault (Java)

```java
// Spring Cloud Vault
@Configuration
class VaultConfig {
    @Value("${database.password}")
    private String databasePassword;
    
    @Bean
    DataSource dataSource() {
        return DataSourceBuilder.create()
            .password(databasePassword)
            .build();
    }
}
```

### Пример интеграции с AWS Secrets Manager (Python)

```python
import boto3
from botocore.exceptions import ClientError

def get_secret():
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name='us-east-1'
    )
    
    try:
        response = client.get_secret_value(
            SecretId='prod/db/password'
        )
        return response['SecretString']
    except ClientError as e:
        raise e
```

---

## 8. Почему AES нельзя использовать для хранения паролей?

> Очень популярный вопрос на интервью.

### Ответ

Пароль **не нужно получать обратно**. Следовательно — **AES не нужен**.

### Дополнительный аргумент

Если украли:
- **базу**;
- **AES Key**;

можно **расшифровать все пароли**.

При использовании **Argon2** такого не происходит. Argon2 — **однонаправленная функция**.

### Когда AES нужен?

AES нужен когда данные **нужно восстановить**:
- номера банковских карт;
- паспортные данные;
- медицинская информация;
- API Keys (хотя лучше Secret Manager).

### Правильная схема для чувствительных данных

```
Данные → AES-256-GCM → Ciphertext + IV + Tag → Хранилище
```

```python
from cryptography.fernet import Fernet

# [OK] AES-256-GCM через Fernet (рекомендуемый high-level API)
key = Fernet.generate_key()
f = Fernet(key)
ciphertext = f.encrypt(b"Sensitive data")
plaintext = f.decrypt(ciphertext)
```

---

## 9. TLS

### HTTPS ≠ безопасность

HTTPS состоит из двух частей:

1. **Шифрование** — защита от прослушивания.
2. **Проверка личности сервера** — защита от MITM.

### Самая опасная ошибка

```java
// [NO] ОПАСНО: доверяем любому сертификату
TrustManager[] trustAll = new TrustManager[] {
    new X509TrustManager() {
        public void checkClientTrusted(...) {}
        public void checkServerTrusted(...) {}
        public X509Certificate[] getAcceptedIssuers() { return null; }
    }
};

SSLContext sc = SSLContext.getInstance("TLS");
sc.init(null, trustAll, new SecureRandom());
HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
```

```python
# [NO] ОПАСНО: отключаем проверку
import requests
requests.packages.urllib3.disable_warnings()
response = requests.get('https://example.com', verify=False)
```

```javascript
// [NO] ОПАСНО: Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

### Что происходит?

Приложение говорит: **"Я доверяю абсолютно любому сертификату."**

### Последствия — MITM

```
Client                    Attacker                  Server
  │                         │                         │
  │── https://bank.com ────→│                         │
  │                         │── https://bank.com ────→│
  │                         │←── Cert ───────────────│
  │←── Fake Cert ──────────│                         │
  │── POST /transfer ─────→│                         │
  │                         │── POST /transfer ─────→│
  │                         │←── Response ───────────│
  │←── Modified Resp. ────│                         │
```

Злоумышленник может:
- читать трафик;
- менять запросы;
- менять ответы.

Хотя HTTPS **формально** работает.

### Очень популярный вопрос

> Что хуже?
> - **TLS 1.3 + trustAllCertificates()**
> - **TLS 1.2 + нормальная проверка сертификата**

**Ответ:** Второй вариант значительно безопаснее.

**Почему:** trustAllCertificates полностью уничтожает весь смысл TLS. Шифрование без аутентификации — это шифрование для злоумышленника.

---

## 10. Почему нельзя отключать проверку сертификатов?

### Типичное оправдание

> "Это только для DEV."

### Проблема

**Временный код очень часто попадает в Production.**

> Нет ничего более постоянного, чем временное решение.

### Правильный подход

| Практика | Описание |
|----------|----------|
| Отдельные конфигурации | Разные профили для DEV/STAGE/PROD |
| CI проверки | Запретить trustAllCertificates в Production |
| SAST правила | Semgrep/CodeQL правило для запрета |

### Semgrep правило

```yaml
# [NO] Запрет trustAllCertificates
rules:
  - id: trust-all-certificates
    patterns:
      - pattern: verify=False
      - pattern: NODE_TLS_REJECT_UNAUTHORIZED='0'
      - pattern: trustAllCertificates()
    message: "Never disable certificate validation"
    severity: ERROR
```

---

## 11. TLS 1.0 vs TLS 1.2 vs TLS 1.3

### Сравнение

| Версия | Статус | Проблемы |
|--------|--------|----------|
| **TLS 1.0** | [NO] Устарел | Слабые cipher suites, BEAST атака |
| **TLS 1.1** | [NO] Устарел | Слабые cipher suites |
| **TLS 1.2** | [OK] Рекомендуется | Надёжен, широко поддерживается |
| **TLS 1.3** | [OK] Рекомендуется | Быстрее, безопаснее, меньше round trips |

### Почему TLS 1.0 и 1.1 нельзя использовать?

- слабые cipher suites;
- известные атаки (BEAST, POODLE, LUCKY13);
- отсутствие современных механизмов защиты;
- устаревшая криптография.

### Настройка сервера (Nginx)

```nginx
# [NO] ПЛОХО: TLS 1.0 и 1.1 включены
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

# [OK] ХОРОШО: только современные версии
ssl_protocols TLSv1.2 TLSv1.3;

# [OK] Лучшие cipher suites
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers on;
```

### Настройка Java

```java
// [NO] ПЛОХО
System.setProperty("https.protocols", "TLSv1,TLSv1.1,TLSv1.2");

// [OK] ХОРОШО
System.setProperty("https.protocols", "TLSv1.2,TLSv1.3");
```

---

## 12. Perfect Forward Secrecy (PFS)

> Очень любят спрашивать **Senior** кандидатов.

### Без PFS

```
Server Private Key → Все TLS соединения
```

Украли ключ — можно расшифровать **весь ранее записанный трафик**.

### С PFS

Каждая TLS-сессия использует **собственный временный ключ**.

```
Connection A → Session Key A
Connection B → Session Key B
```

После окончания соединения ключ **уничтожается**.

### Что даёт PFS?

Даже если приватный ключ сервера украдут **позже**,
**старые соединения расшифровать нельзя**.

### Как включить PFS?

PFS обеспечивается cipher suites с **ECDHE** (Ephemeral Diffie-Hellman) или **DHE**.

```nginx
# PFS включён (ECDHE)
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
```

```python
# Python requests использует PFS по умолчанию (TLS 1.2+)
response = requests.get('https://example.com')
```

---

## 13. Практические сценарии

### Сценарий 1: Хранение паролей пользователей

```python
# [NO] НЕПРАВИЛЬНО
import hashlib
hash = hashlib.sha256(password.encode()).hexdigest()

# [OK] ПРАВИЛЬНО
from argon2 import PasswordHasher
ph = PasswordHasher(memory_cost=65536, time_cost=3, parallelism=4)
hash = ph.hash(password)
```

### Сценарий 2: Хранение номеров банковских карт

```python
from cryptography.fernet import Fernet

# [OK] ПРАВИЛЬНО: шифрование с AES-256-GCM
key = Fernet.generate_key()  # Хранить в Vault!
f = Fernet(key)
encrypted = f.encrypt(b"4111-1111-1111-1111")

# При отображении — маскировать
print("4111-XXXX-XXXX-1111")
```

### Сценарий 3: API Keys в коде

```python
# [NO] НЕПРАВИЛЬНО
API_KEY = "sk-1234567890abcdef"

# [OK] ПРАВИЛЬНО
import os
import boto3

client = boto3.client('secretsmanager')
API_KEY = client.get_secret_value(SecretId='prod/api-key')
```

### Сценарий 4: Проверка целостности файла

```python
import hashlib

# [OK] ПРАВИЛЬНО: SHA-256 для контроля целостности (не для паролей!)
with open('deploy.tar.gz', 'rb') as f:
    checksum = hashlib.sha256(f.read()).hexdigest()
```

---

## 14. Interview Questions

### Базовые вопросы (Junior/Middle)

| Вопрос | Краткий ответ |
|--------|---------------|
| **Почему SHA-256 нельзя использовать для хранения паролей?** | Слишком быстрый — миллиарды хешей в секунду на GPU |
| **Почему AES нельзя использовать для хранения паролей?** | Пароль не нужно восстанавливать + если украдут ключ — все пароли расшифрованы |
| **Что лучше: Hash или Encryption?** | Зависит от задачи: Hash — данные не нужны обратно, Encryption — нужны |
| **Что такое Salt?** | Случайная строка для каждого пользователя, защищает от Rainbow Tables |
| **Что такое Pepper?** | Общий секрет, хранится отдельно от базы |
| **Где хранить Pepper?** | Vault, Secrets Manager, Key Vault, HSM |

### Продвинутые вопросы (Middle/Senior)

| Вопрос | Краткий ответ |
|--------|---------------|
| **Почему trustAllCertificates опасен?** | MITM — злоумышленник может читать/менять трафик |
| **Что такое MITM?** | Man-in-the-Middle: атакующий перехватывает трафик между клиентом и сервером |
| **Почему TLS 1.0 больше нельзя использовать?** | BEAST, POODLE, слабые cipher suites |
| **Что такое Perfect Forward Secrecy?** | Каждая сессия использует временный ключ — старый трафик защищён даже после компрометации ключа сервера |
| **Почему Argon2 лучше bcrypt?** | Memory Hard — усложняет GPU атаки |
| **Environment Variables vs Vault?** | Env vars — приемлемо но ограничено (логи, heap dump, k8s describe). Vault — полноценное решение с Dynamic Secrets |

### Практические вопросы

| Вопрос | Ответ |
|--------|-------|
| **Как хранить пароль?** | Argon2id + Salt (+ Pepper) |
| **Как хранить банковскую карту?** | AES-256-GCM (ключ в Vault) |
| **Как хранить API Key?** | Secret Manager / Vault (или Dynamic Secrets) |
| **Как проверить целостность файла?** | SHA-256 (для целостности, не для паролей!) |
| **Нужно восстановить данные?** | Encryption (AES) |

---

## 15. Шпаргалка

### Выбор криптографического примитива

```
┌─────────────────────────────────────────────────────────┐
│                 Какой алгоритм выбрать?                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Данные нужно восстановить?                              │
│  ├── НЕТ ──────────────────────→ Хеширование             │
│  │   ├── Пароль/PIN ───────────→ Argon2id (+ Salt)       │
│  │   ├── Контроль целостности ─→ SHA-256                 │
│  │   └── HMAC ─────────────────→ HMAC-SHA256             │
│  │                                                       │
│  └── ДА ───────────────────────→ Шифрование              │
│      ├── Симметричное ─────────→ AES-256-GCM             │
│      ├── Асимметричное ────────→ RSA-3072/ECC P-256      │
│      └── Ключи обмена ─────────→ ECDHE (PFS)             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Quick Reference

| Задача | Алгоритм | Примечание |
|--------|----------|------------|
| Хранение пароля | **Argon2id** | Salt + Pepper опционально |
| Хранение карты/PII | **AES-256-GCM** | Ключ в Vault |
| API Key | **Vault** | Dynamic Secrets |
| Целостность файла | **SHA-256** | Не для паролей! |
| TLS | **TLS 1.2 / 1.3** | С ECDHE (PFS) |
| Цифровая подпись | **ECDSA / EdDSA** | |
| HMAC | **HMAC-SHA256** | |

### Что нужно запомнить

1. **Пароли никогда не шифруются** — они хешируются.
2. **Argon2id** — современный стандарт хранения паролей.
3. **Salt** уникален для каждого пользователя и **не является секретом**.
4. **Pepper** — секрет, который хранится отдельно от базы данных.
5. **Переменные окружения** — приемлемое решение, но не замена Secret Manager.
6. **Vault** и аналогичные решения — лучший способ управления секретами.
7. **HTTPS бесполезен**, если отключена проверка сертификатов.
8. **TLS 1.2/1.3** — современный стандарт, TLS 1.0/1.1 использовать нельзя.
9. **Perfect Forward Secrecy** защищает ранее записанный трафик даже после компрометации ключа сервера.
10. **Всегда сначала задавай себе вопрос:** *"Нужно ли мне когда-нибудь получить исходное значение обратно?"* Именно этот вопрос определяет выбор между хешированием и шифрованием.

---

##  Связанные темы

- [Интерпретаторы](../fundamentals/interpreters.md) — пароли как inputs для password hashing interpreter
- [Secrets Management](../authorization/broken-access-control.md) — пересечение с управлением доступом к секретам
- [Security Misconfiguration](../web-security/security-misconfiguration.md) — TLS misconfiguration как частный случай

---

> **Оценка:** По теме Cryptographic Failures уверенный Middle AppSec Engineer. Сформирован правильный подход: начинать с анализа задачи, угроз и требований, а затем подбирать подходящий криптографический механизм.
