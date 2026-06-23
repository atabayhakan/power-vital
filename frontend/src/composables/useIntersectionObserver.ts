// useIntersectionObserver — defer mounting a component until it scrolls
// near the viewport. Used by large below-the-fold components (CrossSellGrid,
// TrustBadges, PartnersBlock, etc.) to cut initial JS execution + DOM
// nodes by 30-50%.
//
// Usage:
//   const root = ref<HTMLElement | null>(null);
//   const visible = useIntersectionObserver(root, { rootMargin: '200px' });
//   <div ref="root">...</div>
//   <CrossSellGrid v-if="visible" />
//
// The observer is created lazily (only when the ref is attached) and
// disconnected on unmount. SSR-safe (returns ref(false) if window is
// undefined).
import { ref, watch, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';

export interface IntersectionObserverOptions {
  /** Margin around the root. Default '200px' triggers ~before visible. */
  rootMargin?: string;
  /** Visibility threshold 0-1. Default 0.1 = 10% visible. */
  threshold?: number;
  /** Trigger only once (default true — common case for lazy sections) */
  once?: boolean;
}

export const useIntersectionObserver = (
  target: Ref<HTMLElement | null | undefined>,
  options: IntersectionObserverOptions = {}
): Ref<boolean> => {
  const { rootMargin = '200px', threshold = 0.1, once = true } = options;
  const isVisible = ref(false);

  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return isVisible; // SSR or unsupported — caller decides fallback
  }

  let observer: IntersectionObserver | null = null;

  const start = (el: HTMLElement) => {
    if (observer) return;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            isVisible.value = true;
            if (once && observer) {
              observer.disconnect();
              observer = null;
            }
          } else if (!once) {
            isVisible.value = false;
          }
        }
      },
      { rootMargin, threshold }
    );
    observer.observe(el);
  };

  const stop = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  watch(
    target,
    (el) => {
      stop();
      if (el) start(el);
    },
    { immediate: true, flush: 'post' }
  );

  onBeforeUnmount(stop);

  return isVisible;
};

export default useIntersectionObserver;
