<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const activeTab = ref('general');

const settings = ref({ 
  companyName: '', address: '', phone: '', email: '', mapIframeCode: '', logoUrl: '',
  topbarShippingMsg: '', topbarPhone: '',
  trustBadges: [] as any[],
  partners: [] as any[],
  footerLinks: [] as any[],
  copyrightText: ''
});

const loading = ref(false);
const saved = ref(false);
const uploading = ref(false);

const sanitizedMapPreview = computed(() => {
  const raw = settings.value.mapIframeCode;
  if (!raw) return '';
  const m = raw.match(/<iframe[^>]*src=["'][^"']*["'][^>]*><\/iframe>/i);
  return m ? m[0] : '';
});

const token = () => localStorage.getItem('token') || '';
const headers = () => ({ Authorization: `Bearer ${token()}` });

const fetchSettings = async () => {
  try {
    const res = await axios.get('/api/v1/settings', { headers: headers() });
    settings.value = {
      companyName: res.data.companyName || '',
      address: res.data.address || '',
      phone: res.data.phone || '',
      email: res.data.email || '',
      mapIframeCode: res.data.mapIframeCode || '',
      logoUrl: res.data.logoUrl || '',
      topbarShippingMsg: res.data.topbarShippingMsg || '',
      topbarPhone: res.data.topbarPhone || '',
      trustBadges: res.data.trustBadges || [],
      partners: res.data.partners || [],
      footerLinks: res.data.footerLinks || [],
      copyrightText: res.data.copyrightText || ''
    };
    
    // Default fallback if empty
    if (settings.value.trustBadges.length === 0) {
      settings.value.trustBadges = [
        { id: 1, icon: '🚚', title: 'Hızlı Kargo', desc: '1-3 iş günü teslimat', isActive: true },
        { id: 2, icon: '🔒', title: 'Güvenli Ödeme', desc: '256-bit SSL koruması', isActive: true }
      ];
    }
  } catch {}
};

const saveSettings = async () => {
  loading.value = true;
  saved.value = false;
  try {
    await axios.put('/api/v1/settings', settings.value, { headers: headers() });
    saved.value = true;
    setTimeout(() => { saved.value = false; }, 3000);
  } catch (e: any) { alert('Hata: ' + (e.response?.data?.error || e.message)); }
  loading.value = false;
};

const uploadLogo = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', input.files[0]);
    const res = await axios.post('/api/v1/upload', fd, {
      headers: { ...headers(), 'Content-Type': 'multipart/form-data' }
    });
    settings.value.logoUrl = res.data.url;
  } catch (e: any) { alert('Yükleme hatası: ' + (e.response?.data?.error || e.message)); }
  uploading.value = false;
};

// CRUD Helpers
const addTrustBadge = () => settings.value.trustBadges.push({ id: Date.now(), icon: '🏷️', title: 'Yeni Özellik', desc: 'Açıklama', isActive: true });
const removeTrustBadge = (i: number) => settings.value.trustBadges.splice(i, 1);

const addPartner = () => settings.value.partners.push({ id: Date.now(), logoUrl: '', name: 'Partner', link: '', isActive: true });
const removePartner = (i: number) => settings.value.partners.splice(i, 1);

const addFooterLink = () => settings.value.footerLinks.push({ id: Date.now(), title: 'Yeni Link', url: '/', section: 'Genel' });
const removeFooterLink = (i: number) => settings.value.footerLinks.splice(i, 1);

