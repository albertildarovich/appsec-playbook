# Network Basics for SOC

## Зачем это SOC-аналитику

Сетевой трафик — один из главных источников данных о атаках. SOC-аналитик должен:

- Понимать модель OSI и стек TCP/IP.
- Знать протоколы: TCP, UDP, DNS, HTTP/HTTPS, SMB, FTP, SMTP.
- Понимать принципы маршрутизации и работы сетевых устройств.
- Различать средства защиты: IDS/IPS, NGFW, DLP, WAF, AV/EDR.
- Анализировать сетевые аномалии: сканирование, C2, exfiltration, lateral movement.

## Модель OSI и стек TCP/IP

```
OSI                          TCP/IP            Примеры
-------------------------------------------------------------
7. Application                                 HTTP, HTTPS, DNS, FTP, SMTP
6. Presentation                                TLS (шифрование)
5. Session                                      TLS, RDP
4. Transport                                    TCP, UDP
3. Network                                      IP, ICMP, ARP
2. Data Link                                    Ethernet, Wi-Fi
1. Physical                                     Кабель, радио
```

Ключевое для SOC: транспортный (L4) и прикладной (L7) уровни.

## Ключевые протоколы

### TCP (Transport Layer Protocol)

Надёжная передача данных. Установка соединения — three-way handshake.

```
Клиент                   Сервер
  |--- SYN ------------->|
  |<-- SYN+ACK ----------|
  |--- ACK ------------->|
  |                       |
  |--- Данные ---------->|
  |<-- ACK --------------|
  |                       |
  |--- FIN ------------->|
  |<-- FIN/ACK ----------|
  |--- ACK ------------->|
```

Подозрительное: SYN-flooding, port scanning (много SYN без завершения), FIN-сканы.

### UDP (User Datagram Protocol)

Без установления соединения. Быстрее, но без гарантий доставки. Используется для DNS, NTP, VoIP, игр.

Подозрительное: UDP-флуд, DNS-туннелирование, TFTP.

### DNS (Domain Name System)

Разрешение доменных имён в IP. Порт 53 (UDP/TCP).

Типы записей:

```
A     -> IPv4 (example.com -> 93.184.216.34)
AAAA  -> IPv6
MX    -> почтовый сервер
NS    -> авторитетный сервер
TXT   -> SPF, DKIM, произвольный текст
CNAME -> алиас
```

Подозрительное:

- DNS-туннелирование: большой объём TXT-записей, поддомены с base64.
- DGA (Domain Generation Algorithm): много запросов на несуществующие домены.
- Быстрая смена DNS (fast-flux).
- Запросы к известным C2-доменам.

### HTTP/HTTPS

| Метод | Назначение |
|-------|-----------|
| GET | Получить данные |
| POST | Отправить данные (создать) |
| PUT | Заменить ресурс |
| PATCH | Частично изменить |
| DELETE | Удалить |
| OPTIONS | Узнать возможности сервера |

Коды ответа:

```
1xx - информационные
2xx - успех (200 OK, 201 Created)
3xx - редирект (301, 302)
4xx - ошибка клиента (401 Unauthorized, 403 Forbidden, 404)
5xx - ошибка сервера (500, 502, 503)
```

Подозрительное:

- Mass assignment, SQLi-паттерны в query.
- XSS-нагрузки в параметрах.
- Аномальные запросы к /admin, /api, /config.
- Подозрительные User-Agent (curl, sqlmap, python-requests).
- Большие POST-запросы (upload/exitfile exfil).

### SMB (Server Message Block)

Сетевые файловые шары Windows. Порты 445/TCP (SMB), 137-139 (NetBIOS).

Подозрительное:

- Подключение к ADMIN$, C$, IPC$.
- Pass-the-Hash через SMB.
- EternalBlue-эксплойты (MS17-010).
- Lateral movement через SMB.

### FTP (File Transfer Protocol)

Передача файлов. Порты 21 (управление), 20 (данные). Устаревший — передаёт логин/пароль в открытом виде.

Подозрительное: анонимный вход, передача больших объёмов, credentials в открытом виде.

## Сетевые устройства

