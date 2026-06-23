// Component tests for LazyImage — verifies the right HTML structure for
// each src category.
//
// As of 2026-06-21 the upload pipeline (and the backfill script) emits
// responsive -600w/-1024w/-1920w variants in BOTH WebP and AVIF. The
// component renders a <picture> with two <source> tags (avif first for
// modern browsers, then webp) and a master <img> fallback.
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LazyImage from '../src/components/common/LazyImage.vue';

const baseProps = { src: '/uploads/x.webp', alt: 'test alt' };

describe('LazyImage', () => {
  describe('uploads path (responsive variants — avif + webp sources)', () => {
    it('renders <picture> with avif + webp sources for 600/1024/1920 widths', () => {
      const w = mount(LazyImage, { props: baseProps });
      expect(w.find('picture').exists()).toBe(true);
      const sources = w.findAll('source');
      expect(sources.length).toBe(2);
      // Order matters: avif first (browsers that support it use it).
      expect(sources[0].attributes('type')).toBe('image/avif');
      expect(sources[1].attributes('type')).toBe('image/webp');
      expect(sources[0].attributes('srcset')).toBe(
        '/uploads/x-600w.avif 600w, /uploads/x-1024w.avif 1024w, /uploads/x-1920w.avif 1920w'
      );
      expect(sources[1].attributes('srcset')).toBe(
        '/uploads/x-600w.webp 600w, /uploads/x-1024w.webp 1024w, /uploads/x-1920w.webp 1920w'
      );
    });

    it('passes sizes attribute through to both <source> tags', () => {
      const w = mount(LazyImage, {
        props: { ...baseProps, sizes: '(max-width: 600px) 100vw, 50vw' }
      });
      const sources = w.findAll('source');
      expect(sources[0].attributes('sizes')).toBe('(max-width: 600px) 100vw, 50vw');
      expect(sources[1].attributes('sizes')).toBe('(max-width: 600px) 100vw, 50vw');
    });

    it('fallback <img> always has loading=lazy by default', () => {
      const w = mount(LazyImage, { props: baseProps });
      const img = w.find('img');
      expect(img.attributes('loading')).toBe('lazy');
      expect(img.attributes('fetchpriority')).toBe('auto');
      expect(img.attributes('decoding')).toBe('async');
    });

    it('eager=true sets loading=eager + fetchpriority=high', () => {
      const w = mount(LazyImage, { props: { ...baseProps, eager: true } });
      const img = w.find('img');
      expect(img.attributes('loading')).toBe('eager');
      expect(img.attributes('fetchpriority')).toBe('high');
    });

    it('applies aspect-ratio style when width+height are set', () => {
      const w = mount(LazyImage, {
        props: { ...baseProps, width: 600, height: 400 }
      });
      const style = w.find('img').attributes('style') || '';
      expect(style).toContain('aspect-ratio: 600 / 400');
    });

    it('fallback <img> src is the master URL (always loads)', () => {
      const w = mount(LazyImage, { props: baseProps });
      const img = w.find('img');
      expect(img.attributes('src')).toBe('/uploads/x.webp');
    });
  });

  describe('external URL (no server variants)', () => {
    it('renders a plain <img> — no <picture>, no srcset', () => {
      const w = mount(LazyImage, {
        props: { src: 'https://cdn.example.com/x.jpg', alt: 'external' }
      });
      expect(w.find('picture').exists()).toBe(false);
      const img = w.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('https://cdn.example.com/x.jpg');
      // No srcset sources
      expect(w.findAll('source').length).toBe(0);
    });

    it('still applies eager loading for external URLs', () => {
      const w = mount(LazyImage, {
        props: { src: 'https://x.com/y.jpg', alt: 'a', eager: true }
      });
      expect(w.find('img').attributes('loading')).toBe('eager');
    });
  });

  describe('accessibility', () => {
    it('always renders the alt attribute', () => {
      const w = mount(LazyImage, {
        props: { src: '/uploads/x.webp', alt: 'Power Vital Collagen' }
      });
      expect(w.find('img').attributes('alt')).toBe('Power Vital Collagen');
    });
  });
});
