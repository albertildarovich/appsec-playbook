// ==============================
// Security Auditor - Background Script
// ==============================

// Cache for headers collected via webRequest
const headersCache = new Map();
const HEADER_CACHE_TTL = 120000; // 2 minutes (keep longer)

// Listen for web requests to capture response headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.responseHeaders) {
      const headers = {};
      details.responseHeaders.forEach(header => {
        headers[header.name.toLowerCase()] = header.value;
      });
      
      headersCache.set(details.url, {
        headers,
        timestamp: Date.now()
      });
    }
    return { responseHeaders: details.responseHeaders };
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// Also intercept main document request to get the URL
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.type === 'main_frame' && details.responseHeaders) {
      const headers = {};
      details.responseHeaders.forEach(header => {
        headers[header.name.toLowerCase()] = header.value;
      });
      
      headersCache.set(details.url, {
        headers,
        timestamp: Date.now()
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [url, data] of headersCache.entries()) {
    if (now - data.timestamp > HEADER_CACHE_TTL) {
      headersCache.delete(url);
    }
  }
}, 30000);

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getHeaders': {
      const cached = headersCache.get(request.url);
      if (cached && (Date.now() - cached.timestamp) < HEADER_CACHE_TTL) {
        sendResponse({ headers: cached.headers });
        return false;
      }
      
      // Not in cache - try to fetch headers from the page
      // For http:// pages we use XMLHttpRequest which works better than fetch
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', request.url, true);
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED || xhr.readyState === XMLHttpRequest.DONE) {
            const headers = {};
            const headerStr = xhr.getAllResponseHeaders();
            if (headerStr) {
              headerStr.trim().split('\n').forEach(line => {
                const colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                  const name = line.substring(0, colonIdx).trim().toLowerCase();
                  const value = line.substring(colonIdx + 1).trim();
                  headers[name] = value;
                }
              });
            }
            headersCache.set(request.url, { headers, timestamp: Date.now() });
            sendResponse({ headers });
          }
        };
        xhr.onerror = () => {
          sendResponse({ headers: {} });
        };
        xhr.send();
      } catch (e) {
        sendResponse({ headers: {} });
      }
      return true; // Keep channel open for async response
    }

    case 'getPageInfo':
      // Forward request to content script
      chrome.tabs.sendMessage(sender.tab?.id, { action: 'getPageInfo' }, (response) => {
        sendResponse(response || {});
      });
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Log installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🛡 Security Auditor installed:', details.reason);
});
