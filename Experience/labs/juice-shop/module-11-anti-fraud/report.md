# Модуль 11: Anti-Fraud

> **Цель:** Подумать как защитник, а не как атакующий
> **Формат:** анализируем фрод-сценарии и предлагаем контрмеры

---

## План

- [ ] Какие фрод-сценарии возможны в Juice Shop?
- [ ] Какие проверки нужно добавить?
- [ ] Написать рекомендации по anti-fraud

---

## Что уже есть (найденные уязвимости)

Из предыдущих модулей мы нашли сценарии, которые можно использовать для фрода:

| Сценарий | Описание | Риск |
|----------|----------|------|
| Mass Assignment | Создание админа через регистрацию | Critical |
| Нет rate limiting | Brute-force паролей | Critical |
| Нет верификации email | Регистрация на чужие email | High |
| Нет капчи | Массовое создание ботов | Critical |
| JWT без Exp | Token живёт вечно | Critical |
| JWT не инвалидируется | Logout не завершает сессию | Critical |
| IDOR | Доступ к чужим корзинам | Critical |
| BFLA | Удаление фидбеков без прав | High |

---

## Рекомендации по Anti-Fraud

| Сценарий | Контрмеры |
|----------|-----------|
| Mass Assignment | DTO/allowlist полей, не сохранять `role`, `deluxeToken` из запроса |
| Rate limiting | express-rate-limit, блокировка IP после N попыток, Cloudflare/WAF |
| Верификация email | Подтверждение email через ссылку/code перед активацией |
| Капча | reCAPTCHA/hCaptcha на регистрацию и login |
| JWT без Exp | Добавить `exp` claim (15-60 min), использовать Refresh tokens |
| JWT инвалидация | Server-side blacklist токенов при logout |
| IDOR | Проверять `UserId` === `basket.UserId` при каждом запросе |
| BFLA | Middleware: проверять `role` на DELETE/PUT операциях |

> **Вывод:** Juice Shop — intentionally vulnerable application. В реальном проекте эти контрмеры — base security requirements.
