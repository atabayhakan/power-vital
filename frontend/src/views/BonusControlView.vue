<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const config = ref<any>(null);
const stats = ref<any>(null);
const isLoading = ref(true);
const isSaving = ref(false);

const fetchConfig = async () => {
  try {
    const res = await axios.get('/api/v1/system/config', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    config.value = res.data.config;
    stats.value = res.data.stats;
  } catch (e) {
    console.error('Failed to fetch config, using demo data:', e);
    // Demo data
    config.value = { isReferralActive: true, isUnilevelActive: true, isOverdriveActive: true };
    stats.value = { totalRevenue: '50000', totalPaid: '14000', currentPayoutRatio: '28' };
  } finally {
    isLoading.value = false;
  }
};

const toggleModule = async (moduleName: string) => {
  config.value[moduleName] = !config.value[moduleName];
  isSaving.value = true;
  try {
    await axios.put('/api/v1/system/config', {
      isReferralActive: config.value.isReferralActive,
      isUnilevelActive: config.value.isUnilevelActive,
      isOverdriveActive: config.value.isOverdriveActive,
    }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  } catch (e) {
    console.error('Failed to save module state', e);
    // Revert on error
    config.value[moduleName] = !config.value[moduleName];
  } finally {
    isSaving.value = false;
  }
};

const closeWeek = async () => {
  if (!confirm('Haftayı kapatmak istediğinize emin misiniz? Bu işlem bekleyen puanları (hedefleri) gelecek haftaya devredecek ve Olimpiyat Koşusunu sıfırlayacaktır.')) {
    return;
  }
  
  isSaving.value = true;
  try {
    await axios.post('/api/v1/system/close-week', {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    alert('Hafta başarıyla kapatıldı! Puanlar devredildi ve yeni yarış başladı.');
    fetchConfig(); // refresh stats
  } catch (e) {
    console.error('Failed to close week:', e);
    alert('Hafta kapatılırken bir hata oluştu.');
  } finally {
    isSaving.value = false;
  }
};

const payoutRatioNumber = computed(() => {
  return parseFloat(stats.value?.currentPayoutRatio || '0');
});

const progressColor = computed(() => {
  if (payoutRatioNumber.value > 28) return '#ef4444'; // Red
  if (payoutRatioNumber.value > 20) return '#eab308'; // Yellow
  return '#22c55e'; // Green
});

const toggleMlm = async () => {
  const newState = !config.value.isMlmEnabled;
  config.value.isMlmEnabled = newState;
  isSaving.value = true;
  try {
    await axios.put('/api/v1/system/config', { isMlmEnabled: newState }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  } catch (e) {
    config.value.isMlmEnabled = !newState; // Revert
    alert('MLM durumu değiştirilemedi.');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchConfig();
});
</script>

<template>
  <div class="bonus-control-content animate-fade-in">
    <div class="header-row">
      <div>
        <h2>E-Ticaret Sistemi Prim Kontrol Merkezi</h2>
        <p class="subtitle">Gelir modellerini yönetin ve %30 şirket güvenlik kilidini izleyin.</p>
      </div>
      <button class="btn-primary" style="background:#ef4444; border:none;" @click="closeWeek" :disabled="isSaving">
        🛑 Haftayı Kapat
      </button>
    </div>

    <div v-if="isLoading" class="loading glass-panel">Veriler yükleniyor...</div>
    
    <div v-else-if="config && stats" class="dashboard-grid">

      <!-- ═══ MLM MASTER TOGGLE ═══ -->
      <div class="mlm-master-card glass-panel">
        <div class="mlm-master-row">
          <div>
            <h3>🔌 MLM Motor Durumu</h3>
            <p class="desc">Tüm ağ pazarlama modüllerini (Network, Bonus, Olimpiyat) tek anahtarla kapatabilirsiniz. E-ticaret, POS ve stok yönetimi etkilenmez.</p>
          </div>
          <button 
            class="mlm-toggle" 
            :class="{ on: config.isMlmEnabled, off: !config.isMlmEnabled }" 
            @click="toggleMlm" 
            :disabled="isSaving">
            <span class="mlm-toggle-track">
              <span class="mlm-toggle-dot"></span>
            </span>
            <span class="mlm-toggle-label">{{ config.isMlmEnabled ? 'AKTİF' : 'KAPALI' }}</span>
          </button>
        </div>
        <div v-if="!config.isMlmEnabled" class="mlm-off-notice">
          ⚠️ MLM motoru kapalı. Tüm satışlar standart perakende işlemi olarak kaydedilir. Bonus hesaplanmaz.
        </div>
      </div>
      
      <!-- Security Lock Metric -->
      <div class="metric-card glass-panel limit-card">
        <h3>%30 Şirket Güvenlik Kilidi (Max Payout)</h3>
        <p class="desc">Dağıtılan toplam primlerin şirket cirosuna oranı. %30'a ulaşırsa sistem yeni prim dağıtımını durdurur.</p>
        
        <div class="stats-row">
          <div class="stat">
            <span>Toplam Ciro</span>
            <h4>${{ stats.totalRevenue }}</h4>
          </div>
          <div class="stat">
            <span>Dağıtılan Prim</span>
            <h4 class="text-gradient">${{ stats.totalBonus }}</h4>
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill" 
              :style="{ width: `${Math.min(payoutRatioNumber, 100)}%`, backgroundColor: progressColor }"
            ></div>
          </div>
          <div class="progress-labels">
            <span :style="{ color: progressColor, fontWeight: 'bold' }">%{{ stats.currentPayoutRatio }}</span>
            <span>Limit: %{{ config.maxPayoutLimitPct }}</span>
          </div>
        </div>
      </div>

      <!-- Income Models Toggles (Only relevant when MLM is ON) -->
      <div class="modules-card glass-panel" :class="{ 'disabled-card': !config.isMlmEnabled }">
        <h3>Aktif Gelir Modelleri (Şalterler)</h3>
        
        <div class="module-item">
          <div class="module-info">
            <h4>1. Referans Primi (%10)</h4>
            <p>Direkt satışlardan elde edilen anında kazanç modeli.</p>
          </div>
          <button 
            class="toggle-btn" 
            :class="{ active: config.isReferralActive }"
            @click="toggleModule('isReferralActive')"
            :disabled="isSaving"
          >
            {{ config.isReferralActive ? 'AÇIK' : 'KAPALI' }}
          </button>
        </div>

        <div class="module-item">
          <div class="module-info">
            <h4>2. Derinlik / Unilevel Ekip Primi</h4>
            <p>Ağın alt katmanlarından gelen hacim bazlı takım primi.</p>
          </div>
          <button 
            class="toggle-btn" 
            :class="{ active: config.isUnilevelActive }"
            @click="toggleModule('isUnilevelActive')"
            :disabled="isSaving"
          >
            {{ config.isUnilevelActive ? 'AÇIK' : 'KAPALI' }}
          </button>
        </div>

        <div class="module-item highlight-module">
          <div class="module-info">
            <h4>3. Antigravity "Overdrive" Primi (%5) 🚀</h4>
            <p>Şirket cirosunun %5'i havuzda birikir. Piramidi yıkan performansa dayalı global ödül.</p>
          </div>
          <button 
            class="toggle-btn" 
            :class="{ active: config.isOverdriveActive }"
            @click="toggleModule('isOverdriveActive')"
            :disabled="isSaving"
          >
            {{ config.isOverdriveActive ? 'AÇIK' : 'KAPALI' }}
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.bonus-control-content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.subtitle {
  color: var(--color-text-muted);
  margin-top: 8px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.metric-card, .modules-card {
  padding: 32px;
}

h3 {
  margin-bottom: 12px;
  font-size: 20px;
}

.desc {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
  background: rgba(0,0,0,0.1);
  padding: 20px;
  border-radius: 12px;
}

.stat span {
  font-size: 13px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat h4 {
  font-size: 28px;
  margin-top: 4px;
}

.progress-container {
  margin-top: 20px;
}

.progress-bar-bg {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease-out, background-color 0.5s;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.module-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.module-item:last-child {
  border-bottom: none;
}

.module-info h4 {
  margin-bottom: 4px;
  font-size: 16px;
}

.module-info p {
  font-size: 13px;
  color: var(--color-text-muted);
}

.highlight-module {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%);
  padding: 20px;
  border-radius: 12px;
  margin-top: 10px;
  border: 1px solid rgba(14, 165, 233, 0.2);
}

.toggle-btn {
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.2);
  color: white;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.toggle-btn.active {
  background: #10b981;
  border-color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* ═══ MLM Master Toggle ═══ */
.mlm-master-card { grid-column: 1 / -1; padding: 28px 32px; }
.mlm-master-row { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.mlm-toggle { display: flex; align-items: center; gap: 12px; background: none; border: none; cursor: pointer; padding: 8px; }
.mlm-toggle-track { width: 56px; height: 28px; border-radius: 14px; position: relative; transition: background .3s; }
.mlm-toggle.on .mlm-toggle-track { background: #10b981; }
.mlm-toggle.off .mlm-toggle-track { background: #6b7280; }
.mlm-toggle-dot { position: absolute; top: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: left .3s; }
.mlm-toggle.on .mlm-toggle-dot { left: 31px; }
.mlm-toggle.off .mlm-toggle-dot { left: 3px; }
.mlm-toggle-label { font-weight: 700; font-size: 14px; letter-spacing: 1px; }
.mlm-toggle.on .mlm-toggle-label { color: #10b981; }
.mlm-toggle.off .mlm-toggle-label { color: #ef4444; }
.mlm-off-notice { margin-top: 16px; padding: 12px 16px; background: rgba(245,54,92,.1); border: 1px solid rgba(245,54,92,.25); border-radius: 8px; color: #f5365c; font-size: 13px; font-weight: 600; }

.disabled-card { opacity: .45; pointer-events: none; position: relative; }
.disabled-card::after { content: 'MLM Kapalı'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px; font-weight: 800; color: #ef4444; letter-spacing: 2px; }
</style>
