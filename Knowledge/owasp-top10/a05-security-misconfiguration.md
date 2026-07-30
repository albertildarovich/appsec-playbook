# A05 — Security Misconfiguration

> **Суть:** Небезопасная конфигурация, а не код. Система сама помогает злоумышленнику, раскрывая информацию.
>
> **Главный вопрос:** «Почему это вообще доступно?»

---

## Быстрый чек-лист

- [ ] DEBUG = OFF в production?
- [ ] Swagger / OpenAPI отключён в production?
- [ ] Stack trace не показывается пользователю?
- [ ] Server Header не раскрывает версию?
- [ ] `.git` и `.env` не доступны через HTTP?
- [ ] Стандартные пароли заменены?
- [ ] Ненужные сервисы (Actuator, Tomcat Manager, phpMyAdmin) не доступны извне?

---

## Типичные примеры

| Проблема | Чем опасно | Защита |
|----------|-----------|--------|
| **DEBUG Mode** | Подробные ошибки, логи, тестовые endpoint'ы | `DEBUG = OFF` |
| **Открытый Swagger** | Раскрытие внутренних API | Отключить в production |
| **Stack Trace** | Архитектура, версии библиотек, имена классов | `500 Internal Server Error` |
| **Server Header** | Версия Tomcat/Apache → CVE поиск | Убрать или минимизировать |
| **Доступный `.git`** | Исходный код, история, секреты в коммитах | Не размещать в веб-директории |
| **Доступный `.env`** | Пароли, ключи, токены | Никогда не доступен через HTTP |
| **Стандартные пароли** | admin/admin, root/root | Сменить при деплое |

---

##  Полная версия

 [`04-web-security/security-misconfiguration.md`](../web-security/security-misconfiguration.md) — Secure by Default, Reduce Attack Surface, что искать на Code Review
