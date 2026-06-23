# Frontend — Power Vital

Vue 3 + TypeScript + Vite SPA with i18n (TR/RU/KG/EN), Pinia stores, and lazy image loading.

📖 **Full repo docs**: see the [root README](../README.md).

## Quick Start

```bash
npm ci
npm run dev        # Vite dev server :5173 (proxies /api → :3000)
npm run build      # production build → dist/
npm run preview    # serve the built dist
```

## Testing

```bash
npm test              # run all Vitest suites (4 files, 41 tests, ~2s)
npm run test:watch    # watch mode for local dev

# i18n parity auditor — 100% coverage across TR/RU/KG (448 keys each)
npm run smoke:i18n

# dist smoke test — serves vite build on a local port, verifies
# routes return 200, asset Content-Type, cache headers, gzip budgets
npm run smoke:dist
```

**Test stack**: Vitest 4 + `@vue/test-utils` + `happy-dom` (10× faster than jsdom).
No network, no DB — all 41 tests run in ~2s on a developer laptop.

| Suite | Tests | What it covers |
|---|---|---|
| `useImageSrcset.test.ts` | 10 | Pure-JS srcset builder (AVIF/WebP variants) |
| `LazyImage.test.ts` | 8 | `<picture>` structure, eager/lazy, external URLs |
| `AdminMetricsWidget.test.ts` | 9 | Aggregation + template rendering (axios mocked) |
| `i18n.test.ts` | 14 | TR/RU/KG JSON parity, no empty values, sections match |

**Smoke test budgets**:

| Bundle | Budget (gzip) | Current |
|---|---|---|
| main | 180 KB | 139 KB |
| quill | 60 KB | 46 KB |
| PageBuilder | 90 KB | 68 KB |
| total JS | 700 KB | 368 KB |

## Stack

- **Vue 3.5** (composition API + `<script setup>`)
- **TypeScript 6** (strict)
- **Vite 8** (HMR, Rollup-based production build)
- **Pinia 3** (state)
- **Vue Router 5**
- **vue-i18n 9**
- **vite-plugin-pwa 1.3** (PWA manifest + service worker)

## Key Directories

```
src/
├── components/
│   ├── blocks/      # CMS blocks (HeroSlider, ProductGrid, …)
│   └── common/      # shared (LazyImage.vue, …)
├── composables/     # useTranslate, useImageSrcset, useIntersectionObserver
├── views/           # routed pages
├── stores/          # Pinia stores
└── locales/         # i18n JSON (tr.json, ru.json, kg.json, en.json)
```

## Performance Features

| Feature | Where |
|---|---|
| Lazy hydration | `useIntersectionObserver` — CrossSellGrid, etc. mount only when in viewport |
| Responsive images | `<LazyImage>` — AVIF + WebP + 600/1024/1920 srcset, prevents CLS |
| Eager above-the-fold | HeroSlider first slide + ProductDetail main image (fetchpriority=high) |
| Async decoding | All `<LazyImage>` default to `decoding="async"` |

## API Client

Uses `axios` with an interceptor that auto-refreshes the JWT on 401:
```js
// see frontend/src/utils/api.ts
api.interceptors.response.use(r => r, async err => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true;
    await api.post('/auth/refresh'); // HttpOnly cookie carries the refresh token
    return api(err.config);
  }
  throw err;
});
```

## i18n

Frontend uses `vue-i18n`. For content (product names, descriptions, accordions,
benefits, hero slides, FAQ items) it falls back to the per-record `translations`
JSON stored in the backend, served via `useTranslate().tField(record, 'name')`.

## Build Output

```
dist/
├── index.html
├── assets/         # hashed JS + CSS bundles (code-split by route)
├── uploads/        # passthrough (served by backend in prod)
└── manifest.json   # PWA manifest
```
