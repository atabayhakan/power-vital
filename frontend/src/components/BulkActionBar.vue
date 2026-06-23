<script setup lang="ts">
// BulkActionBar — reusable bulk-action toolbar for admin list pages.
//
// Shows the selected-row count and a row of contextual action buttons.
// Each action can POST to a backend endpoint, run a confirm() prompt,
// and surface the result via toast.
//
// Usage:
//   <BulkActionBar
//     :selected-count="selectedIds.length"
//     :actions="actions"
//     @clear="selectedIds = []"
//   />
//
// The parent owns the selectedIds array; BulkActionBar just emits a
// `run` event with the chosen action's payload.
import { computed } from 'vue';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

export interface BulkAction {
  /** Stable id used in `run` payload */
  id?: string;
  /**
   * Legacy event name — kept for backwards-compat with view components
   * that emit a named event instead of running the action server-side.
   * New code should use `id` (and optionally `endpoint`).
   */
  event?: string;
  /** Visible button label (already translated) */
  label: string;
  /** Optional icon (emoji) shown before the label */
  icon?: string;
  /** Hex color for the button (e.g. '#BC4A3C' for red destructive) */
  color?: string;
  /** HTTP method + path + body shape */
  method?: 'POST';
  /** Skip the confirm() prompt when true (use with care) */
  skipConfirm?: boolean;
  /** Custom confirm message; falls back to a generic "Are you sure?" */
  confirmMessage?: string;
  /** Endpoint template — receives { ids: string[] } at call time */
  endpoint?: string;
  /**
   * When set, the parent treats this as a CSV download: the `run` event
   * is fired with the action and an empty `ids` array, and the parent
   * fetches the CSV from `endpoint` (passing the auth header) and saves
   * it to `download` (filename).
   */
  download?: string;
  /**
   * Optional static body fields merged with `{ ids }` when posting to
   * `endpoint`. Used by bulk-update / bulk-delete actions where the
   * backend expects a discriminator (e.g. `{ kind: 'users' }`).
   */
  body?: Record<string, unknown>;
  /** When true, button is rendered in a destructive style (red) */
  destructive?: boolean;
  /** When true, button is disabled (e.g. permission denied) */
  disabled?: boolean;
  /** Visual variant — overrides default color if set */
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'ghost';
}

const props = withDefaults(defineProps<{
  selectedCount: number;
  actions?: BulkAction[];
  /** Show the clear-selection button when count > 0 */
  showClear?: boolean;
}>(), {
  actions: () => [],
  showClear: true
});

const emit = defineEmits<{
  (e: 'clear'): void;
  (e: 'clear-selection'): void;
  (e: 'select-all'): void;
  (e: 'run', payload: { action: BulkAction; ids: string[] }): void;
  (e: 'action', eventName: string): void;
}>();

const visible = computed(() => props.selectedCount > 0);
const barText = computed(() =>
  props.selectedCount === 1
    ? t('admin.bulk.selectedOne')
    : t('admin.bulk.selectedMany', { n: props.selectedCount })
);

const handleRun = (action: BulkAction) => {
  if (action.disabled) return;
  if (!action.skipConfirm) {
    const msg = action.confirmMessage || t('admin.bulk.confirmGeneric');
     
    if (typeof (globalThis as any).confirm === 'function' && !(globalThis as any).confirm(msg)) {
      return;
    }
  }
  // Legacy API: just emit the named event. Parent handles the action.
  if (action.event && !action.endpoint) {
    emit('action', action.event);
    return;
  }
  // New API: defer to the parent (it owns selectedIds + api).
  emit('run', { action, ids: [] });
};

const handleClear = () => {
  emit('clear');
  emit('clear-selection');
};
</script>

<template>
  <Transition name="bulk-slide">
    <div v-if="visible" class="bulk-bar" role="region" aria-label="Bulk actions">
      <div class="bulk-bar__count">
        <span class="bulk-bar__pill">{{ barText }}</span>
      </div>
      <div class="bulk-bar__actions">
        <button
          v-for="a in actions"
          :key="a.event || a.id || a.label"
          type="button"
          class="bulk-btn"
          :class="{
            'bulk-btn--destructive': a.destructive,
            [`bulk-btn--${a.variant || 'neutral'}`]: !!a.variant
          }"
          :disabled="a.disabled"
          :style="a.color ? { background: a.color } : undefined"
          @click="handleRun(a)"
        >
          <span v-if="a.icon" class="bulk-btn__icon">{{ a.icon }}</span>
          <span>{{ a.label }}</span>
        </button>
        <button
          v-if="showClear"
          type="button"
          class="bulk-btn bulk-btn--ghost"
          @click="handleClear"
        >
          {{ t('admin.bulk.clearSelection') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #BC4A3C, #d96a5a);
  color: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(188, 74, 60, 0.32);
}
.bulk-bar__pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  font-weight: 800;
  letter-spacing: 0.3px;
}
.bulk-bar__actions {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}
.bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.bulk-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}
.bulk-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.bulk-btn--primary { background: rgba(59, 130, 246, 0.55); border-color: rgba(59, 130, 246, 0.8); }
.bulk-btn--success { background: rgba(16, 185, 129, 0.55); border-color: rgba(16, 185, 129, 0.8); }
.bulk-btn--warning { background: rgba(245, 158, 11, 0.55); border-color: rgba(245, 158, 11, 0.8); }
.bulk-btn--danger  { background: rgba(239, 68, 68, 0.55);  border-color: rgba(239, 68, 68, 0.8); }
.bulk-btn--neutral { background: rgba(107, 114, 128, 0.55); border-color: rgba(107, 114, 128, 0.8); }
.bulk-btn--destructive {
  background: #1f1300;
  border-color: rgba(255, 255, 255, 0.6);
}
.bulk-btn--ghost {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.4);
}
.bulk-btn__icon { font-size: 1rem; line-height: 1; }

.bulk-slide-enter-active, .bulk-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.bulk-slide-enter-from, .bulk-slide-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

@media (max-width: 720px) {
  .bulk-bar { flex-direction: column; align-items: stretch; }
  .bulk-bar__actions { justify-content: flex-end; }
}
</style>
