// Backfill script — generate responsive variants (600w/1024w/1920w + avif)
// for every master image in /uploads/ that doesn't already have its
// -<width>w.<format> variants on disk.
//
// Idempotent: re-running skips files that already have all expected
// variants. Safe to run while the API is up — it only reads/writes
// /var/www/power-vital/uploads/.
//
// Usage:  node scripts/backfill-image-variants.ts

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/power-vital/uploads';
const RECEIPTS_DIR = path.join(UPLOAD_DIR, 'receipts');
const WIDTHS = [600, 1024, 1920];
const FORMATS = ['webp', 'avif'] as const;
const QUALITY = 85;
const AVIF_QUALITY = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface VariantTask {
  masterPath: string;
  outPath: string;
  width: number;
  format: 'webp' | 'avif';
}

const buildVariant = async (t: VariantTask): Promise<number> => {
  const pipeline = sharp(t.masterPath, { failOn: 'truncated' })
    .rotate()
    .resize({ width: t.width, withoutEnlargement: true });
  if (t.format === 'avif') pipeline.avif({ quality: AVIF_QUALITY, effort: 4 });
  else pipeline.webp({ quality: QUALITY });
  const info = await pipeline.toFile(t.outPath);
  return info.size;
};

const variantPaths = (base: string, ext: string, dir: string): VariantTask[] => {
  const tasks: VariantTask[] = [];
  for (const w of WIDTHS) {
    for (const f of FORMATS) {
      tasks.push({
        masterPath: path.join(dir, base + ext),
        outPath: path.join(dir, `${base}-${w}w.${f}`),
        width: w,
        format: f
      });
    }
  }
  return tasks;
};

const isAlreadyDone = async (base: string, dir: string): Promise<boolean> => {
  for (const w of WIDTHS) {
    for (const f of FORMATS) {
      try {
        await fs.access(path.join(dir, `${base}-${w}w.${f}`));
      } catch {
        return false;
      }
    }
  }
  return true;
};

const processDir = async (dir: string, label: string): Promise<void> => {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (err: any) {
    console.log(`[${label}] cannot read ${dir}: ${err.message}`);
    return;
  }

  // Only treat image extensions as masters.
  const imageExt = /\.(jpe?g|png|gif|webp|avif)$/i;
  const masters = entries.filter((e) => imageExt.test(e) && !/-\d+w\.(webp|avif)$/i.test(e));
  console.log(`[${label}] ${masters.length} master image(s) found in ${dir}`);

  let built = 0, skipped = 0, failed = 0;
  for (const m of masters) {
    const ext = path.extname(m);
    const base = path.basename(m, ext);
    if (await isAlreadyDone(base, dir)) {
      skipped++;
      continue;
    }
    const tasks = variantPaths(base, ext, dir);
    let ok = true;
    for (const t of tasks) {
      try {
        const bytes = await buildVariant(t);
        if (bytes === 0) throw new Error('empty file');
      } catch (err: any) {
        // AVIF can fail on rare PNG palettes; ignore those.
        if (t.format === 'avif') continue;
        console.error(`  [${label}] ${m} → ${path.basename(t.outPath)}: ${err.message}`);
        ok = false;
        failed++;
      }
    }
    if (ok) built++;
    // Throttle to keep CPU sane on the prod box.
    await sleep(150);
  }
  console.log(`[${label}] done: built=${built} skipped=${skipped} failed=${failed}`);
};

const main = async () => {
  console.log(`Backfilling responsive variants in ${UPLOAD_DIR}`);
  await processDir(UPLOAD_DIR, 'uploads');
  await processDir(RECEIPTS_DIR, 'receipts');
  console.log('done');
};

main().catch((e) => {
  console.error('fatal', e);
  process.exit(1);
});
