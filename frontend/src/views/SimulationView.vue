<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

// --- Inputs / Sliders ---
const totalRevenue = ref(100000); // USD
const fastStartMix = ref(40); // % of totalRevenue that comes from new signups (Fast Start)
const unilevelMix = computed(() => 100 - fastStartMix.value); // Remaining % is Unilevel

// Toggles
const isSecurityLockActive = ref(true);
const maxPayoutLimitPct = ref(30);

const isFastStartActive = ref(true);
const isUnilevelActive = ref(true);
const isOverdriveActive = ref(true);

// Dynamic Rates
const fastStartRates = ref([10, 5, 2]); // e.g. Depth 1: 10%, Depth 2: 5%, Depth 3: 2%
const unilevelRates = ref([5, 5, 5, 5, 5]); // e.g. Depths 1-5
const overdrivePoolPct = ref(5); // Global Pool %

// --- Calculations ---

// Simulated Fast Start Payout
const fastStartRevenue = computed(() => (totalRevenue.value * fastStartMix.value) / 100);
const fastStartEffectiveRate = computed(() => {
  // If everyone hit all 3 depths perfectly, we pay out sum of rates.
  // In a simulation, we assume max theoretical payout for safety.
  return fastStartRates.value.reduce((acc, val) => acc + Number(val), 0);
});
const fastStartPayout = computed(() => isFastStartActive.value ? (fastStartRevenue.value * fastStartEffectiveRate.value) / 100 : 0);

// Simulated Unilevel Payout
const unilevelRevenue = computed(() => (totalRevenue.value * unilevelMix.value) / 100);
const unilevelEffectiveRate = computed(() => {
  return unilevelRates.value.reduce((acc, val) => acc + Number(val), 0);
});
const unilevelPayout = computed(() => isUnilevelActive.value ? (unilevelRevenue.value * unilevelEffectiveRate.value) / 100 : 0);

// Simulated Overdrive Pool Payout
const overdrivePayout = computed(() => isOverdriveActive.value ? (totalRevenue.value * Number(overdrivePoolPct.value)) / 100 : 0);

// Total Payout Before Lock
const totalCalculatedPayout = computed(() => fastStartPayout.value + unilevelPayout.value + overdrivePayout.value);
const payoutPercentage = computed(() => (totalCalculatedPayout.value / totalRevenue.value) * 100);

// Lock logic
const isLockBreached = computed(() => payoutPercentage.value > maxPayoutLimitPct.value);
const finalPayout = computed(() => {
  if (isSecurityLockActive.value && isLockBreached.value) {
    return (totalRevenue.value * maxPayoutLimitPct.value) / 100;
  }
  return totalCalculatedPayout.value;
});

const companyProfit = computed(() => totalRevenue.value - finalPayout.value);

// --- Pie Chart (Conic Gradient) ---
const chartGradient = computed(() => {
  if (totalCalculatedPayout.value === 0) return 'conic-gradient(#333 0 100%)';
  
  const fsPct = (fastStartPayout.value / totalCalculatedPayout.value) * 100;
  const unPct = (unilevelPayout.value / totalCalculatedPayout.value) * 100;
  
  return `conic-gradient(
    #ef4444 0% ${fsPct}%, 
    #3b82f6 ${fsPct}% ${fsPct + unPct}%, 
    #eab308 ${fsPct + unPct}% 100%
  )`;
});

