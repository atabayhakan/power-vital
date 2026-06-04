<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface Settings { companyName: string; address: string | null; phone: string | null; email: string | null; mapIframeCode: string | null; }

const settings = ref<Settings>({ companyName: 'Power Vital', address: 'Bişkek, Kırgızistan', phone: '+996 312 123 456', email: 'info@powervital.kg', mapIframeCode: null });
const form = ref({ name: '', email: '', message: '' });
const sent = ref(false);
const sending = ref(false);

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    if (res.data) settings.value = res.data;
  } catch {}
});

const submitForm = async () => {
  if (!form.value.name || !form.value.email || !form.value.message) return;
  sending.value = true;
  await new Promise(r => setTimeout(r, 800));
  sent.value = true;
  sending.value = false;
};

// ═══ XSS Protection — only allow <iframe> tags ═══
const sanitizedMapHtml = computed(() => {
  const raw = settings.value.mapIframeCode;
  if (!raw) return '';
  // Extract only <iframe> tags, strip everything else
  const iframeMatch = raw.match(/<iframe[^>]*src=["'][^"']*["'][^>]*><\/iframe>/i);
  return iframeMatch ? iframeMatch[0] : '';
});
</script>

<template>
<div class="cp">
  <!-- Nav -->
  <nav class="cp-nav">
    <div class="wrap cp-nav-row">
      <router-link to="/" class="cp-brand">Power<span>Vital</span></router-link>
      <div class="cp-links">
        <router-link to="/">Ana Sayfa</router-link>
        <router-link to="/about">Hakkımızda</router-link>
        <router-link to="/contact" class="active">İletişim</router-link>
      </div>
    </div>
  </nav>

  <main class="wrap cp-main">
    <div class="cp-hero">
      <h1>İletişim</h1>
      <p>Sorularınız, önerileriniz veya iş birliği teklifleriniz için bize ulaşın.</p>
    </div>

    <div class="cp-grid">
      <!-- Form Card -->
      <div class="cp-card">
        <h2>Bize Yazın</h2>
        <form v-if="!sent" @submit.prevent="submitForm" class="cp-form">
          <div class="cp-field"><label>Adınız Soyadınız</label><input v-model="form.name" required placeholder="Örn: Aydos Toktogulov" /></div>
          <div class="cp-field"><label>E-posta Adresiniz</label><input v-model="form.email" type="email" required placeholder="ornek@email.com" /></div>
          <div class="cp-field"><label>Mesajınız</label><textarea v-model="form.message" required rows="5" placeholder="Mesajınızı buraya yazabilirsiniz..."></textarea></div>
          <button type="submit" class="cp-send" :disabled="sending">{{ sending ? 'Gönderiliyor...' : 'Mesajı Gönder →' }}</button>
        </form>
        <div v-else class="cp-success">
          <div class="cp-success-icon">✅</div>
          <h3>Mesajınız İletildi!</h3>
          <p>En kısa sürede size dönüş yapacağız. Teşekkür ederiz.</p>
        </div>
      </div>

      <!-- Info Card -->
      <div class="cp-card cp-info">
        <h2>İletişim Bilgileri</h2>
        <div class="cp-info-item" v-if="settings.address">
          <span class="cp-info-ico">📍</span>
          <div><b>Adres</b><p>{{ settings.address }}</p></div>
        </div>
        <div class="cp-info-item" v-if="settings.phone">
          <span class="cp-info-ico">📞</span>
          <div><b>Telefon</b><p>{{ settings.phone }}</p></div>
        </div>
        <div class="cp-info-item" v-if="settings.email">
          <span class="cp-info-ico">✉️</span>
          <div><b>E-posta</b><p>{{ settings.email }}</p></div>
        </div>
        <div class="cp-hours">
          <b>Çalışma Saatleri</b>
          <p>Pazartesi – Cuma: 09:00 – 18:00</p>
          <p>Cumartesi: 10:00 – 15:00</p>
        </div>
      </div>
    </div>

    <!-- Map -->
    <div class="cp-map" v-if="sanitizedMapHtml">
      <h2>Konumumuz</h2>
      <div class="cp-map-frame" v-html="sanitizedMapHtml"></div>
    </div>
  </main>

  <footer class="cp-footer">
    <div class="wrap">&copy; 2026 Power Vital. Tüm hakları saklıdır.</div>
  </footer>
