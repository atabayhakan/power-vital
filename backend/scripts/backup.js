#!/usr/bin/env node
// Daily MySQL backup with rotation.
//
// Usage:
//   node scripts/backup.js                       # daily
//   node scripts/backup.js --type=weekly         # weekly
//   node scripts/backup.js --type=monthly        # monthly
//   node scripts/backup.js --type=daily --upload # also push to S3
//
// Reads DATABASE_URL from .env (or BACKUP_DATABASE_URL override).
//
// Rotation policy:
//   • daily   — keep last 7
//   • weekly  — keep last 4  (Sunday only)
//   • monthly — keep last 12 (1st of month only)
//
// Each backup is gzipped .sql file in BACKUP_DIR (default ./backups).
// Exit code 0 on success, 1 on failure. Logs go to stdout + backup.log.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { createGzip } = require('zlib');
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('fs');
const { config: loadEnv } = require('dotenv');

const execFileAsync = promisify(execFile);

// ── Args + env ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg = (k) => {
  const m = args.find(a => a.startsWith(`--${k}=`));
  return m ? m.split('=').slice(1).join('=') : null;
};
const type = arg('type') || 'daily';
const shouldUpload = args.includes('--upload');

loadEnv({ path: path.resolve(__dirname, '../.env'), override: false });
const dbUrl = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('FATAL: DATABASE_URL not set in .env');
  process.exit(1);
}

// Parse mysql://user:pass@host:port/db
const u = new URL(dbUrl);
const db = {
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  host: u.hostname,
  port: u.port || '3306',
  database: u.pathname.replace(/^\//, '').replace(/\?.*$/, '')
};
if (!db.database) {
  console.error('FATAL: database name missing from DATABASE_URL');
  process.exit(1);
}

const BACKUP_DIR = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.resolve(__dirname, '../backups');
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try { fs.appendFileSync(path.join(BACKUP_DIR, 'backup.log'), line); } catch {}
};

// ── mysqldump wrapper ─────────────────────────────────────────────────────
const dumpMysql = async (outFile) => {
  const args = [
    `-h${db.host}`,
    `-P${db.port}`,
    `-u${db.user}`,
    // Don't dump routines/triggers to keep dump small and avoid definer issues
    // when restoring into a DB where the original user no longer exists.
    '--skip-routines',
    '--skip-triggers',
    '--single-transaction',
    '--quick',
    '--routines=false',
    '--column-statistics=0',
    db.database
  ];
  log(`mysqldump ${db.host}:${db.port}/${db.database} -> ${outFile}`);

  // Stream mysqldump stdout -> gzip -> file
  return new Promise((resolve, reject) => {
    const child = execFile('mysqldump', args, {
      env: { ...process.env, MYSQL_PWD: db.password },
      maxBuffer: 1024 * 1024 * 256
    });
    const gzip = createGzip({ level: 9 });
    const out = createWriteStream(outFile);
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.stdout.pipe(gzip).pipe(out);
    out.on('finish', () => {
      if (child.exitCode === 0) resolve();
      else reject(new Error(`mysqldump exited ${child.exitCode}: ${stderr}`));
    });
    out.on('error', reject);
    child.on('error', reject);
  });
};

// ── Optional S3 upload ────────────────────────────────────────────────────
const uploadToS3 = async (file) => {
  const bucket = process.env.BACKUP_S3_BUCKET;
  const prefix = process.env.BACKUP_S3_PREFIX || 'db-backups';
  if (!bucket) { log('S3 upload skipped (BACKUP_S3_BUCKET not set)'); return; }
  const key = `${prefix}/${path.basename(file)}`;
  // Use AWS CLI for portability — avoids an SDK dependency for a single command.
  try {
    await execFileAsync('aws', ['s3', 'cp', file, `s3://${bucket}/${key}`, '--only-show-errors'], { timeout: 600_000 });
    log(`Uploaded s3://${bucket}/${key}`);
  } catch (err) {
    log(`S3 upload FAILED: ${err.message}`);
    // Don't fail the whole backup if S3 is unreachable
  }
};

// ── Rotation ─────────────────────────────────────────────────────────────
const RETENTION = { daily: 7, weekly: 4, monthly: 12 };

const rotate = (type) => {
  const prefix = `${db.database}-${type}-`;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith('.sql.gz'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  const keep = RETENTION[type] || 7;
  const toDelete = files.slice(keep);
  for (const f of toDelete) {
    const full = path.join(BACKUP_DIR, f.name);
    fs.unlinkSync(full);
    log(`Rotated (deleted): ${f.name}`);
  }
};

// ── Main ─────────────────────────────────────────────────────────────────
const main = async () => {
  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    console.error(`FATAL: --type must be one of daily|weekly|monthly (got "${type}")`);
    process.exit(1);
  }
  // Skip work if it's not the right day for weekly/monthly
  const d = new Date();
  if (type === 'weekly' && d.getUTCDay() !== 0) {
    log(`weekly backup skipped (today is not Sunday UTC, day=${d.getUTCDay()})`);
    return;
  }
  if (type === 'monthly' && d.getUTCDate() !== 1) {
    log(`monthly backup skipped (today is not the 1st UTC, date=${d.getUTCDate()})`);
    return;
  }

  const stamp = d.toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2024-01-15T10-30-00
  const filename = `${db.database}-${type}-${stamp}.sql.gz`;
  const outPath = path.join(BACKUP_DIR, filename);

  const start = Date.now();
  try {
    await dumpMysql(outPath);
    const size = fs.statSync(outPath).size;
    const tookSec = ((Date.now() - start) / 1000).toFixed(1);
    log(`OK ${filename} (${(size / 1024 / 1024).toFixed(2)} MB in ${tookSec}s)`);
    if (shouldUpload) await uploadToS3(outPath);
    rotate(type);
  } catch (err) {
    log(`FAILED: ${err.message}`);
    // Clean up partial dump
    try { fs.unlinkSync(outPath); } catch {}
    process.exit(1);
  }
};

main();
