// ==============================
// Security Auditor - Popup Script
// ==============================

// --- Checklist Definition (OWASP-based) ---
const CHECKLIST = [
  {
    id: 'https',
    title: 'HTTPS используется',
    category: 'Transport Security',
    severity: 'high',
    description: 'Страница должна использовать HTTPS для защиты данных при передаче. Проверьте, что URL начинается с https://',
    check: async (url) => url.startsWith('https://'),
    autoCheckable: true
  },
  {
    id: 'hsts',
    title: 'HSTS Header присутствует',
    category: 'Transport Security',
    severity: 'high',
    description: 'HTTP Strict-Transport-Security header принуждает браузер использовать HTTPS. Ожидается: max-age >= 31536000',
    check: async (url, headers) => !!headers?.['strict-transport-security'],
    autoCheckable: true
  },
  {
    id: 'x-frame-options',
    title: 'X-Frame-Options или CSP frame-ancestors',
    category: 'Clickjacking Protection',
    severity: 'medium',
    description: 'Защита от clickjacking: заголовок X-Frame-Options (DENY/SAMEORIGIN) или CSP frame-ancestors',
    check: async (url, headers) => {
      const xfo = headers?.['x-frame-options'];
      const csp = headers?.['content-security-policy'];
      return !!(xfo || (csp && csp.includes('frame-ancestors')));
    },
    autoCheckable: true
  },
  {
    id: 'x-content-type-options',
    title: 'X-Content-Type-Options: nosniff',
    category: 'MIME Security',
    severity: 'medium',
    description: 'Запрещает MIME-сниффинг, защищая от атак, основанных на несоответствии MIME-типов',
    check: async (url, headers) => headers?.['x-content-type-options'] === 'nosniff',
    autoCheckable: true
  },
  {
    id: 'content-security-policy',
    title: 'Content-Security-Policy',
    category: 'Content Security',
    severity: 'high',
    description: 'CSP снижает риск XSS-атак, ограничивая источники загружаемых ресурсов',
    check: async (url, headers) => !!headers?.['content-security-policy'],
    autoCheckable: true
  },
  {
    id: 'x-xss-protection',
    title: 'X-XSS-Protection',
    category: 'XSS Protection',
    severity: 'low',
    description: 'Хотя этот заголовок устарел в современных браузерах, его наличие может помочь в старых версиях',
    check: async (url, headers) => {
      const val = headers?.['x-xss-protection'];
      return val === '1; mode=block' || val === '1';
    },
    autoCheckable: true
  },
  {
    id: 'referrer-policy',
    title: 'Referrer-Policy установлен',
    category: 'Privacy',
    severity: 'medium',
    description: 'Контролирует, сколько информации о реферере передается при переходе по ссылкам',
    check: async (url, headers) => !!headers?.['referrer-policy'],
    autoCheckable: true
  },
  {
    id: 'cookies-secure',
    title: 'Куки с флагом Secure',
    category: 'Cookie Security',
    severity: 'high',
    description: 'Куки должны использовать флаг Secure, чтобы передаваться только по HTTPS',
    check: async (url, headers, cookies) => {
      if (!cookies || cookies.length === 0) return true; // no cookies = no issue
      return cookies.every(c => c.secure);
    },
    autoCheckable: true
  },
  {
    id: 'cookies-httponly',
    title: 'Куки с флагом HttpOnly',
    category: 'Cookie Security',
    severity: 'high',
    description: 'HttpOnly куки недоступны через JavaScript, что снижает риск XSS-кражи кук',
    check: async (url, headers, cookies) => {
      if (!cookies || cookies.length === 0) return true;
      const sessionCookies = cookies.filter(c => c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('token'));
      if (sessionCookies.length === 0) return true;
      return sessionCookies.some(c => c.httpOnly);
    },
    autoCheckable: true
  },
  {
    id: 'cookies-samesite',
    title: 'Куки с SameSite',
    category: 'Cookie Security',
    severity: 'medium',
    description: 'SameSite=Lax или Strict предотвращает CSRF-атаки через межсайтовые запросы',
    check: async (url, headers, cookies) => {
      if (!cookies || cookies.length === 0) return true;
      return cookies.some(c => c.sameSite === 'lax' || c.sameSite === 'strict' || c.sameSite === 'Lax' || c.sameSite === 'Strict');
    },
    autoCheckable: true
  },
  {
    id: 'no-inline-scripts',
    title: 'Нет инлайн-скриптов (CSP nonce)',
    category: 'XSS Prevention',
    severity: 'medium',
    description: 'При использовании CSP, инлайн-скрипты должны быть разрешены только через nonce или hash',
    check: async () => null, // manual check
    autoCheckable: false
  },
  {
    id: 'autocomplete-off-sensitive',
    title: 'Автозаполнение отключено для sensitive полей',
    category: 'Forms Security',
    severity: 'medium',
    description: 'Поля ввода паролей, номеров карт и других чувствительных данных должны иметь autocomplete="off"',
    check: async () => null, // manual check
    autoCheckable: false
  },
  {
    id: 'password-field-type',
    title: 'Пароли используют input type="password"',
    category: 'Forms Security',
    severity: 'high',
    description: 'Поля для ввода паролей должны использовать type="password" для маскировки ввода',
    check: async () => null, // manual check
    autoCheckable: false
  },
  {
    id: 'open-ports-check',
    title: 'Проверка открытых портов (базовая)',
    category: 'Infrastructure',
    severity: 'info',
    description: 'Вручную проверьте, какие порты открыты на сервере. Не должно быть открыто лишних сервисов',
    check: async () => null,
    autoCheckable: false
  },
  {
    id: 'server-header',
    title: 'Server header не раскрывает версию',
    category: 'Information Disclosure',
    severity: 'low',
    description: 'Server header не должен содержать детальной информации о версии ПО',
    check: async (url, headers) => {
      const server = headers?.['server'];
      if (!server) return true;
      // Warn if version is exposed
      return !/\d+\.\d+/.test(server);
    },
    autoCheckable: true
  },
  {
    id: 'x-powered-by',
    title: 'X-Powered-By отсутствует',
    category: 'Information Disclosure',
    severity: 'low',
    description: 'Заголовок X-Powered-By раскрывает технологию на сервере, лучше его удалить',
    check: async (url, headers) => !headers?.['x-powered-by'],
    autoCheckable: true
  },
  {
    id: 'form-input-validation',
    title: 'Валидация форм на сервере (предполагается)',
    category: 'Input Validation',
    severity: 'high',
    description: 'Убедитесь, что все входящие данные валидируются на сервере. Клиентская валидация недостаточна',
    check: async () => null,
    autoCheckable: false
  },
  {
    id: 'sql-injection-test',
    title: 'Тест SQL-инъекций (базовый)',
    category: 'Injection',
    severity: 'high',
    description: 'Проверьте ввод кавычек (\') или SQL-команд в поля ввода. Наблюдайте за ошибками или изменениями в поведении',
    check: async () => null,
    autoCheckable: false
  },
  {
    id: 'xss-test',
    title: 'Тест XSS (базовый)',
    category: 'XSS',
    severity: 'high',
    description: 'Попробуйте ввести <script>alert(1)</script> в поля ввода. Если появляется alert — есть XSS уязвимость',
    check: async () => null,
    autoCheckable: false
  },
  {
    id: 'directory-listing',
    title: 'Directory Listing отключен',
    category: 'Information Disclosure',
    severity: 'medium',
    description: 'Проверьте, отключен ли листинг директорий на сервере (попробуйте зайти на /, /images, /css)',
    check: async () => null,
    autoCheckable: false
  },
  {
    id: 'cors-policy',
    title: 'CORS политика настроена безопасно',
    category: 'Cross-Origin',
    severity: 'medium',
    description: 'Access-Control-Allow-Origin не должен быть "*" для production, если не требуется публичный API',
    check: async (url, headers) => {
      const acao = headers?.['access-control-allow-origin'];
      if (!acao) return true;
      return acao !== '*';
    },
    autoCheckable: true
  },
  {
    id: 'permissions-policy',
    title: 'Permissions-Policy header',
    category: 'Privacy',
    severity: 'low',
    description: 'Permissions-Policy (ранее Feature-Policy) ограничивает доступ к API браузера (камера, геолокация и т.д.)',
    check: async (url, headers) => !!headers?.['permissions-policy'] || !!headers?.['feature-policy'],
    autoCheckable: true
  },
  {
    id: 'subresource-integrity',
    title: 'Subresource Integrity (SRI) для внешних ресурсов',
    category: 'Supply Chain',
    severity: 'medium',
    description: 'Внешние скрипты и стили должны использовать integrity атрибут для проверки целостности',
    check: async () => null,
    autoCheckable: false
  }
];

