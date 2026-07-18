<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import ConfirmModal from '../components/ConfirmModal.vue';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

const config = ref<any>(null);
const stats = ref<any>(null);
const isLoading = ref(true);
const isSaving = ref(false);
const showCloseWeekModal = ref(false);
const fetchError = ref('');

const fetchConfig = async () => {
  isLoading.value = true;
  fetchError.value = '';
  try {
    const res = await axios.get('/api/v1/system/config', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    config.value = res.data.config;
    stats.value = res.data.stats;
  } catch (e: any) {
    // 🛡️ Demo veriye SESSİZCE düşmek yok — gerçek hata + retry gösterilir
    console.error('Failed to fetch config:', e);
    fetchError.value = e?.response?.data?.error || e?.message || t('bonus.loadError');
    config.value = null;
    stats.value = null;
  } finally {
    isLoading.value = false;
  }
};

const saveConfig = async () => {
  isSaving.value = true;
  try {
    let fsr = typeof config.value.fastStartRates === 'string' ? JSON.parse(config.value.fastStartRates) : config.value.fastStartRates;
    let ur = typeof config.value.unilevelRates === 'string' ? JSON.parse(config.value.unilevelRates) : config.value.unilevelRates;
    
    await axios.put('/api/v1/system/config', {
      isFastStartActive: config.value.isFastStartActive,
      fastStartRates: fsr,
      isUnilevelActive: config.value.isUnilevelActive,
      unilevelRates: ur,
      isOverdriveActive: config.value.isOverdriveActive,
      overdrivePoolPct: Number(config.value.overdrivePoolPct),
      maxPayoutLimitPct: Number(config.value.maxPayoutLimitPct)
    }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    
    // update local state to reflect parsed
    config.value.fastStartRates = JSON.stringify(fsr);
    config.value.unilevelRates = JSON.stringify(ur);
    
    alert('Ayarlar başarıyla kaydedildi!');
  } catch (e: any) {
    if (e.name === 'SyntaxError' || (e.message && e.message.includes('JSON'))) {
      alert('Kaydetme hatası. Lütfen JSON formatını (Örn: [10,5,2]) doğru girdiğinizden emin olun.');
    } else {
      // Report the real failure — never pretend the save succeeded.
      console.error('Save bonus config error:', e);
      const msg = e?.response?.data?.error || e?.message || 'Bilinmeyen hata';
      alert('Ayarlar kaydedilemedi: ' + msg);
    }
  } finally {
    isSaving.value = false;
  }
};

const toggleModule = async (moduleName: string) => {
  config.value[moduleName] = !config.value[moduleName];
  await saveConfig();
};

const closeWeek = async () => {
  showCloseWeekModal.value = true;
};

const performCloseWeek = async () => {
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
    showCloseWeekModal.value = false;
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

const theoreticalMaxPayout = computed(() => {
  if (!config.value) return 0;
  let total = 0;
  
  try {
    if (config.value.isFastStartActive) {
      let fsr = typeof config.value.fastStartRates === 'string' ? JSON.parse(config.value.fastStartRates) : config.value.fastStartRates;
      if (Array.isArray(fsr)) total += fsr.reduce((a, b) => Number(a) + Number(b), 0);
    }
    if (config.value.isUnilevelActive) {
      let ur = typeof config.value.unilevelRates === 'string' ? JSON.parse(config.value.unilevelRates) : config.value.unilevelRates;
      if (Array.isArray(ur)) total += ur.reduce((a, b) => Number(a) + Number(b), 0);
    }
    if (config.value.isOverdriveActive) {
      total += Number(config.value.overdrivePoolPct || 0);
    }
  } catch(e) {
    console.error('JSON parse error for theoretical calculation');
  }
  return total;
});

const isBankruptRisk = computed(() => {
  if (!config.value) return false;
  return theoreticalMaxPayout.value > (config.value.maxPayoutLimitPct || 30);
});

const toggleMlm = async () => {
  const newState = !config.value.isMlmEnabled;
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Oturum bulunamadı. Lütfen /pv-hq-admin adresinden admin olarak giriş yapın.');
    return;
  }
  config.value.isMlmEnabled = newState;
  isSaving.value = true;
  try {
    await axios.put('/api/v1/system/config', { isMlmEnabled: newState }, { headers: { Authorization: `Bearer ${token}` } });
  } catch (e: any) {
    config.value.isMlmEnabled = !newState; // Revert
    const status = e?.response?.status;
    if (status === 401) alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
    else if (status === 403) alert('Bu işlem için admin yetkisi gerekiyor.');
    else alert('MLM durumu değiştirilemedi: ' + (e?.response?.data?.error || e.message));
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
        <h2>⚙️ Bonus Kontrol Merkezi</h2>
        <p class="subtitle">MLM gelir modellerini yönetin ve %30 şirket güvenlik kilidini izleyin.</p>
      </div>
      <button class="btn-danger-solid" @click="closeWeek" :disabled="isSaving">
        🛑 Haftayı Kapat
      </button>
    </div>

    <div v-if="isLoading" class="loading panel">Veriler yükleniyor...</div>

    <div v-else-if="fetchError" class="panel fetch-error-panel">
      <h3>❌ {{ t('bonus.loadError') }}</h3>
      <p class="desc">{{ fetchError }}</p>
      <button class="btn-primary" style="padding: 8px 16px;" @click="fetchConfig">{{ t('bonus.retry') }}</button>
    </div>
    
    <div v-else-if="config && stats" class="admin-panel-grid">

      <!-- ═══ MLM MASTER TOGGLE ═══ -->
      <div class="mlm-master-card panel">
        <div class="mlm-master-row">
          <div>
            <h3>🔌 MLM Motor Durumu</h3>
            <p class="desc">Tüm ağ pazarlama modüllerini (Network, Bonus) tek anahtarla kapatabilirsiniz. E-ticaret, POS ve stok yönetimi etkilenmez.</p>
          </div>
          <button 
            class="mlm-toggle" 
            :class="{ on: config.isMlmEnabled, off: !config.isMlmEnabled }" 
            @click="toggleMlm" 
            :disabled="isSaving">
            <span class="mlm-toggle-track">
              <span class="mlm-toggle-dot"/>
            </span>
            <span class="mlm-toggle-label">{{ config.isMlmEnabled ? 'AKTİF' : 'KAPALI' }}</span>
          </button>
        </div>
        <div v-if="!config.isMlmEnabled" class="mlm-off-notice">
          ⚠️ MLM motoru kapalı. Tüm satışlar standart perakende işlemi olarak kaydedilir. Bonus hesaplanmaz.
        </div>
      </div>
      
      <!-- Security Lock Metric -->
      <div class="metric-card panel limit-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3>Şirket Güvenlik Kilidi (Max Payout)</h3>
            <p class="desc">Dağıtılan toplam primlerin şirket cirosuna oranı. Limit aşılırsa prim dağıtımı durur.</p>
          </div>
          <div class="limit-input">
            <label>Limit (%)</label>
            <input type="number" v-model="config.maxPayoutLimitPct" @change="saveConfig" style="width:70px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.2); color:white; padding:4px 8px; border-radius:4px;" />
          </div>
        </div>
        
        <div v-if="isBankruptRisk && config.isMlmEnabled" class="bankrupt-alert">
          <strong>⚠️ MATEMATİKSEL İFLAS RİSKİ!</strong>
          <br/>
          Seçtiğiniz prim modellerinin toplam teorik dağıtımı (%{{ theoreticalMaxPayout }}) şirket limitini (%{{ config.maxPayoutLimitPct }}) aşıyor! Satışlar arttıkça şirket zarar edecektir. Lütfen prim şalterlerinden bazılarını kapatın.
        </div>

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
            />
          </div>
          <div class="progress-labels">
            <span :style="{ color: progressColor, fontWeight: 'bold' }">%{{ stats.currentPayoutRatio }}</span>
            <span>Limit: %{{ config.maxPayoutLimitPct }}</span>
          </div>
        </div>
      </div>

      <!-- Income Models Toggles (Only relevant when MLM is ON) -->
      <div class="modules-card panel" :class="{ 'disabled-card': !config.isMlmEnabled }">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <h3>Aktif Gelir Modelleri (Şalterler)</h3>
          <button class="btn-primary" style="padding: 6px 12px; font-size:12px;" @click="saveConfig" :disabled="isSaving">💾 Oranları Kaydet</button>
        </div>
        
        <div class="module-item">
          <div class="module-info">
            <h4>1. Referans Primi (Derinlik Oranları)</h4>
            <p>Direkt satışlardan elde edilen anında kazanç modeli. Format: [10, 5, 2]</p>
            <input type="text" class="rate-input" v-model="config.fastStartRates" placeholder="Örn: [10, 5, 2]" />
          </div>
          <button 
            class="toggle-btn" 
            :class="{ active: config.isFastStartActive }"
            @click="toggleModule('isFastStartActive')"
            :disabled="isSaving"
          >
            {{ config.isFastStartActive ? 'AÇIK' : 'KAPALI' }}
          </button>
        </div>

        <div class="module-item">
          <div class="module-info">
            <h4>2. Unilevel Ekip Primi (Derinlik Oranları)</h4>
            <p>Ağın alt katmanlarından gelen hacim bazlı takım primi. Format: [5, 5, 5]</p>
            <input type="text" class="rate-input" v-model="config.unilevelRates" placeholder="Örn: [5, 5, 5, 5, 5]" />
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

        <div class="module-item">
          <div class="module-info">
            <h4>3. Antigravity "Overdrive" Primi (%) 🚀</h4>
            <p>Şirket cirosunun belli bir yüzdesi havuzda birikir.</p>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:14px;">Oran (%):</span>
              <input type="number" class="rate-input-small" v-model="config.overdrivePoolPct" />
            </div>
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

    <!-- Haftayı Kapat Onay Modalı -->
    <ConfirmModal
      :is-open="showCloseWeekModal"
      variant="danger"
      title="Haftayı Kapat — Geri Alınamaz İşlem"
      message="Bu haftalık MLM döngüsünü kapatmak ve puanları bir sonraki haftaya devretmek üzeresiniz. Tüm distribütör hacim verileri sıfırlanacak ve yeni hafta başlayacaktır."
      :details="[
        'Tüm aktif WeeklyCycle kayıtları kapatılır (isClosed=true)',
        'Kullanıcı haftalık hacimleri (PersonalVolume + TeamVolume) bir sonraki haftaya carry-over olarak devredilir',
        'Yeni bir WeeklyCycle (weekNumber+1) otomatik oluşturulur',
        'Bu işlem geri alınamaz — manuel SQL müdahalesi gerekir'
      ]"
      confirm-text="HAFTAYI KAPAT"
      cancel-text="Vazgeç"
      require-text-confirm="KAPAT"
      @cancel="showCloseWeekModal = false"
      @confirm="performCloseWeek"
    />
  </div>
</template>

<style scoped>
.bonus-control-content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.subtitle {
  color: var(--color-text-muted);
  margin-top: 8px;
  font-size: 12px;
}

.btn-danger-solid {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.btn-danger-solid:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}
.btn-danger-solid:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.1);
  color: #a1a1aa;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    inset 2px 2px 5px rgba(255,255,255,0.05),
    inset -2px -2px 5px rgba(0,0,0,0.5),
    0 4px 10px rgba(0,0,0,0.3);
}

.toggle-btn:hover {
  transform: translateY(-2px);
  color: #fff;
  box-shadow: 
    inset 2px 2px 5px rgba(255,255,255,0.1),
    inset -2px -2px 5px rgba(0,0,0,0.5),
    0 6px 15px rgba(0,0,0,0.4);
}

.toggle-btn.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 
    inset 2px 2px 5px rgba(255,255,255,0.3),
    inset -2px -2px 5px rgba(0,0,0,0.2),
    0 4px 15px rgba(16, 185, 129, 0.4);
}
.toggle-btn.active:hover {
  box-shadow: 
    inset 2px 2px 5px rgba(255,255,255,0.4),
    inset -2px -2px 5px rgba(0,0,0,0.2),
    0 6px 20px rgba(16, 185, 129, 0.6);
}


/* ═══ MLM Master Toggle ═══ */
.mlm-master-card { grid-column: 1 / -1; }
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
.bankrupt-alert {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  color: #ffb3b3;
  font-size: 14px;
  line-height: 1.5;
}

.bankrupt-alert strong {
  color: #ef4444;
  font-size: 16px;
}

.fetch-error-panel {
  padding: 24px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.rate-input {
  width: 100%;
  max-width: 200px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  margin-top: 8px;
  font-family: monospace;
}

.rate-input-small {
  width: 60px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
