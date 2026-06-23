<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast glass-panel"
        :class="`toast-${toast.type}`"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✅</span>
          <span v-else-if="toast.type === 'error'">🚨</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-content">
          <h4 class="toast-title">{{ toast.title }}</h4>
          <p v-if="toast.message" class="toast-message">{{ toast.message }}</p>
        </div>
        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none; /* Let clicks pass through empty space */
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  min-width: 280px;
  max-width: 380px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.1);
  background: rgba(24, 24, 27, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.05);
}

.toast-success { border-left: 4px solid var(--color-primary); }
.toast-error { border-left: 4px solid #ef4444; }
.toast-info { border-left: 4px solid #3b82f6; }

.toast-icon {
  font-size: 20px;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  margin: 0 0 4px 0;
}

.toast-message {
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  color: #a1a1aa;
  margin: 0;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #a1a1aa;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #fff;
}

/* Animations */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}
.toast-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