// --- State ---
let checklistState = {};
let scanResults = [];
let autoCheckResults = {};

// --- DOM References ---
const $ = (id) => document.getElementById(id);

// --- Initialize ---
document.addEventListener('DOMContentLoaded', async () => {
  // Show current URL
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tabs[0]?.url || 'unknown';
  $('currentUrl').textContent = currentUrl;

  // Load saved state
  await loadState();

  // Render checklist
  renderChecklist();

  // Setup event listeners
  setupEventListeners();
});

// --- Load State ---
async function loadState() {
  const data = await chrome.storage.local.get(['checklistState', 'scanResults']);
  checklistState = data.checklistState || {};
  scanResults = data.scanResults || [];
  autoCheckResults = {};
}

// --- Save State ---
async function saveState() {
  await chrome.storage.local.set({
    checklistState,
    scanResults
  });
}

// --- Render Checklist ---
function renderChecklist() {
  const container = $('checklistItems');
  container.innerHTML = '';

  CHECKLIST.forEach(item => {
    const state = checklistState[item.id] || { checked: false, status: 'pending' };
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.dataset.id = item.id;

    const severityClass = `badge-${item.severity}`;
    const statusLabels = {
      'pass': '<span class="item-status status-pass">✓ Пройдено</span>',
      'fail': '<span class="item-status status-fail">✗ Провалено</span>',
      'warning': '<span class="item-status status-warning">⚠ Внимание</span>',
      'pending': '<span class="item-status status-pending">○ Ожидание</span>'
    };

    div.innerHTML = `
      <div class="checklist-item-header">
        <label>
          <input type="checkbox" ${state.checked ? 'checked' : ''}>
          <span class="custom-checkbox"></span>
        </label>
        <div class="item-info">
          <div class="item-title">${item.title}</div>
          <div class="item-category">${item.category} · <span class="${severityClass}">${getSeverityLabel(item.severity)}</span></div>
          <div class="item-description">${item.description}</div>
        </div>
        ${statusLabels[state.status] || statusLabels.pending}
      </div>
    `;

    // Checkbox toggle
    const checkbox = div.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      updateItemStatus(item.id, checkbox.checked, state.status);
    });

    // Click to expand description
    const header = div.querySelector('.checklist-item-header');
    header.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const desc = div.querySelector('.item-description');
      desc.classList.toggle('expanded');
    });

    container.appendChild(div);
  });
}

