<script setup lang="ts">
import { ref } from 'vue';
import api from '../utils/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useRouter } from 'vue-router';
import { useTranslate } from '../composables/useTranslate';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useTranslate();
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const login = async () => {
  try {
    isLoading.value = true;
    errorMsg.value = '';
    const res = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    });

    authStore.setAuth(res.data.user.role, res.data.user, res.data.token, res.data.user.id);

    if (res.data.user.role === 'admin') {
      router.push('/admin');
    } else if (res.data.user.role === 'distributor') {
      router.push('/dashboard');
    } else {
      router.push('/account');
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || t('login.loginFailed');
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
        <p>{{ t('login.subtitle') }}</p>
      </div>

      <form @submit.prevent="login" class="auth-form">
        <div class="form-group">
          <label>{{ t('login.email') }}</label>
          <input type="email" v-model="email" required :placeholder="t('common.emailPlaceholder')" class="light-input" />
        </div>

        <div class="form-group">
          <label>{{ t('login.password') }}</label>
          <input type="password" v-model="password" required placeholder="••••••••" class="light-input" />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="btn-primary auth-btn" :disabled="isLoading">
          {{ isLoading ? t('login.submitting') : t('login.submit') }}
        </button>
      </form>

      <div class="auth-footer">
        {{ t('login.noAccount') }} <router-link to="/register">{{ t('login.signUp') }}</router-link>
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
  padding: var(--space-2xl, 40px);
  border-radius: var(--radius-xl, 24px);
  box-shadow: var(--clay-shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-2xl, 30px);
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
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--pv-red);
  font-weight: 700;
  text-decoration: none;
}
</style>
