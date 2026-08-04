# Email Security для SOC

## Зачем это SOC-аналитику

Email — основной вектор первичного проникновения (phishing, malware delivery, BEC). SOC-аналитик обязан:

- Понимать работу почтовых протоколов (SMTP, POP3, IMAP).
- Знать механизмы защиты (SPF, DKIM, DMARC, BIMI).
- Уметь анализировать письма: заголовки, вложения, ссылки.
- Отличать phishing/spear-phishing/whaling/BEC.
- Знать, как выглядит spoofing и как его детектировать.

## Схема доставки почты

```
Отправитель                    Промежуточные MTA                  Получатель
  MUA -> MSA (587) -> MTA (25) -> MX (25) -> MDA -> MUA (POP3/IMAP)
```

| Компонент | Протокол/Порт | Назначение |
|-----------|---------------|------------|
| MUA | - | Почтовый клиент (Outlook, Thunderbird) |
| MSA (Submission) | SMTP 587/TLS | Приём письма от клиента |
| MTA | SMTP 25 | Пересылка между серверами |
| MX | SMTP 25 | Входной почтовый сервер домена |
| MDA | - | Доставка в ящик получателя |
| Retrieval | POP3 110/995, IMAP 143/993 | Получение письма клиентом |

## Заголовки письма (Headers)

Ключевые поля для анализа:

| Заголовок | Что содержит | Зачем анализировать |
|-----------|--------------|---------------------|
| Received | Цепочка серверов (добавляется каждым MTA) | Проверка реального пути письма |
| From | Видимый отправитель (можно подделать) | Сверять с SPF/DKIM |
| Reply-To | Куда уйдёт ответ | BEC: ответ уходит атакующему |
| Return-Path | Отправитель для bounce (MAIL FROM) | Сверять с SPF |
| Message-ID | Уникальный ID | Поиск одинаковых массовых рассылок |
| DKIM-Signature | Подпись DKIM | Проверка подлинности отправителя |
| Authentication-Results | Результат SPF/DKIM/DMARC | Ключевой для определения спама/фишинга |
| Subject | Тема письма | Срочность, угрозы, знакомые слова |
| X-Originating-IP | IP, с которого отправлено | Гео, репутация IP |

## Механизмы аутентификации почты

### SPF (Sender Policy Framework)

Проверяет право домена отправлять почту от указанного домена по IP.

DNS-запись SPF:

```
v=spf1 ip4:192.0.2.1 ip4:192.0.2.2 -all
```

Механика:

1. Получатель берёт домен из MAIL FROM (Return-Path).
2. Делает DNS TXT-запрос для SPF.
3. Сравнивает IP отправителя с записями.
4. Результат: Pass / Fail / Neutral / SoftFail.

### DKIM (DomainKeys Identified Mail)

Подписывает письмо ключом домена. Проверяется по DNS ключу.

Пример DKIM-Signature в письме:

```
DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=selector1;
  c=relaxed/relaxed; t=1720000000;
  bh=abc123...; h=From:To:Subject:Date; b=xyz789...
```

DNS-запись DKIM (selector1._domainkey.example.com):

```
v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

Определяет политику обработки писем, не прошедших SPF/DKIM.

DNS-запись DMARC (_dmarc.example.com):

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; pct=100
```

Политики:

| Политика | Действие |
|----------|----------|
| p=none | Только мониторинг, отчёты, не блокировать |
| p=quarantine | Письмо в спам |
| p=reject | Отклонить письмо |

DMARC требует совпадения домена в From с доменом SPF/DKIM (alignment).

### BIMI (Brand Indicators for Message Identification)

Логотип бренда в письме. Требует DMARC reject/quarantine.

## Типы почтовых атак

| Атака | Описание | Детект |
|-------|----------|--------|
| Phishing | Массовая рассылка с целью кражи учётных данных | SPF/DKIM/DMARC fail, поддельный домен |
| Spear Phishing | Целевая атака на конкретного сотрудника | Изучение контекста, подмена коллеги |
| Whaling | Атака на топ-менеджмент | Подделка CEO/CFO |
| Business Email Compromise (BEC) | Подмена руководства/партнёра, просьба перевода | Reply-To/домен отправителя |
| Spoofing | Подделка From/Display Name | SPF/DKIM fail, внешний домен с именем |
| Malware/Attachment | Вредоносное вложение (docx, xls, iso, sfx) | AV/EDR, хеши, анализ макросов |
| Link Spoofing | URL ведёт на поддельный сайт (typosquat) | Декодирование ссылок, GeoIP |
| Account Takeover | Компрометация легитимного ящика | Аномальные входы (IP, гео, время), пересылки |

