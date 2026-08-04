# Incident Ticket Template (SOC L1)

Шаблон тикета для регистрации и обработки инцидента на линии L1.
Заполняется аналитиком при поступлении алерта из SIEM/EDR.

## Поля тикета

| Поле | Значение |
|---|---|
| **Ticket ID** | SOC-YYYY-XXXX |
| **Summary** | Краткое описание инцидента (одна строка) |
| **Source** | SIEM (Wazuh/Kibana) / EDR / Пользователь / Внешний отчёт |
| **Timestamp** | YYYY-MM-DD HH:MM:SS UTC |
| **Affected Host** | hostname / IP |
| **User** | домен\\логин или uid |
| **Raw Event** | Фрагмент сырого события из Kibana Discover / Wazuh Alert |
| **Initial Analysis** | Что видно на первый взгляд: паттерн, аномалия, контекст |
| **MITRE Mapping** | Тактика (TAXXXX) + Техника (TXXXX.XXX) |
| **Severity** | Critical / High / Medium / Low |
| **Recommendation** | Что предлагает L1: эскалировать, закрыть, мониторить |
| **Escalation Decision** | Escalated to L2 / Closed / Pending Evidence |
| **Closure Note** | Итог: TP/FP, подтверждённый ущерб, предпринятые действия |

## Пример заполнения

| Поле | Значение |
|---|---|
| **Ticket ID** | SOC-2026-0001 |
| **Summary** | Suspicious encoded PowerShell launched from Word document |
| **Source** | Wazuh SIEM, rule id:100011 |
| **Timestamp** | 2026-08-03 14:22:33 UTC |
| **Affected Host** | WS-001 (10.0.0.101) |
| **User** | WS-001\albert |
| **Raw Event** | `powershell.exe -enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAATgBlAHQALgBXAG...` (Sysmon EID 1) |
| **Initial Analysis** | Обфусцированная команда PowerShell. Parent process — winword.exe (документ). Пользователь albert открыл вложение. Признаки фишинга. |
| **MITRE Mapping** | Execution (TA0002) / T1059.001 — PowerShell |
| **Severity** | Medium |
| **Recommendation** | Изолировать хост, собрать образ памяти, передать на L2 |
| **Escalation Decision** | Escalated to L2 |
| **Closure Note** | TP. Подтверждён фишинг-документ. Хост изолирован, тикет передан на L2 для IR. |

## Workflow

```
Alert (SIEM) --> Triage (L1) --> Ticket --> Analysis --> Escalation / Closure
```

## Связанные документы

- [incident-report-template.md](incident-report-template.md) — полный шаблон отчёта об инциденте
- [incidents.md](incidents.md) — таблица обработанных инцидентов
- [false-positive-tuning.md](false-positive-tuning.md) — тюнинг ложных срабатываний