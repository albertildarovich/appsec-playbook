# Лабораторная: Mobile Security Basics

Цель: освоить базовые практики безопасности мобильных приложений на основе OWASP Mobile Top 10. Демонстрация уязвимостей, способов их выявления и исправления на примере Android-приложения.

## Контекст

Демонстрационное Android-приложение `ShopApp` (Kotlin):

- Хранит токен в SharedPreferences.
- Общается с API по HTTP (без TLS), сертификаты не проверяются.
- Авторизация по одному фактору, без rate-limit.
- Использует WebView для отображения контента.
- Содержит логи с персональными данными.

```
+-----------------------+         +----------------------------+
|  ShopApp (Android)    |  HTTP   |  api.shopapp.ru            |
|                       | -------->                            |
|  SharedPreferences    |         |  /login                   |
|  WebView              |         |  /order                   |
|  Logcat               |         |  /payment                 |
+-----------------------+         +----------------------------+
```

## OWASP Mobile Top 10 (2024)

| ID | Категория | Статус в ShopApp |
|----|-----------|------------------|
| M1 | Improper Credential Usage | [x] присутствует |
| M2 | Inadequate Supply Chain Security | [ ] не рассматривается |
| M3 | Insecure Authentication/Authorization | [x] присутствует |
| M4 | Insufficient Input/Output Validation | [x] присутствует |
| M5 | Insecure Communication | [x] присутствует |
| M6 | Inadequate Privacy Controls | [x] присутствует |
| M7 | Insufficient Binary Protections | [ ] не рассматривается |
| M8 | Security Misconfiguration | [x] присутствует |
| M9 | Insecure Data Storage | [x] присутствует |
| M10 | Insufficient Cryptography | [x] присутствует |

## Кейс 1: Insecure Data Storage (M9)

Уязвимый код:

```kotlin
// MainActivity.kt
class MainActivity : AppCompatActivity() {

    private fun saveToken(token: String) {
        // M9: хранение токена в открытом виде
        val prefs = getSharedPreferences("auth", Context.MODE_PRIVATE)
        prefs.edit().putString("jwt", token).apply()
    }

    private fun loadToken(): String? {
        val prefs = getSharedPreferences("auth", Context.MODE_PRIVATE)
        return prefs.getString("jwt", null)
    }
}
```

Проблемы:

- Токен хранится в открытом виде в SharedPreferences.
- Файл доступен при рутованном устройстве или при резервном копировании (adb backup).
- Любой компонент приложения имеет доступ к тем же prefs.

Исправление: EncryptedSharedPreferences (AndroidX Security Crypto).

```kotlin
// MainActivity.kt
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class MainActivity : AppCompatActivity() {

    private val prefs by lazy {
        val masterKey = MasterKey.Builder(this)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            this,
            "auth_secure",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private fun saveToken(token: String) {
        prefs.edit().putString("jwt", token).apply()
    }
}
```

Дополнительные меры:

- Для чувствительных данных (платёжные данные) использовать Keystore + AES-GCM.
- Не хранить данные, которые можно не хранить (токен можно хранить в памяти).
- Проверить `android:allowBackup="false"` или `android:fullBackupContent="false"`.

## Кейс 2: Insecure Communication (M5)

Уязвимый код:

```kotlin
// NetworkClient.kt
object NetworkClient {

    // M5: отключение проверки сертификатов
    private val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
        override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}
        override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
    })

    val client: OkHttpClient by lazy {
        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, trustAllCerts, java.security.SecureRandom())
        OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
            .hostnameVerifier { _, _ -> true }
            .build()
    }
}
```

Проблемы:

- `trustAllCerts` отключает проверку сертификатов — возможен Man-in-the-Middle.
- `hostnameVerifier` принимает любой хост — атакующий может подменить сервер.
- Данные передаются без гарантии подлинности сервера.

Исправление 1: удалить кастомный TrustManager, использовать системные доверенные сертификаты.

```kotlin
// NetworkClient.kt
object NetworkClient {

    val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .build()
    }
}
```

Исправление 2: Certificate Pinning для чувствительных операций.