## Анализ письма (пошагово)

```
1. Полный заголовок
   - Received: цепочка, IP, серверы
   - From / Return-Path / Reply-To: совпадают?
   - Authentication-Results: SPF/DKIM/DMARC pass/fail?

2. Домен отправителя
   - Реальный ли домен? День регистрации (WHOIS)
   - Похож ли на легитимный? (typosquat: amaz0n.com)
   - Проверить DNS: MX, SPF, DMARC

3. Ссылки
   - Декодировать: куда реально ведёт? (деобфускация, перенаправления)
   - Проверить репутацию домена/URL (VirusTotal, URLhaus)

4. Вложения
   - Тип файла. Расширение `.exe`, `.iso`, `.docm`, `.xlsm` - подозрительно
   - Хеш (SHA256) -> VirusTotal
   - Макросы/WPS в Office-документах
   - Запакованные файлы: `password: 123` - признак обхода AV

5. Контекст
   - Тема: срочность, угрозы, просьбы
   - Ожидал ли получатель данное письмо?
   - Обращение по имени или generic?

6. Решение
   - Quarantine / delete / эскалация
   - Поиск похожих писем в ящике (Message-ID pattern)
   - Уведомить пользователя
```

## DLP-моменты в почте

| Что утекает | Примеры | Как контролировать |
|-------------|---------|--------------------|
| PII | Имя, телефон, паспорт | DLP-правила, регэкспы |
| Финансы | Счета, карты, банковские реквизиты | DLP + BEC-детект |
| Коммерческая тайна | Исходники, контракты | Классификация, DLP |
| Учётные данные | Пароли в письмах | Запрет паролей в почте |

## Пример фишингового письма (разбор)

```
From: "Банк Тинькофф" <security@tinkoff-support.xyz>
Reply-To: refund@yahoo.com
Subject: Ваш счёт заблокирован. Подтвердите данные (СРОЧНО)

SPF: fail (IP 185.220.101.2 не в разрешённых)
DKIM: нет подписи
DMARC: fail (домен tinkoff-support.xyz без DMARC)
```

Признаки:

1. Домен `tinkoff-support.xyz` — не `tinkoff.ru` (typosquat/подмена).
2. SPF fail, DKIM отсутствует, DMARC fail.
3. Reply-To на посторонний домен.
4. Срочность + угроза блокировки (манипуляция).
5. Ссылки (не видны) ведут на поддельный логин.

## Шпаргалка: что проверять

| Проверка | Инструмент/метод |
|----------|------------------|
| SPF/DKIM/DMARC домена | dmarcian, MXToolbox, dig TXT _dmarc.domin |
| Репутация IP | VirusTotal, Spamhaus, Talos |
| Репутация URL | VirusTotal, URLhaus, Google Safe Browsing |
| Хеш вложения | VirusTotal, MalwareBazaar |
| WHOIS домена | whois, securitytrails |
| Дата регистрации домена | WHOIS (недавно зарегистрирован - плохо) |
| Полные заголовки | Outlook: View Source; Gmail: Show original |

Пример CLI-проверки DNS:

```
dig TXT _dmarc.example.com
dig TXT example.com | grep spf
dig TXT selector1._domainkey.example.com
```

## Практика

- Phishing-анализ кейсов на CyberDefenders.
- TryHackMe: Phishing Analysis, Email Analysis rooms.
- Настроить собственный тестовый SMTP (Postfix/Docker) и собрать подаваемые письма.
- Проверить SPF/DKIM/DMARC для своих доменов (mx-toolbox).

## Связанные материалы

- Knowledge/soc/mitre-attack.md (T1566 Phishing)
- Knowledge/soc/siem-basics.md
- Knowledge/soc/network-basics.md
- Experience/labs/soc/