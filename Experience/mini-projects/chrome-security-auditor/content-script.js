// ==============================
// Security Auditor - Content Script
// ==============================

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getPageInfo':
      const pageInfo = analyzePage();
      sendResponse(pageInfo);
      break;

    case 'scanPage':
      const scanResults = performPageScan();
      sendResponse(scanResults);
      break;

    case 'highlightElements':
      highlightVulnerableElements(request.findings);
      sendResponse({ success: true });
      break;
  }
});

// Analyze page structure and gather info
function analyzePage() {
  return {
    forms: analyzeForms(),
    cookies: document.cookie,
    scripts: Array.from(document.scripts).map(s => ({
      src: s.src,
      isInline: !s.src,
      integrity: s.integrity || null,
      type: s.type
    })),
    links: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => ({
      href: l.href,
      integrity: l.integrity || null
    })),
    iframes: Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src,
      sandbox: f.sandbox?.value || ''
    })),
    formsCount: document.forms.length,
    totalScripts: document.scripts.length,
    localStorage: { ...localStorage },
    hasMixedContent: checkMixedContent()
  };
}

// Analyze forms for security issues
function analyzeForms() {
  const forms = [];
  Array.from(document.forms).forEach((form, index) => {
    const formInfo = {
      index,
      id: form.id || '(no id)',
      action: form.action,
      method: form.method.toUpperCase(),
      hasPassword: false,
      inputs: []
    };

    Array.from(form.elements).forEach(el => {
      const inputInfo = {
        name: el.name,
        type: el.type,
        autocomplete: el.autocomplete || 'not set',
        isPassword: el.type === 'password'
      };

      if (el.type === 'password') {
        formInfo.hasPassword = true;
      }

      formInfo.inputs.push(inputInfo);
    });

    forms.push(formInfo);
  });
  return forms;
}

// Check for mixed content (HTTP resources on HTTPS page)
function checkMixedContent() {
  if (window.location.protocol !== 'https:') return [];

  const mixed = [];
  
  // Check scripts
  document.querySelectorAll('script[src^="http:"]').forEach(el => {
    mixed.push({ type: 'script', src: el.src });
  });

  // Check stylesheets
  document.querySelectorAll('link[rel="stylesheet"][href^="http:"]').forEach(el => {
    mixed.push({ type: 'stylesheet', href: el.href });
  });

  // Check images
  document.querySelectorAll('img[src^="http:"]').forEach(el => {
    mixed.push({ type: 'image', src: el.src });
  });

  // Check iframes
  document.querySelectorAll('iframe[src^="http:"]').forEach(el => {
    mixed.push({ type: 'iframe', src: el.src });
  });

  return mixed;
}

// Perform active scan of the page
function performPageScan() {
  const findings = [];

  // 1. Check for inline scripts (potential XSS)
  const inlineScripts = Array.from(document.scripts).filter(s => !s.src);
  if (inlineScripts.length > 0) {
    findings.push({
      type: 'inline-scripts',
      severity: 'low',
      title: 'Инлайн-скрипты на странице',
      description: `Найдено ${inlineScripts.length} инлайн-скрипт(ов). При использовании CSP рекомендуется nonce или hash.`,
      elements: inlineScripts
    });
  }

  // 2. Check for forms without proper attributes
  Array.from(document.forms).forEach((form, i) => {
    if (!form.action || form.action === '' || form.action === window.location.href) {
      findings.push({
        type: 'form-no-action',
        severity: 'medium',
        title: `Форма #${i} без action`,
        description: 'Форма отправляет данные на текущий URL. Убедитесь, что это ожидаемое поведение.',
        element: form
      });
    }

    // Check password fields without autocomplete=off
    Array.from(form.elements).forEach(el => {
      if (el.type === 'password' && el.autocomplete !== 'off') {
        findings.push({
          type: 'password-autocomplete',
          severity: 'medium',
          title: 'Поле пароля с автозаполнением',
          description: `Поле "${el.name || '(без имени)'}" не имеет autocomplete="off"`,
          element: el
        });
      }
    });
  });

  // 3. Check mixed content
  const mixed = checkMixedContent();
  if (mixed.length > 0) {
    findings.push({
      type: 'mixed-content',
      severity: 'high',
      title: 'Смешанный контент',
      description: `Найдено ${mixed.length} ресурсов, загружаемых по HTTP на HTTPS-странице`,
      items: mixed.slice(0, 5) // limit to first 5
    });
  }

  // 4. Check for insecure localStorage usage with sensitive data
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'jwt', 'session', 'auth', 'credential', 'api_key'];
  for (const key of Object.keys(localStorage)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      findings.push({
        type: 'sensitive-localstorage',
        severity: 'high',
        title: `Чувствительные данные в localStorage: ${key}`,
        description: 'Хранение токенов и ключей в localStorage может быть небезопасным.',
        key
      });
    }
  }

  // 5. Check iframes with no sandbox
  document.querySelectorAll('iframe:not([sandbox])').forEach(iframe => {
    findings.push({
      type: 'iframe-no-sandbox',
      severity: 'medium',
      title: 'IFrame без sandbox',
      description: `IFrame (src: ${iframe.src || 'about:blank'}) не имеет sandbox-атрибута`,
      element: iframe
    });
  });

  // 6. Check for open redirects in links
  document.querySelectorAll('a[href^="//"]').forEach(a => {
    findings.push({
      type: 'protocol-relative-link',
      severity: 'low',
      title: 'Протокол-относительная ссылка',
      description: `Ссылка ${a.href} может вызвать проблемы при MIMT-атаках`,
      element: a
    });
  });

  return findings;
}

// Highlight elements on the page
function highlightVulnerableElements(findings) {
  // Remove existing highlights
  document.querySelectorAll('.sec-auditor-highlight').forEach(el => {
    el.style.outline = '';
    el.classList.remove('sec-auditor-highlight');
  });

  findings.forEach(finding => {
    if (finding.elements) {
      finding.elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.outline = '3px solid #f87171';
          el.classList.add('sec-auditor-highlight');
        }
      });
    }
    if (finding.element instanceof HTMLElement) {
      finding.element.style.outline = '3px solid #fbbf24';
      finding.element.classList.add('sec-auditor-highlight');
    }
  });
}

// Initial passive analysis (runs on page load)
(function() {
  // We just initialize and wait for commands from popup
  console.log('🛡 Security Auditor loaded on:', window.location.href);
})();
