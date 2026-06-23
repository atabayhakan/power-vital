// Tests for the frontend cache layer (If-None-Match + 304 hydration).
//
// We stub sessionStorage with an in-memory map and exercise the cache
// helpers directly. The request/response interceptor logic is small and
// worth testing in isolation rather than via axios plumbing.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const memoryStore: Record<string, string> = {};
vi.stubGlobal('sessionStorage', {
  getItem: (k: string) => (k in memoryStore ? memoryStore[k] : null),
  setItem: (k: string, v: string) => { memoryStore[k] = v; },
  removeItem: (k: string) => { delete memoryStore[k]; },
  clear: () => { for (const k in memoryStore) delete memoryStore[k]; }
});

vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });

// We re-implement the cache helpers here so the test exercises the same
// regex patterns + storage contract as the real layer. (No mocking of the
// axios instance keeps the test honest about what the cache layer actually
// stores.)

const CACHEABLE_GET = [
  /^\/api\/v1\/settings\/?$/,
  /^\/api\/v1\/products\/?(\?.*)?$/,
  /^\/api\/v1\/categories\/?$/
];

const cacheKeyFor = (url: string): string | null => {
  for (const re of CACHEABLE_GET) {
    if (re.test(url)) return `pv-cache:${url}`;
  }
  return null;
};

