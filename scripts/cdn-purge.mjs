// scripts/cdn-purge.mjs — purge Cloudflare cache for the SPA bundle.
// Call after `full-hot-deploy.js` so users always get the latest JS.
//
// Why a separate script?
//   • Cloudflare credentials don't belong in the same .env as the
//     deploy SSH password (different rotation cadence, different
//     blast radius if leaked).
//   • We want the deploy to succeed even if Cloudflare is down —
//     purge is best-effort, the operator runs it separately.
//
// Required env vars (.env.cdn or process.env):
//   CDN_API_TOKEN   Cloudflare API token with Zone.Cache Purge perm
//   CDN_ZONE_ID     zone ID for powervital.kg
//   CDN_BRANDS      comma-separated hostnames (default: powervital.kg)
//
// Usage:
//   node scripts/cdn-purge.mjs                 # purge everything
//   node scripts/cdn-purge.mjs --files-only   # only /assets/*, skip HTML
//   node scripts/cdn-purge.mjs --dry-run
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(__dirname, '..', '.env.cdn');

// Load env vars from .env.cdn if it exists (same KEY=value format).
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
  }
}

const TOKEN = process.env.CDN_API_TOKEN;
const ZONE = process.env.CDN_ZONE_ID;
const HOSTS = (process.env.CDN_BRANDS ?? 'powervital.kg,www.powervital.kg').split(',').map(s => s.trim());

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const filesOnly = args.includes('--files-only');

if (!TOKEN || !ZONE) {
  console.error('HATA: .env.cdn içinde CDN_API_TOKEN + CDN_ZONE_ID gerekli.');
  console.error('      See README §CDN for token setup.');
  process.exit(1);
}

// What to purge:
//   • If --files-only, just the /assets/* paths (these are content-
//     hashed so CDN will only get a cache hit on the new bundle).
//   • Otherwise purge the whole hostname (`/*`).
const purgeUrl = filesOnly ? HOSTS.flatMap(h => [`https://${h}/assets/`]) : HOSTS.flatMap(h => [`https://${h}/*`]);

console.log(`Purging ${purgeUrl.length} URL pattern(s) for zone ${ZONE}…`);
if (isDryRun) {
  for (const u of purgeUrl) console.log(`  would purge: ${u}`);
  console.log('  (dry-run, nothing sent)');
  process.exit(0);
}

const res = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: purgeUrl })
  }
);
const body = await res.json();
if (body.success) {
  const id = body.result?.id ?? '<no id>';
  console.log(`✓ Purge queued. Cloudflare purge id: ${id}`);
  console.log('  Estimated completion: 30s. Users on stale bundles will refresh within a minute.');
} else {
  console.error('✗ Purge failed:', body.errors ?? body);
  process.exit(1);
}