```kotlin
// NetworkClient.kt
import okhttp3.CertificatePinner

object NetworkClient {

    val client: OkHttpClient by lazy {
        val pinner = CertificatePinner.Builder()
            .add("api.shopapp.ru", "sha256/47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=")
            .build()

        OkHttpClient.Builder()
            .certificatePinner(pinner)
            .build()
    }
}
```

Дополнительные меры:

- Использовать только HTTPS (`android:usesCleartextTraffic="false"`).
- Настроить network_security_config.xml для ограничения доверенных доменов.

```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <domain-config>
        <domain includeSubdomains="true">api.shopapp.ru</domain>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
</network-security-config>
```

## Кейс 3: Weak Authentication (M3)

Уязвимый код:

```kotlin
// LoginActivity.kt
class LoginActivity : AppCompatActivity() {

    private fun login(email: String, password: String) {
        // M3: однофакторная аутентификация, отсутствие rate-limit
        api.login(email, password).enqueue(object : Callback<AuthResponse> {
            override fun onResponse(call: Call<AuthResponse>, response: Response<AuthResponse>) {
                if (response.isSuccessful) {
                    saveToken(response.body()!!.token)
                }
            }
        })
    }
}
```

Проблемы:

- Нет ограничения числа попыток входа — перебор пароля.
- Нет двухфакторной аутентификации.
- Токен долгоживущий (30 дней), нет refresh-механизма.

Исправление:

```kotlin
// LoginActivity.kt
class LoginActivity : AppCompatActivity() {

    private var attempts = 0

    private fun login(email: String, password: String) {
        // Ограничение числа попыток на клиенте + обязательный rate-limit на сервере
        if (attempts >= 5) {
            showError("Слишком много попыток. Попробуйте позже.")
            return
        }

        api.login(email, password).enqueue(object : Callback<AuthResponse> {
            override fun onResponse(call: Call<AuthResponse>, response: Response<AuthResponse>) {
                if (response.isSuccessful) {
                    attempts = 0
                    saveToken(response.body()!!.token)
                    // Запрос MFA (OTP), если включено
                    promptMfaIfRequired()
                } else {
                    attempts++
                }
            }
        })
    }
}
```

Серверные меры:

- Rate-limit на /login (например, 5 попыток за 15 минут, блокировка IP).
- OTP/WebAuthn как второй фактор.
- Короткий TTL access-токена (15 минут), refresh-токен (7 дней), ротация refresh-токена.

## Инструменты для анализа

- Мобильный анализ: MobSF (Moblie Security Framework) — статический анализ APK.
- Динамический анализ: Frida + Objection — runtime-манипуляции, пиннинг-байпас.
- Трафик: mitmproxy, Burp Suite — перехват и модификация HTTPS-трафика.
- Декомпиляция: jadx — просмотр Java/Kotlin кода из APK.
- apktool — извлечение ресурсов, манифеста, smali.

Базовый сценарий тестирования APK:

```
1. Собрать приложение: ./gradlew assembleDebug
2. Установить на эмулятор: adb install app-debug.apk
3. Декомпилировать: jadx -d out/ app-debug.apk
4. Изучить манифест: aapt dump xmltree app-debug.apk AndroidManifest.xml
5. Перехватить трафик: mitmproxy -p 8080 (устройство на прокси)
6. Проверить хранилище: adb shell run-as com.shopapp cat /data/data/com.shopapp/shared_prefs/auth.xml
7. Runtim-анализ: frida -U -f com.shopapp -l hook.js
```

## Выводы

- Mobile-приложения должны минимизировать объём хранимых данных (M9).
- Шифрование при хранении — обязательное, но не единственное требование: важен и ключевой менеджмент (M10).
- Прозрачный TLS и проверка сертификатов — базовая защита (M5), pinning — для чувствительных сценариев.
- Аутентификация требует всех слоёв: клиентский UX, серверный rate-limit, MFA, короткие токены (M3).
- Статический анализ (MobSF) находит хранимые секреты и конфигурации; динамический (Frida) — runtime-проблемы.

## Связанные материалы

- OWASP Mobile Top 10: https://owasp.org/www-project-mobile-top-10/
- OWASP MASVS: https://mas.owasp.org/
- Knowledge/authentication/oauth2-oidc.md
- Knowledge/authentication/identification-authentication-failures.md
- Knowledge/authorization/bola.md