// Image optimization pipeline.
//
// Single source of truth for every image that goes through the backend.
// Produces responsive variants in WebP (universal) and AVIF (modern browsers)
// without altering the visual quality — same dimensions, just better encoding.
//
// Quality settings:
//   • quality: 85 — visual sweet spot (Google Lighthouse / Mozilla WebP
//     recommendations). 100 = pixel-perfect but ~3x larger; 80 is the
//     threshold below which most people start noticing compression.
//   • withoutEnlargement: true — never blow up a small image. A 400×300
//     upload stays 400×300, it does NOT get scaled to 1920×1440.
//
// Output variants per upload:
//   • 1920w (cap width) — desktop full-bleed
//   • 1024w             — tablet / mid screens
//   •  600w             — phone / grid thumbnails
// Each variant is written in BOTH WebP and AVIF, with original kept as-is.

import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

export type ImageFormat = 'webp' | 'avif';

export interface ImageVariant {
  /** Width in pixels (height is auto, aspect preserved) */
  width: number;
  format: ImageFormat;
  /** Filename written to disk */
  filename: string;
  /** Public URL, e.g. /uploads/2024-01-01/abc-1920.webp */
  url: string;
  /** Bytes written, populated after the file is on disk */
  bytes?: number;
}

export interface OptimizeOptions {
  /** Directory the original file already lives in (so we write variants next to it) */
  uploadDir: string;
  /** Original filename including extension, e.g. "abc-1234.webp" */
  originalFilename: string;
  /** Public URL prefix for building the variant URLs */
  urlBase: string;
  /** Quality 1-100; default 85 (visually lossless) */
  quality?: number;
  /** Width variants to produce; default [600, 1024, 1920] */
  widths?: number[];
  /** Formats to produce; default ['webp', 'avif'] */
  formats?: ImageFormat[];
  /**
   * Whether to re-encode the original (master) at 1920w. Default true so
   * the original on disk is always optimized. If you pass false the master
   * is left untouched and only sub-1920 variants are produced.
   */
  rewriteMaster?: boolean;
}

export interface OptimizeResult {
  master: ImageVariant;
  variants: ImageVariant[];
  /** Total bytes written across all variants */
  totalBytes: number;
}

const DEFAULT_WIDTHS = [600, 1024, 1920] as const;
const DEFAULT_FORMATS: ImageFormat[] = ['webp', 'avif'];
const DEFAULT_QUALITY = 85;

const encoder = (format: ImageFormat) =>
  format === 'avif'
    ? sharp({}).avif({ quality: 50, effort: 4 }) // AVIF q=50 ≈ WebP q=85 visually
    : sharp({}).webp({ quality: 85 });

/**
 * Produce a single variant: read `sourcePath`, resize to `width` (no enlargement),
 * encode in `format` at the given `quality`, and write to `outPath`.
 */
async function buildVariant(
  sourcePath: string,
  outPath: string,
  width: number,
  format: ImageFormat,
  quality: number
): Promise<number> {
  const pipeline = sharp(sourcePath, { failOn: 'truncated' })
    .rotate() // honour EXIF orientation
    .resize({ width, withoutEnlargement: true });

  if (format === 'avif') {
    pipeline.avif({ quality, effort: 4 });
  } else {
    pipeline.webp({ quality });
  }

  const info = await pipeline.toFile(outPath);
  return info.size;
}

/**
 * Public entry point. Given a file that has just been written to `uploadDir`,
 * produce all configured width+format variants alongside it.
 *
 * The original filename is preserved for the "master" copy (always 1920w WebP),
 * and each variant gets a `<width>w.<format>` suffix on the basename.
 *
 * @example
 *   const result = await optimizeUploadedImage({
 *     uploadDir: '/var/www/pv/uploads',
 *     originalFilename: '1700000000-photo.jpg',
 *     urlBase: '/uploads'
 *   });
 *   // result.variants = [
 *   //   { width: 600,  format: 'webp', url: '/uploads/1700000000-photo-600w.webp' },
 *   //   { width: 1024, format: 'webp', url: '/uploads/1700000000-photo-1024w.webp' },
 *   //   { width: 1920, format: 'webp', url: '/uploads/1700000000-photo-1920w.webp' },
 *   //   ... avif variants
 *   // ]
 */
export async function optimizeUploadedImage(opts: OptimizeOptions): Promise<OptimizeResult> {
  const {
    uploadDir,
    originalFilename,
    urlBase,
    quality = DEFAULT_QUALITY,
    widths = [...DEFAULT_WIDTHS],
    formats = DEFAULT_FORMATS,
    rewriteMaster = true
  } = opts;

  const ext = path.extname(originalFilename); // .jpg / .webp / .png
  const base = path.basename(originalFilename, ext);
  const sourcePath = path.join(uploadDir, originalFilename);

  // Variants, deduplicated: e.g. if widths includes 1920 we don't need a
  // separate "master" since the 1920w WebP IS the master. Otherwise we
  // write a master at 1920w WebP that the 600/1024 can fall back to.
  const masterWidth = Math.max(...widths);
  const variants: ImageVariant[] = [];
  let totalBytes = 0;

  for (const width of widths) {
    for (const format of formats) {
      const suffix = `${width}w`;
      const outName = `${base}-${suffix}.${format}`;
      const outPath = path.join(uploadDir, outName);
      try {
        const bytes = await buildVariant(sourcePath, outPath, width, format, quality);
        const url = `${urlBase.replace(/\/$/, '')}/${outName}`;
        const v: ImageVariant = { width, format, filename: outName, url, bytes };
        variants.push(v);
        totalBytes += bytes;
      } catch (err: any) {
        // AVIF encode can fail on certain rare PNG palettes; log and skip.
        // The WebP variant will still be available so this is non-fatal.
        if (format === 'avif') continue;
        throw err;
      }
    }
  }

  // The "master" is the largest WebP variant — the canonical /uploads/<name>.webp
  // that all callers (DB, response bodies) point at.
  const masterVariant =
    variants.find(v => v.width === masterWidth && v.format === 'webp') ??
    variants[0];

  // Optionally rewrite the original (non-WebP) upload to a 1920w WebP
  // to save space. Safe — we've already produced the variants.
  if (rewriteMaster && masterVariant && originalFilename !== masterVariant.filename) {
    try {
      const masterPath = path.join(uploadDir, masterVariant.filename);
      // Move (rename) the largest WebP variant to the original filename
      // so the canonical /uploads/<filename> URL stays valid.
      await fs.rename(masterPath, path.join(uploadDir, originalFilename));
      masterVariant.filename = originalFilename;
      masterVariant.url = `${urlBase.replace(/\/$/, '')}/${originalFilename}`;
    } catch {
      // Non-fatal: variants are still on disk.
    }
  }

  return {
    master: masterVariant,
    variants,
    totalBytes
  };
}
