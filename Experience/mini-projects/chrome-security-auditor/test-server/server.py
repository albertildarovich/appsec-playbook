#!/usr/bin/env python3
"""
Security Auditor - Test Server
Уязвимый тестовый сервер для проверки расширения.
Запуск: python3 server.py
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import json
import urllib.parse


class TestHandler(BaseHTTPRequestHandler):
    """Сервер с различными уязвимостями для тестирования"""
    
    def do_GET(self):
        path = self.path.split('?')[0]
        
        if path == '/':
            return self.serve_index()
        elif path == '/login':
            return self.serve_login()
        elif path == '/admin':
            return self.serve_admin()
        elif path == '/search':
            return self.handle_search()
        elif path == '/api/users':
            return self.serve_api_users()
        elif path == '/api/config':
            return self.serve_api_config()
        elif path == '/headers':
            return self.show_headers()
        elif path == '/redirect':
            return self.do_redirect()
        elif path == '/static/app.js':
            return self.serve_script()
        else:
            return self.send_404()
    
    def do_POST(self):
        path = self.path.split('?')[0]
        
        if path == '/login':
            return self.handle_login()
        elif path == '/api/submit':
            return self.handle_api_submit()
        else:
            return self.send_404()

    def send_vulnerable_headers(self):
        """Устанавливаем намеренно уязвимые заголовки"""
        # ❌ Нет HSTS (должен быть Strict-Transport-Security)
        # ❌ ALLOWALL вместо DENY для X-Frame-Options
        self.send_header('X-Frame-Options', 'ALLOWALL')
        # ❌ Раскрываем версию сервера
        self.send_header('Server', 'Apache/2.4.49 (Ubuntu) PHP/7.4.33')
        # ❌ X-Powered-By раскрывает технологию
        self.send_header('X-Powered-By', 'Express/4.18.2')
        # ❌ X-Content-Type-Options отсутствует (должен быть nosniff)
        # ❌ Устаревший X-XSS-Protection
        self.send_header('X-XSS-Protection', '1; mode=block')
        # ❌ Referrer-Policy отсутствует
        # ❌ CORS слишком открыт
        self.send_header('Access-Control-Allow-Origin', '*')
        # ❌ Нет CSP
        # ❌ Permissions-Policy отсутствует

    def send_vulnerable_cookies(self):
        """Устанавливаем намеренно уязвимые куки"""
        # ❌ Кука без Secure и HttpOnly
        self.send_header('Set-Cookie',
            'session_id=abc123def456; Path=/; Max-Age=3600')
        # ❌ Токен без Secure и HttpOnly
        self.send_header('Set-Cookie',
            'token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9; Path=/')
        
    def serve_index(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_vulnerable_headers()
        self.send_vulnerable_cookies()
        self.end_headers()

        html = """<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>TestBank - Уязвимый банк (для тестов)</title>
</head>
<body>
    <h1>🏦 TestBank Online</h1>
    <p>Добро пожаловать! Это уязвимый тестовый сайт.</p>
    <script>
        // ❌ Инлайн-скрипт без nonce
        console.log("TestBank loaded");

        // ❌ Чувствительные данные в localStorage
        localStorage.setItem('session_token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9');
        localStorage.setItem('api_key', 'sk-live-test123456789');
    </script>
    
    <h2>Вход в систему</h2>
    <form action="/login" method="POST">
        <div>
            <label>Логин:
                <input type="text" name="username" autocomplete="off">
            </label>
        </div>
        <div>
            <label>Пароль:
                <input type="text" name="password" autocomplete="on">
                <!-- ❌ password без type="password" -->
            </label>
        </div>
        <button type="submit">Войти</button>
    </form>
    
    <h2>Поиск по сайту</h2>
    <form action="/search" method="GET">
        <input type="text" name="q" placeholder="Поиск...">
        <button type="submit">Найти</button>
    </form>
    
    <h2>Услуги</h2>
    <ul>
        <li><a href="//evil.com/redirect">Перевод средств</a></li>
        <!-- ❌ Протокол-относительная ссылка -->
        <li><a href="/redirect">Партнёрская программа</a></li>
    </ul>
    
    <h2>Важные документы</h2>
    <iframe src="/admin" width="400" height="200"></iframe>
    <!-- ❌ iframe без sandbox -->

    <script src="http://cdn.evil.com/tracker.js"></script>
    <!-- ❌ HTTP скрипт на HTTP странице -->

    <link rel="stylesheet" href="http://cdn.evil.com/style.css">
    <!-- ❌ HTTP CSS -->

    <img src="http://cdn.evil.com/pixel.gif" width="1" height="1">
    <!-- ❌ HTTP изображение -->

    <script src="/static/app.js"></script>
