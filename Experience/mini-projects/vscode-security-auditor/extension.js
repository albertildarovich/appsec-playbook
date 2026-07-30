// ==============================
// VSCode Security Auditor
// ==============================

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// --- Checklist Items for Code Analysis ---
const CHECKS = {
  javascript: [
    {
      id: 'eval-usage',
      title: 'Использование eval()',
      severity: 'high',
      category: 'Code Injection',
      description: 'eval() выполняет произвольный код. Используйте JSON.parse() или Function конструктор с осторожностью.',
      pattern: /\beval\s*\(/g,
      message: 'Избегайте eval() — это может привести к RCE'
    },
    {
      id: 'innerHTML-usage',
      title: 'innerHTML / outerHTML',
      severity: 'high',
      category: 'XSS',
      description: 'Вставка через innerHTML может привести к XSS. Используйте textContent или createElement.',
      pattern: /\.innerHTML\s*=/g,
      message: 'innerHTML может привести к XSS. Используйте textContent'
    },
    {
      id: 'document-write',
      title: 'document.write()',
      severity: 'medium',
      category: 'XSS',
      description: 'document.write() может быть использован для XSS атак.',
      pattern: /document\.write\s*\(/g,
      message: 'Избегайте document.write()'
    },
    {
      id: 'localStorage-sensitive',
      title: 'Секреты в localStorage',
      severity: 'high',
      category: 'Data Storage',
      description: 'Хранение токенов/ключей в localStorage небезопасно. Используйте httpOnly cookies.',
      pattern: /localStorage\.(setItem|getItem)\s*\(.*(?:token|secret|key|password|jwt|session)/gi,
      message: 'Не храните секреты в localStorage'
    },
    {
      id: 'hardcoded-secrets',
      title: 'Хардкоженные секреты',
      severity: 'high',
      category: 'Secrets Management',
      description: 'В коде обнаружены потенциальные секреты, API-ключи или пароли.',
      pattern: /(?:api[_-]?(?:key|secret)|password|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi,
      message: 'Возможный хардкоженный секрет! Используйте переменные окружения'
    },
    {
      id: 'aws-key',
      title: 'AWS Access Key',
      severity: 'high',
      category: 'Secrets Management',
      description: 'AWS ключи не должны быть в коде. Используйте IAM роли или env variables.',
      pattern: /(?:AKIA[0-9A-Z]{16}|(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['"].+?['"])/g,
      message: 'AWS ключ найден в коде!'
    },
    {
      id: 'sql-concatenation',
      title: 'SQL-инъекция (конкатенация)',
      severity: 'high',
      category: 'Injection',
      description: 'Конкатенация строк в SQL запросах ведёт к SQL-инъекциям. Используйте parameterized queries.',
      pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*?['"]\s*\+\s*\w+/gis,
      message: 'Используйте parameterized queries вместо конкатенации'
    },
    {
      id: 'no-input-validation',
      title: 'Отсутствие валидации ввода',
      severity: 'medium',
      category: 'Input Validation',
      description: 'Параметры функций обрабатываются без проверки. Добавьте валидацию.',
      pattern: /function\s+\w+\s*\(.*\)\s*\{[^}]*?(?:\.innerHTML|\.html\(|\.append\(|\.prepend\()/gs,
      message: 'Добавьте валидацию входящих данных'
    },
    {
      id: 'crypto-weak',
      title: 'Слабый шифровальный алгоритм',
      severity: 'medium',
      category: 'Cryptography',
      description: 'MD5, SHA1 считаются небезопасными. Используйте SHA256/512 или bcrypt.',
      pattern: /(?:MD5|SHA1|sha1|md5)\s*\(/g,
      message: 'Используйте современные алгоритмы (SHA256, bcrypt)'
    },
    {
      id: 'debug-code',
      title: 'Отладочный код в production',
      severity: 'low',
      category: 'Information Disclosure',
      description: 'console.log, debugger и отладочные комментарии не должны быть в production.',
      pattern: /(?:console\.(?:log|debug|trace)|debugger;)/g,
      message: 'Удалите отладочный код перед production'
    },
    {
      id: 'insecure-regex',
      title: 'Потенциальный ReDoS',
      severity: 'medium',
      category: 'Input Validation',
      description: 'Regex с повторяющимися группами может быть уязвим к ReDoS атакам.',
      pattern: /\(.+\)\+(?:.*\1)?\s*\*/g,
      message: 'Проверьте регулярное выражение на ReDoS уязвимости'
    },
    {
      id: 'path-traversal',
      title: 'Path Traversal',
      severity: 'high',
      category: 'Injection',
      description: 'Работа с файловыми путями без валидации может привести к path traversal.',
      pattern: /(?:readFile|writeFile|readFileSync|writeFileSync|join)\s*\([^)]*\.\.\//g,
      message: 'Проверьте file path на path traversal'
    },
    {
      id: 'no-csp',
      title: 'Отсутствие CSP мета-тега',
      severity: 'medium',
      category: 'Content Security',
      description: 'HTML не содержит Content-Security-Policy мета-тег.',
      pattern: null,
      fileType: 'html',
      check: (content) => !/content-security-policy/i.test(content),
      message: 'Добавьте CSP мета-тег'
    }
  ],
  python: [
    {
      id: 'py-eval',
      title: 'Использование eval()/exec()',
      severity: 'high',
      category: 'Code Injection',
      description: 'eval()/exec() выполняют произвольный код. Избегайте их использования с пользовательским вводом.',
      pattern: /(?:eval|exec)\s*\(/g,
      message: 'Избегайте eval()/exec() — риск RCE'
    },
    {
      id: 'py-pickle',
      title: 'Pickle с ненадёжными данными',
      severity: 'high',
      category: 'Deserialization',
      description: 'unpickle() может выполнить произвольный код при десериализации.',
      pattern: /pickle\.loads?\s*\(/g,
      message: 'Используйте JSON или безопасные форматы вместо pickle'
    },
    {
      id: 'py-sql-injection',
      title: 'SQL-инъекция (f-string)',
      severity: 'high',
      category: 'Injection',
      description: 'f-strings в SQL запросах ведут к SQL-инъекциям.',
      pattern: /(?:cursor\.execute|connection\.execute)\s*\(\s*f['"]/g,
      message: 'Используйте parameterized queries вместо f-strings'
    },
    {
      id: 'py-subprocess-shell',
      title: 'shell=True в subprocess',
      severity: 'high',
      category: 'Command Injection',
      description: 'shell=True позволяет инъекцию команд. Укажите shell=False или используйте список аргументов.',
      pattern: /subprocess\.(?:call|Popen|run)\([^)]*shell\s*=\s*True/g,
      message: 'Избегайте shell=True — риск command injection'
    },
    {
      id: 'py-request-timeout',
      title: 'requests без timeout',
      severity: 'medium',
      category: 'Network Security',
      description: 'HTTP запросы без timeout могут привести к зависанию приложения.',
      pattern: /requests\.(?:get|post|put|delete)\([^)]*(?!timeout)/g,
      message: 'Добавьте timeout к HTTP запросам'
    },
    {
      id: 'py-hardcoded-secrets',
      title: 'Хардкоженные пароли/ключи',
      severity: 'high',
      category: 'Secrets Management',
      description: 'Пароли и ключи не должны быть в коде.',
      pattern: /(?:PASSWORD|SECRET|API_KEY|TOKEN)\s*=\s*['"][A-Za-z0-9_\-@#$%^&+=]{8,}['"]/g,
      message: 'Используйте переменные окружения для секретов'
    },
    {
      id: 'py-os-system',
      title: 'os.system() / os.popen()',
      severity: 'high',
      category: 'Command Injection',
      description: 'os.system() и os.popen() подвержены command injection.',
      pattern: /os\.(?:system|popen)\s*\(/g,
      message: 'Используйте subprocess с shell=False'
    }
  ],
  dockerfile: [
    {
      id: 'docker-root',
      title: 'Запуск от root',
      severity: 'medium',
      category: 'Privilege Escalation',
      description: 'Контейнер запускается от root. Используйте USER для запуска от непривилегированного пользователя.',
      pattern: /^FROM\s+/gim,
      check: (content) => {
        const lastUser = [...content.matchAll(/^USER\s+(\w+)/gim)];
        const fromLines = content.match(/^FROM\s+/gim);
        return !lastUser.length && fromLines?.length > 0;
      },
      message: 'Добавьте USER <non-root> в Dockerfile'
    },
    {
      id: 'docker-latest-tag',
      title: 'Использование :latest тега',
      severity: 'low',
      category: 'Supply Chain',
      description: 'Тег :latest может привести к непредсказуемым обновлениям. Фиксируйте версию.',
      pattern: /FROM\s+\S+:latest/gim,
      message: 'Укажите конкретную версию вместо :latest'
    },
    {
      id: 'docker-add-vs-copy',
      title: 'ADD вместо COPY',
      severity: 'low',
      category: 'Best Practices',
      description: 'ADD имеет неожиданные функции (распаковка архивов). Лучше использовать COPY.',
      pattern: /^ADD\s+/gim,
      message: 'Используйте COPY вместо ADD (если не нужна распаковка архивов)'
    },
    {
      id: 'docker-env-secrets',
      title: 'Секреты в ENV',
      severity: 'high',
      category: 'Secrets Management',
      description: 'Хранение секретов в ENV в Dockerfile. Используйте Docker secrets или build args.',
      pattern: /ENV\s+(?:PASSWORD|SECRET|TOKEN|API_KEY|PASS|KEY)\s*=/gi,
      message: 'Не храните секреты в ENV. Используйте --secret или build args'
    },
    {
      id: 'docker-apt-no-rm',
      title: 'apt-get без --no-install-recommends',
      severity: 'info',
      category: 'Best Practices',
      description: 'Без --no-install-recommends устанавливаются лишние пакеты, увеличивая surface attack.',
      pattern: /apt-get\s+install/g,
      check: (content) => {
        const aptInstall = [...content.matchAll(/apt-get\s+install/g)];
        const noRecommends = content.includes('--no-install-recommends');
        return aptInstall.length > 0 && !noRecommends;
      },
      message: 'Добавьте --no-install-recommends к apt-get install'
    }
  ],
  yaml: [
    {
      id: 'k8s-privileged',
      title: 'Privileged контейнер',
      severity: 'high',
      category: 'Kubernetes',
      description: 'Контейнер с privileged: true имеет неограниченный доступ к хосту.',
      pattern: /privileged:\s*true/g,
      message: 'Избегайте privileged: true'
    },
    {
      id: 'k8s-run-as-root',
      title: 'Запуск от root (securityContext)',
      severity: 'medium',
      category: 'Kubernetes',
      description: 'Если runAsNonRoot: true не задан, контейнер может запуститься от root.',
      pattern: /securityContext:/g,
      check: (content) => {
        // Проверяем, есть ли securityContext без runAsNonRoot
        const contexts = content.split('securityContext:');
        for (const ctx of contexts.slice(1)) {
          if (!ctx.includes('runAsNonRoot')) return true;
        }
        return false;
      },
      message: 'Добавьте runAsNonRoot: true в securityContext'
    },
    {
      id: 'k8s-host-network',
      title: 'hostNetwork: true',
      severity: 'high',
      category: 'Kubernetes',
      description: 'hostNetwork даёт контейнеру доступ к сетевому стеку хоста.',
      pattern: /hostNetwork:\s*true/g,
      message: 'Избегайте hostNetwork: true'
    },
    {
      id: 'k8s-read-only-rootfs',
      title: 'readOnlyRootFilesystem не задан',
      severity: 'medium',
      category: 'Kubernetes',
      description: 'Контейнер может писать в файловую систему. Установите readOnlyRootFilesystem: true.',
      pattern: /securityContext:/g,
      check: (content) => {
        const contexts = content.split('securityContext:');
        for (const ctx of contexts.slice(1)) {
          if (!ctx.includes('readOnlyRootFilesystem')) return true;
        }
        return false;
      },
      message: 'Добавьте readOnlyRootFilesystem: true'
    }
  ],
  html: [
    {
      id: 'html-no-csp',
      title: 'Отсутствие CSP',
      severity: 'high',
      category: 'Content Security',
      description: 'HTML не содержит Content-Security-Policy.',
      pattern: /<meta[^>]*http-equiv=["']Content-Security-Policy["']/i,
      check: (content) => !/Content-Security-Policy/i.test(content),
      message: 'Добавьте Content-Security-Policy'
    },
    {
      id: 'html-inline-scripts',
      title: 'Инлайн-скрипты',
      severity: 'medium',
      category: 'XSS Prevention',
      description: 'Инлайн-скрипты без nonce. Используйте nonce или вынесите в отдельные файлы.',
      pattern: /<script[\s>](?!.*src=)(?!.*nonce=)[\s\S]*?<\/script>/gi,
      message: 'Используйте nonce или вынесите скрипты в отдельные файлы'
    },
    {
      id: 'html-autocomplete-off',
      title: 'Автозаполнение на sensitive полях',
      severity: 'medium',
      category: 'Forms Security',
      description: 'Поля ввода паролей должны иметь autocomplete="off".',
      pattern: /<input[^>]*type=["']password["'][^>]*(?!autocomplete)/gi,
      message: 'Добавьте autocomplete="off" к полям паролей'
    }
  ]
};

// --- Diagnostics Collection ---
const diagnostics = vscode.languages.createDiagnosticCollection('security-auditor');

// --- Severity Mapping ---
function severityToDiagnostic(severity) {
  switch (severity) {
    case 'high': return vscode.DiagnosticSeverity.Error;
    case 'medium': return vscode.DiagnosticSeverity.Warning;
    case 'low': return vscode.DiagnosticSeverity.Information;
    default: return vscode.DiagnosticSeverity.Hint;
  }
}

// --- Scan File ---
async function scanFile(document) {
  if (!document) return;

  const config = vscode.workspace.getConfiguration('securityAuditor');
  if (!config.get('enable')) return;

  const severityThreshold = config.get('severityThreshold', 'medium');
  const severityLevels = { 'info': 0, 'low': 1, 'medium': 2, 'high': 3 };
  const minLevel = severityLevels[severityThreshold] || 2;

  const fileName = document.fileName;
  const ext = path.extname(fileName).slice(1);
  const langId = document.languageId;
  const content = document.getText();

  const findings = [];

  // Determine which checks to run based on file type
  let applicableChecks = [];
  
  // Map languageId/file extension to check groups
  const langMap = {
    'javascript': 'javascript',
    'typescript': 'javascript',
    'javascriptreact': 'javascript',
    'typescriptreact': 'javascript',
    'python': 'python',
    'dockerfile': 'dockerfile',
    'yaml': 'yaml',
    'json': null,
    'html': 'html',
    'shellscript': null
  };

  const checkType = langMap[langId] || (CHECKS[ext] ? ext : null);
  
  if (checkType && CHECKS[checkType]) {
    applicableChecks = CHECKS[checkType];
  } else {
    // Try generic checks for any code file
    applicableChecks = [
      {
        id: 'hardcoded-secrets-generic',
        title: 'Потенциальные секреты',
        severity: 'high',
        category: 'Secrets Management',
        pattern: /(?:password|secret|token|api_key|api_secret)\s*[:=]\s*['"][A-Za-z0-9_\-@#$%^&+=]{16,}['"]/gi,
        message: 'Потенциальный секрет в коде'
      }
    ];
  }

  if (!applicableChecks.length) return;

  // Run checks
  applicableChecks.forEach(check => {
    const severityValue = severityLevels[check.severity] || 0;
    if (severityValue < minLevel) return;

    let matches = [];

    if (check.check) {
      // Custom check function
      try {
        const result = check.check(content);
        if (result) {
          matches.push({ start: 0, end: 0 }); // highlight first line
        }
      } catch (e) {
        // skip
      }
    } else if (check.pattern) {
      // Regex pattern
      const regex = new RegExp(check.pattern.source, check.pattern.flags.includes('g') ? check.pattern.flags : check.pattern.flags + 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0].trim().substring(0, 80)
        });
      }
    }

    matches.forEach(m => {
      const startPos = document.positionAt(m.start);
      const endPos = document.positionAt(m.end || m.start + 1);
      
      findings.push({
        range: new vscode.Range(startPos, endPos),
        message: `${check.message} [${check.category}]`,
        severity: severityToDiagnostic(check.severity),
        code: check.id,
        source: 'Security Auditor',
        tags: check.severity === 'high' ? [vscode.DiagnosticTag.Unnecessary] : []
      });

      // Save for report
      check._lastFindings = check._lastFindings || [];
      check._lastFindings.push({
        line: startPos.line + 1,
        file: path.basename(fileName),
        snippet: m.text || ''
      });
    });
  });

  // Update diagnostics
  if (findings.length > 0) {
    diagnostics.set(document.uri, findings);
  } else {
    // Clear diagnostics for this file if no issues
    if (diagnostics.has(document.uri)) {
      const existing = diagnostics.get(document.uri);
      if (existing?.length > 0) {
        diagnostics.set(document.uri, []);
      }
    }
  }

  // Refresh tree view
  if (treeProvider) treeProvider.refresh();

  return findings;
}

// --- Scan Workspace ---
async function scanWorkspace() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage('[NO] Откройте проект для сканирования');
    return;
  }

  const files = await vscode.workspace.findFiles(
    '{**/*.js,**/*.ts,**/*.py,**/*.html,**/*.yml,**/*.yaml,**/Dockerfile,**/docker-compose*}',
    '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/vendor/**}'
  );

  if (files.length === 0) {
    vscode.window.showInformationMessage('🔍 Не найдено файлов для сканирования');
    return;
  }

  const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: '🔍 Security Audit: сканирование проекта...',
    cancellable: true
  };

  let totalFindings = 0;
  let scannedFiles = 0;

  await vscode.window.withProgress(progressOptions, async (progress, token) => {
    for (let i = 0; i < files.length; i++) {
      if (token.isCancellationRequested) break;

      const file = files[i];
      progress.report({
        message: `${i + 1}/${files.length}: ${path.basename(file.fsPath)}`,
        increment: (100 / files.length)
      });

      try {
        const doc = await vscode.workspace.openTextDocument(file);
        const findings = await scanFile(doc);
        if (findings) totalFindings += findings.length;
        scannedFiles++;
      } catch (e) {
        // skip binary files
      }
    }
  });

  // Refresh tree
  if (treeProvider) treeProvider.refresh();

  if (totalFindings > 0) {
    vscode.window.showWarningMessage(
      `🔍 Сканирование завершено: ${scannedFiles} файлов, найдено ${totalFindings} проблем`,
      'Показать результаты'
    ).then(selection => {
      if (selection === 'Показать результаты') {
        showResults();
      }
    });
  } else {
    vscode.window.showInformationMessage(
      `[OK] Сканирование завершено: ${scannedFiles} файлов, проблем не найдено`
    );
  }
}

// --- Show Results Panel ---
function showResults() {
  const panel = vscode.window.createOutputChannel('Security Auditor');
  panel.clear();

  let bySeverity = { high: [], medium: [], low: [], info: [] };
  let total = 0;

  // Collect all diagnostics
  for (const [uri, diags] of diagnostics) {
    diags.forEach(d => {
      const severity = d.severity === vscode.DiagnosticSeverity.Error ? 'high' :
                       d.severity === vscode.DiagnosticSeverity.Warning ? 'medium' :
                       d.severity === vscode.DiagnosticSeverity.Information ? 'low' : 'info';
      
      bySeverity[severity].push({
        file: vscode.workspace.asRelativePath(uri),
        line: d.range.start.line + 1,
        message: d.message,
        severity
      });
      total++;
    });
  }

  if (total === 0) {
    panel.appendLine('[OK] Проблем не найдено. Отличная работа!');
    panel.show();
    return;
  }

  panel.appendLine('='.repeat(70));
  panel.appendLine('  🛡  SECURITY AUDITOR - РЕЗУЛЬТЫ СКАНИРОВАНИЯ');
  panel.appendLine('='.repeat(70));
  panel.appendLine(`  Всего найдено: ${total} проблем`);
  panel.appendLine(`  [CRIT] Высоких: ${bySeverity.high.length}`);
  panel.appendLine(`  [MED] Средних: ${bySeverity.medium.length}`);
  panel.appendLine(`  🔵 Низких: ${bySeverity.low.length}`);
  panel.appendLine(`  ⚪ Инфо: ${bySeverity.info.length}`);
  panel.appendLine('-'.repeat(70));
  panel.appendLine('');

  ['high', 'medium', 'low', 'info'].forEach(severity => {
    if (bySeverity[severity].length === 0) return;

    const labels = {
      high: '[CRIT] ВЫСОКИЙ ПРИОРИТЕТ',
      medium: '[MED] СРЕДНИЙ ПРИОРИТЕТ',
      low: '🔵 НИЗКИЙ ПРИОРИТЕТ',
      info: '⚪ ИНФО'
    };

    panel.appendLine(`  ${labels[severity]}:`);
    panel.appendLine('');

    bySeverity[severity].forEach((item, i) => {
      panel.appendLine(`    ${i + 1}. ${item.file}:${item.line}`);
      panel.appendLine(`       ${item.message}`);
    });
    panel.appendLine('');
  });

  panel.appendLine('-'.repeat(70));
  panel.appendLine('  Сгенерировано: ' + new Date().toLocaleString());
  panel.appendLine('='.repeat(70));

  panel.show();
}

// --- Export Report ---
async function exportReport() {
  const report = {
    timestamp: new Date().toISOString(),
    workspace: vscode.workspace.name || 'unknown',
    summary: { high: 0, medium: 0, low: 0, info: 0, total: 0 },
    findings: []
  };

  for (const [uri, diags] of diagnostics) {
    diags.forEach(d => {
      const severity = d.severity === vscode.DiagnosticSeverity.Error ? 'high' :
                       d.severity === vscode.DiagnosticSeverity.Warning ? 'medium' :
                       d.severity === vscode.DiagnosticSeverity.Information ? 'low' : 'info';
      
      report.summary[severity]++;
      report.summary.total++;
      report.findings.push({
        file: vscode.workspace.asRelativePath(uri),
        line: d.range.start.line + 1,
        severity,
        message: d.message,
        code: d.code
      });
    });
  }

  const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri;
  const fileUri = await vscode.window.showSaveDialog({
    defaultUri: defaultUri ? vscode.Uri.joinPath(defaultUri, 'security-audit-report.json') : undefined,
    filters: { 'JSON': ['json'] }
  });

  if (fileUri) {
    fs.writeFileSync(fileUri.fsPath, JSON.stringify(report, null, 2));
    vscode.window.showInformationMessage(`[OK] Отчёт сохранён: ${fileUri.fsPath}`);
  }
}

// --- Clear Results ---
function clearResults() {
  diagnostics.clear();
  if (treeProvider) treeProvider.refresh();
  updateStatusBar();
  vscode.window.showInformationMessage('🧹 Результаты очищены');
}

// --- Status Bar ---
let statusBarItem;

function updateStatusBar() {
  if (!statusBarItem) {
    statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }

  let totalIssues = 0;
  let highIssues = 0;

  for (const [, diags] of diagnostics) {
    diags.forEach(d => {
      totalIssues++;
      if (d.severity === vscode.DiagnosticSeverity.Error) highIssues++;
    });
  }

  if (totalIssues > 0) {
    statusBarItem.text = `🛡 $(warning) ${totalIssues} issue${totalIssues > 1 ? 's' : ''}` +
      (highIssues > 0 ? ` (${highIssues} high)` : '');
    statusBarItem.tooltip = 'Security Auditor: нажмите для просмотра результатов';
    statusBarItem.command = 'security-auditor.showResults';
    statusBarItem.backgroundColor = highIssues > 0 ? new vscode.ThemeColor('statusBarItem.errorBackground') : undefined;
    statusBarItem.show();
  } else {
    statusBarItem.text = '🛡 $(check)';
    statusBarItem.tooltip = 'Security Auditor: проблем не найдено';
    statusBarItem.command = 'security-auditor.showResults';
    statusBarItem.backgroundColor = undefined;
    statusBarItem.show();
  }
}

// ==============================
// TreeView Provider — дерево уязвимостей в сайдбаре
// ==============================

class SecurityTreeDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.items = [];
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (!element) {
      return this.buildTree();
    }
    if (element.children) {
      return element.children;
    }
    return [];
  }

  buildTree() {
    const tree = [];
    let byFile = new Map();

    // Собираем диагностики по файлам
    for (const [uri, diags] of diagnostics) {
      if (diags.length === 0) continue;
      const filePath = vscode.workspace.asRelativePath(uri);
      const fileItem = new vscode.TreeItem(
        ` ${filePath}`,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      fileItem.id = uri.toString();
      fileItem.contextValue = 'file';
      fileItem.command = {
        command: 'vscode.open',
        arguments: [uri],
        title: 'Open File'
      };
      fileItem.tooltip = `${diags.length} проблем`;

      const children = diags.map(d => {
        const icon = d.severity === vscode.DiagnosticSeverity.Error ? '[CRIT]' :
                     d.severity === vscode.DiagnosticSeverity.Warning ? '[MED]' :
                     d.severity === vscode.DiagnosticSeverity.Information ? '🔵' : '⚪';
        
        const issueItem = new vscode.TreeItem(
          `${icon} Ln ${d.range.start.line + 1}: ${d.message}`,
          vscode.TreeItemCollapsibleState.None
        );
        issueItem.id = `${uri.toString()}-${d.range.start.line}`;
        issueItem.command = {
          command: 'vscode.open',
          arguments: [uri, { selection: d.range }],
          title: 'Go to issue'
        };
        issueItem.contextValue = 'issue';
        issueItem.tooltip = d.message;
        return issueItem;
      });
      fileItem.children = children;
      tree.push(fileItem);
    }

    if (tree.length === 0) {
      const emptyItem = new vscode.TreeItem(
        '[OK] Проблем не найдено',
        vscode.TreeItemCollapsibleState.None
      );
      emptyItem.tooltip = 'Запустите сканирование (Cmd+Shift+S)';
      return [emptyItem];
    }

    // Добавляем сводку сверху
    let high = 0, medium = 0, low = 0;
    for (const [, diags] of diagnostics) {
      diags.forEach(d => {
        if (d.severity === vscode.DiagnosticSeverity.Error) high++;
        else if (d.severity === vscode.DiagnosticSeverity.Warning) medium++;
        else if (d.severity === vscode.DiagnosticSeverity.Information) low++;
      });
    }

    const summaryItem = new vscode.TreeItem(
      `🔍 ${high+medium+low} проблем: [CRIT]${high} [MED]${medium} 🔵${low}`,
      vscode.TreeItemCollapsibleState.None
    );
    summaryItem.tooltip = 'Нажмите для просмотра детального отчёта';
    summaryItem.command = { command: 'security-auditor.showResults', title: 'Show Results' };
    tree.unshift(summaryItem);

    return tree;
  }
}

let treeProvider;
let treeView;

// ==============================
// Plugin Activation
// ==============================

function activate(context) {
  console.log('🛡 Security Auditor активирован');

  // Register TreeView
  treeProvider = new SecurityTreeDataProvider();
  treeView = vscode.window.createTreeView('securityAuditorView', {
    treeDataProvider: treeProvider
  });
  context.subscriptions.push(treeView);

  // Register commands
  const scanFileCmd = vscode.commands.registerCommand('security-auditor.scanFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await scanFile(editor.document);
      updateStatusBar();
      vscode.window.showInformationMessage(
        `🔍 Файл проверен. Откройте Problems panel (Ctrl+Shift+M) для просмотра`
      );
    }
  });

  const scanWorkspaceCmd = vscode.commands.registerCommand('security-auditor.scanWorkspace', async () => {
    await scanWorkspace();
    updateStatusBar();
  });

  const showResultsCmd = vscode.commands.registerCommand('security-auditor.showResults', () => {
    showResults();
  });

  const exportReportCmd = vscode.commands.registerCommand('security-auditor.exportReport', () => {
    exportReport();
  });

  const clearResultsCmd = vscode.commands.registerCommand('security-auditor.clearResults', () => {
    clearResults();
    updateStatusBar();
  });

  context.subscriptions.push(
    scanFileCmd, scanWorkspaceCmd, showResultsCmd,
    exportReportCmd, clearResultsCmd,
    diagnostics
  );

  // Auto-scan on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const config = vscode.workspace.getConfiguration('securityAuditor');
      if (config.get('scanOnSave')) {
        await scanFile(document);
        updateStatusBar();
      }
    })
  );

  // Update status bar on changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => updateStatusBar())
  );

  // Initial scan of active file
  if (vscode.window.activeTextEditor) {
    const config = vscode.workspace.getConfiguration('securityAuditor');
    if (config.get('enable')) {
      scanFile(vscode.window.activeTextEditor.document);
      updateStatusBar();
    }
  }

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('securityAuditor')) {
        if (vscode.window.activeTextEditor) {
          scanFile(vscode.window.activeTextEditor.document);
          updateStatusBar();
        }
      }
    })
  );
}

function deactivate() {
  diagnostics.clear();
  if (statusBarItem) statusBarItem.dispose();
}

module.exports = { activate, deactivate };
