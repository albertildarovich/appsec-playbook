# STRIDE

## Теория

STRIDE — мнемоническая аббревиатура из 6 категорий угроз от Microsoft.

| Категория | Нарушение | Что защищаем |
|-----------|-----------|-------------|
| **S**poofing | Аутентификация | Identity |
| **T**ampering | Целостность | Data integrity |
| **R**epudiation | Неотказуемость | Audit trail |
| **I**nformation Disclosure | Конфиденциальность | Data privacy |
| **D**enial of Service | Доступность | Availability |
| **E**levation of Privilege | Авторизация | Access control |

## Как применять STRIDE к элементам DFD

| Элемент DFD | S | T | R | I | D | E |
|-------------|---|---|---|---|---|---|
| External Entity | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Process | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Store | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Data Flow | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |

## Типичные ошибки

| Категория | Ошибка разработчика | Как AppSec обнаружит |
|-----------|-------------------|---------------------|
| Spoofing | JWT без проверки signature | Code Review |
| Tampering | Отсутствие HMAC для cookies | Code Review + SAST |
| Repudiation | Нет audit логов | Review архитектуры |
| Information Disclosure | Stack trace в ответе | DAST + Code Review |
| Denial of Service | Нет rate limiting | Load testing + DAST |
| Elevation of Privilege | IDOR | Manual testing |

## Практика

**Формат записи угрозы**:
```
[STRIDE-T] IDOR в GET /api/users/{id}
Risk: High
Control: Проверка ownership через user_id из JWT
Status: Fix verified
```

## Lessons Learned

- STRIDE — это checklist, а не наука. Не нужно искать все 6 типов на каждый элемент.
- Для External Entities актуальны Spoofing и DoS.
- Для Data Stores — Tampering и Information Disclosure.
- Для процессов — все 6, но приоритет: E > S > I > T > D > R.