</body>
</html>"""
        self.wfile.write(html.encode('utf-8'))

    def serve_login(self):
        error = ''
        if '?error=' in self.path:
            error = self.path.split('?error=')[1]
            error = urllib.parse.unquote(error)

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_vulnerable_headers()
        self.send_header('Set-Cookie',
            'session_id=new_session_xyz789; Path=/; Max-Age=86400')
        self.end_headers()

        # ❌ Рефлектед XSS в параметре error
        html = f"""<!DOCTYPE html>
<html>
<head><title>Вход</title></head>
<body>
    <h1>Вход в систему</h1>
    <div class="error">{error}</div>
    <form action="/login" method="POST">
        <input type="text" name="username">
        <input type="password" name="password">
        <button type="submit">Войти</button>
    </form>
</body>
</html>"""
        self.wfile.write(html.encode('utf-8'))

    def serve_admin(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()

        html = """<!DOCTYPE html>
<html>
<head><title>Admin Panel</title></head>
<body>
    <h1>🔐 Панель администратора</h1>
    <p>Секретный ключ: sk-XXXXX-XXXXX-XXXXX</p>
    
    <h2>Пользователи</h2>
    <table border="1">
        <tr><th>ID</th><th>Email</th><th>Роль</th></tr>
        <tr><td>1</td><td>admin@testbank.com</td><td>admin</td></tr>
        <tr><td>2</td><td>user@testbank.com</td><td>user</td></tr>
    </table>
    
    <h2>API Endpoints</h2>
    <div class="api-info">
        GET /api/users - список пользователей<br>
        GET /api/config - конфигурация<br>
        POST /api/submit - отправка данных
    </div>
</body>
</html>"""
        self.wfile.write(html.encode('utf-8'))

    def handle_search(self):
        """Симуляция поиска с SQL-инъекцией"""
        query = ''
        if '?q=' in self.path:
            query = self.path.split('?q=')[1]
            query = urllib.parse.unquote(query)

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        
        if "'" in query or '"' in query:
            # ❌ SQL error disclosure
            html = f"""<!DOCTYPE html>
<html>
<head><title>Поиск - Ошибка</title></head>
<body>
    <h1>Ошибка SQL</h1>
    <pre>Database error: syntax error at or near "{query[:50]}" LINE 1: SELECT * FROM users WHERE name LIKE '%{query}%'</pre>
</body>
</html>"""
        else:
            html = f"""<!DOCTYPE html>
<html>
<head><title>Поиск: {query}</title></head>
<body>
    <h1>Результаты поиска: {query}</h1>
    <p>Ничего не найдено.</p>
