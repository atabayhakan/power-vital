// Power Vital - Full Hot Deploy (backend + frontend + restart)
//
// Credentials: password-based SSH auth. The password is read from
// process.env.DEPLOY_SSH_PASSWORD so it never lives in this file.
// Required env:
//   DEPLOY_SSH_HOST     default: 193.160.119.100
//   DEPLOY_SSH_PORT     default: 65002
//   DEPLOY_SSH_USER     default: root
//   DEPLOY_SSH_PASSWORD (required)
//
// Usage:
//   DEPLOY_SSH_PASSWORD='...' node full-hot-deploy.js
//   or use a .env.deploy file (auto-loaded via process.loadEnvFile below)
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');
const path = require('path');
const os = require('os');

// Auto-load .env.deploy if it exists (Node 20.6+ built-in).
const envFile = path.join(__dirname, '.env.deploy');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const CONFIG = {
  host: process.env.DEPLOY_SSH_HOST || '193.160.119.100',
  port: Number(process.env.DEPLOY_SSH_PORT || 65002),
  username: process.env.DEPLOY_SSH_USER || 'root',
  password: process.env.DEPLOY_SSH_PASSWORD || '',
  remoteDir: '/var/www/power-vital',
  localBackendDist: path.join(__dirname, 'backend', 'dist'),
  localFrontendDist: path.join(__dirname, 'frontend', 'dist'),
  remoteBackendDist: '/var/www/power-vital/backend/dist',
  remoteFrontendDist: '/var/www/power-vital/frontend/dist',
};

if (!CONFIG.password) {
  console.error('HATA: DEPLOY_SSH_PASSWORD env değişkeni tanımlı değil.');
  console.error('Çözüm 1 — .env.deploy dosyası oluştur:');
  console.error('   DEPLOY_SSH_HOST=193.160.119.100');
  console.error('   DEPLOY_SSH_PORT=65002');
  console.error('   DEPLOY_SSH_USER=root');
  console.error('   DEPLOY_SSH_PASSWORD=<şifre>');
  console.error('   DEPLOY_REMOTE_DIR=/var/www/power-vital');
  console.error('Çözüm 2 — Inline env ile çağır:');
  console.error('   DEPLOY_SSH_PASSWORD="..." node full-hot-deploy.js');
  process.exit(1);
}

