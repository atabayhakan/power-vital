<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useTranslate } from '../../composables/useTranslate';

const { t } = useTranslate();
const partners = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    if (res.data && res.data.partners) {
      partners.value = res.data.partners.filter((p: any) => p.isActive !== false);
    }
  } catch (err) {
    console.error('Failed to load partners', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="partners-block" v-if="!loading && partners.length > 0">
    <div class="partners-container">
      <h3 class="partners-title">{{ t('partners.title') }}</h3>
      <div class="partners-marquee">
        <div class="marquee-track" :style="{ animationDuration: Math.max(20, partners.length * 5) + 's' }">
          <a v-for="partner in partners" :key="partner.id" :href="partner.link || '#'" target="_blank" rel="noopener noreferrer" class="partner-logo-wrapper">
            <img :src="partner.logoUrl" :alt="partner.name" class="partner-logo" />
          </a>
          <!-- Duplicate for infinite scroll effect -->
          <a v-for="partner in partners" :key="partner.id + '_dup'" :href="partner.link || '#'" target="_blank" rel="noopener noreferrer" class="partner-logo-wrapper" aria-hidden="true">
            <img :src="partner.logoUrl" :alt="partner.name" class="partner-logo" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.partners-block {
  padding: 60px 20px;
  background: transparent;
  overflow: hidden;
}

.partners-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.partners-title {
  font-size: 1.5rem;
  color: var(--text-muted);
  margin-bottom: 40px;
  font-weight: 500;
  letter-spacing: 1px;
}

.partners-marquee {
  width: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
}

.partners-marquee::before,
.partners-marquee::after {
  content: '';
  position: absolute;
  top: 0;
  width: 150px;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}
.partners-marquee::before {
  left: 0;
  background: linear-gradient(to right, var(--color-bg, #0A0A0C), transparent);
}
.partners-marquee::after {
  right: 0;
  background: linear-gradient(to left, var(--color-bg, #0A0A0C), transparent);
}

.marquee-track {
  display: flex;
  align-items: center;
  gap: 80px;
  padding: 0 40px;
  animation: scroll-left 30s linear infinite;
  white-space: nowrap;
}

.partner-logo-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  filter: grayscale(100%) opacity(0.6);
  transition: all 0.3s ease;
  height: 60px;
  flex-shrink: 0;
}

.partner-logo-wrapper:hover {
  filter: grayscale(0%) opacity(1);
  transform: scale(1.05);
}

.partner-logo {
  max-height: 100%;
  max-width: 180px;
  object-fit: contain;
}

@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - 40px)); }
}

/* Light mode overrides */
:global([data-theme="light"]) .partners-marquee::before {
  background: linear-gradient(to right, #F9F6F1, transparent);
}
:global([data-theme="light"]) .partners-marquee::after {
  background: linear-gradient(to left, #F9F6F1, transparent);
}

@media (max-width: 768px) {
  .marquee-track { gap: 40px; padding: 0 20px; }
  .partner-logo { max-width: 120px; height: 40px; }
  .partners-marquee::before, .partners-marquee::after { width: 60px; }
}
</style>