onMounted(fetchSettings);
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="topbar"><h2>🏢 Site & İletişim Ayarları</h2></header>

    <div class="tabs">
      <button :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">Genel Ayarlar</button>
      <button :class="{ active: activeTab === 'topbar' }" @click="activeTab = 'topbar'">Üst Çubuk (Topbar)</button>
      <button :class="{ active: activeTab === 'trust' }" @click="activeTab = 'trust'">Güven Rozetleri</button>
      <button :class="{ active: activeTab === 'partners' }" @click="activeTab = 'partners'">Partnerler</button>
      <button :class="{ active: activeTab === 'footer' }" @click="activeTab = 'footer'">Alt Bilgi (Footer)</button>
    </div>

    <div class="settings-card glass-panel">
      <form @submit.prevent="saveSettings" class="settings-form">
        
        <!-- GENERAL SETTINGS -->
        <div v-show="activeTab === 'general'">
          <div class="form-section">
            <h3>🖼️ Site Logosu</h3>
            <p class="help-text">Logo yüklediğinizde navbar ve footer'da otomatik görüntülenir.</p>
            <div class="logo-row">
              <div class="logo-preview" v-if="settings.logoUrl"><img :src="settings.logoUrl" alt="Logo" /></div>
              <div class="logo-placeholder" v-else>Logo yüklenmemiş</div>
              <div class="logo-actions">
                <label class="upload-btn">{{ uploading ? '⏳ Yükleniyor...' : '📤 Logo Yükle' }}
                  <input type="file" accept="image/*" @change="uploadLogo" :disabled="uploading" hidden />
                </label>
                <button type="button" v-if="settings.logoUrl" class="clear-btn" @click="settings.logoUrl = ''">✕ Kaldır</button>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Şirket Bilgileri</h3>
            <div class="form-row">
              <div class="field"><label>Şirket Adı</label><input v-model="settings.companyName" /></div>
              <div class="field"><label>E-posta</label><input v-model="settings.email" type="email" /></div>
            </div>
            <div class="form-row">
              <div class="field"><label>Telefon</label><input v-model="settings.phone" placeholder="+996 312 123 456" /></div>
              <div class="field"><label>Adres</label><input v-model="settings.address" /></div>
            </div>
          </div>

          <div class="form-section">
            <h3>Harita Embed Kodu</h3>
            <p class="help-text">Google Maps veya Yandex Maps iframe kodunu yapıştırın.</p>
            <textarea v-model="settings.mapIframeCode" rows="3"></textarea>
            <div class="map-preview" v-if="sanitizedMapPreview" v-html="sanitizedMapPreview"></div>
          </div>
        </div>

        <!-- TOPBAR -->
        <div v-show="activeTab === 'topbar'">
          <div class="form-section">
            <h3>Üst Çubuk (Topbar)</h3>
            <p class="help-text">Sitenin en üstündeki şerit.</p>
            <div class="form-row">
              <div class="field"><label>Kargo Kampanya Mesajı</label><input v-model="settings.topbarShippingMsg" /></div>
              <div class="field"><label>İletişim Numarası</label><input v-model="settings.topbarPhone" /></div>
            </div>
          </div>
        </div>

        <!-- TRUST BADGES -->
        <div v-show="activeTab === 'trust'">
          <div class="form-section">
            <h3>Güven Rozetleri</h3>
            <p class="help-text">Ana sayfa ürün listesinin altındaki bar.</p>
            <div v-for="(badge, i) in settings.trustBadges" :key="badge.id" class="dynamic-row">
              <input v-model="badge.icon" class="w-small" placeholder="İkon (Emoji/Text)" />
              <input v-model="badge.title" placeholder="Başlık" />
              <input v-model="badge.desc" placeholder="Açıklama" />
              <label class="toggle"><input type="checkbox" v-model="badge.isActive"> Aktif</label>
              <button type="button" @click="removeTrustBadge(i)" class="btn-del">🗑️</button>
            </div>
            <button type="button" class="btn-add" @click="addTrustBadge">+ Rozet Ekle</button>
          </div>
        </div>

        <!-- PARTNERS -->
        <div v-show="activeTab === 'partners'">
          <div class="form-section">
            <h3>Çok Kanallı Entegre Operasyon Ağı</h3>
            <p class="help-text">Partner/Pazaryeri ikonları.</p>
            <div v-for="(partner, i) in settings.partners" :key="partner.id" class="dynamic-row">
              <input v-model="partner.name" class="w-medium" placeholder="Partner Adı" />
              <input v-model="partner.link" placeholder="Tıklama Linki (İsteğe bağlı)" />
              <input v-model="partner.logoUrl" placeholder="Logo Resim URL'si" />
              <label class="toggle"><input type="checkbox" v-model="partner.isActive"> Aktif</label>
              <button type="button" @click="removePartner(i)" class="btn-del">🗑️</button>
            </div>
            <button type="button" class="btn-add" @click="addPartner">+ Partner Ekle</button>
          </div>
        </div>

        <!-- FOOTER -->
        <div v-show="activeTab === 'footer'">
          <div class="form-section">
            <h3>Alt Bilgi (Footer)</h3>
            <div class="form-row">
              <div class="field">
                <label>Telif Hakkı Metni (Copyright)</label>
                <input v-model="settings.copyrightText" />
              </div>
            </div>
            <h4 style="margin-top:20px;">Hızlı Linkler</h4>
            <div v-for="(link, i) in settings.footerLinks" :key="link.id" class="dynamic-row">
              <input v-model="link.title" placeholder="Link Metni" />
              <input v-model="link.url" placeholder="URL (/about vb.)" />
              <button type="button" @click="removeFooterLink(i)" class="btn-del">🗑️</button>
            </div>
            <button type="button" class="btn-add" @click="addFooterLink">+ Link Ekle</button>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Kaydediliyor...' : '💾 Kaydet' }}</button>
          <span v-if="saved" class="saved-msg">✅ Ayarlar başarıyla kaydedildi!</span>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.admin-page { flex: 1; padding: 32px; overflow-y: auto; }
