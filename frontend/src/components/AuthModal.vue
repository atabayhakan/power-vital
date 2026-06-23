<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/useAuthStore';
import { useTranslate } from '../composables/useTranslate';
import api from '../utils/api';

const { t } = useTranslate();
const authStore = useAuthStore();

const isOpen = ref(false);
const activeTab = ref<'login' | 'register'>('login');
const email = ref('');
const password = ref('');
const name = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const showPassword = ref(false);

const openModal = () => {
  isOpen.value = true;
  errorMsg.value = '';
};

const closeModal = () => {
  if (!isLoading.value) {
    isOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('open-auth-modal', openModal);
});

onUnmounted(() => {
  window.removeEventListener('open-auth-modal', openModal);
});

const handleSubmit = async () => {
  if (!email.value || !password.value || (activeTab.value === 'register' && !name.value)) {
    errorMsg.value = t('authModal.errFillAll');
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';

  try {
    const endpoint = activeTab.value === 'login' ? '/auth/login' : '/auth/register';
    const payload = activeTab.value === 'login'
      ? { email: email.value, password: password.value }
      : { email: email.value, password: password.value, name: name.value };
    const res = await api.post(endpoint, payload);
    if (res.data && res.data.token && res.data.user) {
      authStore.setAuth(res.data.user.role, res.data.user, res.data.token, res.data.user.id);
      isOpen.value = false; // Force close regardless of isLoading
    } else {
      errorMsg.value = t('authModal.errUnexpected');
      console.error('[AuthModal] Unexpected response shape:', res.data);
    }
  } catch (e: any) {
    console.error('[AuthModal] Auth error:', e);
    const apiMsg = e.response?.data?.error || e.response?.data?.message || e.message;
    errorMsg.value = (activeTab.value === 'login' ? t('authModal.errLoginFail') : t('authModal.errRegisterFail')) + (apiMsg ? ': ' + apiMsg : '');
  } finally {
    isLoading.value = false;
  }
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <Teleport to="body">
    <Transition name="auth">
      <div v-if="isOpen" class="am-backdrop" @click="closeModal">
        <div class="am-modal" @click.stop>

          <!-- Close -->
          <button class="am-close" @click="closeModal" :disabled="isLoading" :aria-label="t('authModal.close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <!-- Brand -->
          <div class="am-brand">
            <span class="am-brand__text">Power<span class="am-brand__accent">Vital</span></span>
          </div>

          <!-- Tabs -->
          <div class="am-tabs">
            <button
              class="am-tab"
              :class="{ 'am-tab--active': activeTab === 'login' }"
              @click="activeTab = 'login'"
              :disabled="isLoading"
            >{{ t('authModal.tabLogin') }}</button>
            <button
              class="am-tab"
              :class="{ 'am-tab--active': activeTab === 'register' }"
              @click="activeTab = 'register'"
              :disabled="isLoading"
            >{{ t('authModal.tabRegister') }}</button>
            <div class="am-tabs__slider" :class="{ 'am-tabs__slider--right': activeTab === 'register' }"/>
          </div>

          <!-- Header -->
          <div class="am-header">
            <h2 class="am-header__title">{{ activeTab === 'login' ? t('authModal.welcomeTitle') : t('authModal.joinTitle') }}</h2>
            <p class="am-header__sub">{{ activeTab === 'login' ? t('authModal.welcomeSub') : t('authModal.joinSub') }}</p>
          </div>

          <!-- Form -->
          <form class="am-form" @submit.prevent="handleSubmit">

            <!-- Name (register only) -->
            <div class="am-field" v-if="activeTab === 'register'">
              <label class="am-field__label" for="auth-name">{{ t('authModal.nameLabel') }}</label>
              <div class="am-field__input-wrap">
                <svg class="am-field__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  id="auth-name"
                  type="text"
                  v-model="name"
                  :placeholder="t('authModal.namePlaceholder')"
                  :disabled="isLoading"
                  autocomplete="name"
                  required
                />
              </div>
            </div>

            <!-- Email -->
            <div class="am-field">
              <label class="am-field__label" for="auth-email">{{ t('authModal.emailLabel') }}</label>
              <div class="am-field__input-wrap">
                <svg class="am-field__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <input
                  id="auth-email"
                  type="text"
                  v-model="email"
                  :placeholder="t('common.emailPlaceholder')"
                  :disabled="isLoading"
                  autocomplete="email"
                />
              </div>
            </div>

            <!-- Password with show/hide toggle -->
            <div class="am-field">
              <label class="am-field__label" for="auth-pw">{{ t('authModal.passwordLabel') }}</label>
              <div class="am-field__input-wrap">
                <svg class="am-field__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="auth-pw"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  placeholder="••••••••"
                  :disabled="isLoading"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="am-field__toggle"
                  @click="togglePassword"
                  :aria-label="showPassword ? t('authModal.hidePassword') : t('authModal.showPassword')"
                  tabindex="-1"
                >
                  <!-- Eye open -->
                  <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <!-- Eye closed -->
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <path d="m14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Forgot password (login only) -->
            <div class="am-forgot" v-if="activeTab === 'login'">
              <a href="#" @click.prevent>{{ t('authModal.forgot') }}</a>
            </div>

            <!-- Error -->
            <div class="am-error" v-if="errorMsg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
              {{ errorMsg }}
            </div>

            <!-- Submit -->
            <button type="submit" class="am-submit" :disabled="isLoading">
              <span v-if="!isLoading">{{ activeTab === 'login' ? t('authModal.tabLogin') : t('authModal.tabRegister') }}</span>
              <span v-else class="am-submit__spinner"/>
            </button>

            <!-- Divider -->
            <div class="am-divider">
              <span>{{ t('authModal.or') }}</span>
            </div>

            <!-- Social hint -->
            <p class="am-social-hint">
              {{ activeTab === 'login' ? t('authModal.noAccount') : t('authModal.hasAccount') }}
              <a href="#" @click.prevent="activeTab = activeTab === 'login' ? 'register' : 'login'">
                {{ activeTab === 'login' ? t('authModal.doRegister') : t('authModal.doLogin') }}
              </a>
            </p>

          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Backdrop ─── */
.am-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(24, 24, 27, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

/* ─── Modal ─── */
.am-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--clay-shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: var(--space-2xl) var(--space-xl);
  overflow: hidden;
}

/* Subtle accent gradient in top-left corner */
.am-modal::before {
  content: '';
  position: absolute;
  top: -60px;
  left: -60px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(188, 74, 60, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

/* ─── Transitions ─── */
.auth-enter-active { transition: opacity var(--duration-normal) ease; }
.auth-leave-active { transition: opacity var(--duration-fast) ease; }
.auth-enter-from, .auth-leave-to { opacity: 0; }
.auth-enter-active .am-modal { animation: modalIn var(--duration-slow) var(--ease-spring); }
.auth-leave-active .am-modal { animation: modalOut var(--duration-fast) ease; }

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes modalOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95) translateY(8px); }
}

/* ─── Close ─── */
.am-close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all var(--duration-fast);
}
.am-close:hover {
  background: var(--surface-inset);
  color: var(--text-primary);
  transform: rotate(90deg);
}