| Устройство | Уровень | Функция |
|------------|---------|---------|
| Маршрутизатор (Router) | L3 | Маршрутизация между сетями |
| Коммутатор (Switch) | L2 | Коммутация в пределах сегмента |
| Firewall (МЭ) | L4/L7 | Фильтрация трафика по правилам |
| NGFW | L7 | Deep Packet Inspection, App Control, IPS |
| IDS | L3-L7 | Обнаружение вторжений (пассивно) |
| IPS | L3-L7 | Обнаружение + блокировка |
| WAF | L7 | Защита веб-приложений (OWASP Top 10) |
| DLP | L7 | Контроль утечек данных |
| VPN Gateway | - | Шифрованный удалённый доступ |
| Proxy | L7 | Промежуточный сервер, кэш, контроль |

## IDS vs IPS vs EDR vs AV

| Средство | Принцип | Примеры |
|----------|---------|---------|
| AV (антивирус) | Хостовое, сигнатуры, эвристика | Kaspersky, Defender |
| EDR | Хостовое, поведенческий анализ, telemetry | CrowdStrike, SentinelOne |
| IDS | Сетевое, пассивное, сигнатуры/аномалии | Suricata, Snort |
| IPS | Сетевое, активное (блокирует) | Suricata (IPS mode), NGFW |
| NGFW | Сетевое, L7, приложения, юзеры | Palo Alto, Check Point |
| WAF | Веб-спец, L7 | ModSecurity, Cloudflare WAF |

Различия:

| Характеристика | AV | EDR | IDS | IPS |
|----------------|----|----|-----|-----|
| Где работает | Хост | Хост | Сеть | Сеть |
| Активность | Пассивно (лечит) | Активно (блокирует) | Пассивно (только алерт) | Активно (блокирует) |
| Что видит | Файлы | Поведение, процессы, сеть | Трафик | Трафик |
| Обход | Просто | Сложнее | Проще | Сложнее |

## Сетевые аномалии (что искать)

| Аномалия | Признак | Тактика MITRE |
|----------|---------|---------------|
| Сканирование портов | Много соединений к разным портам с одного IP | Discovery (TA0007) |
| SYN flood | Масса SYN без ACK | Impact (TA0040) |
| DNS-туннель | Большой DNS-трафик, TXT-записи, несуществующие домены | C2 (TA0011), Exfiltration (TA0010) |
| C2 beacon | Регулярные соединения к одному IP/домену, одинаковые интервалы | C2 (TA0011) |
| Exfil по HTTP | Большие POST на нетипичный внешний хост | Exfiltration (TA0010) |
| Lateral movement SMB | SMB-соединения на административные шары с необычного хоста | Lateral Movement (TA0008) |
| Non-standard port | Трафик на нетипичные порты (C2, туннель) | C2 (TA0011) |
| UDP flood | Аномальный объём UDP | Impact (TA0040) |

## Анализ трафика: первые действия

```
1. Что за событие?
   - IDS/IPS алерт? Firewall deny? NetFlow?
   - Протокол, порты, IP

2. Внутри или снаружи?
   - source/destination IP, гео, ASN

3. Есть ли сигнатура?
   - Suricata rule ID, правило NGFW

4. Захват трафика?
   - tcpdump -i eth0 host 185.220.101.2
   - Смотреть payload (HTTP, DNS, SMB)

5. Обогащение
   - TI, VirusTotal, whois

6. Решение
   - Блокировать IP/домен
   - Эскалировать с evidence
```

## Шпаргалка: порты

| Порт | Протокол | Сервис |
|------|----------|--------|
| 21 | TCP | FTP |
| 22 | TCP | SSH |
| 23 | TCP | Telnet (небезопасно) |
| 25 | TCP | SMTP |
| 53 | UDP/TCP | DNS |
| 80 | TCP | HTTP |
| 110 | TCP | POP3 |
| 135 | TCP | RPC (важно для атак) |
| 139/445 | TCP | NetBIOS / SMB |
| 143 | TCP | IMAP |
| 443 | TCP | HTTPS |
| 3389 | TCP | RDP |
| 5985/5986 | TCP | WinRM |
| 8080 | TCP | HTTP-alt / proxy |

## Практика

- TryHackMe: Network Fundamentals, Intro to LAN, Wireshark rooms.
- Wireshark: захват и анализ трафика (PCAP).
- Suricata: написать правило, прогнать PCAP.
- Поднять домашний NGFW/прокси и посмотреть логи.

## Связанные материалы

- Knowledge/soc/siem-basics.md
- Knowledge/soc/email-security.md
- Knowledge/soc/mitre-attack.md
- Experience/labs/soc/