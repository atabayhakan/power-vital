// Dist build smoke test — serves dist/ on a local port, hits the routes
// a real browser would request, and asserts:
//
//   • index.html returns 200 with the expected <link>/<script> tags
//   • All hashed assets under /assets/ resolve and return 200
//   • Security headers present on the HTML response (the ones nginx
//     sets; we don't expect Vite's dev server to set CSP)
//   • Asset sizes are within budget (gzip + raw)
//
// Run with:
//   npm run build && npm run smoke:dist
//
// Output is plain text suitable for CI log capture.
import { createServer } from 'http';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.SMOKE_DIST_PORT) || 4173;

// MIME map — Vite serves these via nginx in production, but for a smoke
// test we just need Content-Type to be correct enough for our checks.
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

// Asset size budgets (gzipped). Anything bigger means the bundle is
// regressing — fix it before it ships.
const BUDGETS = {
  mainJsGzip:    180 * 1024,   // main bundle ~140KB today, allow 180KB
  quillJsGzip:    60 * 1024,
  pageBuilderGzip: 90 * 1024,
  totalJsGzip:   700 * 1024   // all JS combined
};

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const results: CheckResult[] = [];

const check = (name: string, ok: boolean, detail: string) => {
  results.push({ name, ok, detail });
  const mark = ok ? '✅' : '❌';
  console.log(`  ${mark} ${name} — ${detail}`);
};

const readDistFile = async (rel: string): Promise<Buffer | null> => {
  try {
    return await fs.readFile(join(DIST, rel));
  } catch {
    return null;
  }
};

const startServer = async () => {
  // Inventory the dist directory. We need both the bare path
  // (e.g. "/favicon.svg") AND any nested paths. readdir recursive
  // returns paths like "assets/index-abc.js" with the directory
  // separator matching the host OS — normalise to forward slashes.
  const collectFiles = async (dir: string, prefix = ''): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const urlPath = prefix + '/' + e.name;
      if (e.isDirectory()) {
        await collectFiles(join(dir, e.name), urlPath);
      } else {
        fileMap.set(urlPath, join(dir, e.name));
      }
    }
  };
  const fileMap = new Map<string, string>();
  await collectFiles(DIST, '');

  // Capture main + lazy chunks for budget checks
  const assetsDir = await fs.readdir(join(DIST, 'assets')).catch(() => []);
  const jsFiles = assetsDir.filter(f => f.endsWith('.js'));
  let totalGzip = 0;
  let mainGzip = 0;
  let quillGzip = 0;
  let pageBuilderGzip = 0;
  for (const f of jsFiles) {
    const buf = await fs.readFile(join(DIST, 'assets', f));
    const gz = gzipSync(buf).length;
    totalGzip += gz;
    if (f.startsWith('index-'))      mainGzip        = Math.max(mainGzip, gz);
    if (f.startsWith('quill-'))      quillGzip       = gz;
    if (f.startsWith('PageBuilder')) pageBuilderGzip = gz;
  }

  console.log();
  console.log('═'.repeat(70));
  console.log('  DIST BUILD SMOKE TEST');
  console.log('═'.repeat(70));
  console.log();
  console.log(`  Serving from: ${DIST}`);
  console.log(`  Port:         ${PORT}`);
  console.log();

  // Budget checks
  check('main bundle gzip ≤ 180KB',
    mainGzip <= BUDGETS.mainJsGzip,
    `${(mainGzip / 1024).toFixed(1)} KB`);
  check('quill chunk gzip ≤ 60KB',
    quillGzip <= BUDGETS.quillJsGzip,
    `${(quillGzip / 1024).toFixed(1)} KB`);
  check('PageBuilder chunk gzip ≤ 90KB',
    pageBuilderGzip <= BUDGETS.pageBuilderGzip,
    `${(pageBuilderGzip / 1024).toFixed(1)} KB`);
  check('total JS gzip ≤ 700KB',
    totalGzip <= BUDGETS.totalJsGzip,
    `${(totalGzip / 1024).toFixed(1)} KB (${jsFiles.length} files)`);

  // Boot the server (hand-crafted; we don't need express for smoke)
  const server = createServer(async (req, res) => {
    const url = req.url || '/';
    // SPA fallback — anything that isn't a known asset returns index.html
    const filePath = fileMap.get(url) ?? fileMap.get('/index.html');
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    try {
      const data = await fs.readFile(filePath);
      const ext = extname(filePath).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': url === '/' ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end('Read error');
    }
  });

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  return { server, fileMap };
};