/* ─── Brand ─── */
.am-brand {
  text-align: center;
  margin-bottom: var(--space-lg);
}
.am-brand__text {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.03em;
}
.am-brand__accent {
  color: var(--pv-red);
}

/* ─── Tabs ─── */
.am-tabs {
  position: relative;
  display: flex;
  background: var(--surface-inset);
  box-shadow: var(--clay-inset);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: var(--space-xl);
}

.am-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: color var(--duration-fast);
  position: relative;
  z-index: 2;
}

.am-tab--active {
  color: var(--text-on-brand);
}

.am-tabs__slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: var(--pv-red);
  border-radius: var(--radius-xs);
  box-shadow: 0 2px 8px var(--pv-red-glow);
  transition: transform var(--duration-normal) var(--ease-spring);
  z-index: 1;
}
.am-tabs__slider--right {
  transform: translateX(calc(100% + 4px));
}

/* ─── Header ─── */
.am-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}
.am-header__title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  letter-spacing: -0.02em;
}
.am-header__sub {
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* ─── Fields ─── */
.am-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.am-field__label {
  display: block;
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.am-field__input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--surface-inset);
  box-shadow: var(--clay-inset);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  border: 2px solid transparent;
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}

.am-field__input-wrap:focus-within {
  border-color: var(--pv-red);
  box-shadow: var(--clay-inset), 0 0 0 3px rgba(188, 74, 60, 0.1);
}

.am-field__icon {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: color var(--duration-fast);
}

.am-field__input-wrap:focus-within .am-field__icon {
  color: var(--pv-red);
}

.am-field__input-wrap input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-primary);
  outline: none;
  width: 100%;
  min-width: 0;
}

.am-field__input-wrap input::placeholder {
  color: var(--text-muted);
}

/* ─── Password Toggle ─── */
.am-field__toggle {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  transition: color var(--duration-fast), background var(--duration-fast);
}
.am-field__toggle:hover {
  color: var(--pv-red);
  background: rgba(188, 74, 60, 0.06);
}

/* ─── Forgot ─── */
.am-forgot {
  text-align: right;
  margin-top: calc(-1 * var(--space-xs));
}
.am-forgot a {
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--pv-red);
  text-decoration: none;
  transition: opacity var(--duration-fast);
}
.am-forgot a:hover { opacity: 0.7; }

/* ─── Error ─── */
.am-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: var(--radius-xs);
  color: var(--color-error);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: var(--font-body);
}

/* ─── Submit ─── */
.am-submit {
  width: 100%;
  padding: 14px;
  background: var(--pv-gradient);
  color: var(--text-on-brand);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: var(--clay-brand-inset), 0 4px 16px var(--pv-red-glow);
  transition: all var(--duration-fast) var(--ease-spring);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
}
.am-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--clay-brand-inset), 0 8px 28px var(--pv-red-glow);
}
.am-submit:active:not(:disabled) {
  transform: scale(0.97);
}
.am-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.am-submit__spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Divider ─── */
.am-divider {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-xs) 0;
}
.am-divider::before,
.am-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
}
.am-divider span {
  font-family: var(--font-body);
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* ─── Social hint ─── */
.am-social-hint {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
}
.am-social-hint a {
  color: var(--pv-red);
  font-weight: 700;
  text-decoration: none;
  transition: opacity var(--duration-fast);
}
.am-social-hint a:hover { opacity: 0.7; }

/* ─── Responsive ─── */
@media (max-width: 480px) {
  .am-modal {
    padding: var(--space-xl) var(--space-lg);
    border-radius: var(--radius-lg);
    max-width: 100%;
  }
  .am-header__title { font-size: 1.4rem; }
}
</style>