.topbar { margin-bottom: 24px; }
.topbar h2 { font-size: 24px; font-weight: 700; }

.tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,.1); padding-bottom: 12px; overflow-x: auto; }
.tabs button { background: none; border: none; color: var(--color-text-muted); padding: 8px 16px; cursor: pointer; font-weight: 600; border-radius: 6px; transition: .2s; white-space: nowrap; }
.tabs button:hover { background: rgba(255,255,255,.05); }
.tabs button.active { background: rgba(255,255,255,.1); color: var(--color-text-main); }

.settings-card { padding: 28px; }
.settings-form { display: flex; flex-direction: column; gap: 28px; }
.form-section h3 { font-size: 16px; margin-bottom: 14px; color: var(--color-text-main); }
.form-row { display: flex; gap: 16px; margin-bottom: 12px; }
.field { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 600; color: var(--color-text-muted); }
.field input { padding: 10px 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; color: var(--color-text-main); font-size: 14px; outline: none; }
.field input:focus { border-color: var(--color-primary); }
.help-text { font-size: 12px; color: var(--color-text-muted); margin-bottom: 10px; }
textarea { width: 100%; padding: 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; color: var(--color-text-main); font-size: 13px; font-family: monospace; outline: none; resize: vertical; }

/* Dynamic Rows */
.dynamic-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; background: rgba(0,0,0,.2); padding: 12px; border-radius: 8px; }
.dynamic-row input { flex: 1; padding: 8px 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 6px; color: #fff; font-size: 13px; outline: none; }
.dynamic-row .w-small { flex: 0 0 100px; }
.dynamic-row .w-medium { flex: 0 0 150px; }
.btn-del { background: rgba(245,54,92,.1); border: 1px solid rgba(245,54,92,.3); border-radius: 6px; cursor: pointer; padding: 8px 12px; font-size: 14px; transition: .2s; }
.btn-del:hover { background: rgba(245,54,92,.2); }
.btn-add { background: rgba(255,255,255,.05); border: 1px dashed rgba(255,255,255,.2); color: var(--color-text-main); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: .2s; margin-top: 4px; }
.btn-add:hover { background: rgba(255,255,255,.1); }

.toggle { font-size: 13px; color: #ccc; display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0 8px; }

/* Logo */
.logo-row { display: flex; align-items: center; gap: 20px; }
.logo-preview img { height: 50px; border-radius: 6px; background: rgba(255,255,255,.1); padding: 6px; }
.logo-placeholder { padding: 16px 24px; background: rgba(255,255,255,.03); border: 1px dashed rgba(255,255,255,.15); border-radius: 8px; font-size: 13px; color: var(--color-text-muted); }
.logo-actions { display: flex; gap: 10px; align-items: center; }
.upload-btn { padding: 8px 18px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
.clear-btn { padding: 6px 14px; background: rgba(245,54,92,.15); color: #f5365c; border: 1px solid rgba(245,54,92,.3); border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; }

.map-preview { margin-top: 10px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); }
.map-preview :deep(iframe) { width: 100% !important; min-height: 200px; display: block; }
.form-actions { display: flex; align-items: center; gap: 16px; margin-top: 16px; }
.btn-primary { padding: 12px 28px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.saved-msg { color: var(--color-accent-success); font-size: 14px; font-weight: 600; }
</style>