</body>
</html>"""
        
        self.wfile.write(html.encode('utf-8'))
    
    def serve_api_users(self):
        """API endpoint без авторизации"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.end_headers()
        
        data = {
            "users": [
                {"id": 1, "email": "admin@testbank.com", "role": "admin",
                 "password_hash": "5e884898da28047151d0e56f8dc62927"},
                {"id": 2, "email": "user@testbank.com", "role": "user",
                 "password_hash": "e3b0c44298fc1c149afbf4c8996fb92"}
            ]
        }
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))
    
    def serve_api_config(self):
        """API с конфигурацией (секреты наружу)"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        config = {
            "database": {
                "host": "localhost",
                "port": 5432,
                "name": "testbank_prod",
                "user": "postgres",
                "password": "postgres_placeholder"
            },
            "api_keys": {
                "stripe": "stripe_test_key_placeholder",
                "aws": "AKIAXXXXXXXXXXXXXXXX",
                "sendgrid": "SG.XXXXXXXXXXXXXXXX"
            },
            "debug": True,
            "admin_email": "admin@testbank.com"
        }
        self.wfile.write(json.dumps(config, indent=2).encode('utf-8'))
    
    def serve_script(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/javascript')
        self.end_headers()
        self.wfile.write(b'console.log("Static script loaded");')

    def show_headers(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        headers = dict(self.headers)
        self.wfile.write(json.dumps(headers, indent=2).encode('utf-8'))
    
    def do_redirect(self):
        """Open redirect"""
        self.send_response(302)
        self.send_header('Location', 'http://evil.com/phishing')
        self.end_headers()
    
    def handle_login(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length else ''

        self.send_response(302)
        self.send_header('Location', '/admin')
        self.send_header('Set-Cookie', 
            'session_id=authenticated_session_123; Path=/; HttpOnly; SameSite=Lax')
        self.end_headers()
    
    def handle_api_submit(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "message": "Data saved"}).encode('utf-8'))
    
    def send_404(self):
        self.send_response(404)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<h1>404 Not Found</h1>')
    
    def log_message(self, format, *args):
        msg = format % args
        ts = datetime.now().strftime('%H:%M:%S')
        print(f"  [{ts}] {self.command} {self.path} -> {msg}")


def run_server():
    port = 8080
    server = HTTPServer(('localhost', port), TestHandler)
    
    print("=" * 60)
    print("  🛡️ Security Auditor - Test Server")
    print("=" * 60)
    print(f"\n  URL: http://localhost:{port}")
    print(f"\n  Встроенные уязвимости для тестирования:")
    print(f"  📋 Заголовки:")
    print(f"    1. ❌ Нет HSTS")
    print(f"    2. ❌ X-Frame-Options: ALLOWALL")
    print(f"    3. ❌ Server раскрывает версию")
    print(f"    4. ❌ X-Powered-By: Express/4.18.2")
    print(f"    5. ❌ Нет X-Content-Type-Options")
    print(f"    6. ❌ Нет CSP")
    print(f"    7. ❌ CORS: Access-Control-Allow-Origin: *")
    print(f"    8. ❌ Нет Referrer-Policy, Permissions-Policy")
    print(f"  📋 Куки:")
    print(f"    9. ❌ Куки без Secure")
    print(f"   10. ❌ Куки без HttpOnly")
    print(f"   11. ❌ Нет SameSite атрибута")
    print(f"  📋 HTML/DOM:")
    print(f"   12. ❌ Инлайн-скрипты без nonce")
    print(f"   13. ❌ Чувствительные данные в localStorage")
    print(f"   14. ❌ Поле пароля без type=password")
    print(f"   15. ❌ Смешанный контент (HTTP ресурсы)")
    print(f"   16. ❌ IFrame без sandbox")
    print(f"   17. ❌ Протокол-относительные ссылки")
    print(f"  📋 API:")
    print(f"   18. ❌ /api/users - без авторизации")
    print(f"   19. ❌ /api/config - секреты наружу")
    print(f"   20. ❌ SQL error disclosure на /search")
    print(f"   21. ❌ Open redirect на /redirect")
    print(f"   22. ❌ Рефлектед XSS на /login?error=")
    print("=" * 60)
    print("\n  Нажмите Ctrl+C для остановки\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Сервер остановлен.")
        server.server_close()


if __name__ == '__main__':
    run_server()
