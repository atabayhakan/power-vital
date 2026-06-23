// OpenAPI 3.1 spec generator.
//
// We use @asteasolutions/zod-to-openapi which integrates with zod: each
// validator schema can be registered once with metadata (description, example,
// tags) and then referenced from any route.
//
// The generated spec is served at:
//   GET /api/docs.json  — raw OpenAPI 3.1 JSON
//   GET /api/docs       — Swagger UI
//
// Why docs.json + Swagger UI?
//   • Swagger UI is the de-facto standard for browsing API contracts
//   • /api/docs.json is consumable by code generators (openapi-typescript,
//     orval, etc.) so the frontend can have fully-typed API clients
//   • The contract is the SOURCE OF TRUTH: any drift between zod and
//     OpenAPI breaks tests.

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Side-effect import: enables `.openapi(...)` on every zod schema
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register the JWT security scheme so paths can reference it as `bearerAuth: []`.
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT obtained from POST /api/v1/auth/login'
});

// API-wide metadata. Registered in src/routes/docs.ts once we have all
// routes collected; the final spec is emitted from src/openapi.ts.
export const API_METADATA = {
  title: 'Power Vital API',
  version: '1.0.0',
  description: `
Power Vital e-commerce + MLM platform backend.

## Languages
All user-facing strings live in three locales: **TR** (primary), **RU**, **KG**.
The active locale is negotiated via the \`Accept-Language\` header and a \`lang\`
query param. AI-generated translations fill missing locale fields automatically.

## Auth
Mutating endpoints require a \`Bearer\` JWT in the \`Authorization\` header.
Admin-only routes additionally check the \`role\` claim.

## Rate limiting
All \`/api/*\` routes are rate-limited to 150 req/min per IP. Burst over
the limit returns 429 with \`Retry-After\`.

## Errors
All errors return \`{ error: string, issues?: ValidationIssue[] }\` where
\`ValidationIssue\` has the shape \`{ path, message, code }\`.
  `.trim()
};

export const SECURITY_SCHEMES = {
  bearerAuth: {
    type: 'http' as const,
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT obtained from POST /api/v1/auth/login'
  }
};
// SECURITY_SCHEMES is kept for reference / future use. The actual
// registration uses registry.registerComponent above so the generator
// picks it up automatically.

/**
 * Build the final OpenAPI 3.1 document from everything registered on the
 * shared `registry`. Called once at server startup, then cached.
 */
export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: API_METADATA.title,
      version: API_METADATA.version,
      description: API_METADATA.description
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
      { url: 'https://powervital.kg', description: 'Production (Kyrgyzstan)' },
      { url: 'https://powervital.org', description: 'Production (intl alias)' }
    ]
  });
}

export { z };
export default registry;
