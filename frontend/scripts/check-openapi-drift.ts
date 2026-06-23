// openapi-drift.test.ts — fail if the generated types drift from the OpenAPI spec.
//
// This catches the case where:
//   1. The backend deploys a new OpenAPI spec (e.g. adds a field to User).
//   2. The frontend hasn't regenerated its types.
//   3. The frontend code (typed `data.user.role`) silently breaks at runtime.
//
// Run via:  npm run openapi:check          (live check vs production)
//           OPENAPI_URL=http://localhost:3000/api/docs.json npm run openapi:check
//           npm run openapi:check -- --offline   (check vs checked-in openapi.json)
//
// The script:
//   1. Fetches /api/docs.json from the configured API URL.
//   2. Generates the types via the openapi-typescript CLI.
//   3. Compares against the checked-in src/api/types.ts.
//   4. Fails (exit code 1) with a clear message if there's a drift.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const OFFLINE = args.includes('--offline');
const STRICT = args.includes('--ci') || process.env.CI === 'true';

const ROOT = process.cwd();
const OPENAPI_URL = OFFLINE
  ? null
  : (process.env.OPENAPI_URL || 'https://powervital.kg/api/docs.json');
const SPEC_FILE = join(ROOT, '..', 'openapi.json');
const TYPES_FILE = join(ROOT, 'src', 'api', 'types.ts');
const TMP_TYPES = join(ROOT, '.openapi-types.new.ts');

console.log(`[openapi:check] Target: ${OPENAPI_URL}`);
console.log(`[openapi:check] Mode: ${OFFLINE ? 'offline (checked-in spec)' : `live (${OPENAPI_URL})`}${STRICT ? ' [CI]' : ''}`);
console.log('[openapi:check] 1/3 Reading OpenAPI spec...');

// 1. Acquire spec (download live OR use checked-in)
if (!OFFLINE && OPENAPI_URL) {
  try {
    const curlCmd = process.platform === 'win32'
      ? `curl -sS "${OPENAPI_URL}" -o "${SPEC_FILE}"`
      : `curl -sS "${OPENAPI_URL}" -o "${SPEC_FILE}"`;
    execSync(curlCmd, { stdio: 'inherit' });
  } catch (e: any) {
    console.error('[openapi:check] FAIL: could not download spec:', e.message);
    process.exit(1);
  }
}
try {
  const spec = JSON.parse(readFileSync(SPEC_FILE, 'utf8'));
  console.log(`         ✓ ${Object.keys(spec.paths || {}).length} paths, ${Object.keys(spec.components?.schemas || {}).length} schemas`);
} catch (e: any) {
  console.error('[openapi:check] FAIL: could not parse spec:', e.message);
  process.exit(1);
}

console.log('[openapi:check] 2/3 Generating types...');
try {
  execSync(`npx --yes openapi-typescript@7 "${SPEC_FILE}" -o "${TMP_TYPES}"`, {
    stdio: 'inherit',
  });
} catch (e: any) {
  console.error('[openapi:check] FAIL: openapi-typescript failed:', e.message);
  process.exit(1);
}

console.log('[openapi:check] 3/3 Comparing against checked-in types.ts...');
const checked = readFileSync(TYPES_FILE, 'utf8');
const fresh = readFileSync(TMP_TYPES, 'utf8');

if (checked === fresh) {
  console.log('[openapi:check] ✓ In sync — no drift.');
  // Clean up
  try { unlinkSync(TMP_TYPES); } catch {}
  process.exit(0);
}

// Drift detected — write the new types to a `.new.ts` and tell the dev.
mkdirSync(join(ROOT, '.openapi-drift'), { recursive: true });
writeFileSync(join(ROOT, '.openapi-drift', 'types.new.ts'), fresh);

console.error('');
console.error('═══════════════════════════════════════════════════════════');
console.error('  OpenAPI DRIFT DETECTED');
console.error('═══════════════════════════════════════════════════════════');
console.error(`  Source: ${OFFLINE ? 'checked-in openapi.json' : OPENAPI_URL}`);
console.error('  Target: src/api/types.ts');
console.error('');
console.error('  This usually means the backend deployed a change');
console.error('  (new field, renamed path, removed endpoint, etc).');
console.error('');
console.error('  Next steps:');
console.error('    1. Inspect the diff:');
console.error('         diff src/api/types.ts .openapi-drift/types.new.ts');
console.error('    2. Update your view/component code to match the new shape.');
console.error('    3. Apply the new types:');
console.error('         cp .openapi-drift/types.new.ts src/api/types.ts');
console.error('    4. Run `npm run typecheck` to surface compile errors.');
console.error('    5. Commit the new types.ts + view changes together.');
console.error('═══════════════════════════════════════════════════════════');

try { unlinkSync(TMP_TYPES); } catch {}
process.exit(1);