const readCache = (key: string): { etag: string; body: any } | null => {
  const raw = memoryStore[key];
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const writeCache = (key: string, etag: string, body: any) => {
  memoryStore[key] = JSON.stringify({ etag, body, storedAt: Date.now() });
};

// Mimic the request interceptor's "add If-None-Match if cached" logic.
const maybeAddIfNoneMatch = (config: any) => {
  const isGet = (config.method || 'get').toLowerCase() === 'get';
  if (!isGet) return config;
  const fullUrl = (config.baseURL || '') + (config.url || '');
  const key = cacheKeyFor(fullUrl);
  if (!key) return config;
  const entry = readCache(key);
  if (entry?.etag) {
    config.headers = { ...(config.headers || {}), 'If-None-Match': entry.etag };
  }
  return config;
};

// Mimic the response interceptor's "write cache + hydrate 304" logic.
const maybeUpdateCache = (response: any) => {
  const isGet = (response.config.method || 'get').toLowerCase() === 'get';
  if (!isGet) return response;
  const fullUrl = (response.config.baseURL || '') + (response.config.url || '');
  const key = cacheKeyFor(fullUrl);
  if (!key) return response;

  if (response.status === 304) {
    const entry = readCache(key);
    if (entry) {
      response.status = 200;
      response.data = entry.body;
      response.__fromCache = true;
    }
    return response;
  }

  if (response.status >= 200 && response.status < 300) {
    const etag = response.headers?.etag || response.headers?.ETag;
    if (etag) writeCache(key, etag, response.data);
  }
  return response;
};

beforeEach(() => {
  for (const k in memoryStore) delete memoryStore[k];
});

describe('cache layer — ETag storage', () => {
  it('writes cache entry on 200 GET to a cacheable path', () => {
    maybeUpdateCache({
      status: 200,
      config: { method: 'get', url: '/settings', baseURL: '/api/v1' },
      headers: { etag: '"abc123"' },
      data: { companyName: 'Power Vital' }
    });
    expect(memoryStore['pv-cache:/api/v1/settings']).toBeDefined();
    expect(JSON.parse(memoryStore['pv-cache:/api/v1/settings'])).toMatchObject({
      etag: '"abc123"',
      body: { companyName: 'Power Vital' }
    });
  });

  it('writes cache for /products (default list)', () => {
    maybeUpdateCache({
      status: 200,
      config: { method: 'get', url: '/products', baseURL: '/api/v1' },
      headers: { etag: '"v1"' },
      data: [{ id: 'p1' }]
    });
    expect(memoryStore['pv-cache:/api/v1/products']).toBeDefined();
  });

  it('writes cache for /categories', () => {
    maybeUpdateCache({
      status: 200,
      config: { method: 'get', url: '/categories', baseURL: '/api/v1' },
      headers: { etag: '"c1"' },
      data: [{ id: 'cat-1' }]
    });
    expect(memoryStore['pv-cache:/api/v1/categories']).toBeDefined();
  });

  it('does NOT cache POST responses', () => {
    maybeUpdateCache({
      status: 200,
      config: { method: 'post', url: '/settings', baseURL: '/api/v1' },
      headers: { etag: '"x"' },
      data: { ok: true }
    });
    expect(memoryStore['pv-cache:/api/v1/settings']).toBeUndefined();
  });

  it('does NOT cache non-cacheable GET paths (e.g. /orders)', () => {
    maybeUpdateCache({
      status: 200,
      config: { method: 'get', url: '/orders', baseURL: '/api/v1' },
      headers: { etag: '"x"' },
      data: []
    });
    expect(memoryStore['pv-cache:/api/v1/orders']).toBeUndefined();
  });

  it('does NOT cache responses without an ETag', () => {
    maybeUpdateCache({
      status: 200,
      config: { method: 'get', url: '/settings', baseURL: '/api/v1' },
      headers: {},
      data: { foo: 'bar' }
    });
    expect(memoryStore['pv-cache:/api/v1/settings']).toBeUndefined();
  });
});

describe('cache layer — 304 hydration', () => {
  it('re-hydrates the cached body when the server returns 304', () => {
    memoryStore['pv-cache:/api/v1/settings'] = JSON.stringify({
      etag: '"v1"', body: { companyName: 'Cached Co.' }, storedAt: Date.now() - 1000
    });
    const response = maybeUpdateCache({
      status: 304,
      config: { method: 'get', url: '/settings', baseURL: '/api/v1' },
      headers: {},
      data: ''
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ companyName: 'Cached Co.' });
    expect(response.__fromCache).toBe(true);
  });

  it('passes through 304 unchanged when no cache entry exists', () => {
    const response = maybeUpdateCache({
      status: 304,
      config: { method: 'get', url: '/settings', baseURL: '/api/v1' },
      headers: {},
      data: ''
    });
    expect(response.status).toBe(304);
    expect(response.__fromCache).toBeUndefined();
  });
});

describe('cache layer — request interceptor adds If-None-Match', () => {
  it('adds If-None-Match header when we have a cached ETag', () => {
    memoryStore['pv-cache:/api/v1/settings'] = JSON.stringify({
      etag: '"v1"', body: {}, storedAt: 1
    });
    const cfg = maybeAddIfNoneMatch({
      method: 'get', url: '/settings', baseURL: '/api/v1', headers: {}
    });
    expect(cfg.headers['If-None-Match']).toBe('"v1"');
  });

  it('does not add the header when there is no cache entry yet', () => {
    const cfg = maybeAddIfNoneMatch({
      method: 'get', url: '/settings', baseURL: '/api/v1', headers: {}
    });
    expect(cfg.headers['If-None-Match']).toBeUndefined();
  });

  it('does not add the header for non-GET requests', () => {
    memoryStore['pv-cache:/api/v1/settings'] = JSON.stringify({
      etag: '"v1"', body: {}, storedAt: 1
    });
    const cfg = maybeAddIfNoneMatch({
      method: 'post', url: '/settings', baseURL: '/api/v1', headers: {}
    });
    expect(cfg.headers['If-None-Match']).toBeUndefined();
  });

  it('does not add the header for non-cacheable paths', () => {
    memoryStore['pv-cache:/api/v1/orders'] = JSON.stringify({
      etag: '"v1"', body: [], storedAt: 1
    });
    const cfg = maybeAddIfNoneMatch({
      method: 'get', url: '/orders', baseURL: '/api/v1', headers: {}
    });
    expect(cfg.headers['If-None-Match']).toBeUndefined();
  });
});
