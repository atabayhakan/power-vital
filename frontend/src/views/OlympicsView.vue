<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import axios from 'axios';

const leaderboard = ref<any[]>([]);
const isLoading = ref(true);

const fetchLeaderboard = async () => {
  try {
    const res = await axios.get('/api/v1/system/leaderboard');
    leaderboard.value = res.data;
  } catch (e) {
    console.error('Failed to fetch leaderboard:', e);
    // Demo data for showcase if backend is offline or resetting
    leaderboard.value = [
        { userId: '1', name: 'Nurlan B.', role: 'distributor', score: 15400, pv: 400, gv: 15000, carry: 0 },
        { userId: '2', name: 'Almaz K.', role: 'dealer', score: 12200, pv: 1200, gv: 11000, carry: 0 },
        { userId: '3', name: 'Aigerim T.', role: 'distributor', score: 9800, pv: 800, gv: 9000, carry: 0 },
        { userId: '4', name: 'Talgat Y.', role: 'distributor', score: 4500, pv: 500, gv: 4000, carry: 0 },
    ];
  } finally {
    isLoading.value = false;
  }
};

// Calculate maximum score for dynamic width scaling
const maxScore = computed(() => {
  if (leaderboard.value.length === 0) return 100;
  return Math.max(...leaderboard.value.map(user => user.score), 100);
});

let intervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchLeaderboard();
  
  // Refresh leaderboard every 10 seconds to simulate a live race
  intervalId = setInterval(fetchLeaderboard, 10000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});
</script>

<template>
  <div class="olympics-content animate-fade-in">
    <div class="header-row">
      <div class="title-area">
        <h2>Olimpiyat Koşusu 🏆</h2>
        <p class="subtitle">Bu haftanın en çok satış (Kişisel + Ekip) üreten şampiyonları canlı yarışıyor!</p>
      </div>
      <div class="live-badge">🔴 CANLI</div>
    </div>

    <div v-if="isLoading" class="loading glass-panel">Yarış pisti hazırlanıyor...</div>
    
    <div v-else class="track-container glass-panel">
      <!-- Racing Track -->
      <div class="racing-track">
        <div 
          v-for="(runner, index) in leaderboard" 
          :key="runner.userId" 
          class="runner-lane"
        >
          <!-- Ranking Position -->
          <div class="rank-badge" :class="`rank-${index + 1}`">
            {{ index + 1 }}
          </div>

          <!-- Runner Info & Bar -->
          <div class="runner-progress">
            <div class="runner-info">
              <span class="name">{{ runner.name }} <span class="role">({{ runner.role }})</span></span>
              <span class="score text-gradient">{{ runner.score }} Puan</span>
            </div>
            
            <!-- Animated Progress Bar -->
            <div class="bar-bg">
              <div 
                class="bar-fill" 
                :class="`fill-${index + 1}`"
                :style="{ width: `${(runner.score / maxScore) * 100}%` }"
              >
                <!-- Runner Avatar running on the edge of the bar -->
                <div class="runner-avatar">🚀</div>
              </div>
            </div>
            
            <div class="score-details">
              Kişisel: {{ runner.pv }} | Ekip: {{ runner.gv }} | Devreden: {{ runner.carry }}
            </div>
          </div>
        </div>
        
        <div v-if="leaderboard.length === 0" class="empty-state">
          Henüz kimse piste çıkmadı! İlk satışı yaparak liderliğe yerleş.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.olympics-content {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtitle {
  color: var(--color-text-muted);
  margin-top: 8px;
}

.live-badge {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #ef4444;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: bold;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.track-container {
  padding: 40px;
}

.racing-track {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.runner-lane {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.rank-1 { background: #fbbf24; color: #000; box-shadow: 0 0 15px rgba(251, 191, 36, 0.5); } /* Gold */
.rank-2 { background: #9ca3af; color: #fff; } /* Silver */
.rank-3 { background: #b45309; color: #fff; } /* Bronze */

.runner-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.runner-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.name {
  font-size: 18px;
  font-weight: 600;
}

.role {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: normal;
}

.score {
  font-size: 20px;
  font-weight: bold;
}

.bar-bg {
  height: 24px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.05);
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 12px;
  position: relative;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.fill-1 { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.fill-2 { background: linear-gradient(90deg, #6b7280, #9ca3af); }
.fill-3 { background: linear-gradient(90deg, #9a3412, #c2410c); }
.fill-4, .fill-5 { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }

.runner-avatar {
  position: absolute;
  right: -10px;
  top: -6px;
  font-size: 24px;
  filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));
}

.score-details {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
