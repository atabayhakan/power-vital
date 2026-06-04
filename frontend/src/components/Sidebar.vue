<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMlm } from '../composables/useMlm';

const router = useRouter();
const userRole = ref('distributor');
const { isMlmEnabled, fetchMlmStatus } = useMlm();

onMounted(() => {
  userRole.value = localStorage.getItem('role') || 'distributor';
  fetchMlmStatus();
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  router.push('/login');
};
</script>

<template>
  <aside class="sidebar glass-panel">
    <div class="logo-area">
      <h2 class="brand-text">POWER <span class="vital">VITAL</span></h2>
    </div>

    <nav class="nav-links">
      <router-link :to="userRole === 'admin' ? '/admin' : '/dashboard'" class="nav-item">
        <span class="icon">📊</span>
        <span class="label">Özet (Dashboard)</span>
      </router-link>

      <router-link to="/pos" class="nav-item">
        <span class="icon">🛒</span>
        <span class="label">Hızlı Kasa (POS)</span>
      </router-link>

      <router-link to="/orders" class="nav-item">
        <span class="icon">📦</span>
        <span class="label">Siparişlerim</span>
      </router-link>

      <!-- ═══ MLM-ONLY LINKS (Hidden when MLM is OFF) ═══ -->
      <template v-if="isMlmEnabled">
        <router-link to="/network" class="nav-item">
          <span class="icon">🌳</span>
          <span class="label">Ağaç (Network)</span>
        </router-link>

        <router-link to="/olympics" class="nav-item">
          <span class="icon">🚀</span>
          <span class="label">Olimpiyat Koşusu</span>
        </router-link>
      </template>

      <!-- ADMIN ONLY LINKS -->
      <template v-if="userRole === 'admin'">
        <div class="nav-divider"></div>
        <div class="nav-section-title">YÖNETİM</div>
        
        <router-link to="/products" class="nav-item">
          <span class="icon">💊</span>
          <span class="label">Ürün Yönetimi</span>
        </router-link>
        
        <router-link to="/slider-manage" class="nav-item">
          <span class="icon">🖼️</span>
          <span class="label">Slider Yönetimi</span>
        </router-link>

        <router-link to="/site-settings" class="nav-item">
          <span class="icon">🏢</span>
          <span class="label">İletişim Ayarları</span>
        </router-link>
        
        <!-- MLM Admin links (only when MLM enabled) -->
        <template v-if="isMlmEnabled">
          <router-link to="/simulation" class="nav-item">
            <span class="icon">🔮</span>
            <span class="label">Simülasyon</span>
          </router-link>
        </template>
        
        <router-link to="/bonus-control" class="nav-item">
          <span class="icon">⚙️</span>
          <span class="label">Sistem Ayarları</span>
        </router-link>
      </template>
    </nav>

    <div class="user-profile">
      <div class="avatar"></div>
      <div class="info">
        <span class="name">{{ userRole === 'admin' ? 'Admin' : (isMlmEnabled ? 'Distribütör' : 'Müşteri') }}</span>
        <span class="status text-gradient">{{ isMlmEnabled ? 'Aktif Bayi' : 'Aktif Hesap' }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout" title="Çıkış Yap">🚪</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 0;
  border-right: var(--border-glass);
}

.logo-area {
  margin-bottom: 32px;
  text-align: center;
}

.brand-text {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-main);
}

.brand-text .vital {
  color: var(--color-primary);
}

.nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: 10px;
  transition: var(--transition-smooth);
  font-size: 14px;
}

.nav-item:hover, .nav-item.router-link-active {
  background: rgba(0, 210, 255, 0.08);
  color: var(--color-text-main);
}

.nav-item.router-link-active {
  border-left: 3px solid var(--color-primary);
  background: linear-gradient(90deg, rgba(0,210,255,0.12) 0%, transparent 100%);
}

.nav-divider {
  height: 1px;
  background: rgba(255,255,255,.06);
  margin: 12px 0;
}

.nav-section-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--color-text-muted);
  padding: 0 14px;
  margin-bottom: 4px;
}

.icon { font-size: 18px; }
.label { font-weight: 500; }

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 20px;
  border-top: var(--border-glass);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.info { flex: 1; }
.info .name { font-weight: 600; font-size: 13px; display: block; }
.info .status { font-size: 11px; }

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  transition: transform .2s;
}
.logout-btn:hover { transform: scale(1.2); }
</style>
