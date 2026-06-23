<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useTranslate } from '../../composables/useTranslate';

const { t } = useTranslate();

interface Certificate {
  id: string;
  icon: string;
  title: string;
  desc: string;
  isActive: boolean;
}

const certificates = ref<Certificate[]>([]);

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    const badges: Certificate[] = res.data?.trustBadges || [];
    certificates.value = badges.filter(b => b.isActive !== false);
  } catch {
    certificates.value = [
      { id: '1', icon: 'https://cdn-icons-png.flaticon.com/128/1055/1055646.png', title: 'ISO 9001', desc: 'Kalite Yönetim Sistemi', isActive: true },
      { id: '2', icon: 'https://cdn-icons-png.flaticon.com/128/1055/1055644.png', title: 'Helal Sertifikası', desc: 'Helal Gıda Sertifikası', isActive: true },
      { id: '3', icon: 'https://cdn-icons-png.flaticon.com/128/1055/1055666.png', title: 'FDA Onaylı', desc: 'ABD Gıda ve İlaç Dairesi', isActive: true },
    ];
  }
});
</script>

<template>
  <section class="certificates-section">
    <div class="certificates-container">
      <div class="certificates-header">
        <h2 class="certificates-title">{{ t('certificates.title') }}</h2>
        <p class="certificates-subtitle">{{ t('certificates.subtitle') }}</p>
      </div>
      <div class="certificates-grid">
        <div v-for="cert in certificates" :key="cert.id" class="certificate-card clay-surface">
          <div class="certificate-icon-wrap clay-inset">
            <img v-if="cert.icon && (cert.icon.startsWith('http') || cert.icon.startsWith('/'))"
                 :src="cert.icon" :alt="cert.title" class="certificate-icon" />
            <span v-else class="certificate-icon-fallback">{{ cert.icon || '📜' }}</span>
          </div>
          <div class="certificate-info">
            <h3 class="certificate-name">{{ cert.title }}</h3>
            <p v-if="cert.desc" class="certificate-desc">{{ cert.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.certificates-section {
  padding: 64px 24px;
  background: var(--surface-page, #F9F6F1);
}

.certificates-container {
  max-width: 1280px;
  margin: 0 auto;
}

.certificates-header {
  text-align: center;
  margin-bottom: 48px;
}

.certificates-title {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 900;
  color: var(--text-primary, #18181b);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.certificates-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary, #52525b);
  margin: 0;
  font-weight: 500;
}

.certificates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.certificate-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  border-radius: 20px;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
}

.certificate-card:hover {
  transform: translateY(-4px) scale(1.01);
}

.certificate-icon-wrap {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.certificate-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.certificate-icon-fallback {
  font-size: 2rem;
}

.certificate-info {
  flex: 1;
  min-width: 0;
}

.certificate-name {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary, #18181b);
  margin: 0 0 4px 0;
}

.certificate-desc {
  font-size: 0.9rem;
  color: var(--text-secondary, #52525b);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .certificates-section { padding: 40px 16px; }
  .certificates-grid { grid-template-columns: 1fr; }
  .certificate-card { padding: 16px; }
  .certificate-icon-wrap { width: 56px; height: 56px; }
  .certificate-icon { width: 36px; height: 36px; }
}
</style>
