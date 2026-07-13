# AppSec Interview Questions

## Общие вопросы

---

### 🎯 Почему PreparedStatement безопаснее конкатенации строк?

**💡 Концепция:** SQL-запрос компилируется отдельно от данных.

**📝 Ответ:**
PreparedStatement делит SQL-код и пользовательские данные на уровне протокола СУБД:

1. Сначала СУБД получает шаблон: `SELECT * FROM users WHERE id = ?`
2. Парсит и компилирует его
3. Только потом получает данные (id)

Пользовательские данные никогда не интерпретируются как SQL-команды — они всегда остаются значениями.

**🔗 Связи:** SQLi, Taint Analysis, ORM

---

### 🎯 Чем отличается Reflected XSS от Stored XSS?

**💡 Концепция:** Способ доставки payload.

**📝 Ответ:**
- **Reflected**: payload в HTTP-запросе, сразу отражается в ответе. Требует social engineering (жертва должна перейти по ссылке).
- **Stored**: payload сохраняется на сервере (БД), выполняется при открытии страницы любым пользователем. Не требует social engineering.

Stored XSS опаснее: поражает всех, может накапливаться.

**🔗 Связи:** XSS, DOM XSS, CSP

---

### 🎯 Как объяснить DOM XSS?

**💡 Концепция:** Уязвимость на клиенте, сервер не участвует.

**📝 Ответ:**
DOM XSS возникает, когда JavaScript-код на странице берёт данные из источника (source) — например, location.hash — и передаёт их в опасную функцию (sink) — например, innerHTML — без проверки.

Сервер не участвует: уязвимость живёт полностью во frontend-коде. SAST может найти её (Taint Analysis), DAST — через headless browser.

**Типичный поток:**
```
Source (location.search) → DOM (name) → Sink (innerHTML)
```

**🔗 Связи:** XSS, Source/Sink, SAST

---

### 🎯 В чём разница между SAST и DAST?

**💡 Концепция:** White-box vs Black-box.

**📝 Ответ:**

| Критерий | SAST | DAST |
|----------|------|------|
| Доступ к коду | ✅ Да | ❌ Нет |
| Когда запускать | Раньше (commit) | Позже (staging) |
| False Positives | Больше | Меньше |
| Coverage | Весь код | Только running endpoints |
| Тип анализа | Taint Analysis | Behavioural |

**Лучшая практика:** SAST в CI/CD (быстро), DAST на staging (глубоко).

**🔗 Связи:** DevSecOps, CI/CD

---

### 🎯 Что такое Defense in Depth?

**💡 Концепция:** Не полагаться на один слой защиты.

**📝 Ответ:**
Defense in Depth — это стратегия, при которой для защиты используются несколько независимых слоёв. Если один слой обойдён, следующий должен остановить атаку.

**Пример для XSS:**
```
Layer 1: Output Encoding
Layer 2: CSP
Layer 3: HttpOnly cookies
Layer 4: Input validation
Layer 5: WAF
```

**🔗 Связи:** Security Principles

---

### 🎯 Что такое Security Champion?

**💡 Концепция:** Разработчик, который помогает с безопасностью в команде.

**📝 Ответ:**
Security Champion — это разработчик в product команде, который:
- Является локальным экспертом по безопасности
- Помогает triage SAST findings
- Проводит lightweight Threat Modeling
- Является мостом между командой и AppSec

Не заменяет AppSec, а масштабирует его.

**🔗 Связи:** Secure SDLC, Governance

---

### 🎯 Почему CSP не является заменой Output Encoding?

**💡 Концепция:** CSP снижает последствия, а не устраняет причину.

**📝 Ответ:**
1. CSP не поддерживается во всех браузерах
2. CSP может быть обойдён, если на сайте есть JSONP или загружаются сторонние скрипты
3. CSP не защищает от data exfiltration через существующие скрипты
4. CSP — defense in depth, а не primary control

Output Encoding устраняет причину XSS. CSP снижает последствия, если encoding пропущен.

**🔗 Связи:** XSS, CSP

---

### 🎯 Как работает Taint Analysis?

**💡 Концепция:** Отслеживание потока недоверенных данных.

**📝 Ответ:**
Taint Analysis отслеживает путь пользовательских данных от источника (source) до опасной функции (sink).

```
Source (GET параметр)
    ↓
Propagation (присваивание, конкатенация)
    ↓
Sink (executeQuery, innerHTML, eval)
```

Если на пути нет Sanitizer (экранирования, параметризации) — инструмент сообщает об уязвимости.

**🔗 Связи:** SAST, Semgrep

---

### 🎯 Что такое SBOM?

**💡 Концепция:** Inventory всех компонентов ПО.

**📝 Ответ:**
SBOM (Software Bill of Materials) — это список всех компонентов, библиотек и зависимостей, из которых состоит приложение. Аналогично списку ингредиентов на упаковке продукта.

**Зачем:**
- Быстрое реагирование на CVE (знаем, какие библиотеки используем)
- Compliance (EO 14028, PCI DSS)
- Supply chain transparency

**Форматы:** SPDX, CycloneDX

**🔗 Связи:** SCA, NIST SSDF

---

### 🎯 Как приоритизировать уязвимости?

**💡 Концепция:** Risk-based approach.

**📝 Ответ:**
Не все уязвимости одинаково опасны. Приоритизирую по:

1. **Exploitability**: есть ли PoC/exploit? CVSS?
2. **Business impact**: какие данные под угрозой? PII? Payment?
3. **Exposure**: доступно ли из интернета?
4. **Compensating controls**: есть ли WAF? CSP? Network segmentation?

**Формула:** Risk = Likelihood × Impact

CVSS Base Score — только стартовая точка. Реальная приоритизация всегда с учётом контекста.

**🔗 Связи:** Vulnerability Management
