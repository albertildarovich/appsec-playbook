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




| External Entity | Да | Нет | Нет | Нет | Нет | Нет |
| Process | Да | Да | Да | Да | Да | Да |
| Data Store | Нет | Да | Нет | Да | Нет | Нет |
| Data Flow | Да | Да | Нет | Да | Да | Нет |

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














