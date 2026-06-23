# axios → fetch migration plan

Status: **planned (not executed)** — touches 8 files, risk/benefit
unfavorable at current scale. See "When to revisit" below.

## Current state

`axios@1.17.0` is the only HTTP client across the SPA. Every
`apiGet/apiPost/apiPut/apiPatch/apiDelete` helper in
`src/api/openapi-client.ts` wraps axios. Three middleware-style hooks
live in `src/main.ts` + `src/composables/useImpersonation.ts` +
`src/utils/api.ts`:

  1. **Request interceptor (main.ts)** — injects `Authorization`
     header from `localStorage.token` and `Accept-Language` from
     `localStorage.pv_lang` on every request.

  2. **Request interceptor (useImpersonation.ts)** — when the admin
     starts an impersonation session, attaches `X-Impersonate-User`
     header to every request until the session ends.

  3. **Response interceptor (utils/api.ts)** — on HTTP 401 from any
     request, clears the cached token, redirects to `/login`, and
     surfaces a toast. Two instances: the openapi `api` client and
     the global `axios` (used by legacy call sites).

## Why we can't just `fetch.replace(axios)`

  - `fetch` has no interceptor chain → we'd need to wrap every
    `apiGet/apiPost/...` helper to re-implement the three hooks.
  - `AbortController` integration is manual — axios cancels
    in-flight requests on `api.post` cancellation automatically.
  - `axios.post(url, data)` auto-stringifies JSON bodies and sets
    `Content-Type: application/json`. With fetch we'd write
    `fetch(url, { method: 'POST', headers: {...}, body: JSON.stringify(data) })`
    at every call site.
  - The legacy `axios` instance is referenced directly from
    non-migrated files (look for `import axios from 'axios'`); those
    bypass the openapi-client helpers entirely.

## Migration steps (in order)

### 1. Land the new HTTP client module

Create `src/api/http.ts` exporting a single `http` object:

```ts
export interface HttpResponse<T> { data: T; status: number; }
export interface HttpError { status: number; data?: unknown; }

export const http = {
  get:    async <T>(url: string, opts?: RequestInit & { signal?: AbortSignal }) => { ... },
  post:   async <T>(url: string, body?: unknown, opts?: ...) => { ... },
  put:    async <T>(...) => { ... },
  patch:  async <T>(...) => { ... },
  delete: async <T>(...) => { ... },
};
```

Each method:
  - Reads `token` + `pv_lang` from localStorage, sets headers
  - JSON-encodes `body` (unless `Content-Type: multipart/form-data`)
  - On non-2xx, throws a typed `HttpError`
  - On 401, dispatches a global `auth:expired` event that the
    interceptor listener handles

### 2. Replace openapi-client.ts internals

The `apiGet/apiPost/...` public API stays the same — only the
internal axios calls are swapped for `http.get/post/...`. This means
**zero call-site changes**.

### 3. Migrate the legacy `axios` instance

Replace direct `axios.post('/api/v1/...')` calls in:
  - `src/views/AccountView.vue`
  - `src/views/AdminPushAnalytics.vue`
  - `src/views/AdminReviewManager.vue`
  - `src/views/AdminBulkActions.vue`
  - `src/views/DistributorDashboard.vue`
  - `src/views/AdminLogin.vue` (uses `axios` directly for the
    login form — keep this on `http` for consistency)

Estimated: ~20 call sites. Each is a 1-line change
(`axios.post(url, data)` → `http.post(url, data)`).

### 4. Delete axios

After `grep -r "from 'axios'" src/` returns nothing:
  - `npm uninstall axios` (saves ~30 KB)
  - Remove the two `axios.defaults.baseURL` + `interceptors.*`
    blocks from `main.ts` — replaced by the `http` module's own
    setup.

### 5. Verify

  - `npm run lint` — no unused imports
  - `npm test` — 326 tests should pass with no changes (the openapi-
    client signature is unchanged)
  - `npm run build` — index.js should drop by ~30 KB
  - Manual: log in, place an order, view admin pages, impersonate
    a user, verify all 401/refresh flows still work.

## Cost / benefit

| Metric | Today | After | Delta |
|---|---|---|---|
| Bundle (index.js) | 597 KB | ~567 KB | **-30 KB** |
| Tests touched | 0 | 0 | none |
| Files touched | 0 | ~25 | 1-day work |
| Risk | low | medium | one week of test cycles |

## When to revisit

  - When axios publishes a CVE we care about (none today; npm audit
    reports 0 backend vulns).
  - When we need streaming responses or SSE on the browser side
    (axios has better support out of the box).
  - When bundle size starts affecting LCP (current LCP under
    1.5s on 3G, so not yet).

Until then, axios is doing the job — its ~30 KB is well-spent given
the migration cost.