<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useMlm } from '../composables/useMlm';

const router = useRouter();
const { isMlmEnabled, fetchMlmStatus } = useMlm();

const name = ref('');
const email = ref('');
const password = ref('');
const sponsorId = ref('');
const role = ref('customer');
const errorMsg = ref('');
const isLoading = ref(false);

onMounted(async () => {
  await fetchMlmStatus();
  // If MLM is off, force customer role
  if (!isMlmEnabled.value) {
    role.value = 'customer';
  }
});

const register = async () => {
  try {
    isLoading.value = true;
    errorMsg.value = '';
    
    await axios.post('/api/v1/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      sponsorId: isMlmEnabled.value ? (sponsorId.value || undefined) : undefined,
      role: isMlmEnabled.value ? role.value : 'customer'
    });
    
    // Auto login after register
    const loginRes = await axios.post('/api/v1/auth/login', {
      email: email.value,
      password: password.value
    });
    
    localStorage.setItem('token', loginRes.data.token);
    localStorage.setItem('userId', loginRes.data.user.id);
    localStorage.setItem('role', loginRes.data.user.role);
    
    if (loginRes.data.user.role === 'distributor') {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'Kayıt başarısız oldu.';
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
        <p>Aramıza katılın</p>
      </div>
      
      <!-- Role selector: ONLY show when MLM is enabled -->
      <div class="role-selector" v-if="isMlmEnabled">
        <button 
          class="role-btn" 
          :class="{ active: role === 'customer' }" 
          @click="role = 'customer'"
          type="button">
          🧑‍💼 Müşteri
        </button>
        <button 
          class="role-btn" 
          :class="{ active: role === 'distributor' }" 
          @click="role = 'distributor'"
          type="button">
          🚀 Distribütör (Bayi)
        </button>
      </div>

      <div class="role-description" v-if="isMlmEnabled">
        <p v-if="role === 'customer'">Sadece ürünleri inceler ve satın alırsınız.</p>
        <p v-if="role === 'distributor'">Prim kazanır, ekibinizi kurar ve ağınızı yönetirsiniz.</p>
      </div>

      <form @submit.prevent="register" class="auth-form">
        <div class="form-group">
          <label>Ad Soyad</label>
          <input type="text" v-model="name" required placeholder="Adınız Soyadınız" class="light-input" />
        </div>

        <div class="form-group">
          <label>E-posta Adresi</label>
          <input type="email" v-model="email" required placeholder="ornek@email.com" class="light-input" />
        </div>
        
        <div class="form-group">
          <label>Şifre</label>
          <input type="password" v-model="password" required placeholder="••••••••" class="light-input" />
        </div>

        <!-- Sponsor ID: ONLY when MLM enabled AND distributor selected -->
        <div class="form-group slide-down" v-if="isMlmEnabled && role === 'distributor'">
          <label>Sponsor Kodu (İsteğe Bağlı)</label>
          <input type="text" v-model="sponsorId" placeholder="Sponsorunuzun referans kodu" class="light-input" />
        </div>
        
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        
        <button type="submit" class="btn-primary auth-btn" :disabled="isLoading">
          {{ isLoading ? 'İşleniyor...' : 'Kayıt Ol' }}
        </button>
      </form>
      
      <div class="auth-footer">
        Zaten hesabınız var mı? <router-link to="/login">Giriş Yap</router-link>
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
  color: #b05d5d;
}

.auth-header p {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}

.role-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.role-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.role-btn.active {
  border-color: #b05d5d;
  background: #ffe8e8;
  color: #b05d5d;
}

.role-description {
  text-align: center;
  font-size: 12px;
  color: #888;
  margin-bottom: 20px;
  height: 18px;
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
  border-color: #b05d5d;
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
  background: #b05d5d;
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
  color: #b05d5d;
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
