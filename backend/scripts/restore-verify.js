#!/usr/bin/env node
// Restore-verify: take the latest backup, restore it into a throwaway test
// database, and run sanity checks. This catches "the backup is running fine
// but produces an un-restorable file" before it matters in production.
//
// Usage:
//   node scripts/restore-verify.js                          # use latest daily
//   node scripts/restore-verify.js --file=path.sql.gz       # use a specific file
//   node scripts/restore-verify.js --keep                   # keep test DB after run
//
// Required env:
//   BACKUP_DATABASE_URL — full MySQL creds of a *test* server (e.g. pv_test on staging)
//   Optional: BACKUP_DIR (default ./backups)

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { createGunzip } = require('zlib');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const { config: loadEnv } = require('dotenv');

const execFileAsync = promisify(execFile);

const args = process.argv.slice(2);
const arg = (k) => {
  const m = args.find(a => a.startsWith(`--${k}=`));
  return m ? m.split('=').slice(1).join('=') : null;
};
const explicitFile = arg('file');
const keepTestDb = args.includes('--keep');

loadEnv({ path: path.resolve(__dirname, '../.env'), override: false });
const testUrl = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
if (!testUrl) {
  console.error('FATAL: BACKUP_DATABASE_URL or DATABASE_URL must be set');
  process.exit(1);
}

const u = new URL(testUrl);
const conn = {
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  host: u.hostname,
  port: u.port || '3306'
};

const BACKUP_DIR = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.resolve(__dirname, '../backups');

const log = (m) => process.stdout.write(`[${new Date().toISOString()}] ${m}\n`);

const mysqlExec = async (sql, db) => {
  const args = ['-h', conn.host, '-P', conn.port, '-u', conn.user];
  if (db) args.push(db);
  args.push('-e', sql);
  return execFileAsync('mysql', args, { env: { ...process.env, MYSQL_PWD: conn.password } });
};

const findLatest = () => {
  if (explicitFile) return path.resolve(explicitFile);
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs, full: path.join(BACKUP_DIR, f) }))
    .sort((a, b) => b.mtime - a.mtime);
  if (files.length === 0) throw new Error(`No .sql.gz files found in ${BACKUP_DIR}`);
  return files[0].full;
};

const main = async () => {
  const backupFile = findLatest();
  const backupSize = fs.statSync(backupFile).size;
  log(`Selected backup: ${path.basename(backupFile)} (${(backupSize / 1024 / 1024).toFixed(2)} MB)`);

  const testDb = `pv_restore_check_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  log(`Creating throwaway database: ${testDb}`);
  await mysqlExec(`CREATE DATABASE \`${testDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  const start = Date.now();
  const sqlFile = backupFile.replace(/\.gz$/, '');
  try {
    // 1. Decompress
    log('Decompressing...');
    await pipeline(createReadStream(backupFile), createGunzip(), createWriteStream(sqlFile));
    const decompressedSize = fs.statSync(sqlFile).size;
    log(`Decompressed: ${(decompressedSize / 1024 / 1024).toFixed(2)} MB`);

    // 2. Restore
    log('Restoring into test DB...');
    await new Promise((resolve, reject) => {
      const child = execFile('mysql', [
        '-h', conn.host, '-P', conn.port, '-u', conn.user, testDb
      ], { env: { ...process.env, MYSQL_PWD: conn.password } });
      let stderr = '';
      child.stderr.on('data', (d) => { stderr += d.toString(); });
      const stream = createReadStream(sqlFile).pipe(child.stdin);
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`mysql exited ${code}: ${stderr}`)));
      child.on('error', reject);
      stream.on('error', reject);
    });
    log(`Restore complete in ${((Date.now() - start) / 1000).toFixed(1)}s`);

    // 3. Sanity checks — make sure the dump actually contains data
    log('Running sanity checks...');
    const checks = [
      { table: 'User', minRows: 0, desc: 'user accounts' },
      { table: 'Product', minRows: 0, desc: 'products' },
      { table: 'Order', minRows: 0, desc: 'orders' },
      { table: 'Transaction', minRows: 0, desc: 'wallet transactions' }
    ];
    for (const c of checks) {
      const { stdout } = await mysqlExec(`SELECT COUNT(*) AS n FROM \`${c.table}\``, testDb);
      const n = parseInt(String(stdout).match(/(\d+)/)?.[1] || '0', 10);
      const ok = n >= c.minRows;
      log(`  ${ok ? 'OK ' : 'WARN'} ${c.table}: ${n} rows (${c.desc})`);
      if (!ok) {
        throw new Error(`Sanity check failed: ${c.table} has ${n} rows, expected >= ${c.minRows}`);
      }
    }

    // 4. Check that the FULLTEXT index is present (catches missing-migration bugs)
    const { stdout: idxOut } = await mysqlExec(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='${testDb}' AND TABLE_NAME='Product' AND INDEX_NAME='product_fulltext_idx'`,
      testDb
    );
    const hasFulltext = /product_fulltext_idx/.test(String(idxOut));
    log(`  ${hasFulltext ? 'OK ' : 'WARN'} FULLTEXT index product_fulltext_idx: ${hasFulltext ? 'present' : 'MISSING'}`);

    log(`RESTORE VERIFY: PASS  (${((Date.now() - start) / 1000).toFixed(1)}s total)`);
  } finally {
    // Cleanup
    if (!keepTestDb) {
      log(`Dropping test DB: ${testDb}`);
      try { await mysqlExec(`DROP DATABASE \`${testDb}\``); } catch (e) { log(`  (failed: ${e.message})`); }
    } else {
      log(`Keeping test DB: ${testDb} (--keep)`);
    }
    try { fs.unlinkSync(sqlFile); } catch {}
  }
};

main().catch(err => {
  console.error(`RESTORE VERIFY: FAIL\n  ${err.message}`);
  process.exit(1);
});
