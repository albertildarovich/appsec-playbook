# 🛡 Security Auditor — VSCode Extension

> Линтер безопасности кода для Visual Studio Code.

##  Возможности

- **50+ проверок** для JavaScript, TypeScript, Python, HTML, Dockerfile, YAML/K8s
- **Автоматическое сканирование** при сохранении (опционально)
- **Подсветка проблем** в редакторе (Problems panel)
- **Сканирование всего проекта** одной командой
- **Экспорт отчёта** в JSON
- **Статус бар** с количеством проблем

## 🔍 Что проверяет

### JavaScript / TypeScript
| Проверка | Серьёзность |
|---------|------------|
| `eval()` использование | [CRIT] high |
| `innerHTML` / опасная вставка | [CRIT] high |
| `document.write()` | [MED] medium |
| Секреты в localStorage | [CRIT] high |
| Хардкоженные пароли/токены | [CRIT] high |
| AWS ключи | [CRIT] high |
| SQL-инъекции (конкатенация) | [CRIT] high |
| Слабые алгоритмы (MD5, SHA1) | [MED] medium |
| Отладочный код | 🔵 low |
| ReDoS уязвимости | [MED] medium |
| Path Traversal | [CRIT] high |

### Python
| Проверка | Серьёзность |
|---------|------------|
| `eval()` / `exec()` | [CRIT] high |
| `pickle.loads()` | [CRIT] high |
| SQL-инъекции (f-strings) | [CRIT] high |
| `shell=True` в subprocess | [CRIT] high |
| `os.system()` / `os.popen()` | [CRIT] high |
| HTTP requests без timeout | [MED] medium |
| Хардкоженные секреты | [CRIT] high |

### Dockerfile
| Проверка | Серьёзность |
|---------|------------|
| Запуск от root | [MED] medium |
| `:latest` тег | 🔵 low |
| `ADD` вместо `COPY` | 🔵 low |
| Секреты в ENV | [CRIT] high |
| `apt-get` без `--no-install-recommends` | ⚪ info |

### Kubernetes / YAML
| Проверка | Серьёзность |
|---------|------------|
| `privileged: true` | [CRIT] high |
| `runAsNonRoot` не задан | [MED] medium |
| `hostNetwork: true` | [CRIT] high |
| `readOnlyRootFilesystem` не задан | [MED] medium |

### HTML
| Проверка | Серьёзность |
|---------|------------|
| Отсутствие CSP | [CRIT] high |
| Инлайн-скрипты без nonce | [MED] medium |
| Автозаполнение на password полях | [MED] medium |

##  Установка

### Из VSIX (разработка)
```bash
# 1. Установите vsce
npm install -g @vscode/vsce

# 2. Соберите пакет
cd 17-mini-projects/vscode-security-auditor
vsce package

# 3. Установите в VSCode
code --install-extension vscode-security-auditor-*.vsix
```

### Developer Mode
1. Откройте VSCode → Extensions (Ctrl+Shift+X)
2. `...` → Install from VSIX...
3. Выберите `.vsix` файл

## ⌨ Команды

| Команда | Горячие клавиши | Описание |
|---------|----------------|----------|
| `Security Audit: Сканировать текущий файл` | `Ctrl+Shift+S` (Win) / `Cmd+Shift+S` (Mac) | Проверить активный файл |
| `Security Audit: Сканировать весь проект` | — | Проверить все файлы проекта |
| `Security Audit: Показать результаты` | — | Открыть панель результатов |
| `Security Audit: Экспорт отчёта` | — | Сохранить отчёт в JSON |
| `Security Audit: Очистить результаты` | — | Сбросить все предупреждения |

## ⚙ Настройки

| Параметр | По умолчанию | Описание |
|---------|-------------|----------|
| `securityAuditor.enable` | `true` | Включить/отключить расширение |
| `securityAuditor.severityThreshold` | `"medium"` | Минимальный уровень (`info`, `low`, `medium`, `high`) |
| `securityAuditor.scanOnSave` | `false` | Сканировать при сохранении файла |

## 🖥 Использование

1. Откройте файл в VSCode
2. Нажмите `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Win)
3. Проблемы появятся в **Problems** панели (Ctrl+Shift+M)
4. Нажмите на проблему — перейдёте к уязвимому месту

##  Пример отчёта

```
=====================================================
  🛡  SECURITY AUDITOR - РЕЗУЛЬТЫ СКАНИРОВАНИЯ
=====================================================
  Всего найдено: 5 проблем
  [CRIT] Высоких: 2
  [MED] Средних: 2
  🔵 Низких: 1
-----------------------------------------------------

  [CRIT] ВЫСОКИЙ ПРИОРИТЕТ:
    1. src/config.py:15
       Потенциальный секрет в коде
    2. Dockerfile:8
       Не храните секреты в ENV
  ...
```

## 🗺 План развития

- [x] **Этап 1:** Базовые проверки для JS/TS, Python, Docker, K8s
- [ ] **Этап 2:** Проверка package.json/dependencies (Snyk-like)
- [ ] **Этап 3:** Интеграция с SAST-инструментами (Bandit, Semgrep)
- [ ] **Этап 4:** Авто-фикс для простых проблем
- [ ] **Этап 5:** Локальный AI-ассистент для рекомендаций

---

**[WARN] Предупреждение:** Инструмент предназначен для помощи в code review и не заменяет полноценный security audit.
