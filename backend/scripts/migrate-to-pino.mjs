// One-off migration script: console.log/error/warn → logger calls.
// Run once: `node scripts/migrate-to-pino.mjs` from backend/
// Safe to re-run: it skips files that already import logger.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src/routes', 'src/services', 'src/workers', 'src/queues', 'src/jobs', 'src/i18n', 'src/middleware', 'src/lib'];
const TARGET_EXT = '.ts';

let changed = 0;
let skipped = 0;

for (const dir of TARGET_DIRS) {
  const abs = join(ROOT, dir);
  try { statSync(abs); } catch { continue; }
  walk(abs);
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) { walk(full); continue; }
    if (extname(full) !== TARGET_EXT) continue;
    if (full.endsWith('logger.ts') || full.endsWith('httpLogger.ts')) continue;
    migrate(full);
  }
}

function migrate(file) {
  const original = readFileSync(file, 'utf8');
  if (original.includes("from '../utils/logger'") || original.includes("from '../../utils/logger'") || original.includes("from './logger'")) {
    skipped++;
    return;
  }
  let next = original;

  // console.error('msg:', error) → logger.error({ err: error }, 'msg')
  next = next.replace(
    /console\.error\(\s*(['"`])([^'"`]+)\1\s*,\s*error\s*\)/g,
    (m, q, msg) => `logger.error({ err: error }, ${q}${msg}${q})`
  );
  next = next.replace(
    /console\.error\(\s*(['"`])([^'"`]+)\1\s*,\s*e(?:rr)?\.message\s*\)/g,
    (m, q, msg) => `logger.error({ err: e?.message }, ${q}${msg}${q})`
  );
  // console.error('msg', error) without template
  next = next.replace(
    /console\.error\(\s*(['"`])([^'"`]+)\1\s*,\s*(\w+)\s*\)/g,
    (m, q, msg, v) => `logger.error({ err: ${v} }, ${q}${msg}${q})`
  );
  // console.error with no args: console.error(...) — keep first string as message
  next = next.replace(
    /console\.error\(\s*error\s*\)/g,
    `logger.error({ err: error }, 'Unhandled error')`
  );
  next = next.replace(
    /console\.error\(\s*\(?e(?:rr)?\)?\s*\)/g,
    `logger.error({ err: e }, 'Unhandled error')`
  );
  // console.error with template literal
  next = next.replace(
    /console\.error\(\s*`([^`]+)`\s*,\s*(\w+)\s*\)/g,
    (m, tpl, v) => `logger.error({ err: ${v} }, \`${tpl}\`)`
  );
  // console.log with template string
  next = next.replace(
    /console\.log\(\s*`([^`]+)`\s*\)/g,
    (m, tpl) => `logger.info(\`${tpl}\`)`
  );
  // console.log with simple string
  next = next.replace(
    /console\.log\(\s*(['"])([^'"]+)\1\s*\)/g,
    (m, q, s) => `logger.info(${q}${s}${q})`
  );
  // console.warn
  next = next.replace(
    /console\.warn\(\s*`([^`]+)`\s*,\s*([^)]+)\)/g,
    (m, tpl, extra) => `logger.warn(\`${tpl}\`, ${extra})`
  );
  next = next.replace(
    /console\.warn\(\s*(['"])([^'"]+)\1\s*\)/g,
    (m, q, s) => `logger.warn(${q}${s}${q})`
  );
  next = next.replace(
    /console\.warn\(\s*`([^`]+)`\s*\)/g,
    (m, tpl) => `logger.warn(\`${tpl}\`)`
  );

  if (next === original) { skipped++; return; }

  // Insert import after the last existing import line
  const importPath = computeImportPath(file);
  const importLine = `import { logger } from '${importPath}';\n`;
  const lines = next.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, importLine.trimEnd());
  } else {
    lines.unshift(importLine.trimEnd());
  }
  writeFileSync(file, lines.join('\n'));
  changed++;
}

function computeImportPath(file) {
  const rel = file.replace(ROOT, '').replace(/\\/g, '/');
  // All TS files in src/ except src/index.ts use ../utils/logger
  if (rel === 'src/index.ts') return './utils/logger';
  if (rel.startsWith('src/')) return '../utils/logger';
  return '../utils/logger';
}

console.log(`\nPino migration: ${changed} file(s) updated, ${skipped} skipped (already migrated or no console calls).\n`);
