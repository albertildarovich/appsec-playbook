# Web Security

> Уязвимости веб-приложений из OWASP Top 10 и не только.

---

## Содержание раздела

| Файл | Описание | Статус |
|------|----------|--------|
| `sqli.md` | SQL Injection — теория, виды, эксплуатация, защита | ✅ 100% |
| `xss.md` | Cross-Site Scripting — Reflected, Stored, DOM-based | ✅ 100% |
| `csrf.md` | CSRF — механизм атаки, CORS vs SOP vs CSRF, хранение токенов | ✅ 100% |
| `ssrf.md` | SSRF — сервер как браузер, внутренняя сеть, metadata, защита | ✅ 100% |
| `xxe.md` | XXE — External Entities, чтение файлов, SSRF через XML, DoS, защита | ✅ 100% |
| `command-injection.md` | Command Injection — shell, Runtime.exec, ProcessBuilder, безопасные паттерны | ✅ 100% |
| `insecure-deserialization.md` | Insecure Deserialization — языковое покрытие, gadget chains, защита | ✅ 100% |
| `security-misconfiguration.md` | Security Misconfiguration — debug, .git, .env, Secure by Default | ✅ 100% |
---

## SQL Injection

✅ [Читать конспект →](sqli.md)

---

## XSS (Cross-Site Scripting)

✅ [Читать конспект →](xss.md)

---

## CSRF (Cross-Site Request Forgery)

Ключевые тезисы:

- **CSRF** — браузер жертвы отправляет доверенный запрос, сервер доверяет Cookie
- **CORS защищает чтение, не отправку** — CSRF работает без чтения ответа
- **JWT в localStorage** устраняет классический CSRF (HTML-форма не добавит `Authorization`)
- Современный подход: **Access Token в Memory + Refresh Token в HttpOnly Cookie**

👉 [Читать конспект →](csrf.md)

---

## SSRF (Server-Side Request Forgery)

Ключевые тезисы:

- **SSRF** — злоумышленник заставляет сервер выполнять HTTP-запросы к произвольным адресам
- **Главная опасность** — доступ к внутренней сети, `localhost`, облачным metadata (`169.254.169.254`)
- **Первый вопрос AppSec**: зачем пользователю указывать произвольный URL?
- **Allowlist > Blacklist**, проверка после DNS Resolve + каждого редиректа

👉 [Читать конспект →](ssrf.md)

---

## XXE (XML External Entity)

Ключевые тезисы:

- **XXE** — XML-парсер обрабатывает внешние сущности, что ведёт к чтению файлов, SSRF или DoS
- **Лучшая защита** — отключить DOCTYPE, External Entities и DTD
- **Defense in Depth**: безопасный парсер + минимальные привилегии + сегментация сети
- XXE — классический пример, почему сервис должен иметь доступ только к необходимым ресурсам

👉 [Читать конспект →](xxe.md)

---

## Command Injection

Ключевые тезисы:

- **Command Injection** — пользовательский ввод управляет командами ОС
- **Лучшая защита** — не вызывать shell (использовать библиотеки)
- **ProcessBuilder** / `subprocess.run([...])` / `spawn(...)` с раздельными аргументами
- **ProcessBuilder не защищает от SSRF** — проверяй аргументы

👉 [Читать конспект →](command-injection.md)

---

## Insecure Deserialization

Ключевые тезисы:

- **Insecure Deserialization** — злоумышленник управляет процессом создания объектов
- **Это не только Java.** Python (`pickle`), PHP (`unserialize`), .NET (`BinaryFormatter`), Ruby (`Marshal.load`) — все могут быть уязвимы
- **Gadget Chain** — используются существующие классы, не свои
- **JSON безопаснее** — тип известен, строки не выполняются как код
- **JSON опасен** — если включена полиморфная десериализация (`@class`, `enableDefaultTyping`)
- **Ключевое правило:** уязвимость возникает в любой технологии, где недоверенные данные управляют процессом восстановления объектов

👉 [Читать конспект →](insecure-deserialization.md)

---

## Security Misconfiguration

Ключевые тезисы:

- **Security Misconfiguration** — небезопасные настройки, а не код
- **Главный вопрос AppSec:** «Почему это вообще доступно?»
- **Примеры:** DEBUG Mode, открытый Swagger, доступный `.git`, доступный `.env`, stack trace пользователю, Server Header, стандартные пароли
- **Secure by Default** — система должна быть безопасной «из коробки»
- **Reduce Attack Surface** — не публикуй то, что не нужно

👉 [Читать конспект →](security-misconfiguration.md)

---

## План

- [x] SQL Injection
- [x] XSS
- [x] CSRF
- [x] SSRF
- [x] XXE
- [x] Command Injection
- [x] Insecure Deserialization
- [x] Security Misconfiguration
- [ ] Vulnerable Components

