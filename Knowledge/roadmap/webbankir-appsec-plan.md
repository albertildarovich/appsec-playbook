 План работ: подготовка репозитория под вакансию AppSec (Webbankir)

> Составлено на основе разбора репозитория глазами рекрутёра/AppSec-тимлида
> под вакансию Application Security Engineer (– лет, Middle+/Senior).
> Цель — закрыть несоответствия между заявленной структурой и реальным
> содержимым, усилить артефакты по ключевым требованиям вакансии.

Легенда:  сделано · ⬜ TODO

---

 Уже сделано

-  Синхронизирован `README.md` со структурой (удалены несуществующие
  разделы, помечены TODO, поправлен трекер прогресса).
-  Chrome auditor: `MIMT → MITM`; заменено устаревшее правило
  `autocomplete="off"` на проверку «пароль по HTTP».
-  VSCode auditor: убран семантически неверный `DiagnosticTag.Unnecessary`.
-  Переписан `module--ssdlc/.gitlab-ci.yml` в production-grade пайплайн:
  `include` + `extends` + шаблоны (`ci/templates/security-scanning.yml`),
  реальные сканеры (gitleaks, Semgrep, Trivy, npm audit, ZAP),
  `artifacts: reports`, DAG через `needs`, `rules` для MR/защищённых веток.

---

 P — критично (срезает на скрининге)

- ⬜ Kubernetes hardening (`Knowledge/kubernetes/`) — сейчас пустая заглушка,
  а это прямое требование вакансии («харденинг Ks, CIS Benchmarks, runtime security»).
  DoD: каждый подпункт — отдельный .md файл объёмом ≥  строк с примерами и командами.
  - [ ] Pod Security Standards / Pod Security Admission
  - [ ] `securityContext` (runAsNonRoot, readOnlyRootFilesystem, drop capabilities)
  - [ ] NetworkPolicy (default-deny + примеры)
  - [ ] RBAC (least privilege, разбор опасных прав)
  - [ ] CIS Kubernetes Benchmark — краткий чек-лист + как проверять (kube-bench)
  - [ ] Runtime security (Falco) — базовый обзор
  Оценка: ~ дня

- ⬜ DevSecOps (`Knowledge/devsecops/`) — пустая заглушка.
  DoD: один файл `devsecops.md` ≥  строк, покрывающий все подпункты + ссылки на module-.
  - [ ] SAST / DAST / SCA / Secret Scanning / Container / IaC — как выбирать и внедрять
  - [ ] Связать теорию с практикой из `module--ssdlc` (ссылки на реальный пайплайн)
  - [ ] Gate policy: что блокирует, что уходит на ревью
  Оценка: ~ дня

- ⬜ Go-разбор — вакансия требует Golang, в репо только TS/JS/Python.
  DoD: отдельная директория `Knowledge/go-security/` с:
  - [ ]  writeup с уязвимостью в Go (SQLi/SSRF) + fix (≥  строк)
  - [ ]  Semgrep-правило для Go
  Оценка: ~. дня

- ⬜ Валидировать новый пайплайн локально + ресинхронизировать report.md:
  DoD: пайплайн проходит без ошибок; `module--ssdlc/report.md` описывает текущий пайплайн.
  - [ ] `python -c "import yaml; ..."` для `.gitlab-ci.yml` и шаблонов
  - [ ] `npx gitlab-ci-local --list` / прогон, если доступно
  - [ ] Переписать `module--ssdlc/report.md`: секции – и  под новый пайплайн
    (сейчас report.md на  строк описывает grep/echo-пайплайн, а не production-grade)
  Оценка: ~. дня

---

 P — важно (соответствие грейду и стеку)

- ⬜ Architecture Reviews (`Engineering/architecture-reviews/`) — в README бар %,
  для Senior-позиции критично показать умение проводить архитектурные ревью.
  DoD: минимум  документ архитектурного ревью (≥  строк) по шаблону из раздела.
  - [ ] Выбрать типовой компонент (auth-сервис, API gateway) и написать review
  Оценка: ~ день

