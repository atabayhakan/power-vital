// useImageSrcset — turn a single /uploads/<name>.webp URL into a
// multi-width srcset for the responsive <picture> element.
//
// The server-side image service now generates -600w/-1024w/-1920w
// variants in both WebP and AVIF at upload time (and the backfill
// script migrated legacy images). The /uploads/<filename>-<w>w.<ext>
// naming convention is identical between upload-time and backfill
// generation, so callers can build the same srcset string for any
// image in the catalogue.
//
// Usage:
//   <picture>
//     <source :srcset="pictureSources(media.url).avifSrcset" type="image/avif" :sizes="sizes" />
//     <source :srcset="pictureSources(media.url).webpSrcset" type="image/webp" :sizes="sizes" />
//     <img :src="pictureSources(media.url).fallback" :sizes="sizes" ... />
//   </picture>
const WIDTHS = [600, 1024, 1920] as const;

/**
 * Build the URL stem by stripping the existing file extension. Works
 * for any master filename: abc-1700.webp, abc-1700.png, abc-1700.jpg.
 */
function variantStem(url: string): string {
  if (!url) return '';
  // Strip query / hash then trailing extension
  const clean = url.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot < 0) return clean;
  return clean.slice(0, lastDot);
}

function extOf(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  return lastDot < 0 ? '' : clean.slice(lastDot + 1);
}

/**
 * Returns true when the URL points at a master image we control —
 * specifically under /uploads/, where the server-side image service
 * emits -600w / -1024w / -1920w variants. External URLs (CDN, S3,
 * user-uploaded content from a third party) are returned as-is: we
 * don't have variants for them, so the browser will fall back to
 * the original with whatever intrinsic size it has.
 */
function isLocalUpload(url: string): boolean {
  if (!url) return false;
  // Strip query/hash before the path check.
  const path = url.split('?')[0].split('#')[0];
  return /^\/?uploads\//.test(path);
}

/**
 * Build a multi-width srcset for a given format.
 *
 * - For /uploads/ URLs, emits the 3-variant set our image service
 *   produces.
 * - For external URLs, emits a single-entry set with the smallest
 *   width descriptor — the browser still uses the descriptor for
 *   size negotiation, but there's nothing to choose between.
 *
 * @param url      Master image URL (e.g. "/uploads/abc-1700.webp")
 * @param format   "webp" or "avif" — selects the file extension
 * @param widths   Widths to include in the srcset; default [600,1024,1920]
 * @returns        srcset string "url 600w, url 1024w, url 1920w" or ""
 *                 when the URL is empty.
 */
export function srcsetFor(url: string, format: 'webp' | 'avif' = 'webp', widths: readonly number[] = WIDTHS): string {
  if (!url) return '';
  // External URL (CDN, S3, third-party) — we don't generate variants
  // for it; emit a single-entry srcset with the smallest descriptor.
  if (!isLocalUpload(url)) {
    return `${url} ${widths[0] ?? 600}w`;
  }
  const stem = variantStem(url);
  const ext = format === 'avif' ? 'avif' : 'webp';
  return widths.map((w) => `${stem}-${w}w.${ext} ${w}w`).join(', ');
}

/**
 * Convenience: build the whole `<picture>` attribute set.
 */
export function pictureSources(url: string) {
  return {
    avifSrcset: srcsetFor(url, 'avif'),
    webpSrcset: srcsetFor(url, 'webp'),
    fallback: url
  };
}

/**
 * Vue 3 composable wrapper. Returns a stable reference so reactive
 * templates can safely call srcsetFor() inside computed blocks.
 */
export function useImageSrcset() {
  return {
    srcsetFor,
    pictureSources,
    WIDTHS
  };
}

export default useImageSrcset;
export { variantStem, extOf };
