// Bundle size budget — fails CI if any chunk grows beyond its threshold.
// Run after `vite build`.
//
// Why per-file and not just a total?
//   Per-route chunks (PageBuilderView, AdminI18nUiStringsView, etc.) are
//   loaded only when the user visits that page. A 1 MB total budget would
//   let a single 800 KB chunk hide behind 200 KB of small chunks; we want
//   to catch "this one chunk silently doubled in size" regressions.
//
// Numbers below are set with ~30% headroom from the current measured
// sizes (taken on 2026-06-23 from this branch). Bump them only when
// you intentionally add code and document the reason.
//
// Usage:
//   npx vite build && node scripts/check-bundle-budget.mjs
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_ASSETS = 'dist/assets';

const BUDGETS = {
  // entry chunk — always loaded
  'index-': { maxKb: 850, note: 'main entry chunk' },
  // route-level chunks
  'PageBuilderView-': { maxKb: 290, note: 'admin page builder' },
  'AdminI18nUiStringsView-': { maxKb: 185, note: 'i18n UI strings editor' },
  'AdminI18nModelView-': { maxKb: 185, note: 'i18n model editor' },
  'quill-': { maxKb: 215, note: 'rich-text editor (admin only)' },
  'PageManageView-': { maxKb: 130, note: 'admin page manager' },
  'SliderManageView-': { maxKb: 130, note: 'admin hero slider' },
  'CartRecoveryView-': { maxKb: 130, note: 'admin cart recovery' },
  // global
  '_plugin-vue_export-helper-': { maxKb: 150, note: 'vue compiler runtime' },
  'axios-': { maxKb: 130, note: 'HTTP client (only for legacy call sites)' },
  'api-': { maxKb: 60, note: 'openapi-client + axios adapter' },
  'pinia-': { maxKb: 30, note: 'state management' },
  'browser-': { maxKb: 30, note: 'env shim' },
  // any non-listed chunk must stay under this size
  '__default__': { maxKb: 200, note: 'any other route/component chunk' },
};

const ASSETS_DIR = DIST_ASSETS;
const files = readdirSync(ASSETS_DIR).filter(f => f.endsWith('.js'));

const failures = [];
const reports = [];

for (const file of files) {
  const sizeKb = Math.round(statSync(join(ASSETS_DIR, file)).size / 1024 * 10) / 10;
  // Find matching budget rule by longest prefix.
  const prefix = Object.keys(BUDGETS)
    .filter(p => p !== '__default__')
    .filter(p => file.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  const budget = BUDGETS[prefix ?? '__default__'];
  const pass = sizeKb <= budget.maxKb;
  reports.push({ file, sizeKb, budget: budget.maxKb, note: budget.note, pass });
  if (!pass) {
    failures.push(`  ${file}  ${sizeKb} KB  >  ${budget.maxKb} KB  (${budget.note})`);
  }
}

console.log('─'.repeat(70));
console.log('  Bundle size budget — frontend');
console.log('─'.repeat(70));
for (const r of reports.sort((a, b) => b.sizeKb - a.sizeKb)) {
  const marker = r.pass ? '✓' : '✗';
  console.log(`  ${marker}  ${r.file.padEnd(45)}  ${String(r.sizeKb).padStart(7)} KB  (budget ${r.budget} KB)`);
}
console.log('─'.repeat(70));

if (failures.length > 0) {
  console.log(`\n✗ ${failures.length} chunk(s) over budget:\n`);
  console.log(failures.join('\n'));
  console.log('\nEither reduce the chunk size (code-split, lazy import, drop dep)');
  console.log('or bump BUDGETS in scripts/check-bundle-budget.mjs and document why.');
  process.exit(1);
}
console.log('\n✓ All chunks within budget.');