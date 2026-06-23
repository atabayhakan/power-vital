// openapi-client.ts — Type-safe API helpers generated from /api/docs.json.
//
// Usage:
//   import { apiGet, apiPost, apiPut, apiDelete } from '@/api/openapi-client';
//   const r = await apiGet('/api/v1/admin/trends', { query: { days: 7 } });
//   r.data // → fully typed as TrendsResponse
//
//   const r2 = await apiPost('/api/v1/admin/bulk/orders/status', {
//     body: { orderIds: [...], status: 'CONFIRMED' }
//   });
//   r2.data // → BulkResult
//
// Type safety comes from the auto-generated `paths` interface in ./types.ts.
// Adding/removing fields on the backend will surface as a compile-time error here.

import type { paths } from './types';
import api from '@/utils/api';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

type ApiPath = keyof paths;

type PathMethod<P extends ApiPath, M extends Method> = paths[P] extends Record<M, infer R> ? R : never;

type SuccessResponse<P extends ApiPath, M extends Method> = PathMethod<P, M> extends {
  responses: infer R;
}
  ? R extends Record<string, infer V>
    ? V extends { content: { 'application/json': infer J } }
      ? J
      : V extends { content?: never }
        ? unknown
        : never
    : never
  : never;

type RequestBody<P extends ApiPath, M extends Method> = PathMethod<P, M> extends {
  requestBody?: infer R;
}
  ? R extends { content: { 'application/json': infer J } }
    ? J
    : never
  : never;

type QueryParams<P extends ApiPath> = paths[P] extends { parameters: { query?: infer Q } }
  ? [Q] extends [undefined]
    ? Record<string, string | number | boolean>
    : [Q] extends [never]
      ? Record<string, string | number | boolean>
      : Q
  : Record<string, string | number | boolean>;

export interface RequestOptions<P extends ApiPath> {
  query?: QueryParams<P>;
  signal?: AbortSignal;
}

export interface TypedResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export async function apiGet<P extends ApiPath>(path: P, opts: RequestOptions<P> = {}): Promise<TypedResponse<SuccessResponse<P, 'get'>>> {
  const res = await api.get(path, {
    params: opts.query as Record<string, unknown> | undefined,
    signal: opts.signal,
  });
  return { data: res.data, status: res.status, headers: res.headers as Record<string, string> };
}

export async function apiPost<P extends ApiPath>(
  path: P,
  body: RequestBody<P, 'post'>,
  opts: RequestOptions<P> = {}
): Promise<TypedResponse<SuccessResponse<P, 'post'>>> {
  const res = await api.post(path, body, {
    params: opts.query as Record<string, unknown> | undefined,
    signal: opts.signal,
  });
  return { data: res.data, status: res.status, headers: res.headers as Record<string, string> };
}

export async function apiPut<P extends ApiPath>(
  path: P,
  body: RequestBody<P, 'put'>,
  opts: RequestOptions<P> = {}
): Promise<TypedResponse<SuccessResponse<P, 'put'>>> {
  const res = await api.put(path, body, {
    params: opts.query as Record<string, unknown> | undefined,
    signal: opts.signal,
  });
  return { data: res.data, status: res.status, headers: res.headers as Record<string, string> };
}

export async function apiPatch<P extends ApiPath>(
  path: P,
  body: RequestBody<P, 'patch'>,
  opts: RequestOptions<P> = {}
): Promise<TypedResponse<SuccessResponse<P, 'patch'>>> {
  const res = await api.patch(path, body, {
    params: opts.query as Record<string, unknown> | undefined,
    signal: opts.signal,
  });
  return { data: res.data, status: res.status, headers: res.headers as Record<string, string> };
}

export async function apiDelete<P extends ApiPath>(
  path: P,
  opts: RequestOptions<P> = {}
): Promise<TypedResponse<SuccessResponse<P, 'delete'>>> {
  const res = await api.delete(path, {
    params: opts.query as Record<string, unknown> | undefined,
    signal: opts.signal,
  });
  return { data: res.data, status: res.status, headers: res.headers as Record<string, string> };
}

export type {
  paths,
  PathMethod,
  SuccessResponse,
  RequestBody,
  QueryParams,
  ApiPath,
  Method,
};