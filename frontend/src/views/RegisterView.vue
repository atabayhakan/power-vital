<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../utils/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useMlm } from '../composables/useMlm';
import { useTranslate } from '../composables/useTranslate';

const router = useRouter();
const authStore = useAuthStore();
const { isMlmEnabled, fetchMlmStatus } = useMlm();
const { t } = useTranslate();

const name = ref('');
const email = ref('');
const password = ref('');
const sponsorId = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

onMounted(async () => {
  await fetchMlmStatus();
});

const register = async () => {
  try {
    isLoading.value = true;
    errorMsg.value = '';

    await api.post('/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      sponsorId: isMlmEnabled.value ? (sponsorId.value || undefined) : undefined,
      role: 'customer'
    });

    const loginRes = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    });

    authStore.setAuth(loginRes.data.user.role, loginRes.data.user, loginRes.data.token, loginRes.data.user.id);

    if (loginRes.data.user.role === 'distributor') {
      router.push('/dashboard');
    } else {
      router.push('/account');
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || t('register.registerFailed');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card glass-panel-light">
      <div class="auth-header">
        <h2 class="brand-text">POWER <span class="vital">VITAL</span></h2>
        <p>{{ t('register.subtitle') }}</p>
      </div>

      <form @submit.prevent="register" class="auth-form">
        <div class="form-group">
          <label>{{ t('register.name') }}</label>
          <input type="text" v-model="name" required :placeholder="t('register.namePlaceholder')" class="light-input" />
        </div>

        <div class="form-group">
          <label>{{ t('register.email') }}</label>
          <input type="email" v-model="email" required :placeholder="t('common.emailPlaceholder')" class="light-input" />
        </div>

        <div class="form-group">
          <label>{{ t('register.password') }}</label>
          <input type="password" v-model="password" required placeholder="••••••••" class="light-input" />
        </div>

        <div class="form-group slide-down" v-if="isMlmEnabled">
          <label>{{ t('register.sponsorCode') }}</label>
          <input type="text" v-model="sponsorId" :placeholder="t('register.sponsorPlaceholder')" class="light-input" />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="btn-primary auth-btn" :disabled="isLoading">
          {{ isLoading ? t('register.submitting') : t('register.submit') }}
        </button>
      </form>

      <div class="auth-footer">
        {{ t('register.hasAccount') }} <router-link to="/login">{{ t('register.signIn') }}</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg, 20px);
  background: var(--surface-page);
  font-family: var(--font-body);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface-card);
  padding: var(--space-xl, 30px) var(--space-2xl, 40px);
  border-radius: var(--radius-xl, 24px);
  box-shadow: var(--clay-shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-xl, 20px);
}

.brand-text {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
}

.brand-text .vital {
  color: var(--pv-red);
}

.auth-header p {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: var(--space-sm, 8px);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
}

.light-input {
  padding: 12px 16px;
  border: 1px solid var(--surface-inset);
  border-radius: var(--radius-sm, 8px);
  font-size: 15px;
  outline: none;
  transition: border-color var(--duration-fast, 0.2s) var(--ease-smooth);
  background: var(--surface-white);
  color: var(--text-primary);
}

.light-input:focus {
  border-color: var(--pv-red);
}

.auth-btn {
  width: 100%;
  margin-top: 10px;
}

.error-msg {
  color: var(--color-error);
  font-size: 13px;
  background: rgba(197, 48, 48, 0.1);
  padding: 10px;
  border-radius: var(--radius-sm, 6px);
  text-align: center;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--pv-red);
  font-weight: 700;
  text-decoration: none;
}

.slide-down {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
