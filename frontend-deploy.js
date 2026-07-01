// Power Vital - Frontend-only hot deploy (no backend changes)
// Credentials: password from .env.deploy (NEVER committed).
const path = require('path');
const fs = require('fs');
const { NodeSSH } = require('node-ssh');

const ENV_FILE = path.join(__dirname, '.env.deploy');
if (!fs.existsSync(ENV_FILE)) {
  console.error(`HATA: ${ENV_FILE} bulunamadı. ROTATE-SECRETS.md §6.2'ye bakın.`);
  process.exit(1);
}
process.loadEnvFile(ENV_FILE);

const HOST = process.env.DEPLOY_SSH_HOST;
const PORT = Number(process.env.DEPLOY_SSH_PORT || 22);
const USER = process.env.DEPLOY_SSH_USER;
const PASSWORD = process.env.DEPLOY_SSH_PASSWORD;
const REMOTE_DIR = process.env.DEPLOY_REMOTE_DIR || '/var/www/power-vital';

if (!HOST || !USER || !PASSWORD) {
  console.error('HATA: .env.deploy içinde DEPLOY_SSH_HOST/USER/PASSWORD gerekli.');
  process.exit(1);
}

const CONFIG = {
  host: HOST,
  port: PORT,
  username: USER,
  password: PASSWORD,
  remoteDir: REMOTE_DIR,
  localFrontendDist: path.join(__dirname, 'frontend', 'dist'),
  remoteFrontendDist: `${REMOTE_DIR}/frontend/dist`,
};

async function deploy() {
  const ssh = new NodeSSH();
  try {
    console.log('[1/4] Connecting...');
    await ssh.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
      readyTimeout: 30000,
      tryKeyboard: true,
    });
    console.log('   OK\n');

    console.log('[2/4] Clearing & uploading frontend dist...');
    await ssh.execCommand(`rm -rf ${CONFIG.remoteFrontendDist} && mkdir -p ${CONFIG.remoteFrontendDist}`);
    await ssh.putDirectory(CONFIG.localFrontendDist, CONFIG.remoteFrontendDist, {
      recursive: true,
      concurrency: 8,
      tick: () => process.stdout.write('.'),
    });
    console.log('\n   OK\n');

    console.log('[3/4] Verifying...');
    await new Promise((r) => setTimeout(r, 2000));
    const probe = await ssh.execCommand(`curl -s -o /dev/null -w "HTTP: %{http_code}\\n" http://localhost/`);
    console.log(probe.stdout.trim());

    console.log('\n[4/4] DONE');
    console.log(`Site: http://${CONFIG.host}`);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deploy();