- ⬜ Усилить Semgrep-правила (`module--semgrep/rules/`):
  DoD: – правила с документацией.
  - [ ] – нетривиальных правила с `mode: taint` вместо простых паттернов
  - [ ] Документировать false-positive/negative каждого правила
  Оценка: ~ день

- ⬜ Docker security — не только regex-правила:
  DoD: файл `Knowledge/docker-security/` (или в `devsecops/`).
  - [ ] Пример hardened `Dockerfile` (multi-stage, non-root, distroless/pinned)
  - [ ] Чек-лист по CIS Docker Benchmark
  Оценка: ~. дня

- ⬜ Битые ссылки в `owasp-top/README.md` — все относительные ссылки битые
  (пути с числовыми префиксами `../-authorization/`, `../-fundamentals/` и т.д.
  не существуют в ФС). Центральный хаб OWASP Top  нерабочий.
  DoD: все ссылки в таблице и секции «Дополнительно» ведут на существующие файлы.
  Оценка: ~. дня

- ⬜ ASVS маппинг — вакансия упоминает ASVS, в репо маппинга нет.
  DoD: таблица в `module--security-review/report.md` (или отдельный файл),
  маппящая  находок Juice Shop на OWASP ASVS v...
  Оценка: ~. дня

---

 P — усиление портфолио

- ⬜ Case studies (`Experience/case-studies/`) — `case.md` не соответствует формату
  (это описание опыта работы, а не CVE-разбор).
  - [ ] Переписать `case.md` в формат CVE-разбора: анализ → PoC → fix
  - [ ] Или сохранить как есть, но добавить – новых CVE-разбора
  - [ ] Починить битые ссылки внутри (`???` вместо путей, неверный путь к code-review)
  Оценка: ~ день

- ⬜ OWASP Top : дописать A (Software & Data Integrity) и A (Logging & Monitoring).
  DoD: файлы `a-.md` и `a-.md` ≥  строк каждый.
  Оценка: ~ день

- ⬜ Authentication: дописать JWT / OAuth . / OIDC (сейчас помечено TODO).
  DoD: минимум `jwt.md` ≥  строк, остальное — по возможности.
  Оценка: ~ день

---

 P — полировка

- ⬜ Пройтись по всем `README.md` подпапок на предмет «Раздел в разработке».
  Обнаруженные заглушки:
  - `Knowledge/linux/` — пустая заглушка («Раздел в разработке»), не упомянута в плане
  - `Engineering/playbooks/` —  playbook-ов, все  (файлы не созданы, только README с каркасом)
  - `Engineering/architecture-reviews/` — только README, нет ни одного review
  - `Knowledge/devsecops/` — перекрывается P
  - `Knowledge/kubernetes/` — перекрывается P
  Либо наполнить linux/playbooks, либо убрать из корневого README.

- ⬜ Единый стиль отчётов (шаблон `_template.md`) во всех модулях.

- ⬜ Проверить консистентность прогресс-баров в корневом README с реальным состоянием.

---

 Порядок выполнения (рекомендуемый, ~ дней суммарно)

```
Week  (P):  Kubernetes hardening  ──   дня
              DevSecOps-раздел      ──   дня
              Go-writeup            ──  . дня
              Паплайн + report.md   ──  . дня  ← итого ~ дней

Week  (P):  Architecture Review   ──   день
              Semgrep taint-правила ──   день
              Docker security       ──  . дня
              Битые ссылки OWASP    ──  . дня
              ASVS mapping          ──  . дня   ← итого ~. дня

Week  (P):  Case studies          ──   день
              A + A             ──   день
              JWT / OAuth / OIDC    ──   день    ← итого ~ дня

Week  (P):  Полировка README, ссылок, стиля  ──  - дня