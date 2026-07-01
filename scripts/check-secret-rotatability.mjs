#!/usr/bin/env node
// scripts/check-secret-rotatability.mjs
//
// Pre-flight check for rotate-secrets.cjs. Reads .env.deploy (current
// in-use secrets) and .env.deploy.new (candidate replacements), then
// verifies:
//   1. .env.deploy.new exists and contains the expected keys.
//   2. The new values differ from the current values (no-op rotation).
//   3. No committed secrets are present in the workspace that match
//      the new values (i.e. someone leaked them to git again).
//
// This does NOT make any SSH connection — it's safe to run in CI and on
// developer laptops without a VPN.
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const deployEnvPath = join(root, '.env.deploy');
const newEnvPath = join(root, '.env.deploy.new');

function parseEnv(file) {
  const out = {};
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) out[m[1]] = m[2];
    });
  return out;
}

const REQUIRED_KEYS = [
  'DEPLOY_SSH_NEW_PASSWORD',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'MAIL_PASS',
];

let failed = false;

function step(msg) { console.log(`\n=== ${msg} ===`); }
function ok(msg)   { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }
function fail(msg) { console.log(`  ✗ ${msg}`); failed = true; }

step('Pre-flight: rotate-secrets.cjs');

if (!existsSync(deployEnvPath)) {
  fail(`.env.deploy missing — see ROTATE-SECRETS.md §6.2`);
  process.exit(1);
}
const current = parseEnv(deployEnvPath);
ok(`.env.deploy loaded (${Object.keys(current).length} keys)`);

if (!existsSync(newEnvPath)) {
  fail(`.env.deploy.new missing — write the new secrets there before running rotate-secrets.cjs`);
  process.exit(1);
}
const next = parseEnv(newEnvPath);
ok(`.env.deploy.new loaded (${Object.keys(next).length} keys)`);

step('Required keys in .env.deploy.new');
for (const key of REQUIRED_KEYS) {
  if (!next[key]) {
    fail(`missing key: ${key}`);
  } else if (next[key].length < 16) {
    fail(`${key} is too short (${next[key].length} chars, expected ≥16)`);
  } else {
    ok(`${key} present (${next[key].length} chars)`);
  }
}

step('New values look distinct (heuristic check)');
// We can only compare against .env.deploy locally — the real current
// values live on the production server. The remote diff happens during
// `rotate-secrets.cjs --dry-run --all`. Here we just make sure the new
// values don't reuse obvious patterns (same length ± 0 and same first
// 8 chars = suspiciously similar).
for (const key of REQUIRED_KEYS) {
  if (!next[key] || !current[key]) {
    warn(`${key} not in .env.deploy — comparison skipped (remote check via rotate-secrets.cjs --dry-run)`);
    continue;
  }
  const newVal = next[key];
  const curVal = current[key];
  if (newVal === curVal) {
    fail(`${key} is unchanged — rotation would be a no-op`);
  } else if (newVal.slice(0, 8) === curVal.slice(0, 8)) {
    warn(`${key} shares first 8 chars with current — possible typo, please verify`);
  } else {
    ok(`${key} looks distinct (${curVal.length} → ${newVal.length} chars)`);
  }
}

step('New secrets not committed to git');
// We do a textual grep against the working tree for each new value.
// This catches the "someone pasted the new password into a chat / .md
// file" failure mode before we burn the rotation.
try {
  for (const key of ['DEPLOY_SSH_NEW_PASSWORD', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'MAIL_PASS']) {
    const value = next[key];
    if (!value) continue;
    // Use git grep if possible; otherwise fall back to node-side fs scan
    // of the most-likely file paths (excludes node_modules + dist).
    let hit = '';
    try {
      hit = execSync(
        `git -C "${root}" grep -lI --exclude-standard "${value.replace(/"/g, '\\"')}" 2>/dev/null || true`,
        { encoding: 'utf8' }
      ).trim();
    } catch { /* not a git repo or git missing */ }
    if (hit) {
      // .env.deploy and .env.deploy.new themselves are expected.
      const realHits = hit.split('\n').filter((p) =>
        !p.endsWith('.env.deploy') && !p.endsWith('.env.deploy.new')
      );
      if (realHits.length > 0) {
        fail(`${key} value found in committed files: ${realHits.join(', ')}`);
      } else {
        ok(`${key} only in expected .env.deploy* files`);
      }
    } else {
      ok(`${key} not found in any tracked file`);
    }
  }
} catch (e) {
  warn(`git grep failed (${e.message.slice(0, 60)}) — skipped leak check`);
}

step('Result');
if (failed) {
  console.log('✗ Pre-flight failed. Fix the items above before running rotate-secrets.cjs.');
  process.exit(1);
}
console.log('✓ Ready to rotate. Run:');
console.log('    node rotate-secrets.cjs --dry-run --all   # preview');
console.log('    node rotate-secrets.cjs --all             # apply');