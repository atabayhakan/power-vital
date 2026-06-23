// OpenAPI spec contract — every public route should appear in /api/docs.json
// with a non-empty path, method, and tag. This catches drift between the
// zod validators and the OpenAPI registration.
import { describe, it, expect, beforeAll } from 'vitest';
import { buildTestApp } from './testHelpers';
import { registerAllRoutes } from '../src/openapi/routes';
import { buildOpenApiDocument } from '../src/openapi/registry';

describe('OpenAPI /api/docs.json', () => {
  let spec: any;

  beforeAll(() => {
    registerAllRoutes();
    spec = buildOpenApiDocument();
  });

  it('returns a valid OpenAPI 3.1 document with metadata', () => {
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Power Vital API');
    expect(spec.info.version).toBeTruthy();
    expect(Array.isArray(spec.servers)).toBe(true);
    expect(spec.servers.length).toBeGreaterThan(0);
  });

  it('exposes a JWT bearer security scheme', () => {
    expect(spec.components?.securitySchemes?.bearerAuth).toBeDefined();
    expect(spec.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });

  it('documents auth, products, checkout, orders, finance, health', () => {
    const paths = Object.keys(spec.paths);
    // Spot-check critical routes that have been refactored recently
    expect(paths).toContain('/api/v1/auth/register');
    expect(paths).toContain('/api/v1/auth/login');
    expect(paths).toContain('/api/v1/products');
    expect(paths).toContain('/api/v1/products/{id}');
    expect(paths).toContain('/api/v1/checkout');
    expect(paths).toContain('/api/v1/checkout/{orderId}/verify');
    expect(paths).toContain('/api/v1/orders/{id}/status');
    expect(paths).toContain('/api/v1/finance/wallet');
    expect(paths).toContain('/health');
    expect(paths).toContain('/health/ready');
  });

  it('marks admin-only routes with bearerAuth security', () => {
    const products = spec.paths['/api/v1/products'];
    const post = products?.post;
    expect(Array.isArray(post?.security)).toBe(true);
    expect(post.security).toEqual([{ bearerAuth: [] }]);
  });

  it('does NOT mark public routes (login, /health) with security', () => {
    const login = spec.paths['/api/v1/auth/login']?.post;
    const health = spec.paths['/health']?.get;
    expect(login?.security).toBeUndefined();
    expect(health?.security).toBeUndefined();
  });

  it('groups routes into tags so the Swagger UI is navigable', () => {
    const tagNames = new Set<string>();
    for (const path of Object.values<any>(spec.paths)) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const op = path[method];
        if (!op) continue;
        for (const tag of op.tags || []) tagNames.add(tag);
      }
    }
    // We must have at least these high-level tags
    for (const expected of ['Auth', 'Products', 'Checkout', 'Orders', 'Finance', 'Health', 'Media']) {
      expect(tagNames.has(expected), `missing tag: ${expected}`).toBe(true);
    }
  });

  it('reuses registered component schemas (e.g. ErrorResponse)', () => {
    expect(spec.components?.schemas?.ErrorResponse).toBeDefined();
    const errSchema = spec.components.schemas.ErrorResponse;
    expect(errSchema.properties.error).toBeDefined();
    expect(errSchema.properties.issues).toBeDefined();
  });
});
