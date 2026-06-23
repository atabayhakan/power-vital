import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1'
  // Intentionally no default Content-Type: axios sets multipart/form-data
  // with the right boundary for FormData, and application/json for plain
  // objects. Hard-coding application/json here would break file uploads.
});

// ─── Cache layer (stale-while-revalidate via If-None-Match) ──────────────
// The storefront hits the same handful of public endpoints on every page:
//   GET /api/v1/settings        — every page (topbar, footer, hero)
//   GET /api/v1/products        — catalog + search results
//   GET /api/v1/categories      — nav menu + filter chips
//
// The backend already sends Cache-Control + ETag. We additionally remember
// the last response in sessionStorage so that:
//   1. A hard reload (no in-memory cache) still benefits from the ETag.
//   2. Cross-tab navigation reads the same snapshot.
//   3. A 304 from the server can be hydrated to the cached body without
//      any extra DB round-trip.
//
// Cache misses fall back to the normal response (200 with body). Cache
// writes only happen for 200 + 2xx responses on the listed GET endpoints.

interface CacheEntry {
  etag: string;
  body: any;          // parsed JSON
  storedAt: number;   // unix ms — used to show "(cached)" badges if needed
}

const CACHEABLE_GET: RegExp[] = [
  /^\/api\/v1\/settings\/?$/,
  /^\/api\/v1\/products\/?(\?.*)?$/,   // default list only (backend doesn't cache paginated/category/search)
  /^\/api\/v1\/categories\/?$/
];

const cacheKeyFor = (url: string): string | null => {
  for (const re of CACHEABLE_GET) {
    if (re.test(url)) return `pv-cache:${url}`;
  }
  return null;
};

const readCache = (key: string): CacheEntry | null => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch { return null; }
};

const writeCache = (key: string, entry: CacheEntry) => {
  try { sessionStorage.setItem(key, JSON.stringify(entry)); }
  catch { /* quota — silently drop the cache write */ }
};

// Request Interceptor: Add JWT token + If-None-Match header (when we have
// a cached ETag for this endpoint).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.method === 'get' || config.method === 'GET') {
      const fullUrl = (config.baseURL || '') + (config.url || '');
      const key = cacheKeyFor(fullUrl);
      if (key) {
        const entry = readCache(key);
        if (entry?.etag) {
          config.headers['If-None-Match'] = entry.etag;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Public pages must stay viewable even when the stored token is expired/invalid.
// A guest with a stale token (e.g. logged in once, then the JWT expired) hitting
// the homepage triggers a 401 from restoreSession — we must NOT bounce them to
// /login from a public page; just clear the session and let them browse.
export const isPublicPath = (p: string): boolean => {
  if (!p || p === '/') return true;
  if (['/login', '/register', '/katalog', '/catalog', '/about', '/iletisim', '/contact', '/checkout'].includes(p)) return true;
  if (p.startsWith('/product/') || p.startsWith('/urun/') || p.startsWith('/kategori/')) return true;
  return false;
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('userProfile');
};

// ── Single-flight access-token refresh ────────────────────────────────────────
// The access token is short-lived (15 min). On a 401 we silently exchange the
// 7-day refresh token — sent automatically as a same-origin HttpOnly cookie —
// for a fresh access token and retry the original request, so an admin editing
// for a while is never kicked out mid-action (the old behaviour just failed the
// save with "Token is invalid or expired"). Concurrent 401s share one refresh.
let refreshPromise: Promise<string | null> | null = null;
const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = axios.post('/api/v1/auth/refresh', {})
      .then((res) => {
        const tok = res.data?.accessToken;
        if (tok) { localStorage.setItem('token', tok); return tok as string; }
        return null;
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

// Shared 401 handler: try a refresh + one retry, then fall back to logout.
const make401Handler = (instance: any) => async (error: any) => {
  const original = error?.config || {};
  const status = error?.response?.status;
  const url = String(original.url || '');
  const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login');
  // Multipart/file uploads can't be auto-replayed (the request body stream is
  // consumed), and views that upload (Media Library, Products) run their own
  // refresh+retry with a freshly-built FormData. Auto-retrying here corrupted
  // the body and left uploads stuck at 100%. Let those 401s propagate.
  const isFormData = typeof FormData !== 'undefined' && original.data instanceof FormData;

  if (status === 401 && !original.__retried && !isAuthEndpoint && !isFormData) {
    original.__retried = true;
    const newToken = await refreshAccessToken();
    if (newToken) {
      original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
      return instance(original); // retry once with the fresh token
    }
    // Refresh failed (refresh token expired/revoked) — drop the dead session.
    clearSession();
    // Only force /login from PROTECTED pages; public pages stay viewable as guest.
    if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
};

// Attach to BOTH the api instance and the global axios (admin views like
// ProductsView use the global axios directly with manual headers).
api.interceptors.response.use((r) => r, make401Handler(api));
axios.interceptors.response.use((r) => r, make401Handler(axios));

// ─── 304 → cached-body hydration + cache write ───────────────────────────
// We treat a 304 Not Modified the same as a 200 with the cached body: the
// caller's `then()` receives the cached payload, but the network round-trip
// was a tiny header exchange instead of a full JSON payload.
api.interceptors.response.use(async (response) => {
  if (response.config.method === 'get' || response.config.method === 'GET') {
    const fullUrl = (response.config.baseURL || '') + (response.config.url || '');
    const key = cacheKeyFor(fullUrl);
    if (!key) return response;

    if (response.status === 304) {
      const entry = readCache(key);
      if (entry) {
        // Re-hydrate: caller sees the cached body, status flips to 200 so
        // downstream code that branches on `response.status === 200` still
        // works. Mark the timestamp so debug widgets can show "from cache".
        response.status = 200;
        response.statusText = 'OK (cached)';
        response.data = entry.body;
        (response as any).__fromCache = true;
        return response;
      }
      // Cache evicted between request and response — fall through and let
      // the network client retry.
      return response;
    }

    if (response.status >= 200 && response.status < 300) {
      const etag = response.headers['etag'] || response.headers['ETag'];
      if (etag) {
        writeCache(key, { etag, body: response.data, storedAt: Date.now() });
      }
    }
  }
  return response;
});

export default api;