function getSeverityLabel(severity) {
  const labels = {
    'high': 'Высокий',
    'medium': 'Средний',
    'low': 'Низкий',
    'info': 'Инфо'
  };
  return labels[severity] || severity;
}

// --- Update Item Status ---
function updateItemStatus(id, checked, status = 'pending') {
  if (!checklistState[id]) {
    checklistState[id] = {};
  }
  checklistState[id].checked = checked;
  if (checked && status === 'pending') {
    checklistState[id].status = 'pass';
  } else if (!checked) {
    checklistState[id].status = 'pending';
  } else {
    checklistState[id].status = status;
  }
  saveState();
  renderChecklist();
  updateReport();
}

function setItemStatus(id, status) {
  if (!checklistState[id]) {
    checklistState[id] = { checked: false };
  }
  checklistState[id].status = status;
  if (status === 'pass') {
    checklistState[id].checked = true;
  }
  saveState();
  renderChecklist();
  updateReport();
}

// --- Run Auto Checks ---
async function runAutoChecks() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;
  const url = tabs[0]?.url || '';

  if (!tabId || !url) return;

  // Check if we can run checks on this URL
  const isChromeUrl = url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:');
  
  if (isChromeUrl) {
    // On chrome:// pages, we can only check the URL
    const headers = {};
    const cookies = [];
    for (const item of CHECKLIST) {
      if (!item.autoCheckable) continue;
      if (item.id === 'https') {
        const result = url.startsWith('https://');
        setItemStatus(item.id, result ? 'pass' : 'fail');
      } else {
        setItemStatus(item.id, 'warning');
      }
    }
    updateScanResults();
    updateReport();
    return;
  }

  // Inject content script to gather page info (may fail on some pages)
  let pageData = {};
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return {
          cookies: document.cookie,
          forms: Array.from(document.forms).map(f => ({
            action: f.action,
            method: f.method,
            inputs: Array.from(f.elements).map(el => ({
              type: el.type,
              name: el.name,
              autocomplete: el.autocomplete
            }))
          })),
          scripts: Array.from(document.scripts).map(s => ({
            src: s.src,
            integrity: s.integrity
          })),
          links: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => ({
            href: l.href,
            integrity: l.integrity
          }))
        };
      }
    });
    pageData = results[0]?.result || {};
  } catch (e) {
    console.log('Cannot execute script on this page:', e);
  }

  // Get headers from background
  const headers = await getHeaders(url);
  const cookies = await getCookies(url);

  // Run through checklist
  for (const item of CHECKLIST) {
    if (!item.autoCheckable) continue;

    try {
      const result = await item.check(url, headers, cookies, pageData);
      if (result === true) {
        setItemStatus(item.id, 'pass');
        autoCheckResults[item.id] = { status: 'pass', details: 'OK' };
      } else if (result === false) {
        setItemStatus(item.id, 'fail');
        autoCheckResults[item.id] = { status: 'fail', details: 'Не пройдено' };
      }
    } catch (e) {
      console.error(`Check ${item.id} error:`, e);
      setItemStatus(item.id, 'warning');
      autoCheckResults[item.id] = { status: 'warning', details: e.message };
    }
  }

  // Update scanner tab with findings
  updateScanResults();
  updateReport();
}

