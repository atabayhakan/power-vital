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
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  font-family: 'Poppins', sans-serif;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  border: 1px solid #eee;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.brand-text {
  font-size: 28px;
  font-weight: 800;
  color: #000;
  margin: 0;
  letter-spacing: -0.5px;
}

.brand-text .vital {
  color: var(--color-primary);
}

.auth-header p {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
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
  font-weight: 600;
  color: #333;
}

.light-input {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  color: #000;
}

.light-input:focus {
  border-color: var(--color-primary);
}

.auth-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  background: #000;
  border-radius: 8px;
  transition: background 0.3s;
}

.auth-btn:hover {
  background: var(--color-primary);
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #e74c3c;
  font-size: 13px;
  background: rgba(231, 76, 60, 0.1);
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.auth-footer a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
</style>
