// OpenAPI doc tests — verify the generated /api/docs.json covers every
// admin endpoint we shipped in this sprint.
//
// Why serve it from a local Express app instead of inspecting the
// registry directly?
//   • Catches drift between the route file and the generated spec —
//     if a developer adds an endpoint but forgets to call
//     registry.registerPath, this test fires.
//   • Catches zod schema mismatch (a schema that doesn't .openapi()-
//     register produces a $ref to a non-existent schema in the output).
//
// This used to fetch the live https://powervital.kg/api/docs.json —
// a DB-free unit test has no business depending on network access or a
// production deployment being up. It also broke outright once docs were
// gated behind NODE_ENV !== 'production' for security (info-disclosure
// hardening), since prod now 404s on that route by design. Instead we
// build the same document the real server builds (registerAllRoutes +
// buildOpenApiDocument, exactly as src/index.ts does) and serve it from
// an in-process Express app.

import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { buildOpenApiDocument } from '../src/openapi/registry';
import { registerAllRoutes } from '../src/openapi/routes';

registerAllRoutes();
const openapiDocument = buildOpenApiDocument();

const app = express();
app.get('/api/docs.json', (_req, res) => res.json(openapiDocument));

let cached: any = null;
async function loadSpec() {
  if (cached) return cached;
  const res = await request(app).get('/api/docs.json');
  expect(res.status).toBe(200);
  cached = res.body;
  return cached;
}

describe('GET /api/docs.json — OpenAPI contract', () => {
  it('returns a valid OpenAPI 3.x document', async () => {
    const doc = await loadSpec();
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.title).toBe('Power Vital API');
    expect(Array.isArray(doc.servers)).toBe(true);
    expect(doc.servers.length).toBeGreaterThan(0);
  });

  it('includes the bearerAuth security scheme', async () => {
    const doc = await loadSpec();
    expect(doc.components?.securitySchemes?.bearerAuth).toMatchObject({
      type: 'http', scheme: 'bearer'
    });
  });

  it('documents every endpoint added in the analytics/trends/search sprint', async () => {
    const doc = await loadSpec();
    const paths = Object.keys(doc.paths || {});
    const required = [
      '/api/v1/admin/trends',
      '/api/v1/admin/search/users',
      '/api/v1/admin/search/products',
      '/api/v1/admin/analytics/categories',
      '/api/v1/admin/analytics/top-customers',
      '/api/v1/admin/analytics/top-products',
      '/api/v1/admin/bulk/orders/status',
      '/api/v1/admin/bulk/users/role',
      '/api/v1/admin/bulk/products/category',
      '/api/v1/admin/impersonation/sessions',
      '/api/v1/admin/impersonation/status',
      '/api/v1/admin/events', // SSE (added earlier)
      '/api/v1/push/broadcast-history'
    ];
    for (const p of required) {
      expect(paths, `missing path: ${p}`).toContain(p);
    }
  });

  it('references shared envelope schemas for paginated endpoints', async () => {
    const doc = await loadSpec();
    expect(doc.components?.schemas?.['PaginationEnvelope<T>']).toBeDefined();
    expect(doc.components?.schemas?.['CursorEnvelope<T>']).toBeDefined();
    expect(doc.components?.schemas?.['SearchEnvelope<T>']).toBeDefined();
  });

  it('documents the /admin/trends response shape', async () => {
    const doc = await loadSpec();
    const trends = doc.paths['/api/v1/admin/trends']?.get;
    expect(trends).toBeDefined();
    const ref = trends.responses?.[200]?.content?.['application/json']?.schema?.$ref;
    expect(ref).toBe('#/components/schemas/TrendsResponse');
    const trendsSchema = doc.components?.schemas?.TrendsResponse;
    expect(trendsSchema?.properties).toHaveProperty('range');
    expect(trendsSchema?.properties).toHaveProperty('daily');
    expect(trendsSchema?.properties).toHaveProperty('totals');
  });

  it('documents the /admin/analytics/categories response shape', async () => {
    const doc = await loadSpec();
    const analytics = doc.paths['/api/v1/admin/analytics/categories']?.get;
    expect(analytics).toBeDefined();
    // Schema may be either a $ref (referenced component) or inline (object).
    // Both are valid OpenAPI — we just want to make sure SOMETHING is documented.
    const schema = analytics.responses?.[200]?.content?.['application/json']?.schema;
    expect(schema).toBeDefined();
    if (schema.$ref) {
      expect(schema.$ref).toMatch(/#\/components\/schemas\//);
    } else {
      expect(schema.type || schema.properties).toBeDefined();
    }
  });

  it('tags every admin endpoint under a recognisable tag', async () => {
    const doc = await loadSpec();
    const tags = new Set<string>();
    for (const path of Object.values<any>(doc.paths)) {
      for (const method of Object.values<any>(path)) {
        for (const t of method.tags ?? []) tags.add(t);
      }
    }
    // Sanity: at least the 4 core admin tags exist
    for (const required of [
      'Admin — Trends', 'Admin — Search', 'Admin — Analytics', 'Admin — Bulk',
      'Admin — Impersonation'
    ]) {
      expect(tags.has(required), `missing tag: ${required}`).toBe(true);
    }
  });

  it('every documented response references a schema OR marks inline', async () => {
    const doc = await loadSpec();
    const known = new Set(Object.keys(doc.components?.schemas || {}));
    // Generics like PaginationEnvelope<T> use angle-bracket syntax that
    // the OpenAPI generator emits inline. We only fail if a $ref points
    // to a schema we can't find.
    let unresolved = 0;
    for (const path of Object.values<any>(doc.paths)) {
      for (const method of Object.values<any>(path)) {
        for (const code of Object.keys(method.responses ?? {})) {
          const content = method.responses[code]?.content ?? {};
          for (const mime of Object.keys(content)) {
            const schema = content[mime]?.schema;
            const ref = schema?.$ref;
            if (typeof ref === 'string' && ref.startsWith('#/components/schemas/')) {
              const name = ref.split('/').pop()!;
              // Generic <T> markers may be appended; strip them.
              const baseName = name.replace(/<.+>$/, '');
              if (!known.has(baseName) && !known.has(name)) unresolved++;
            }
          }
        }
      }
    }
    expect(unresolved).toBe(0);
  });

  it('total path count is at least 80 (sanity check — drift detection)', async () => {
    const doc = await loadSpec();
    const count = Object.keys(doc.paths).length;
    expect(count).toBeGreaterThanOrEqual(80);
  });
});