// --- Get Headers ---
async function getHeaders(url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'getHeaders', url },
      (response) => {
        resolve(response?.headers || {});
      }
    );
  });
}

// --- Get Cookies ---
async function getCookies(url) {
  try {
    const cookies = await chrome.cookies?.getAll({ url });
    return cookies || [];
  } catch (e) {
    return [];
  }
}

// --- Update Scan Results ---
function updateScanResults() {
  const container = $('scanResults');
  container.innerHTML = '';

  const failures = CHECKLIST.filter(item => {
    const state = checklistState[item.id];
    return state && (state.status === 'fail' || state.status === 'warning');
  });

  if (failures.length === 0) {
    const passCount = CHECKLIST.filter(item => {
      const state = checklistState[item.id];
      return state?.status === 'pass';
    }).length;
    container.innerHTML = `<div class="scan-result-item severity-info">
      <div class="result-title">✅ Проверки выполнены</div>
      <div class="result-description">Пройдено авто-проверок: ${passCount}. Проблем не обнаружено.</div>
    </div>`;
    return;
  }

  failures.forEach(item => {
    const div = document.createElement('div');
    div.className = `scan-result-item severity-${item.severity}`;
    const status = checklistState[item.id]?.status === 'fail' ? 'Проблема' : 'Предупреждение';
    div.innerHTML = `
      <div class="result-title">${item.title}</div>
      <div class="result-description">
        <strong>${status}</strong> · ${item.category}<br>
        ${item.description}
      </div>
    `;
    container.appendChild(div);
  });
}

// --- Update Report ---
function updateReport() {
  let total = CHECKLIST.length;
  let passed = 0, failed = 0, warnings = 0;

  CHECKLIST.forEach(item => {
    const state = checklistState[item.id];
    if (!state) return;
    if (state.status === 'pass') passed++;
    else if (state.status === 'fail') failed++;
    else if (state.status === 'warning') warnings++;
  });

  $('totalChecks').textContent = total;
  $('passedChecks').textContent = passed;
  $('failedChecks').textContent = failed;
  $('warningChecks').textContent = warnings;

  const details = $('reportDetails');
  details.innerHTML = '';

  CHECKLIST.forEach(item => {
    const state = checklistState[item.id];
    if (!state || state.status === 'pending') return;

    const div = document.createElement('div');
    div.className = 'report-detail-item';
    const statusSymbols = {
      'pass': '✅',
      'fail': '❌',
      'warning': '⚠️',
      'pending': '⏳'
    };
    div.innerHTML = `
      <span class="detail-title">${statusSymbols[state.status] || ''} ${item.title}</span>
      <span class="item-status status-${state.status}">${state.status}</span>
    `;
    details.appendChild(div);
  });

  if (passed === 0 && failed === 0 && warnings === 0) {
    details.innerHTML = '<div class="placeholder">Запустите проверки для получения отчёта</div>';
  }
}

