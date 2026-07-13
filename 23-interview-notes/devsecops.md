# DevSecOps Interview Questions

---

### 🎯 Как выглядит идеальный CI/CD pipeline с точки зрения безопасности?

**💡 Концепция:** Security integrated on every stage.

**📝 Ответ:**
```
Commit → Pre-commit hooks (secrets, lint)
  ↓
PR → SAST + SCA (block on CRITICAL)
  ↓
Build → Container scan (Trivy)
  ↓
Staging → DAST + API security scan
  ↓
Release → Security sign-off
  ↓
Production → Runtime monitoring (WAF, RASP)
```

**Ключевые принципы:**
- Shift left: находить уязвимости как можно раньше
- Gates: блокировать только CRITICAL/HIGH
- Noise reduction: тюнить правила, убирать FP

**🔗 Связи:** SAST, DAST, Security Gates

---

### 🎯 Что такое False Positive и как с ними работать?

**💡 Концепция:** Шум, который нужно фильтровать.

**📝 Ответ:**
False Positive — это срабатывание инструмента, которое не является реальной уязвимостью.

**Как работаю с FP:**
1. Анализирую taint flow (может быть не FP, а непонятый finding)
2. Если FP — добавляю в allowlist с комментарием
3. Если много FP одного типа — тюню правило
4. Метрика: FP rate < 20% — хорошо

**Главное:** не игнорировать FP. Иначе они накапливаются и淹没 все реальные findings.

**🔗 Связи:** SAST, Taint Analysis

---

### 🎯 Как выбрать SAST инструмент?

**💡 Контекст:** Выбор инструмента для компании.

**📝 Ответ:**
Смотрю на:

1. **Language coverage**: поддерживает ли языки, которые используем
2. **FP rate**: Semgrep < SonarQube < Checkmarx (по опыту)
3. **Speed**: должен работать за минуты, не часы
4. **Integration**: CI/CD, IDE, PR comments
5. **Custom rules**: можно ли писать свои

**Мой выбор:** Semgrep — open source, быстрый, кастомизируемый.

**🔗 Связи:** SAST, Semgrep

---

### 🎯 Как интегрировать безопасность в CI/CD без замедления разработки?

**💡 Концепция:** Скорость vs Безопасность — не trade-off.

**📝 Ответ:**
1. **Parallel stages**: SAST и SCA параллельно с тестами
2. **Incremental scanning**: только изменённый код
3. **Warn → Block**: начинать с warn, блокировать только CRITICAL
4. **Caching**: кэшировать результаты, не сканировать одно и то же
5. **Pre-commit**: быстрые проверки локально

**Цель:** security checks < 5 минут от общего времени CI/CD.

**🔗 Связи:** DevSecOps, Security Gates
