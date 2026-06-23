// scripts/parse-stats.mjs — quick bundle-size report from the Vite build log.
//
// We DON'T try to parse dist/stats.html here. v5/v7 schemas differ, the
// JSON embed pattern is brittle, and the visualizer adds analysis cost
// to every build. Vite's own build output already prints every chunk's
// size in a stable tabular format — that's the source of truth.
//
// Usage:
//   1. Run `npm run build`.
//   2. Pipe the output:  npm run build 2>&1 | tee .vite-build.log
//   3. Run this script:  node scripts/parse-stats.mjs .vite-build.log
//
// If no log file is passed, we fall back to dist/stats.html (best effort).
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = process.argv[2] ?? '.vite-build.log';

const chunks = [];

const logPath = join(process.cwd(), LOG_FILE);
if (existsSync(logPath)) {
  // Parse Vite output table. Each line looks like:
  //   dist/assets/foo-bar.js  12.34 kB │ gzip:  4.56 kB
  //   dist/index.html  1.23 kB │ gzip:  0.65 kB
  const re = /^(dist\/\S+)\s+([\d.]+)\s*(B|kB|MB)\s*(?:\|\s*gzip:\s*([\d.]+)\s*(B|kB|MB))?/;
  const html = readFileSync(logPath, 'utf8');
  for (const line of html.split(/\r?\n/)) {
    const m = line.match(re);
    if (!m) continue;
    const toBytes = (n, unit) => {
      const v = Number(n);
      if (unit === 'kB') return v * 1024;
      if (unit === 'MB') return v * 1024 * 1024;
      return v;
    };
    chunks.push({
      name: m[1].replace(/^dist\//, ''),
      size: toBytes(m[2], m[3]),
      gzip: m[4] ? toBytes(m[4], m[5]) : 0,
      brotli: 0
    });
  }
}

if (chunks.length === 0) {
  console.error(`No chunks parsed from ${logPath}.`);
  console.error(`Run \`npm run build\` and save its output (e.g. via 2>&1 | tee ${LOG_FILE}).`);
  process.exit(1);
}

chunks.sort((a, b) => b.size - a.size);

const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);

console.log(`Bundle report — ${chunks.length} chunks:`);
console.log('');
console.log(pad('chunk', 56) + pad('size', 12) + pad('gzip', 12));
console.log('-'.repeat(80));

let totalSize = 0;
let totalGzip = 0;
for (const c of chunks) {
  console.log(
    pad(c.name, 56) +
      pad(fmt(c.size), 12) +
      pad(c.gzip ? fmt(c.gzip) : '-', 12)
  );
  totalSize += c.size;
  totalGzip += c.gzip;
}

console.log('-'.repeat(80));
console.log(
  pad('TOTAL', 56) +
    pad(fmt(totalSize), 12) +
    pad(fmt(totalGzip), 12)
);