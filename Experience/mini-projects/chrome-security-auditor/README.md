# 🛡 Security Auditor — Chrome Extension

> Расширение для Chrome для аудита безопасности веб-страниц.

##  Возможности

### Этап 1: Чек-лист уязвимостей
- **23+ проверки** на основе OWASP Top 10 и лучших практик
- **Автоматические проверки** HTTP-заголовков, кук, CSP, HSTS и др.
- **Ручные проверки** для тех аспектов, что требуют экспертной оценки
- **Категоризация** по типу уязвимости и уровню критичности

### Этап 2: Сканер страницы (в разработке)
- Анализ HTML-структуры и форм
- Поиск смешанного контента (HTTP на HTTPS)
- Обнаружение небезопасных кук
- Проверка iframe и LocalStorage

## 📦 Структура

```
chrome-security-auditor/
├── manifest.json          # Манифест расширения
├── background.js          # Фоновый скрипт (webRequest, кэш)
├── content-script.js      # Скрипт для анализа страницы
├── popup/
│   ├── popup.html         # Интерфейс попапа
│   ├── popup.css          # Стили (dark theme)
│   └── popup.js           # Логика чек-листа и сканера
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

##  Установка (Developer Mode)

1. Откройте Chrome и перейдите на `chrome://extensions/`
2. Включите **Developer mode** (правый верхний угол)
3. Нажмите **Load unpacked**
4. Выберите папку `17-mini-projects/chrome-security-auditor`
5. Готово! Иконка появится в панели расширений

## 🧪 Использование

### Чек-лист
1. Откройте любую страницу
2. Нажмите на иконку расширения
3. Вкладка ** Чек-лист** — список проверок
4. Отмечайте выполненные проверки вручную
5. Нажмите **▶ Запустить все проверки** для автоматических

### Сканер
1. Перейдите на вкладку **🔍 Сканер**
2. Нажмите **Сканировать страницу**
3. Расширение проанализирует заголовки, куки и HTML

### Отчёт
1. Вкладка ** Отчёт** — сводка результатов
2. Экспорт в **JSON** или **HTML**

##  Чек-лист (23 проверки)

### Transport Security
- [OK] HTTPS
- [OK] HSTS
- [OK] X-Frame-Options / CSP frame-ancestors
- [OK] X-Content-Type-Options

### Content Security
- [OK] Content-Security-Policy
- [OK] X-XSS-Protection
- [OK] Referrer-Policy

### Cookie Security
- [OK] Secure flag
- [OK] HttpOnly flag
- [OK] SameSite attribute

### Information Disclosure
- [OK] Server header
- [OK] X-Powered-By
- [OK] Directory Listing

### Cross-Origin
- [OK] CORS policy
- [OK] Permissions-Policy

### XSS & Injection
- [OK] Inline scripts (nonce)
- [OK] XSS test
- [OK] SQL injection test

### Forms & Input
- [OK] Autocomplete off
- [OK] Password fields
- [OK] Server validation

### Supply Chain
- [OK] Subresource Integrity (SRI)

### Infrastructure
- [OK] Open ports check

## 🗺 План развития

- [x] **Этап 1:** Чек-лист + базовые авто-проверки
- [ ] **Этап 2:** Углублённый анализ DOM, подсветка элементов
- [ ] **Этап 3:** Пассивный анализ трафика, сканирование API-эндпоинтов
- [ ] **Этап 4:** Интеграция с OWASP ZAP API, более сложные проверки
- [ ] **Этап 5:** Экспорт в PDF, история проверок, сравнение

## 🛡 Для чего это?

Расширение помогает:
- **Разработчикам** — быстро проверить базовые настройки безопасности
- **Security-инженерам** — иметь под рукой чек-лист для первичного аудита
- **QA-инженерам** — добавлять security-тесты в регрессионное тестирование
- **CTF-игрокам** — не пропустить базовые уязвимости

##  Лицензия

Проект является частью учебного курса по Security. Используйте для обучения и тестирования.

---

**[WARN] Предупреждение:** Используйте расширение только на тех сайтах, которые вы имеете право тестировать. Автор не несёт ответственности за неправомерное использование.
