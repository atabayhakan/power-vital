<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  variant?: 'danger' | 'primary' | 'success';
  confirmText?: string;
  cancelText?: string;
  requireTextConfirm?: string; // Optional: user must type this string to confirm
  details?: string[]; // Bullet list of details
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const typedConfirm = ref('');

watch(() => props.isOpen, (val) => {
  if (val) typedConfirm.value = '';
});

const handleConfirm = () => {
  if (props.requireTextConfirm && typedConfirm.value !== props.requireTextConfirm) return;
  emit('confirm');
};

const handleCancel = () => {
  typedConfirm.value = '';
  emit('cancel');
};

const variantClass = () => {
  switch (props.variant) {
    case 'success': return 'modal--success';
    case 'primary': return 'modal--primary';
    case 'danger':
    default: return 'modal--danger';
  }
};

const confirmBtnClass = () => {
  switch (props.variant) {
    case 'success': return 'btn-success';
    case 'primary': return 'btn-primary';
    case 'danger':
    default: return 'btn-danger';
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleCancel">
      <div class="modal-container" :class="variantClass()">
        <div class="modal-header">
          <span class="modal-icon">
            <template v-if="variant === 'danger'">⚠️</template>
            <template v-else-if="variant === 'success'">✅</template>
            <template v-else>❓</template>
          </span>
          <h3 class="modal-title">{{ title }}</h3>
          <button class="modal-close" @click="handleCancel" aria-label="Kapat">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-message">{{ message }}</p>

          <ul v-if="details && details.length" class="modal-details">
            <li v-for="(d, i) in details" :key="i">{{ d }}</li>
          </ul>

          <div v-if="requireTextConfirm" class="modal-confirm-input">
            <label>
              Onaylamak için <code>{{ requireTextConfirm }}</code> yazın:
            </label>
            <input
              v-model="typedConfirm"
              type="text"
              :placeholder="requireTextConfirm"
              class="confirm-text-field"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" @click="handleCancel">
            {{ cancelText || 'İptal' }}
          </button>
          <button
            class="btn"
            :class="confirmBtnClass()"
            @click="handleConfirm"
            :disabled="!!requireTextConfirm && typedConfirm !== requireTextConfirm"
          >
            {{ confirmText || 'Onayla' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: var(--color-bg-panel, #18181b);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 480px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.modal--danger { border-top: 4px solid #ef4444; }
.modal--success { border-top: 4px solid #10b981; }
.modal--primary { border-top: 4px solid #BC4A3C; }

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-icon {
  font-size: 28px;
  line-height: 1;
}

.modal-title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  margin: 0;
  color: var(--color-text-main, #fff);
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted, #a1a1aa);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}
.modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.modal-body {
  padding: 20px 24px;
}

.modal-message {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-main, #e4e4e7);
  margin: 0 0 12px 0;
}

.modal-details {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 12px 16px;
}

.modal-details li {
  font-size: 13px;
  color: var(--color-text-muted, #a1a1aa);
  padding: 4px 0;
  position: relative;
  padding-left: 18px;
}

.modal-details li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: #BC4A3C;
  font-weight: 700;
}

.modal-confirm-input {
  margin-top: 16px;
}

.modal-confirm-input label {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted, #a1a1aa);
  margin-bottom: 6px;
}

.modal-confirm-input code {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', monospace;
  font-weight: 700;
}

.confirm-text-field {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  font-family: 'SF Mono', monospace;
  font-size: 14px;
  outline: none;
}

.confirm-text-field:focus {
  border-color: #BC4A3C;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.15);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.15s;
  letter-spacing: 0.02em;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted, #a1a1aa);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.btn-primary {
  background: linear-gradient(135deg, #BC4A3C, #D8412F);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(188, 74, 60, 0.4);
}
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}
.btn-success:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}
.btn-success:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}
.btn-danger:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}
.btn-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
