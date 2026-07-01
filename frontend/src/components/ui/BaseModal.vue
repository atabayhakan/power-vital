<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  title?: string;
  closeOnOverlayClick?: boolean;
  maxWidth?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const close = () => emit('close');

const onOverlayClick = () => {
  if (props.closeOnOverlayClick !== false) close();
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) close();
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="base-modal-fade">
      <div v-if="isOpen" class="base-modal-overlay" @click.self="onOverlayClick">
        <div class="base-modal-panel" :style="maxWidth ? { maxWidth } : undefined">
          <div v-if="title || $slots.header" class="base-modal-header">
            <slot name="header">
              <h3 class="base-modal-title">{{ title }}</h3>
            </slot>
            <button class="base-modal-close" aria-label="Kapat" @click="close">✕</button>
          </div>

          <div class="base-modal-body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="base-modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Canonical modal chrome — dark glass, matches the admin/dashboard surface
   language (surface-dark-card + clay-dark-shadow). Kept as a single source
   of truth so no other component redefines `.glass-modal`-style overlays
   with their own (drifting) colors. */
.base-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg, 20px);
  z-index: var(--z-modal, 1000);
}

.base-modal-panel {
  background: var(--surface-dark-card, #1E1814);
  border: 1px solid var(--surface-dark-border, rgba(255,255,255,0.07));
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--clay-dark-shadow-lg);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  color: var(--text-on-dark, #F5F1EB);
}

.base-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--surface-dark-border, rgba(255,255,255,0.07));
}

.base-modal-title {
  flex: 1;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: var(--text-on-dark, #F5F1EB);
}

.base-modal-close {
  background: none;
  border: none;
  color: var(--text-on-dark-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-xs, 6px);
  transition: all var(--duration-fast, 0.15s);
}
.base-modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-on-dark);
}

.base-modal-body {
  padding: 20px 24px;
}

.base-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--surface-dark-border, rgba(255,255,255,0.07));
}

.base-modal-fade-enter-active,
.base-modal-fade-leave-active {
  transition: opacity var(--duration-normal, 0.2s) var(--ease-smooth);
}
.base-modal-fade-enter-from,
.base-modal-fade-leave-to {
  opacity: 0;
}
.base-modal-fade-enter-active .base-modal-panel,
.base-modal-fade-leave-active .base-modal-panel {
  transition: transform var(--duration-normal, 0.25s) var(--ease-spring);
}
.base-modal-fade-enter-from .base-modal-panel {
  transform: translateY(20px) scale(0.98);
}
.base-modal-fade-leave-to .base-modal-panel {
  transform: translateY(10px) scale(0.98);
}
</style>
