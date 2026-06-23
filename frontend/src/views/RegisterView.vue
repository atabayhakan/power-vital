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
  padding: 30px 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  border: 1px solid #eee;
}

.auth-header {
  text-align: center;
  margin-bottom: 20px;
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
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.auth-footer a {
  color: var(--color-primary);
  font-weight: 600;
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
