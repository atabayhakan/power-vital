<script setup lang="ts">
// <LazyImage> — a drop-in replacement for <img> that:
//   • Defaults to loading="lazy" + decoding="async" (the modern
//     performance defaults that should apply to ALL below-the-fold images)
//   • Supports <picture> srcset for AVIF/WebP when src looks like a
//     /uploads/ path (server emits 600/1024/1920w + .avif variants)
//   • Optional fetchpriority="high" for above-the-fold images (hero)
//   • Reserves layout space with width/height/aspect-ratio to prevent CLS
//   • Detects external URLs (http/https) and serves the original as a
//     single srcset entry — we don't ship variants we don't control
//
// Usage:
//   <LazyImage src="/uploads/abc.webp" alt="..." width="600" height="400" />
//   <LazyImage src="/uploads/abc.webp" alt="..." :eager="true" />   <!-- hero -->
//   <LazyImage src="https://cdn.example.com/x.jpg" alt="..." />       <!-- external -->
import { computed } from 'vue';
import { srcsetFor } from '../../composables/useImageSrcset';

interface Props {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  /** Mark this as above-the-fold (skips lazy, sets fetchpriority=high) */
  eager?: boolean;
  /** Sizes attribute for srcset (e.g. "100vw" or "(max-width: 600px) 50vw, 33vw") */
  sizes?: string;
  /** CSS class passthrough */
  class?: string;
  /** Decoding mode (default async) */
  decoding?: 'auto' | 'sync' | 'async';
}

const props = withDefaults(defineProps<Props>(), {
  eager: false,
  sizes: '100vw',
  decoding: 'async'
});

const isExternal = computed(() => /^https?:\/\//i.test(props.src || ''));
const isUploads = computed(() => typeof props.src === 'string' && props.src.startsWith('/uploads/'));

const loading = computed(() => props.eager ? 'eager' : 'lazy');
const fetchpriority = computed(() => props.eager ? 'high' : 'auto');
const avifSrcset = computed(() => isUploads.value ? srcsetFor(props.src, 'avif') : '');
const webpSrcset = computed(() => isUploads.value ? srcsetFor(props.src, 'webp') : '');

// Inline style for aspect ratio — prevents CLS even when width/height
// aren't explicitly set
const aspectStyle = computed(() => {
  if (props.width && props.height) {
    return { aspectRatio: `${props.width} / ${props.height}` };
  }
  return undefined;
});
</script>

<template>
  <picture v-if="!isExternal && isUploads" style="display: block; width: 100%; height: 100%;">
    <source v-if="avifSrcset" type="image/avif" :srcset="avifSrcset" :sizes="sizes" />
    <source v-if="webpSrcset" type="image/webp" :srcset="webpSrcset" :sizes="sizes" />
    <img
      :src="src"
      :alt="alt"
      :width="width || undefined"
      :height="height || undefined"
      :loading="loading"
      :decoding="decoding"
      :fetchpriority="fetchpriority"
      :style="aspectStyle"
      :class="$props.class"
    />
  </picture>
  <img
    v-else
    :src="src"
    :alt="alt"
    :width="width || undefined"
    :height="height || undefined"
    :loading="loading"
    :decoding="decoding"
    :fetchpriority="fetchpriority"
    :style="aspectStyle"
    :class="$props.class"
  />
</template>
