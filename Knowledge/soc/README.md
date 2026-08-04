# SOC Analyst Knowledge

База знаний для подготовки к позиции SOC-аналитика L1.

## Содержание

| Раздел | Описание | Статус |
|--------|----------|--------|
| [MITRE ATT&CK + Cyber Kill Chain](./mitre-attack.md) | Тактики, техники, логика атаки, БДУ ФСТЭК | [x] |
| [Active Directory](./active-directory.md) | Структура домена, Kerberos, NTLM, LDAP, GPO, типовые атаки | [x] |
| [Windows Event Logs + Sysmon](./windows-event-logs.md) | Ключевые event ID, диагностика, Sysmon, Sigma | [x] |
| [Email Security](./email-security.md) | SMTP, SPF/DKIM/DMARC, phishing, spoofing | [x] |
| [SIEM Basics](./siem-basics.md) | Splunk SPL, Elastic KQL, Wazuh, корреляция, нормализация | [x] |
| [Network Basics for SOC](./network-basics.md) | TCP/IP, DNS, HTTP/HTTPS, SMB, FTP, IDS/IPS, NGFW, DLP | [x] |
| [Linux Logs](./linux-logs.md) | journalctl, syslog, auth.log, auditd | [x] |
| [Incident Response](./incident-response.md) | Цикл IR, SANS PICERL, эскалация, отчётность | [x] |

## Описание

```
ОС Windows/Linux (журналы, аутентификация, процессы, службы)
  -> windows-event-logs.md, linux-logs.md

Сети (TCP/IP, DNS, HTTP/HTTPS, SMB, FTP, маршрутизация)
  -> network-basics.md

СЗИ (SIEM, EDR, IDS/IPS, DLP, NGFW, AV)
  -> siem-basics.md, network-basics.md

Почта (SMTP, POP3, IMAP, phishing, spoofing)
  -> email-security.md

TTP атакующих (OWASP Top 10, CVE, MITRE ATT&CK, Kill Chain, БДУ ФСТЭК)
  -> mitre-attack.md

Active Directory (домен, пользователи, GPO, Kerberos, NTLM, атаки)
  -> active-directory.md

Практика (TryHackMe, CyberDefenders, SIEM, EDR, скрипты)
  -> Experience/labs/soc/
```

## Принципы

- Каждая техника/событие рассматривается с позиции: как выглядит в логах, как детектировать, как реагировать.
- События Windows разбираются на уровне event ID + Sysmon ID.
- Корреляция строится на MITRE ATT&CK тактиках, а не изолированных событиях.
- Ответ всегда включает эскалацию и документацию.