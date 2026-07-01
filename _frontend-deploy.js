// Power Vital - Frontend-only hot deploy (static dist → nginx). No backend,
// no prisma db push, no PM2 restart — only the Vue dist is replaced.
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
  localFrontendDist: path.join(__dirname, 'frontend', 'dist'),
  remoteFrontendDist: `${REMOTE_DIR}/frontend/dist`,
};

(async () => {
  const ssh = new NodeSSH();
  try {
    console.log('[1/3] Connecting...');
    await ssh.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
      readyTimeout: 30000,
      tryKeyboard: true,
    });
    console.log('   OK\n');

    console.log('[2/3] Clearing & uploading frontend dist...');
    await ssh.execCommand(`rm -rf ${CONFIG.remoteFrontendDist} && mkdir -p ${CONFIG.remoteFrontendDist}`);
    await ssh.putDirectory(CONFIG.localFrontendDist, CONFIG.remoteFrontendDist, {
      recursive: true,
      concurrency: 8,
      tick: () => process.stdout.write('.'),
    });
    console.log('\n   OK\n');

    console.log('[3/3] Frontend health check...');
    const front = await ssh.execCommand(`curl -s -o /dev/null -w "Frontend HTTP: %{http_code}\\n" http://localhost/`);
    console.log(front.stdout.trim());

    console.log('\n=== FRONTEND DEPLOY SUCCESSFUL ===');
    console.log('Site: https://www.powervital.org');
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
})();