</div>
</template>

<style scoped>
.cp {
  min-height: 100vh; width: 100vw; background: #fff;
  font-family: 'Inter', system-ui, sans-serif; color: #18181b;
  overflow-y: auto; line-height: 1.55;
}
.wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* Nav */
.cp-nav { border-bottom: 1px solid #eaeaec; background: #fff; position: sticky; top: 0; z-index: 100; }
.cp-nav-row { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.cp-brand { text-decoration: none; font-size: 20px; font-weight: 800; color: #18181b; }
.cp-brand span { color: #16a34a; }
.cp-links { display: flex; gap: 22px; }
.cp-links a { text-decoration: none; color: #52525b; font-size: 14px; font-weight: 500; transition: color .15s; }
.cp-links .active { color: #18181b; font-weight: 600; }

.cp-main { padding: 40px 20px 60px; }
.cp-hero { text-align: center; margin-bottom: 40px; }
.cp-hero h1 { font-size: 30px; font-weight: 700; margin-bottom: 8px; }
.cp-hero p { color: #52525b; font-size: 15px; }

.cp-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; margin-bottom: 40px; }
.cp-card { padding: 28px; border: 1px solid #eaeaec; border-radius: 10px; }
.cp-card h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
.cp-form { display: flex; flex-direction: column; gap: 14px; }
.cp-field { display: flex; flex-direction: column; gap: 5px; }
.cp-field label { font-size: 13px; font-weight: 600; color: #52525b; }
.cp-field input, .cp-field textarea {
  padding: 11px 14px; border: 1px solid #ddd; border-radius: 8px;
  font-size: 14px; outline: none; transition: border .2s; font-family: inherit;
  background: #fafafa;
}
.cp-field input:focus, .cp-field textarea:focus { border-color: #16a34a; background: #fff; }
.cp-send {
  padding: 13px; background: #18181b; color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background .2s;
}
.cp-send:hover { background: #16a34a; }
.cp-send:disabled { opacity: .5; cursor: not-allowed; }

.cp-success { text-align: center; padding: 36px 0; }
.cp-success-icon { font-size: 44px; margin-bottom: 12px; }
.cp-success h3 { font-size: 20px; margin-bottom: 6px; }
.cp-success p { color: #52525b; font-size: 14px; }

.cp-info-item { display: flex; gap: 12px; margin-bottom: 18px; }
.cp-info-ico { font-size: 22px; }
.cp-info-item b { font-size: 13px; display: block; margin-bottom: 2px; }
.cp-info-item p { font-size: 13px; color: #52525b; margin: 0; }
.cp-hours { margin-top: 24px; padding-top: 18px; border-top: 1px solid #eaeaec; }
.cp-hours b { font-size: 13px; display: block; margin-bottom: 6px; }
.cp-hours p { font-size: 13px; color: #52525b; margin: 0 0 2px; }

.cp-map { margin-bottom: 40px; }
.cp-map h2 { font-size: 18px; font-weight: 700; margin-bottom: 14px; }
.cp-map-frame { border-radius: 10px; overflow: hidden; border: 1px solid #eaeaec; }
.cp-map-frame :deep(iframe) { width: 100% !important; min-height: 380px; display: block; border: 0; }

.cp-footer { border-top: 1px solid #eaeaec; padding: 18px 0; text-align: center; font-size: 12px; color: #a1a1aa; }

@media(max-width:768px) {
  .cp-grid { grid-template-columns: 1fr; }
  .cp-links { display: none; }
}
</style>
