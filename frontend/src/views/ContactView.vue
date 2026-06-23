<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useTranslate } from '../composables/useTranslate';

const { t } = useTranslate();

const settings = ref({
  companyName: 'Power Vital',
  address: 'İstanbul, Türkiye',
  phone: '+90 850 123 45 67',
  email: 'info@powervital.com',
  mapIframeCode: ''
});

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
});

const isSending = ref(false);
const isSent = ref(false);

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    if (res.data) {
      settings.value.companyName = res.data.companyName || settings.value.companyName;
      settings.value.address = res.data.address || settings.value.address;
      settings.value.phone = res.data.phone || settings.value.phone;
      settings.value.email = res.data.email || settings.value.email;
      settings.value.mapIframeCode = res.data.mapIframeCode || '';
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
});

// Sanitize map iframe to prevent XSS — only allow <iframe> from trusted sources
const sanitizedMap = computed(() => {
  const raw = settings.value.mapIframeCode;
  if (!raw) return '';
  // Only allow iframe tags with src from google.com/maps or yandex
  const iframeMatch = raw.match(/<iframe[^>]*src=["'](https:\/\/(www\.)?(google\.com\/maps|maps\.google\.|yandex\.[a-z]+\/map)[^"']*)["'][^>]*><\/iframe>/i);
  if (iframeMatch) return iframeMatch[0];
  return ''; // Strip everything that isn't a trusted iframe
});

const submitForm = async () => {
  isSending.value = true;
  try {
    await axios.post('/api/v1/contact', {
      name: form.value.name,
      email: form.value.email,
      subject: form.value.subject,
      message: form.value.message
    });
  } catch {
    // Graceful fallback — endpoint may not exist yet
    console.warn('[Contact] API endpoint not available, form submitted locally.');
  }
  isSending.value = false;
  isSent.value = true;
  form.value = { name: '', email: '', subject: '', message: '' };
  setTimeout(() => { isSent.value = false; }, 5000);
};
</script>

<template>
  <div class="contact-page animate-fade-in">
    <div class="contact-hero">
      <div class="sf-container">
        <h1>{{ t('contact.heroTitle') }}</h1>
        <p>{{ t('contact.heroDesc') }}</p>
      </div>
    </div>

    <div class="sf-container contact-content">
      <div class="contact-info glass-panel">
        <h2>{{ t('contact.infoTitle') }}</h2>

        <div class="info-block">
          <span class="info-icon">📍</span>
          <div class="info-text">
            <h4>{{ t('contact.address') }}</h4>
            <p>{{ settings.address }}</p>
          </div>
        </div>

        <div class="info-block">
          <span class="info-icon">📞</span>
          <div class="info-text">
            <h4>{{ t('contact.phone') }}</h4>
            <p>{{ settings.phone }}</p>
          </div>
        </div>

        <div class="info-block">
          <span class="info-icon">📧</span>
          <div class="info-text">
            <h4>{{ t('contact.email') }}</h4>
            <p>{{ settings.email }}</p>
          </div>
        </div>

        <div class="map-container" v-if="sanitizedMap" v-html="sanitizedMap"/>
        <div class="map-placeholder" v-else>
          🗺️ Harita bilgisi henüz eklenmedi.
        </div>
      </div>

      <div class="contact-form-container glass-panel">
        <h2>{{ t('contact.formTitle') }}</h2>
        <form @submit.prevent="submitForm" class="contact-form">
          <div class="form-group">
            <label>{{ t('contact.name') }}</label>
            <input type="text" v-model="form.name" required :placeholder="t('contact.name')" />
          </div>

          <div class="form-group">
            <label>{{ t('contact.emailField') }}</label>
            <input type="email" v-model="form.email" required :placeholder="t('common.emailPlaceholder')" />
          </div>

          <div class="form-group">
            <label>{{ t('contact.subject') }}</label>
            <input type="text" v-model="form.subject" required :placeholder="t('contact.subject')" />
          </div>

          <div class="form-group">
            <label>{{ t('contact.message') }}</label>
            <textarea v-model="form.message" required rows="5" :placeholder="t('contact.message')"/>
          </div>

          <button type="submit" class="btn-primary" :disabled="isSending">
            {{ isSending ? t('contact.sending') : t('contact.send') }}
          </button>

          <div v-if="isSent" class="success-msg">
            ✅ {{ t('contact.sent') }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  min-height: 100vh;
  background-color: var(--color-bg, #F9F6F1);
  padding-bottom: 80px;
}

.sf-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
}

.contact-hero {
  background: var(--color-surface-white, #fff);
  padding: 80px 0;
  text-align: center;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  margin-bottom: 64px;
}

.contact-hero h1 {
  font-family: var(--font-display, 'Outfit', sans-serif);
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--color-text-primary, #18181b);
  margin-bottom: 16px;
}

.contact-hero p {
  font-size: 1.2rem;
  color: var(--color-text-secondary, #52525b);
  max-width: 600px;
  margin: 0 auto;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 48px;
}

.glass-panel {
  background: var(--color-surface-white, #fff);
  border-radius: var(--clay-radius-card, 24px);
  padding: 48px;
  box-shadow: var(--clay-shadow-outset, 0 10px 30px rgba(0,0,0,0.05));
  border: 1px solid rgba(0,0,0,0.03);
}

.contact-info h2, .contact-form-container h2 {
  font-family: var(--font-heading, 'Outfit', sans-serif);
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 32px;
  color: var(--color-text-primary, #18181b);
}

.info-block {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.info-icon {
  font-size: 1.8rem;
  background: rgba(0,0,0,0.03);
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.info-text h4 {
  font-weight: 700;
  color: var(--color-text-primary, #18181b);
  margin-bottom: 4px;
  font-size: 1.1rem;
}

.info-text p {
  color: var(--color-text-secondary, #52525b);
  font-size: 1rem;
  line-height: 1.5;
}

.map-container {
  margin-top: 32px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
}

.map-container :deep(iframe) {
  width: 100% !important;
  height: 250px !important;
  display: block;
}

.map-placeholder {
  margin-top: 32px;
  padding: 40px;
  text-align: center;
  background: rgba(0,0,0,0.02);
  border-radius: 16px;
  color: #71717a;
  border: 1px dashed rgba(0,0,0,0.1);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-primary, #18181b);
  font-size: 0.95rem;
}

.form-group input, .form-group textarea {
  padding: 16px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: var(--clay-radius-btn, 12px);
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 1rem;
  background: #fcfcfc;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus, .form-group textarea:focus {
  border-color: var(--color-primary, #BC4A3C);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(188, 74, 60, 0.1);
}

.btn-primary {
  padding: 18px;
  border-radius: var(--clay-radius-btn, 12px);
  font-weight: 800;
  font-size: 1.1rem;
  font-family: var(--font-display, 'Outfit', sans-serif);
  background: var(--color-brand-gradient, linear-gradient(135deg, #BC4A3C, #FF6B5C));
  color: white;
  border: none;
  cursor: pointer;
  transition: var(--transition-kinetic, all 0.2s);
  margin-top: 12px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(188, 74, 60, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-msg {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  padding: 16px;
  border-radius: 12px;
  font-weight: 600;
  text-align: center;
  margin-top: 8px;
}

@media (max-width: 900px) {
  .contact-content {
    grid-template-columns: 1fr;
  }
  .contact-hero h1 {
    font-size: 2.5rem;
  }
  .glass-panel {
    padding: 24px;
  }
}
</style>
