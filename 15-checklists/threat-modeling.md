# Threat Modeling Checklist

## Pre-requisites
- [ ] Есть дизайн-документ / архитектура
- [ ] Определены assets (что защищаем)
- [ ] Определены trust boundaries
- [ ] Определены roles / actors

## DFD
- [ ] Нарисована Data Flow Diagram
- [ ] Отмечены External Entities
- [ ] Отмечены Processes
- [ ] Отмечены Data Stores
- [ ] Отмечены Data Flows
- [ ] Trust boundaries выделены

## STRIDE — для каждого элемента DFD

| Элемент | S | T | R | I | D | E |
|---------|---|---|---|---|---|---|
| External Entities | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Processes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Stores | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Data Flows | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |

- [ ] Spoofing: кто может выдать себя за другого?
- [ ] Tampering: где данные могут быть изменены?
- [ ] Repudiation: кто может отрицать действие?
- [ ] Information Disclosure: где данные могут утечь?
- [ ] Denial of Service: что может сделать систему недоступной?
- [ ] Elevation of Privilege: где можно получить больше прав?

## Documentation
- [ ] Каждая угроза задокументирована
- [ ] Risk assigned: Critical / High / Medium / Low
- [ ] Control / mitigation определён
- [ ] Status: Mitigated / Accepted / In progress
- [ ] Ответственный назначен
- [ ] Трекер (Jira, GitHub Issues) заведён
