# BSIMM / SAMM / SSDF Interview Questions

---

### 🎯 В чём разница между BSIMM и SAMM?

**💡 Концепция:** Descriptive vs Prescriptive.

**📝 Ответ:**

| Критерий | BSIMM | SAMM |
|----------|-------|------|
| Подход | Descriptive (как есть) | Prescriptive (как должно быть) |
| Уровни | Activities (нет уровней) | 3 уровня (0-3) |
| Цель | Benchmark: как у других? | Roadmap: что делать? |
| Бесплатный | ❌ | ✅ |
| Адаптация | Фиксированный | Гибкий |

BSIMM говорит "вот что делают 100+ компаний", SAMM говорит "вот что тебе нужно сделать".

---

### 🎯 Что такое NIST SSDF и зачем он нужен?

**💡 Концепция:** Фреймворк безопасной разработки от правительства США.

**📝 Ответ:**
SSDF (SP 800-218) — это набор из 19 практик безопасности, сгруппированных в 4 категории:

1. **Prepare** — подготовка (security requirements, toolchain)
2. **Protect** — защита (code, build pipeline, artifacts)
3. **Produce** — производство (code review, testing, SBOM)
4. **Respond** — реагирование (vulnerability management)

Обязателен для поставщиков ПО правительству США (EO 14028).

**🔗 Связи:** BSIMM, SAMM, Secure SDLC

---

### 🎯 Как ты будешь внедрять Secure SDLC в компании, где его нет?

**💡 Концепция:** Incremental, не Big Bang.

**📝 Ответ:**
1. **Month 1-2**: SAST в CI/CD + тренинг для разработчиков
2. **Month 3-4**: SCA + Security Requirements в user stories
3. **Month 5-6**: Security Champions + lightweight Threat Modeling
4. **Month 7-8**: Security Gates на CRITICAL
5. **Month 9-10**: DAST на staging
6. **Month 11-12**: Метрики и dashboard

Ключ: начать с малого, показать результаты, масштабировать.

**🔗 Связи:** Secure SDLC, SAMM

---

### 🎯 Что такое Security Gates?

**💡 Концепция:** Контрольные точки в CI/CD.

**📝 Ответ:**
Security Gates — это автоматические проверки в CI/CD pipeline, которые могут блокировать релиз.

**Типичные Gates:**
1. SAST gate — блокирует PR при CRITICAL findings
2. SCA gate — блокирует при known CVEs
3. Secret gate — блокирует при утечке secrets
4. DAST gate — блокирует деплой при XSS/SQLi

**Внедряю постепенно:** warn → block on critical → full automation.

**🔗 Связи:** DevSecOps, CI/CD

---

### 🎯 Как измерить эффективность AppSec программы?

**💡 Концепция:** Data-driven метрики.

**📝 Ответ:**
Использую метрики для разных stakeholders:

**Для AppSec:**
- MTTR (Mean Time to Remediate)
- Open vs Closed vulnerabilities
- Time to triage

**Для разработчиков:**
- SAST coverage
- FP rate
- Vulnerabilities found in dev (ранние этапы)

**Для менеджмента:**
- Vulnerabilities in prod
- MTTR trend
- Incidents count

Главное: метрики должны быть actionable, не vanity.

**🔗 Связи:** Security Metrics, SAMM

---

### 🎯 Как убедить команду внедрить безопасность?

**💡 Концепция:** Developer empathy + ROI.

**📝 Ответ:**
1. **Говорить на их языке**: не "security requirements", а "это спасёт тебе ночной деплой"
2. **Показать pain**: "вот баг, который мы нашли бы раньше с SAST"
3. **Упростить**: готовые rulesets, pre-commit hooks, документация
4. **Автоматизировать**, не создавать ручную работу
5. **Награждать**: Security Champions, recognition

Самый частый аргумент: "нет времени на безопасность". Ответ: "безопасность, добавленная постфактум, стоит в 10x дороже".

**🔗 Связи:** Security Champions, Communication