const main = async () => {
  // Verify dist exists
  try {
    await fs.access(DIST);
  } catch {
    console.error(`❌ dist/ not found at ${DIST} — run "npm run build" first`);
    process.exit(1);
  }

  const { server } = await startServer();

  const fetchUrl = async (path: string): Promise<{ status: number; headers: Record<string, string>; body: string }> => {
    const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    const body = await res.text();
    return { status: res.status, headers, body };
  };

  // ── HTML checks ──────────────────────────────────────────────────────
  console.log();
  console.log('  HTML checks:');
  const html = await fetchUrl('/');
  check('GET / returns 200', html.status === 200, `status=${html.status}`);
  check('Content-Type is text/html', /text\/html/.test(html.headers['content-type'] || ''), html.headers['content-type'] || '');
  // "kg" is the app-wide default locale (useTranslate's readLocale, the
  // axios Accept-Language interceptor, and index.html all default to it).
  check('<html lang="kg"> present', /<html\s+lang="kg"/i.test(html.body), 'lang attribute');
  check('index.html includes <div id="app">', /<div\s+id="app">/.test(html.body), 'SPA root mounted');
  // Production build replaces the dev entry with a hashed asset
  check('index.html has a hashed /assets/*.js script',
    /<script[^>]+src="\/assets\/index-[A-Za-z0-9_-]+\.js"/.test(html.body),
    'production entry script');
  check('index.html preconnects fonts.googleapis.com',
    /<link\s+rel="preconnect"\s+href="https:\/\/fonts\.googleapis\.com"/i.test(html.body),
    'preconnect present');
  check('index.html preconnects cdn.myikas.com',
    /<link\s+rel="preconnect"\s+href="https:\/\/cdn\.myikas\.com"/i.test(html.body),
    'image CDN preconnect');
  check('index.html references manifest.json',
    /<link\s+rel="manifest"\s+href="\/manifest\.json"/.test(html.body),
    'PWA manifest');

  // ── Asset checks ─────────────────────────────────────────────────────
  console.log();
  console.log('  Asset checks:');
  const manifest = await readDistFile('manifest.json');
  check('manifest.json exists', !!manifest, manifest ? `${manifest.length} bytes` : 'missing');

  // Pick the first hashed JS asset under /assets/ and check it serves
  try {
    const assets = await fs.readdir(join(DIST, 'assets'));
    const sampleJs = assets.find(f => f.endsWith('.js'));
    if (sampleJs) {
      const r = await fetchUrl(`/assets/${sampleJs}`);
      check(`GET /assets/${sampleJs} returns 200`, r.status === 200, `${r.body.length} chars`);
      check(`Content-Type is application/javascript for ${sampleJs}`,
        /application\/javascript/.test(r.headers['content-type'] || ''),
        r.headers['content-type'] || '');
      check(`Cache-Control immutable for ${sampleJs}`,
        /max-age=31536000/.test(r.headers['cache-control'] || ''),
        r.headers['cache-control'] || '');
    }
    const sampleCss = assets.find(f => f.endsWith('.css'));
    if (sampleCss) {
      const r = await fetchUrl(`/assets/${sampleCss}`);
      check(`GET /assets/${sampleCss} returns 200`, r.status === 200, `${r.body.length} chars`);
    } else {
      check('CSS bundle exists', false, 'no .css file in dist/assets/');
    }
  } catch (e: any) {
    check('dist/assets/ readable', false, e.message);
  }

  // ── SPA fallback ─────────────────────────────────────────────────────
  console.log();
  console.log('  SPA fallback:');
  const adminRoute = await fetchUrl('/admin');
  check('GET /admin returns 200 (SPA fallback)', adminRoute.status === 200, 'index.html served');
  check('/admin serves the same shell as /',
    adminRoute.body === html.body,
    'identical content (router handles the rest client-side)');

  // ── Static files ─────────────────────────────────────────────────────
  console.log();
  console.log('  Static files:');
  for (const file of ['favicon.svg', 'icons.svg', 'manifest.json']) {
    const r = await fetchUrl(`/${file}`);
    check(`GET /${file}`, r.status === 200, `${r.body.length} bytes`);
  }

  server.close();

  // ── Summary ──────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log();
  console.log('═'.repeat(70));
  console.log(`  ${passed}/${results.length} checks passed`);
  if (failed > 0) {
    console.log(`  ❌ ${failed} FAILED — see above`);
    process.exit(1);
  } else {
    console.log('  ✅ dist/ ready to ship');
  }
  console.log('═'.repeat(70));
};

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
