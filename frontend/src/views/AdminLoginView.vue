<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/useAuthStore';
import { useTranslate } from '../composables/useTranslate';

const authStore = useAuthStore();
const { t } = useTranslate();

const email = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const handleAdminLogin = async () => {
  if (!email.value || !password.value) {
    errorMsg.value = 'Kimlik doğrulama bilgileri eksik.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';

  try {
    await authStore.loginAsAdmin(email.value, password.value);
    window.location.href = '/admin'; // Redirect to God Mode
  } catch (err: any) {
    errorMsg.value = err.message || 'Yetkisiz Erişim (Sistem Reddi)';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="admin-login-page">
    <div class="hq-card clay-dark">
      <div class="hq-logo">HQ.</div>
      <h1 class="hq-title">{{ t('admin.login.systemControl') }}</h1>
      <p class="hq-subtitle">{{ t('admin.login.authorizedStaff') }}</p>

      <form @submit.prevent="handleAdminLogin" class="hq-form">
        <div class="field clay-dark-inset">
          <label>{{ t('admin.login.idOrEmail') }}</label>
          <input type="text" v-model="email" placeholder="admin@powervital.com" :disabled="isLoading" />
        </div>
        <div class="field clay-dark-inset">
          <label>{{ t('admin.login.password') }}</label>
          <input type="password" v-model="password" placeholder="••••••••" :disabled="isLoading" />
        </div>

        <div v-if="errorMsg" class="hq-error">{{ errorMsg }}</div>

        <button type="submit" class="hq-cta" :disabled="isLoading">
          <span class="cta-text" v-if="!isLoading">{{ t('admin.login.secureSubmit') }}</span>
          <span class="cta-text" v-else>{{ t('admin.login.verifying') }}</span>
          <div class="cta-glow"/>
        </button>
      </form>

      <router-link to="/" class="back-link">{{ t('admin.login.backToStore') }}</router-link>
    </div>
  </div>
</template>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  width: 100vw;
  background-color: #121214;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat', sans-serif;
  color: #fff;
  padding: 20px;
}

.hq-card {
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 24px;
}

.clay-dark {
  background-color: #18181b;
  box-shadow: 12px 12px 24px rgba(0, 0, 0, 0.4), -12px -12px 24px rgba(39, 39, 42, 0.4);
  border: 1px solid rgba(63, 63, 70, 0.5);
}

.clay-dark-inset {
  background-color: #121214;
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -4px -4px 8px rgba(39, 39, 42, 0.2);
  border-radius: 12px;
}

.hq-logo {
  font-family: 'Outfit', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: #BC4A3C;
  margin-bottom: 8px;
  letter-spacing: -2px;
}

.hq-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #f4f4f5;
}

.hq-subtitle {
  color: #a1a1aa;
  font-size: 0.9rem;
  margin-bottom: 32px;
  text-align: center;
}

.hq-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}
.field:focus-within {
  border-color: #BC4A3C;
}

.field label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #71717a;
  margin-bottom: 4px;
}

.field input {
  border: none;
  background: transparent;
  font-size: 1.05rem;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: #f4f4f5;
  outline: none;
  width: 100%;
}

.hq-error {
  color: #ef4444;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.hq-cta {
  position: relative;
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #FF3B30 0%, #D8412F 100%);
  color: #fff;
  cursor: pointer;
  margin-top: 12px;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 2px 2px 6px rgba(255, 255, 255, 0.2), inset -2px -2px 6px rgba(0, 0, 0, 0.6);
}
.hq-cta:active:not(:disabled) {
  transform: scale(0.96);
}
.hq-cta:disabled {
  filter: grayscale(1);
  opacity: 0.5;
  cursor: not-allowed;
}

.cta-text {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 1px;
  z-index: 2;
}

.cta-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #FF3B30 0%, #D8412F 100%);
  filter: blur(10px);
  opacity: 0;
  z-index: 1;
  transition: opacity 0.3s;
}
.hq-cta:hover:not(:disabled) .cta-glow {
  opacity: 0.5;
}

.back-link {
  margin-top: 32px;
  color: #71717a;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.2s;
}
.back-link:hover {
  color: #f4f4f5;
}
</style>
