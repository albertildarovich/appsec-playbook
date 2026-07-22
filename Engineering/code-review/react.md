# React / Next.js — Code Review Checklist

## Теория
React — client-side рендеринг со встроенной защитой от XSS (JSX экранирует вывод). Но есть специфичные для React/Next.js уязвимости.

## Что проверять

### 1. dangerouslySetInnerHTML
```tsx
// ОПАСНО: пользовательский ввод как HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// БЕЗОПАСНО: если HTML всё же нужен — санитизировать
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 2. href с пользовательским вводом
```tsx
// ОПАСНО: открытый редирект + javascript:
<a href={userInput}>link</a>

// БЕЗОПАСНО: валидация URL
function isSafeUrl(url: string): boolean {
  const allowed = ['https://trusted.com', 'https://app.example.com'];
  return allowed.some(prefix => url.startsWith(prefix));
}
```

### 3. SSTI в Next.js (getServerSideProps)
```tsx
// ОПАСНО: если в getServerSideProps передаёшь ввод в шаблонизатор
export async function getServerSideProps({ query }) {
  return { props: { name: query.name } }
}
// В шаблоне: <div>{name}</div> — безопасно (JSX экранирует)
// НО: если name используется в dangerouslySetInnerHTML — XSS
```

### 4. SSRF в Next.js API routes
```tsx
// ОПАСНО: API route делает запрос по URL из параметра
export default async function handler(req, res) {
  const { url } = req.query;
  const response = await fetch(url); // SSRF!
  res.json(await response.json());
}
```

### 5. Небезопасная сериализация
```tsx
// ОПАСНО: JSON.stringify может выполнить JS
const data = JSON.parse(someInput); // Если в someInput __proto__ pollution

// БЕЗОПАСНО: проверять прототип
const data = JSON.parse(someInput, (key, value) => {
  if (key === '__proto__') throw new Error('Prototype pollution');
  return value;
});
```

### 6. next/script
```tsx
// ОПАСНО: загрузка скрипта из непроверенного источника
<Script src={userProvidedUrl} />

// БЕЗОПАСНО: allow list доменов
```

### 7. CSP в Next.js
```tsx
// next.config.js
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline'; // ОПАСНО: unsafe-inline
  style-src 'self' 'unsafe-inline';
`;

// Лучше: nonce-based CSP
const csp = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}';
  style-src 'self' 'nonce-${nonce}';
`;
```

## Как искать
- **grep**: `dangerouslySetInnerHTML`, `innerHTML`, `__html`
- **grep**: `href={`, `src={`, `src={user` — внешние ссылки
- **grep**: `eval(`, `new Function(`, `setTimeout(` со строками
- **grep**: `JSON.parse(` — на вход пользовательские данные?
- **SAST**: Semgrep правила для React

## Типичные ошибки

| Ошибка | Риск | Как найти |
|--------|------|-----------|
| `dangerouslySetInnerHTML` | XSS | Поиск по коду |
| Открытый redirect | Phishing | Проверка `href` |
| API route без валидации | SSRF | review API routes |
| CSP с `unsafe-inline` | XSS не блокируется | Проверка next.config.js |
| Next.js middleware без auth | BOLA | Проверка middleware |

## Практика

**Из опыта**: самая частая проблема в React — разработчики ставят `dangerouslySetInnerHTML` потому что "это же просто HTML из CMS, он безопасный". CMS может быть скомпрометирована.

**Лучшая защита**:
1. Не использовать `dangerouslySetInnerHTML` — почти всегда есть альтернатива
2. Если нужно — DOMPurify
3. CSP с nonces (не с `unsafe-inline`)
4. Content-Security-Policy-Report-Only в dev, enforce в prod
5. Trusted Types API

## Lessons Learned
- React защищает от XSS, пока не используешь `dangerouslySetInnerHTML`
- `dangerouslySetInnerHTML` — red flag в каждом Code Review
- CSP с nonces сложнее настроить, но оно того стоит
- Next.js API routes — такой же attack surface как любой backend
