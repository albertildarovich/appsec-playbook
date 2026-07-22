# Security Misconfiguration Cheatsheet

> Быстрая справка по Security Misconfiguration: что проверять, чего искать, как защищаться.

---

## Что проверять при Security Review

```bash
# 1. Открытые endpoint'ы и сервисы
curl -v https://target.com/swagger
curl -v https://target.com/swagger-ui.html
curl -v https://target.com/v3/api-docs
curl -v https://target.com/.git/config
curl -v https://target.com/.env
curl -v https://target.com/actuator
curl -v https://target.com/actuator/health
curl -v https://target.com/health
curl -v https://target.com/admin
curl -v https://target.com/debug
curl -v https://target.com/console        # H2 Console

# 2. Заголовки ответа
curl -sI https://target.com | grep -i "server\|x-powered-by\|x-aspnet-version"

# 3. DEBUG / Stack trace (вызвать ошибку)
curl -v https://target.com/api/nonexistent
```

---

## Чего искать на Code Review

```bash
# Debug и stack trace
grep -rn "DEBUG\|printStackTrace\|System.out\|console.log.*error" src/ --include="*.java" --include="*.py" --include="*.js"
grep -rn "traceback.print_exc\|traceback.format_exc" src/ --include="*.py"

# Тестовые/диагностические endpoint'ы
grep -rn "@GetMapping.*test\|@PostMapping.*test\|@RequestMapping.*test\|@RequestMapping.*debug" src/ --include="*.java"
grep -rn "route.*test\|route.*health\|route.*debug" src/ --include="*.py" --include="*.js"

# Конфигурация
grep -rn "spring.profiles.active\|NODE_ENV\|APP_ENV\|FLASK_ENV" src/ --include="*.properties" --include="*.yaml" --include="*.yml"
grep -rn "spring.jpa.show-sql\|hibernate.show_sql" src/ --include="*.properties" --include="*.yaml"

# Логирование секретов
grep -rn "log.*password\|log.*secret\|log.*token\|log.*credential\|log.*key" src/ --include="*.java" --include="*.py"

# CORS (слишком широкая конфигурация)
grep -rn "Access-Control-Allow-Origin: \*\|allowedOrigins.*\\*\|setAllowCredentials(true)" src/ --include="*.java" --include="*.py" --include="*.js"
```

---

## Ключевые endpoint'ы для проверки

| Endpoint | Что проверяем |
|----------|--------------|
| `/swagger`, `/swagger-ui.html`, `/v3/api-docs` | Swagger в production |
| `/.git/config` | Доступность `.git` |
| `/.env` | Доступность `.env` |
| `/actuator`, `/actuator/health` | Spring Actuator |
| `/health`, `/info`, `/metrics` | Diagnostic endpoints |
| `/console` | H2 Console |
| `/admin`, `/manager` | Admin panels |
| `/debug` | Debug mode |
| `/phpmyadmin` | PHPMyAdmin |
| `/server-status` | Apache status |
| `/robots.txt` | Скрытые пути |

---

## Что должно быть в production

| Параметр | Значение |
|---------|----------|
| `DEBUG` | `OFF` / `false` |
| `show_sql` | `false` |
| Stack trace | Только в логи, не пользователю |
| `Server` header | Минимизирован или удалён |
| Swagger | Отключён |
| `.git` | Недоступен через HTTP |
| `.env` | Недоступен через HTTP |
| CORS | Только нужные origin'ы |
| Default credentials | Изменены или удалены |

---

## Как защищаться

### Web Server (Nginx)

```nginx
# Скрыть версию
server_tokens off;

# Запретить доступ к .git, .env
location ~ /\.(git|env) {
    deny all;
}

# Ограничить доступ к чувствительным путям
location ~ /(swagger|actuator|admin|console) {
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    deny all;
}
```

### Web Server (Apache)

```apache
# Скрыть версию
ServerSignature Off
ServerTokens Prod

# Запретить доступ к .git, .env
<FilesMatch "^\.(git|env)">
    Require all denied
</FilesMatch>
```

### Spring Boot

```yaml
# application-production.yaml
spring:
  jpa:
    show-sql: false
  devtools:
    add-properties: false

server:
  error:
    include-stacktrace: never
    include-message: never

management:
  endpoints:
    enabled-by-default: false
  endpoint:
    health:
      enabled: false
```

### Django / Flask

```python
# settings.py
DEBUG = False

# Не показывать подробные ошибки
ALLOWED_HOSTS = ['example.com']

# Убрать Server header
SECURE_SERVER_HEADER = False
```

### Express.js (Node.js)

```javascript
const app = express();

// Убрать X-Powered-By
app.disable('x-powered-by');

// Скрыть stack trace
app.set('env', 'production');
```

---

## Типичные ошибки

| Ошибка | Почему плохо |
|--------|-------------|
| DEBUG = True в production | Подробные ошибки, диагностические endpoint'ы |
| Stack trace пользователю | Раскрывает архитектуру, технологии, версии |
| `Server: Apache Tomcat 9.0.17` | Позволяет искать CVE под конкретную версию |
| Swagger в production | Раскрывает API, параметры, схемы |
| `.git` доступен через HTTP | Исходный код, история, секреты |
| `.env` доступен через HTTP | Все секреты приложения |
| Standard credentials | admin/admin, root/root |
| CORS: `Access-Control-Allow-Origin: *` | Любой сайт может читать ответы |
| Открытый Actuator | Метрики, health, env, beans |

---

## Связанные CWE

| CWE | Описание |
|-----|----------|
| **CWE-209** | Generation of Error Message Containing Sensitive Information |
| **CWE-200** | Exposure of Sensitive Information to an Unauthorized Actor |
| **CWE-16** | Configuration |
| **CWE-548** | Exposure of Information Through Directory Listing |
| **CWE-598** | Information Exposure Through Query Strings in GET Request |
| **CWE-538** | File and Directory Information Exposure |
| **CWE-942** | Permissive Cross-domain Policy with Untrusted Domains |
