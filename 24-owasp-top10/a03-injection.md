# A03 — Injection

> **Суть:** Недоверенные данные передаются интерпретатору как часть команды/запроса.
>
> **Объединяющая концепция:** Все injection-уязвимости следуют одному паттерну — данные смешиваются с кодом. Подробнее: [`Интерпретаторы`](../01-fundamentals/interpreters.md)

---

## Виды Injection

| Тип | Интерпретатор | Пример | Защита |
|-----|--------------|--------|--------|
| **SQL Injection** | SQL | `' OR 1=1 --` | Prepared Statements |
| **Command Injection** | Shell / OS | `; rm -rf /` | Не вызывать shell, ProcessBuilder с раздельными аргументами |
| **XXE (XML Injection)** | XML Parser | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` | Отключить DOCTYPE и External Entities |
| **LDAP Injection** | LDAP | `admin*` | Экранирование спецсимволов |
| **NoSQL Injection** | MongoDB | `$gt`, `$ne` | Валидация типов, ORM |

---

## Быстрый чек-лист

- [ ] Все SQL-запросы через Prepared Statements / ORM с параметризацией?
- [ ] Нет конкатенации строк в запросах?
- [ ] Команды ОС не вызывают shell (ProcessBuilder, subprocess.run([...]))?
- [ ] XML-парсеры с отключёнными DOCTYPE и External Entities?
- [ ] Пользовательский ввод никогда не выполняется как код (eval, Runtime.exec)?

---

## 🔗 Полные версии

| Тема | Конспект |
|------|----------|
| SQL Injection | [`04-web-security/sqli.md`](../04-web-security/sqli.md) |
| Command Injection | [`04-web-security/command-injection.md`](../04-web-security/command-injection.md) |
| XXE | [`04-web-security/xxe.md`](../04-web-security/xxe.md) |
| Интерпретаторы (объединяющая концепция) | [`01-fundamentals/interpreters.md`](../01-fundamentals/interpreters.md) |
