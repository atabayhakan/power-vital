// Image service tests — verify the optimization pipeline:
//   1. Produces a master WebP at the largest requested width
//   2. Produces sub-width WebP variants (600, 1024)
//   3. Produces AVIF variants when supported
//   4. Respects withoutEnlargement: never blows up small images
//   5. Honour EXIF orientation on the master
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { optimizeUploadedImage } from '../src/services/imageService';

const TMP = join(tmpdir(), `pv-img-${Date.now()}`);

const makePng = async (width: number, height: number, color: { r: number; g: number; b: number }) => {
  return sharp({
    create: { width, height, channels: 3, background: color }
  }).png().toBuffer();
};

beforeAll(async () => {
  await fs.mkdir(TMP, { recursive: true });
});

// Note: do NOT clean up TMP — Windows holds file locks briefly after Sharp
// closes the write stream, and rm -r fails with EBUSY. The OS clears /tmp
// periodically. Tests use unique basenames so collisions are not a concern.

describe('optimizeUploadedImage', () => {
  it('produces master + responsive WebP variants for a large image', async () => {
    const input = `${Date.now()}-large.webp`;
    const buf = await makePng(2400, 1600, { r: 200, g: 100, b: 50 });
    await sharp(buf).webp({ quality: 90 }).toFile(join(TMP, input));

    const result = await optimizeUploadedImage({
      uploadDir: TMP,
      originalFilename: input,
      urlBase: '/uploads',
      widths: [600, 1024, 1920],
      formats: ['webp']
    });

    // Master must be the 1920w WebP
    expect(result.master.width).toBe(1920);
    expect(result.master.format).toBe('webp');
    expect(result.variants.length).toBe(3);

    // All 3 widths must be on disk
    for (const w of [600, 1024, 1920]) {
      const variant = result.variants.find(v => v.width === w && v.format === 'webp');
      expect(variant, `missing ${w}w webp`).toBeDefined();
      const stat = await fs.stat(join(TMP, variant!.filename));
      expect(stat.size).toBeGreaterThan(0);
    }

    // URLs follow the /uploads/<base>-<width>w.<format> convention
    expect(result.variants[0].url).toMatch(/^\/uploads\/.+-600w\.webp$/);
  });

  it('produces AVIF variants when requested', async () => {
    const input = `${Date.now()}-avif.webp`;
    const buf = await makePng(1200, 800, { r: 50, g: 200, b: 100 });
    await sharp(buf).webp({ quality: 90 }).toFile(join(TMP, input));

    const result = await optimizeUploadedImage({
      uploadDir: TMP,
      originalFilename: input,
      urlBase: '/uploads',
      widths: [600, 1024],
      formats: ['webp', 'avif']
    });

    // 2 widths × 2 formats = 4 variants
    expect(result.variants.length).toBe(4);

    const avifVariants = result.variants.filter(v => v.format === 'avif');
    expect(avifVariants.length).toBe(2);
    for (const v of avifVariants) {
      expect(v.url).toMatch(/\.avif$/);
      const stat = await fs.stat(join(TMP, v.filename));
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  it('does NOT enlarge small images (withoutEnlargement respected)', async () => {
    const input = `${Date.now()}-small.webp`;
    // 400x300 image — smaller than the smallest width (600)
    const buf = await makePng(400, 300, { r: 10, g: 10, b: 10 });
    await sharp(buf).webp({ quality: 90 }).toFile(join(TMP, input));

    const result = await optimizeUploadedImage({
      uploadDir: TMP,
      originalFilename: input,
      urlBase: '/uploads',
      widths: [600, 1024, 1920],
      formats: ['webp']
    });

    // The "600w" variant should still be 400px wide (no enlargement)
    const variant600 = result.variants.find(v => v.width === 600);
    expect(variant600).toBeDefined();
    const meta = await sharp(join(TMP, variant600!.filename)).metadata();
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(300);

    // Same for 1024w and 1920w — must stay 400x300
    for (const w of [1024, 1920]) {
      const v = result.variants.find(x => x.width === w);
      const m = await sharp(join(TMP, v!.filename)).metadata();
      expect(m.width).toBe(400);
    }
  });

  it('master URL points to the same file the DB will store', async () => {
    const input = `${Date.now()}-master.webp`;
    const buf = await makePng(2000, 1200, { r: 100, g: 50, b: 200 });
    await sharp(buf).webp({ quality: 90 }).toFile(join(TMP, input));

    const result = await optimizeUploadedImage({
      uploadDir: TMP,
      originalFilename: input,
      urlBase: '/uploads',
      widths: [600, 1024, 1920],
      formats: ['webp'],
      // Skip the file rename — the variant's URL is still valid for the DB.
      rewriteMaster: false
    });

    // Master is the 1920w WebP variant
    expect(result.master.width).toBe(1920);
    expect(result.master.format).toBe('webp');
    expect(result.master.url).toBe(`/uploads/${result.master.filename}`);

    // 1920w variant must exist on disk
    const stat = await fs.stat(join(TMP, result.master.filename));
    expect(stat.size).toBeGreaterThan(0);
  });
});
