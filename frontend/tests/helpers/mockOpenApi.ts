// tests/helpers/mockOpenApi.ts — shared helper for mocking @/api/openapi-client.
//
// USAGE (paste into your test file, replacing the existing axios mock):
//
//   vi.mock('../src/api/openapi-client', async (importOriginal) => {
//     const actual = await importOriginal<typeof import('../src/api/openapi-client')>();
//     return { ...actual, ...mockOpenApiMock() };
//   });
//   import { mockOpenApiMock } from './helpers/mockOpenApi';
//   const api = mockOpenApiMock(); // outside vi.mock closure
//
// Why this pattern?
//   vitest hoists vi.mock() to the top of the file. The factory can't
//   reference variables defined in the same module's top scope unless
//   those variables are wrapped in vi.hoisted(). So we expose a helper
//   that returns the SAME vi.fn() instances the factory uses.
//
//   The factory closure captures the helper's vi.fn()s by reference,
//   so tests can call api.apiGet.mockResolvedValue(...) AFTER setup and
//   the mocked apiGet() will return that value.

import { vi } from 'vitest';

export interface MockApi {
  apiGet: ReturnType<typeof vi.fn>;
  apiPost: ReturnType<typeof vi.fn>;
  apiPut: ReturnType<typeof vi.fn>;
  apiPatch: ReturnType<typeof vi.fn>;
  apiDelete: ReturnType<typeof vi.fn>;
}

/**
 * Hoisted factory. Returns the vi.fn() instances that the vi.mock()
 * factory closure above uses. Call this in your vi.mock factory.
 *
 * Returns the SAME vi.fn() instances across calls — vi.hoisted only
 * runs once per test file, so all calls to mockOpenApiMock() share
 * the same underlying mock spies. This lets vi.resetModules() + a
 * fresh dynamic import still hit the same mocked methods.
 */
export function mockOpenApiMock(): MockApi {
  // vi.hoisted runs at file top, so these vi.fn()s exist before any
  // imports are resolved. The SAME instance is reused across calls.
  const m = vi.hoisted(() => ({
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn(),
    apiPatch: vi.fn(),
    apiDelete: vi.fn(),
  }));
  return m;
}

/**
 * Helper to build a TypedResponse<unknown> that matches what apiGet
 * returns. Tests can pass any shape as `data` and don't need to fully
 * type the response.
 */
export function typedResponse<T>(data: T, status = 200): { data: T; status: number; headers: Record<string, string> } {
  return { data, status, headers: {} };
}

/**
 * Convenience: resolve a single apiGet call with a typed response.
 */
export function mockApiGet(api: MockApi, data: unknown, status = 200) {
  api.apiGet.mockResolvedValueOnce(typedResponse(data, status));
}

export function mockApiPost(api: MockApi, data: unknown, status = 200) {
  api.apiPost.mockResolvedValueOnce(typedResponse(data, status));
}

export function mockApiPut(api: MockApi, data: unknown, status = 200) {
  api.apiPut.mockResolvedValueOnce(typedResponse(data, status));
}

export function mockApiPatch(api: MockApi, data: unknown, status = 200) {
  api.apiPatch.mockResolvedValueOnce(typedResponse(data, status));
}

export function mockApiDelete(api: MockApi, data: unknown, status = 200) {
  api.apiDelete.mockResolvedValueOnce(typedResponse(data, status));
}