const isApplying = ref(false);
const saveConfig = async () => {
  if (!confirm('Bu simülasyon ayarlarını CANLI sisteme uygulamak istediğinize emin misiniz? Gerçek bonus hesaplamaları bu değerleri kullanacaktır.')) {
    return;
  }
  isApplying.value = true;
  try {
    await axios.put('/api/v1/system/config', {
      isFastStartActive: isFastStartActive.value,
      fastStartRates: JSON.stringify(fastStartRates.value),
      isUnilevelActive: isUnilevelActive.value,
      unilevelRates: JSON.stringify(unilevelRates.value),
      isOverdriveActive: isOverdriveActive.value,
      overdrivePoolPct: Number(overdrivePoolPct.value),
      maxPayoutLimitPct: Number(maxPayoutLimitPct.value)
    }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    alert('✅ Ayarlar canlı sisteme başarıyla uygulandı.');
  } catch (e: any) {
    console.error('Apply config error:', e);
    const msg = e?.response?.data?.error || e?.message || 'Bilinmeyen hata';
    alert('❌ Ayarlar uygulanamadı: ' + msg);
  } finally {
    isApplying.value = false;
  }
};

const closeWeek = async () => {
  try {
    const res = await axios.post('/api/v1/system/close-week', {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    alert(`✅ Başarılı: ${res.data.message}`);
  } catch (e: any) {
    if (e.response) {
      alert(`❌ Hata: ${e.response.data.error}`);
    } else {
      alert('Bağlantı hatası: Backend çalışmıyor olabilir.');
    }
  }
};

</script>

<template>
  <div class="simulation-content animate-fade-in">
    <div class="header-row">
      <div>
        <h2>What-If Simülasyon Kum Havuzu</h2>
        <p class="subtitle">Canlı sistemi etkilemeden gelir modellerinin şirket kârlılığına etkisini test edin.</p>
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="btn-danger" @click="closeWeek" style="background:#ef4444; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">Hafta Kapanışı Yap 🔒</button>
        <button class="btn-primary" @click="saveConfig">Geçerli Ayarları Canlıya Al</button>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="isLockBreached && !isSecurityLockActive" class="alert danger">
      <strong>⚠️ TEHLİKE:</strong> Dağıtım oranı (%{{ payoutPercentage.toFixed(1) }}) şirket tavan sınırını aştı! Güvenlik kilidi kapalı olduğu için şirket zarar edebilir.
    </div>
    <div v-if="isLockBreached && isSecurityLockActive" class="alert warning">
      <strong>🛡️ GÜVENLİK DEVREDE:</strong> Dağıtım oranı (%{{ payoutPercentage.toFixed(1) }}) aşımı tespit edildi. Sistem ödemeleri otomatik olarak %{{ maxPayoutLimitPct }} tavanına tıraşlayacak.
    </div>

    <div class="dashboard-grid">
      <!-- Controls -->
      <div class="controls-panel glass-panel">
        <h3>Senaryo Girdileri</h3>
        
        <div class="control-group">
          <label>Aylık Beklenen Ciro: <strong>${{ totalRevenue.toLocaleString() }}</strong></label>
          <input type="range" v-model.number="totalRevenue" min="10000" max="1000000" step="10000" class="slider" />
        </div>

        <div class="control-group">
          <label>Ciro Kaynağı (Yeni Kayıt vs Tekrar Sipariş)</label>
          <div class="split-bar">
            <span class="fs-label">Yeni (Hızlı B.): %{{ fastStartMix }}</span>
            <span class="un-label">Tekrar (Unilevel): %{{ unilevelMix }}</span>
          </div>
          <input type="range" v-model.number="fastStartMix" min="0" max="100" step="5" class="slider" />
        </div>

        <hr />
        <h3>Sistem Şalterleri ve Oranlar</h3>

        <div class="toggle-row">
          <label class="switch-label">
            <input type="checkbox" v-model="isSecurityLockActive" />
            <span class="switch-text">%{{ maxPayoutLimitPct }} Güvenlik Kilidi</span>
          </label>
          <input type="number" v-model.number="maxPayoutLimitPct" class="small-input" min="10" max="50" v-if="isSecurityLockActive"/>
        </div>

        <!-- Fast Start Settings -->
        <div class="config-block">
          <div class="toggle-row">
            <label class="switch-label">
              <input type="checkbox" v-model="isFastStartActive" />
              <span class="switch-text">Hızlı Başlangıç (Fast Start)</span>
            </label>
          </div>
          <div v-if="isFastStartActive" class="rates-inputs">
            <div v-for="(_, idx) in fastStartRates" :key="'fs'+idx" class="rate-box">
              <small>{{ idx + 1 }}. Derinlik</small>
              <input type="number" v-model.number="fastStartRates[idx]" min="0" max="100" />
            </div>
            <button class="btn-text" @click="fastStartRates.push(0)">+ Derinlik</button>
          </div>
        </div>

        <!-- Unilevel Settings -->
        <div class="config-block">
          <div class="toggle-row">
            <label class="switch-label">
              <input type="checkbox" v-model="isUnilevelActive" />
              <span class="switch-text">Aktiflik (Unilevel)</span>
            </label>
          </div>
          <div v-if="isUnilevelActive" class="rates-inputs">
            <div v-for="(_, idx) in unilevelRates" :key="'un'+idx" class="rate-box">
              <small>{{ idx + 1 }}. Derinlik</small>
              <input type="number" v-model.number="unilevelRates[idx]" min="0" max="100" />
            </div>
            <button class="btn-text" @click="unilevelRates.push(0)">+ Derinlik</button>
          </div>
        </div>

        <!-- Overdrive Settings -->
        <div class="config-block">
          <div class="toggle-row">
            <label class="switch-label">
              <input type="checkbox" v-model="isOverdriveActive" />
              <span class="switch-text">Küresel Havuz (Overdrive)</span>
            </label>
            <div v-if="isOverdriveActive" style="display:flex; gap:8px; align-items:center;">
              <small>Oran %</small>
              <input type="number" v-model.number="overdrivePoolPct" class="small-input" min="0" max="100" />
            </div>
          </div>
        </div>

      </div>

      <!-- Results -->
      <div class="results-panel glass-panel">
        <h3>Finansal Çıktılar</h3>
        
        <div class="big-stats">
          <div class="stat-box">
            <p>Dağıtılan Toplam Prim</p>
            <h2 class="text-gradient">${{ finalPayout.toLocaleString() }}</h2>
            <small>Cironun %{{ ((finalPayout / totalRevenue) * 100).toFixed(1) }}'i</small>
          </div>
          <div class="stat-box profit">
            <p>Şirket Kasasında Kalan (Brüt)</p>
            <h2>${{ companyProfit.toLocaleString() }}</h2>
            <small>Cironun %{{ ((companyProfit / totalRevenue) * 100).toFixed(1) }}'i</small>
          </div>
        </div>

        <div class="chart-section">
          <div class="pie-chart" :style="{ background: chartGradient }"/>
          <div class="legend">
            <div class="legend-item"><span class="dot" style="background:#ef4444;"/> Hızlı Başlangıç (${{ fastStartPayout.toLocaleString() }})</div>
            <div class="legend-item"><span class="dot" style="background:#3b82f6;"/> Unilevel (${{ unilevelPayout.toLocaleString() }})</div>
            <div class="legend-item"><span class="dot" style="background:#eab308;"/> Overdrive Havuzu (${{ overdrivePayout.toLocaleString() }})</div>
            <div class="legend-item" v-if="isSecurityLockActive && isLockBreached">
               <span class="dot" style="background:#999;"/> <em>Tıraşlanan Miktar (${{ (totalCalculatedPayout - finalPayout).toLocaleString() }})</em>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simulation-content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #fff;
  /* 🛡️ Scroll fix — admin layout (App.vue) is 100vh flex with overflow:hidden
     on .main-content. Without our own scroll container the long simulation
     page (network graph + sliders) gets clipped at the bottom. */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert {
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
}
.alert.danger {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  color: #fca5a5;
}
.alert.warning {
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid #eab308;
  color: #fde047;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.controls-panel, .results-panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

hr {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin: 10px 0;
}

h3 {
  font-size: 18px;
  color: var(--color-primary);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider {
  width: 100%;
  accent-color: var(--color-primary);
}

.split-bar {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #ccc;
  margin-bottom: -4px;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.small-input {
  width: 60px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

.config-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
}

.rates-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.rate-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.rate-box input {
  width: 50px;
  text-align: center;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  border-radius: 4px;
  padding: 4px;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px;
}

/* Results Side */
.big-stats {
  display: flex;
  gap: 16px;
}

.stat-box {
  flex: 1;
  background: rgba(0,0,0,0.3);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}
.stat-box.profit {
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.stat-box.profit h2 {
  color: #22c55e;
}

.chart-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  margin-top: 24px;
}

.pie-chart {
  width: 250px;
  height: 250px;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  transition: background 0.3s ease;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .sim-header { flex-direction: column; gap: 12px; align-items: stretch; }
}
</style>