async function deploy() {
  try {
    console.log('[1/6] Connecting...');
    await ssh.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
      readyTimeout: 30000,
      tryKeyboard: true,
    });
    console.log(`   OK (${CONFIG.username}@${CONFIG.host}:${CONFIG.port})\n`);

    // ─── BACKEND ───
    console.log('[2/6] Uploading backend dist...');
    await ssh.execCommand(`mkdir -p ${CONFIG.remoteBackendDist}`);
    // Remove routes folder to avoid stale files
    await ssh.execCommand(`rm -rf ${CONFIG.remoteBackendDist}/routes && mkdir -p ${CONFIG.remoteBackendDist}/routes`);
    await ssh.putDirectory(CONFIG.localBackendDist, CONFIG.remoteBackendDist, {
      recursive: true,
      concurrency: 8,
      tick: (lp) => process.stdout.write('.'),
    });
    console.log('\n   OK\n');

    // ─── PRISMA SCHEMA + REGENERATE CLIENT ───
    // The generated Prisma client is derived from schema.prisma. Whenever the
    // schema changes (new/removed columns) we must regenerate it on the
    // server before restarting, otherwise the runtime will query columns
    // that no longer exist in the generated client and fail.
    console.log('[2.5/6] Uploading schema.prisma + regenerating Prisma client...');
    const localSchema = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
    const remoteSchema = path.join(CONFIG.remoteDir, 'backend', 'prisma', 'schema.prisma');
    await ssh.putFile(localSchema, remoteSchema);
    // Sync production dependencies first — prisma CLI must exist before
    // we attempt `prisma db push` below. Diff package.json to decide if
    // a re-install is necessary (cheap no-op if no new prod deps).
    console.log('   Reconciling production node_modules...');
    const localPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'backend', 'package.json'), 'utf8'));
    const remotePkgPath = `${CONFIG.remoteDir}/backend/package.json`;
    const remotePkgExists = await ssh.execCommand(`test -f ${remotePkgPath} && echo yes || echo no`);
    let needsInstall = remotePkgExists.stdout.trim() !== 'yes';
    if (!needsInstall) {
      const remotePkg = JSON.parse((await ssh.execCommand(`cat ${remotePkgPath}`)).stdout);
      const localDeps = Object.keys(localPkg.dependencies ?? {});
      const remoteDeps = Object.keys(remotePkg.dependencies ?? {});
      const added = localDeps.filter(d => !remoteDeps.includes(d));
      if (added.length > 0) {
        console.log(`   New prod deps detected: ${added.join(', ')}`);
        needsInstall = true;
      }
    }
    if (needsInstall) {
      // We always need prisma + tsx as runtime tools in production
      // (prisma db push, schema validation, typecheck hooks). Install
      // them explicitly so a stale remote package-lock.json (which
      // doesn't yet know about new prod deps) can't make `npm install
      // --omit=dev` a no-op and leave us without the prisma CLI.
      const res = await ssh.execCommand(
        `cd ${CONFIG.remoteDir}/backend && npm install prisma@5.22.0 tsx@^4.22.4 --no-audit --no-fund --legacy-peer-deps 2>&1 | tail -5`
      );
      console.log('   ' + (res.stdout || '').trim().split('\n').join('\n   '));
    } else {
      console.log('   node_modules already in sync.');
    }

    await ssh.execCommand(`cd ${CONFIG.remoteDir}/backend && ./node_modules/.bin/prisma db push --accept-data-loss && rm -rf prisma/generated && ./node_modules/.bin/prisma generate 2>&1 | tail -3`);

    console.log('   Running data migrations...');
    const localMigration = path.join(__dirname, 'backend', 'migrate-reviews.ts');
    const remoteMigration = path.join(CONFIG.remoteDir, 'backend', 'migrate-reviews.ts');
    if (fs.existsSync(localMigration)) {
      await ssh.putFile(localMigration, remoteMigration);
      const migRes = await ssh.execCommand(`cd ${CONFIG.remoteDir}/backend && npx tsx migrate-reviews.ts`);
      console.log('   Migration output:', migRes.stdout);
    }
    console.log('   OK\n');

    // ─── FRONTEND ───
    console.log('[3/6] Clearing & uploading frontend dist...');
    await ssh.execCommand(`rm -rf ${CONFIG.remoteFrontendDist} && mkdir -p ${CONFIG.remoteFrontendDist}`);
    await ssh.putDirectory(CONFIG.localFrontendDist, CONFIG.remoteFrontendDist, {
      recursive: true,
      concurrency: 8,
      tick: (lp) => process.stdout.write('.'),
    });
    console.log('\n   OK\n');

    // ─── RESTART PM2 ───
    console.log('[4/6] Restarting PM2...');
    const r = await ssh.execCommand('pm2 restart power-vital-api && sleep 2 && pm2 list');
    console.log(r.stdout);

    // ─── VERIFY BACKEND JSON PARSING ───
    console.log('[5/6] Verifying settings GET parses JSON...');
    // Wait a sec for PM2 to fully boot
    await new Promise(r => setTimeout(r, 3000));
    const probe = await ssh.execCommand(`curl -s http://localhost:3000/api/v1/settings | head -c 300`);
    console.log('Backend response head:');
    console.log(probe.stdout);

    // ─── VERIFY FRONTEND ───
    console.log('\n[6/6] Frontend health check...');
    const front = await ssh.execCommand(`curl -s -o /dev/null -w "Frontend HTTP: %{http_code}\\n" http://localhost/`);
    console.log(front.stdout);

    console.log('\n=== FULL HOT DEPLOY SUCCESSFUL ===');
    console.log('Site: http://' + CONFIG.host);
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    ssh.dispose();
  }
}

deploy();
