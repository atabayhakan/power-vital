// Generate openapi.json from the zod registry WITHOUT booting the full
// Express app. This is what CI / local generation uses so we don't need
// MySQL or Redis just to refresh the spec.
//
// Usage:
//   npm run openapi:generate
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = join(__dirname, '..');

// Dynamic import — Windows requires file:// URL, not a raw path.
const toFileUrl = (p) => 'file:///' + p.replace(/\\/g, '/').replace(/^\/+/, '');

const { registerAllRoutes } = await import(toFileUrl(join(BACKEND_ROOT, 'src', 'openapi', 'routes.ts')));
const { buildOpenApiDocument } = await import(toFileUrl(join(BACKEND_ROOT, 'src', 'openapi', 'registry.ts')));

registerAllRoutes();
const doc = buildOpenApiDocument();

const outPath = join(BACKEND_ROOT, '..', 'openapi.json');
writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log(`✓ Wrote OpenAPI spec: ${outPath}`);
console.log(`  Paths:    ${Object.keys(doc.paths ?? {}).length}`);
console.log(`  Schemas:  ${Object.keys(doc.components?.schemas ?? {}).length}`);
console.log(`  Version:  ${doc.info?.version}`);