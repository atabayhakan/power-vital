<template>
  <Transition name="loader-fade">
    <div v-if="isLoading" class="page-loader">
      <div class="loader-content">
        <div class="loader-logo">
          Power<span class="brand-accent">Vital</span>
        </div>
        <div class="loader-ring"/>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const isLoading = ref(false);
const router = useRouter();

let removeBefore: (() => void) | null = null;
let removeAfter: (() => void) | null = null;
let removeError: (() => void) | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  removeBefore = router.beforeEach((to, from, next) => {
    // Only trigger loader on actual path changes
    if (to.path !== from.path) {
      // A hide scheduled by the previous navigation must not fire into
      // this one, or the loader vanishes mid-load.
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      isLoading.value = true;
    }
    next();
  });

  removeAfter = router.afterEach(() => {
    // Small deliberate delay for a smoother premium feel
    hideTimer = setTimeout(() => {
      isLoading.value = false;
    }, 600);
  });

  // afterEach never runs when a navigation throws (e.g. a failed dynamic
  // chunk import — these show up regularly in the client error log), so
  // without this the loader stayed mounted forever on top of the page.
  removeError = router.onError(() => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    isLoading.value = false;
  });
});

onUnmounted(() => {
  if (removeBefore) removeBefore();
  if (removeAfter) removeAfter();
  if (removeError) removeError();
  if (hideTimer) clearTimeout(hideTimer);
});
</script>

<style scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* Premium Glassmorphism */
  background: rgba(10, 10, 12, 0.85);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Purely visual — must never eat clicks. It sits over the page for the
     600ms hide delay + 0.5s fade-out (near-invisible but still hit-testable
     without this), which made every page feel dead right after navigating. */
  pointer-events: none;
}

:global(:root[data-theme="light"]) .page-loader {
  background: rgba(249, 246, 241, 0.85);
}

.loader-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
}

.loader-logo {
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #F4F4F5;
  z-index: 2;
  animation: pulse-logo 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  letter-spacing: -0.5px;
}

:global(:root[data-theme="light"]) .loader-logo {
  color: #121214;
}

.brand-accent {
  color: var(--color-primary, #BC4A3C);
}

.loader-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--color-primary, #BC4A3C);
  border-right-color: rgba(188, 74, 60, 0.2);
  border-bottom-color: transparent;
  border-left-color: rgba(188, 74, 60, 0.2);
  animation: spin-ring 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  filter: drop-shadow(0 0 12px rgba(188, 74, 60, 0.4));
}

@keyframes pulse-logo {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.92); }
}

@keyframes spin-ring {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
  transform: scale(1.05); /* Slight zoom effect on fade out */
}
</style>
