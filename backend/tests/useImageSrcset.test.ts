// useImageSrcset helper tests — pure JS, runs in the backend's vitest.
// The frontend uses these functions directly; verifying the contract
// here catches regressions even though the components live elsewhere.
import { describe, it, expect } from 'vitest';
import { srcsetFor, pictureSources, WIDTHS } from '../../frontend/src/composables/useImageSrcset';

describe('useImageSrcset — srcsetFor()', () => {
  it('returns a 3-entry WebP srcset for a /uploads/ URL', () => {
    const out = srcsetFor('/uploads/abc-1700.webp', 'webp');
    expect(out).toBe(
      '/uploads/abc-1700-600w.webp 600w, ' +
      '/uploads/abc-1700-1024w.webp 1024w, ' +
      '/uploads/abc-1700-1920w.webp 1920w'
    );
  });

  it('strips any image extension (jpg/png/gif) before appending width', () => {
    expect(srcsetFor('/uploads/x.jpg', 'webp')).toContain('x-600w.webp');
    expect(srcsetFor('/uploads/x.png', 'webp')).toContain('x-600w.webp');
    expect(srcsetFor('/uploads/x.gif', 'webp')).toContain('x-600w.webp');
  });

  it('returns a 3-entry AVIF srcset for AVIF format', () => {
    const out = srcsetFor('/uploads/abc-1700.webp', 'avif');
    expect(out).toContain('-600w.avif 600w');
    expect(out).toContain('-1024w.avif 1024w');
    expect(out).toContain('-1920w.avif 1920w');
  });

  it('returns a single-URL srcset for an absolute (external) URL', () => {
    const out = srcsetFor('https://cdn.example.com/x.webp', 'webp');
    // The browser will still use the width descriptor — we just don't
    // have variants we control. Use the first width from the WIDTHS const
    // (don't depend on it being in scope at test time — the helper
    // defaults to WIDTHS = [600, 1024, 1920] so the descriptor is 600w).
    expect(out).toBe('https://cdn.example.com/x.webp 600w');
  });

  it('returns empty string for empty input (no false 600w entries)', () => {
    expect(srcsetFor('', 'webp')).toBe('');
  });

  it('honours a custom widths list', () => {
    const out = srcsetFor('/uploads/x.webp', 'webp', [300, 900]);
    expect(out).toBe('/uploads/x-300w.webp 300w, /uploads/x-900w.webp 900w');
  });
});

describe('useImageSrcset — pictureSources()', () => {
  it('returns avifSrcset, webpSrcset, and the fallback URL', () => {
    const { avifSrcset, webpSrcset, fallback } = pictureSources('/uploads/x.webp');
    expect(avifSrcset).toContain('.avif');
    expect(webpSrcset).toContain('.webp');
    expect(fallback).toBe('/uploads/x.webp');
  });
});
