<script setup lang="ts">
// ImpersonationBanner — sticky banner shown when an admin is
// impersonating another user. Lets them quickly end the session.
//
// Visible on EVERY route (including admin pages) so the operator
// never forgets they're acting as someone else.
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImpersonation } from '../../composables/useImpersonation';
import ImpersonationSessionsModal from './ImpersonationSessionsModal.vue';

const { t } = useI18n();
const { state, minutesRemaining, stop } = useImpersonation();
const showHistory = ref(false);
</script>

<template>
  <Transition name="imp-slide">
    <div v-if="state.active" class="imp-banner" role="alert">
      <div class="imp-banner__left">
        <span class="imp-banner__icon">⚠️</span>
        <div class="imp-banner__text">
          <strong>İmpersonation modu:</strong>
          <span class="imp-banner__target">
            {{ state.targetName }} &lt;{{ state.targetEmail }}&gt;
          </span>
          olarak görüntülüyorsunuz. Yaptığınız tüm işlemler audit log'a
          <strong>sizin admin kimliğinizle</strong> kaydedilir.
        </div>
      </div>

      <div class="imp-banner__right">
        <span class="imp-banner__timer" :class="{ 'imp-banner__timer--low': minutesRemaining < 5 }">
          ⏱️ {{ minutesRemaining }} dk kaldı
        </span>
        <button class="imp-banner__btn imp-banner__btn--ghost" @click="showHistory = true">
          📜 {{ t('admin.impersonation.viewHistory') }}
        </button>
        <button class="imp-banner__btn" @click="stop">
          🚫 İmpersonation'ı bitir
        </button>
      </div>
    </div>
  </Transition>

  <ImpersonationSessionsModal :open="showHistory" @close="showHistory = false" />
</template>

<style scoped>
.imp-banner {
  position: sticky;
  top: 0;
  z-index: 9999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1.25rem;
  background: linear-gradient(90deg, #f59e0b, #d97706);
  color: #1f1300;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
  border-bottom: 1px solid rgba(0,0,0,0.15);
}

.imp-banner__left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
  min-width: 0;
}

.imp-banner__icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.imp-banner__text {
  line-height: 1.4;
}

.imp-banner__target {
  margin: 0 0.4rem;
  padding: 0.1rem 0.4rem;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
}

.imp-banner__right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.imp-banner__timer {
  font-size: 0.8rem;
  font-weight: 700;
  font-family: ui-monospace, monospace;
}
.imp-banner__timer--low {
  color: #7f1d1d;
  animation: imp-pulse 1s ease-in-out infinite;
}
@keyframes imp-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

.imp-banner__btn {
  background: rgba(0, 0, 0, 0.15);
  color: #1f1300;
  border: 1px solid rgba(0, 0, 0, 0.25);
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  transition: background 0.15s;
}
.imp-banner__btn:hover {
  background: rgba(0, 0, 0, 0.3);
}
.imp-banner__btn--ghost {
  background: transparent;
  border-color: rgba(0, 0, 0, 0.4);
}

/* Slide-in animation */
.imp-slide-enter-active, .imp-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.imp-slide-enter-from, .imp-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .imp-banner { flex-direction: column; align-items: stretch; gap: 0.5rem; padding: 0.75rem; }
  .imp-banner__right { justify-content: space-between; }
  .imp-banner__btn { flex: 1; }
}
</style>
