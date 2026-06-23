// Pure-JS tests for useImageSrcset. No Vue runtime needed.
import { describe, it, expect } from 'vitest';
import { srcsetFor, pictureSources, useImageSrcset, WIDTHS } from '../src/composables/useImageSrcset';
// Touch the symbol so the import isn't flagged as unused when tests only
// reference WIDTHS via the helper return value (a.WIDTHS).
void WIDTHS;

describe('useImageSrcset', () => {
  describe('srcsetFor', () => {
    it('returns empty string for empty input', () => {
      expect(srcsetFor('')).toBe('');
    });

    it('returns empty string for undefined-like input', () => {
      // @ts-expect-error testing runtime guard
      expect(srcsetFor(null)).toBe('');
    });

    it('returns a multi-width srcset pointing at -600w/-1024w/-1920w .webp variants', () => {
      // The image service now generates WebP + AVIF variants at upload
      // time, and the backfill script migrated the existing catalogue.
      // srcsetFor builds the full "url 600w, url 1024w, url 1920w" string.
      const result = srcsetFor('/uploads/abc-1700.webp', 'webp');
      expect(result).toBe(
        '/uploads/abc-1700-600w.webp 600w, /uploads/abc-1700-1024w.webp 1024w, /uploads/abc-1700-1920w.webp 1920w'
      );
    });

    it('returns a multi-width srcset for avif (master .avif variants are served)', () => {
      const result = srcsetFor('/uploads/abc-1700.webp', 'avif');
      expect(result).toBe(
        '/uploads/abc-1700-600w.avif 600w, /uploads/abc-1700-1024w.avif 1024w, /uploads/abc-1700-1920w.avif 1920w'
      );
    });

    it('passes through any extension (.jpg/.png/.gif/.webp)', () => {
      // The variant stem is taken from the URL with the original ext stripped,
      // and a -<w>w.webp suffix is appended for each width.
      expect(srcsetFor('/uploads/x.jpg', 'webp')).toBe(
        '/uploads/x-600w.webp 600w, /uploads/x-1024w.webp 1024w, /uploads/x-1920w.webp 1920w'
      );
      expect(srcsetFor('/uploads/x.png', 'webp')).toBe(
        '/uploads/x-600w.webp 600w, /uploads/x-1024w.webp 1024w, /uploads/x-1920w.webp 1920w'
      );
    });

    it('uses custom widths when provided', () => {
      const result = srcsetFor('/uploads/x.webp', 'webp', [400, 800]);
      expect(result).toBe('/uploads/x-400w.webp 400w, /uploads/x-800w.webp 800w');
    });

    it('strips query string and hash before building variants', () => {
      const result = srcsetFor('/uploads/x.webp?v=42#frag', 'webp');
      expect(result).toBe(
        '/uploads/x-600w.webp 600w, /uploads/x-1024w.webp 1024w, /uploads/x-1920w.webp 1920w'
      );
    });

    it('returns a single-URL srcset for absolute (CDN/external) URLs', () => {
      // External URLs are not under /uploads/, so our image service
      // doesn't generate variants for them. We emit a single entry
      // with the smallest width descriptor — the browser still uses it
      // for size negotiation, but the srcset has no real alternatives.
      const result = srcsetFor('https://cdn.example.com/image-abc.webp', 'webp');
      expect(result).toBe('https://cdn.example.com/image-abc.webp 600w');
    });

    it('treats a relative /uploads/foo URL as local (variants emitted)', () => {
      const result = srcsetFor('/uploads/image-abc.webp', 'webp');
      expect(result).toBe(
        '/uploads/image-abc-600w.webp 600w, ' +
        '/uploads/image-abc-1024w.webp 1024w, ' +
        '/uploads/image-abc-1920w.webp 1920w'
      );
    });

    it('treats an uploads/foo URL without leading slash as local', () => {
      const result = srcsetFor('uploads/image-abc.webp', 'webp');
      expect(result).toBe(
        'uploads/image-abc-600w.webp 600w, ' +
        'uploads/image-abc-1024w.webp 1024w, ' +
        'uploads/image-abc-1920w.webp 1920w'
      );
    });
  });

  describe('pictureSources', () => {
    it('returns avif + webp multi-width srcsets plus the master as fallback', () => {
      const src = pictureSources('/uploads/x.webp');
      expect(src.fallback).toBe('/uploads/x.webp');
      expect(src.avifSrcset).toBe(
        '/uploads/x-600w.avif 600w, /uploads/x-1024w.avif 1024w, /uploads/x-1920w.avif 1920w'
      );
      expect(src.webpSrcset).toBe(
        '/uploads/x-600w.webp 600w, /uploads/x-1024w.webp 1024w, /uploads/x-1920w.webp 1920w'
      );
    });
  });

  describe('useImageSrcset composable', () => {
    it('returns the same helpers (stable reference)', () => {
      const a = useImageSrcset();
      const b = useImageSrcset();
      expect(a.srcsetFor).toBe(b.srcsetFor);
      expect(a.pictureSources).toBe(b.pictureSources);
      expect(a.WIDTHS).toEqual([600, 1024, 1920]);
    });
  });
});