// --- Export Functions ---
function exportJSON() {
  const report = {
    url: $('currentUrl').textContent,
    timestamp: new Date().toISOString(),
    summary: {
      total: CHECKLIST.length,
      passed: parseInt($('passedChecks').textContent),
      failed: parseInt($('failedChecks').textContent),
      warnings: parseInt($('warningChecks').textContent)
    },
    results: CHECKLIST.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      severity: item.severity,
      status: checklistState[item.id]?.status || 'pending',
      description: item.description
    }))
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `security-audit-${Date.now()}.json`);
}

function exportHTML() {
  const url = $('currentUrl').textContent;
  const timestamp = new Date().toLocaleString();
  const total = parseInt($('totalChecks').textContent);
  const passed = parseInt($('passedChecks').textContent);
  const failed = parseInt($('failedChecks').textContent);
  const warnings = parseInt($('warningChecks').textContent);

  let itemsHtml = '';
  CHECKLIST.forEach(item => {
    const state = checklistState[item.id] || { status: 'pending' };
    const statusLabels = {
      'pass': '✅ Пройдено',
      'fail': '❌ Провалено',
      'warning': '⚠️ Внимание',
      'pending': '⏳ Не проверено'
    };
    itemsHtml += `
      <tr>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>${getSeverityLabel(item.severity)}</td>
        <td>${statusLabels[state.status] || '⏳ Не проверено'}</td>
      </tr>
    `;
  });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Security Audit Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #1a1b2e; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat { background: #f0f0f5; padding: 16px; border-radius: 8px; text-align: center; flex: 1; }
    .stat-value { font-size: 28px; font-weight: bold; display: block; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e0e0e8; }
    th { background: #f0f0f5; }
    .meta { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>🛡️ Security Audit Report</h1>
  <p class="meta">URL: ${url}<br>Дата: ${timestamp}</p>
  <div class="summary">
    <div class="stat"><span class="stat-value">${total}</span>Всего</div>
    <div class="stat"><span class="stat-value" style="color:#22c55e">${passed}</span>Пройдено</div>
    <div class="stat"><span class="stat-value" style="color:#ef4444">${failed}</span>Провалено</div>
    <div class="stat"><span class="stat-value" style="color:#eab308">${warnings}</span>Предупреждений</div>
  </div>
  <table>
    <thead>
      <tr><th>Проверка</th><th>Категория</th><th>Важность</th><th>Статус</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <p class="meta" style="margin-top: 30px;">Сгенерировано Security Auditor Chrome Extension</p>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, `security-audit-${Date.now()}.html`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Reset ---
function resetChecklist() {
  CHECKLIST.forEach(item => {
    checklistState[item.id] = { checked: false, status: 'pending' };
  });
  autoCheckResults = {};
  saveState();
  renderChecklist();
  updateReport();
  $('scanResults').innerHTML = '<div class="placeholder">Нажмите "Сканировать страницу" для начала</div>';
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $(tab.dataset.tab).classList.add('active');
    });
  });

  // Run all checks
  $('runAllChecks').addEventListener('click', async () => {
    $('runAllChecks').disabled = true;
    $('runAllChecks').textContent = '⏳ Проверка...';
    await runAutoChecks();
    $('runAllChecks').disabled = false;
    $('runAllChecks').textContent = '▶ Запустить все проверки';
    // Switch to scanner tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="scanner"]').classList.add('active');
    $('scanner').classList.add('active');
  });

  // Scan page button
  $('scanPage').addEventListener('click', async () => {
    $('scanStatus').textContent = '⏳ Сканирование...';
    $('scanStatus').classList.add('scanning');
    await runAutoChecks();
    $('scanStatus').textContent = '✅ Сканирование завершено';
    $('scanStatus').classList.remove('scanning');
  });

  // Reset
  $('resetChecklist').addEventListener('click', resetChecklist);

  // Export
  $('exportReport').addEventListener('click', exportJSON);
  $('exportHTML').addEventListener('click', exportHTML);
}
