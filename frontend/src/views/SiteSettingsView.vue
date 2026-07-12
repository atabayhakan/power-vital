<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import MediaSelectorModal from '../components/MediaSelectorModal.vue';
import CountdownPreview from '../components/admin/CountdownPreview.vue';
import { buildSafeMapIframe } from '../utils/safeMapEmbed';

const activeTab = ref('general');
const isMediaModalOpen = ref(false);
const activeTargetField = ref<{ type: string, index?: number } | null>(null);

const settings = ref({
  companyName: '', address: '', phone: '', email: '', mapIframeCode: '', logoUrl: '',
  logoScale: 1,
  topbarShippingMsg: '', topbarPhone: '',
  trustBadges: [] as any[],
  partners: [] as any[],
  footerLinks: {
    description: 'Sağlık ve enerjinin yeni adresi. Doğadan gelen mucize formüllerle bağışıklığınızı güçlendirin.',
    socials: [
      { id: '1', icon: '📷', url: '#' },
      { id: '2', icon: '🐦', url: '#' },
      { id: '3', icon: '📘', url: '#' }
    ],
    columns: [
      { id: '1', title: 'Hızlı Menü', links: [] },
      { id: '2', title: 'Sözleşmeler', links: [] }
    ]
  } as any,
  faqItems: [] as any[],
  copyrightText: '',
  // Hero campaign banner — admin schedules a countdown that
  // appears at the top of the storefront. `endsAt` is a full
  // ISO-8601 string so the input[type=datetime-local] can read
  // it back directly. `enabled` toggles visibility.
  campaignEnabled: false,
  campaignEndsAt: '' as string | null,
  campaignTitle: '',
  campaignCta: '',
  campaignLink: '/katalog',
  translations: {} as Record<string, any>
});

const loading = ref(false);
const saved = ref(false);

// Admin-side preview of the embed. Uses the same safe builder as the public
// storefront so what the admin previews is exactly what visitors get.
const sanitizedMapPreview = computed(() => buildSafeMapIframe(settings.value.mapIframeCode));

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
      logoScale: typeof res.data.logoScale === 'number' ? res.data.logoScale : 1,
      topbarShippingMsg: res.data.topbarShippingMsg || '',
      topbarPhone: res.data.topbarPhone || '',
      trustBadges: res.data.trustBadges || [],
      partners: (res.data.partners || []).map((p: any, idx: number) => {
        if (typeof p === 'string') {
          return { id: Date.now().toString() + idx, logoUrl: p, name: 'Partner', link: '', isActive: true };
        }
        return p;
      }),
      footerLinks: {
        description: 'Sağlık ve enerjinin yeni adresi. Doğadan gelen mucize formüllerle bağışıklığınızı güçlendirin.',
        socials: [
          { id: '1', icon: '📷', url: '#' },
          { id: '2', icon: '🐦', url: '#' },
          { id: '3', icon: '📘', url: '#' }
        ],
        columns: [
          { id: '1', title: 'Hızlı Menü', links: [] },
          { id: '2', title: 'Sözleşmeler', links: [] }
        ]
      },
      faqItems: Array.isArray(res.data.faqItems) ? res.data.faqItems : [],
      copyrightText: res.data.copyrightText || '',
      campaignEnabled: !!res.data.campaignEnabled,
      campaignEndsAt: res.data.campaignEndsAt
        ? new Date(res.data.campaignEndsAt).toISOString().slice(0, 16)
        : '',
      campaignTitle: res.data.campaignTitle || '',
      campaignCta: res.data.campaignCta || '',
      campaignLink: res.data.campaignLink || '/katalog',
      translations: (typeof res.data.translations === 'string' ? JSON.parse(res.data.translations) : res.data.translations) || {}
    };

    let parsedFooter = res.data.footerLinks;
    if (typeof parsedFooter === 'string') parsedFooter = JSON.parse(parsedFooter);

    if (Array.isArray(parsedFooter)) {
      settings.value.footerLinks.columns[0].links = parsedFooter;
    } else if (parsedFooter && typeof parsedFooter === 'object' && parsedFooter.columns) {
      settings.value.footerLinks = parsedFooter;
    }
    
    // Default fallback if empty
    if (settings.value.trustBadges.length === 0) {
      settings.value.trustBadges = [
        { id: '1', icon: '🚚', title: 'Hızlı Kargo', desc: '1-3 iş günü teslimat', isActive: true },
        { id: '2', icon: '🔒', title: 'Güvenli Ödeme', desc: '256-bit SSL koruması', isActive: true }
      ];
    }
    if (settings.value.faqItems.length === 0) {
      settings.value.faqItems = [
        { id: '1', q: 'Kargo kaç günde ulaşır?', a: 'Siparişleriniz genellikle 1-3 iş günü içerisinde kargoya teslim edilmektedir.' },
        { id: '2', q: 'İade koşulları nelerdir?', a: 'Kullanılmamış ürünleri 14 gün içerisinde iade edebilirsiniz.' },
        { id: '3', q: 'Sadakat seviyesi nasıl artar?', a: 'Toplam harcama tutarınız arttıkça seviyeniz ve kalıcı indirim oranınız otomatik olarak yükselir.' }
      ];
    }
  } catch {
    const local = localStorage.getItem('pv_settings');
    if (local) {
      settings.value = JSON.parse(local);
    } else {
      if (settings.value.trustBadges.length === 0) {
        settings.value.trustBadges = [
          { id: '1', icon: '🚚', title: 'Hızlı Kargo', desc: '1-3 iş günü teslimat', isActive: true },
          { id: '2', icon: '🔒', title: 'Güvenli Ödeme', desc: '256-bit SSL koruması', isActive: true }
        ];
      }
    }
  }
};

const saveSettings = async () => {
  loading.value = true;
  saved.value = false;
  try {
    // The HTML datetime-local input gives us "2026-12-31T23:59"
    // (no seconds, no timezone). The backend Zod schema expects
    // an ISO-8601 string with timezone offset, so we coerce here.
    const payload: any = { ...settings.value };
    if (payload.campaignEndsAt) {
      // Append seconds + a UTC offset so the server can parse it
      // unambiguously regardless of the admin's local timezone.
      payload.campaignEndsAt = new Date(payload.campaignEndsAt).toISOString();
    } else {
      payload.campaignEndsAt = null;
    }
    await axios.put('/api/v1/settings', payload, { headers: headers() });
    saved.value = true;
    setTimeout(() => { saved.value = false; }, 3000);
  } catch (e: any) {
    // Report the real failure — never pretend the save succeeded.
    console.error('Save settings error:', e);
    const msg = e?.response?.data?.error || e?.message || 'Bilinmeyen hata';
    alert('Ayarlar kaydedilemedi: ' + msg);
  }
  loading.value = false;
};

// Settings translations (companyName, address, topbar message, copyright) are
// generated automatically server-side on save + continuous TranslationSweeper.
// No manual translate action needed.

// CRUD Helpers
const openMediaSelector = (type: string, index?: number) => {
  activeTargetField.value = { type, index };
  isMediaModalOpen.value = true;
};

const handleMediaSelect = (url: string) => {
  if (!activeTargetField.value) return;
  const { type, index } = activeTargetField.value;

  if (type === 'logo') settings.value.logoUrl = url;
  else if (type === 'trustBadge' && index !== undefined) settings.value.trustBadges[index].icon = url;
  else if (type === 'partner' && index !== undefined) settings.value.partners[index].logoUrl = url;
  else if (type === 'social' && index !== undefined) settings.value.footerLinks.socials[index].icon = url;

  activeTargetField.value = null;
};

const addTrustBadge = () => settings.value.trustBadges.push({ id: Date.now().toString(), icon: '', title: 'Yeni Özellik', desc: 'Açıklama', isActive: true });
const removeTrustBadge = (i: number) => settings.value.trustBadges.splice(i, 1);

const addPartner = () => settings.value.partners.push({ id: Date.now().toString(), logoUrl: '', name: 'Partner', link: '', isActive: true });
const removePartner = (i: number) => settings.value.partners.splice(i, 1);

const addSocial = () => settings.value.footerLinks.socials.push({ id: Date.now().toString(), icon: '🔗', url: '#' });
const removeSocial = (i: number) => settings.value.footerLinks.socials.splice(i, 1);

const addFaq = () => settings.value.faqItems.push({ id: Date.now().toString(), q: 'Yeni Soru', a: 'Cevap' });
const removeFaq = (i: number) => settings.value.faqItems.splice(i, 1);
const moveFaq = (i: number, dir: number) => {
  const arr = settings.value.faqItems; const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

const addFooterCol = () => settings.value.footerLinks.columns.push({ id: Date.now().toString(), title: 'Yeni Sütun', links: [] });
const removeFooterCol = (i: number) => settings.value.footerLinks.columns.splice(i, 1);

const addFooterLink = (colIndex: number) => settings.value.footerLinks.columns[colIndex].links.push({ id: Date.now().toString(), title: 'Yeni Link', url: '/' });
const removeFooterLink = (colIndex: number, linkIndex: number) => settings.value.footerLinks.columns[colIndex].links.splice(linkIndex, 1);

onMounted(fetchSettings);
</script>

<template>
  <div class="admin-page animate-fade-in">
    <header class="topbar">
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <h2>🏢 Site & İletişim Ayarları</h2>
        <span style="font-size: 0.8rem; color: #6B7280; font-weight: 500;">🌐 Çeviriler otomatik oluşturulur (RU/KG)</span>
      </div>
    </header>

    <div class="tabs">
      <button :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">Genel Ayarlar</button>
      <button :class="{ active: activeTab === 'topbar' }" @click="activeTab = 'topbar'">Üst Çubuk (Topbar)</button>
      <button :class="{ active: activeTab === 'campaign' }" @click="activeTab = 'campaign'">🔥 Kampanya Sayacı</button>
      <button :class="{ active: activeTab === 'trust' }" @click="activeTab = 'trust'">Güven Rozetleri</button>
      <button :class="{ active: activeTab === 'certificates' }" @click="activeTab = 'certificates'">Sertifikalar</button>
      <button :class="{ active: activeTab === 'partners' }" @click="activeTab = 'partners'">Partnerler</button>
      <button :class="{ active: activeTab === 'faq' }" @click="activeTab = 'faq'">Sıkça Sorulan Sorular</button>
      <button :class="{ active: activeTab === 'footer' }" @click="activeTab = 'footer'">Alt Bilgi (Footer)</button>
    </div>

    <div class="settings-card panel">
      <form @submit.prevent="saveSettings" class="settings-form">
        
        <!-- GENERAL SETTINGS -->
        <div v-show="activeTab === 'general'">
          <div class="form-section">
            <h3>🖼️ Site Logosu</h3>
            <p class="help-text">Logo yüklediğinizde navbar ve footer'da otomatik görüntülenir.</p>
            <div class="logo-row">
              <div class="logo-preview" v-if="settings.logoUrl">
                <img :src="settings.logoUrl" alt="Logo" :style="{ maxHeight: (44 * settings.logoScale) + 'px' }" />
              </div>
              <div class="logo-placeholder" v-else>Logo yüklenmemiş</div>
              <div class="logo-actions">
                <button type="button" class="upload-btn" @click="openMediaSelector('logo')">🖼️ Medya Kütüphanesinden Seç</button>
                <button type="button" v-if="settings.logoUrl" class="clear-btn" @click="settings.logoUrl = ''">✕ Kaldır</button>
              </div>
            </div>

            <!-- Logo boyutu (ölçek) — sadece bir logo yüklüyken göster -->
            <div class="logo-scale-row" v-if="settings.logoUrl">
              <label class="logo-scale-label">
                Logo Boyutu
                <span class="logo-scale-value">{{ Math.round(settings.logoScale * 100) }}%</span>
              </label>
              <div class="logo-scale-controls">
                <input
                  type="range" min="0.5" max="2" step="0.05"
                  v-model.number="settings.logoScale"
                  class="logo-scale-slider"
                />
                <button type="button" class="logo-scale-reset" @click="settings.logoScale = 1" title="Varsayılana dön">↺ %100</button>
              </div>
              <p class="help-text">Navbar ve footer'daki logo boyutunu ölçekler (%50–%200). Değişiklik kaydettikten sonra sitede uygulanır.</p>
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
            <textarea v-model="settings.mapIframeCode" rows="3"/>
            <div class="map-preview" v-if="sanitizedMapPreview" v-html="sanitizedMapPreview"/>
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

        <!-- HERO CAMPAIGN BANNER -->
        <div v-show="activeTab === 'campaign'">
          <div class="form-section">
            <h3>🔥 Hero Kampanya Sayacı</h3>
            <p class="help-text">
              Ana sayfanın en üstünde görünen kırmızı şerit — geri sayım
              + başlık + CTA butonu. Kampanya bittiğinde otomatik
              gizlenir (süre sonu geçtiğinde banner'ı tekrar açmak
              için yeni bir bitiş tarihi girin).
            </p>

            <label class="toggle toggle--big">
              <input type="checkbox" v-model="settings.campaignEnabled" />
              <span>🎯 Banner'ı aktifleştir</span>
            </label>

            <div class="form-row" style="margin-top: 16px;">
              <div class="field">
                <label>Bitiş Tarihi & Saati</label>
                <input v-model="settings.campaignEndsAt" type="datetime-local" :disabled="!settings.campaignEnabled" />
                <small class="help-text">Yerel saat diliminde. Sunucu UTC'ye çevirir.</small>
              </div>
              <div class="field">
                <label>Bağlantı (CTA tıklaması)</label>
                <input v-model="settings.campaignLink" placeholder="/katalog" :disabled="!settings.campaignEnabled" />
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label>Başlık (TR)</label>
                <input v-model="settings.campaignTitle" placeholder="Yaz kampanyası bitimine" :disabled="!settings.campaignEnabled" />
                <small class="help-text">RU/KG/EN çevirileri otomatik oluşturulur (TranslationSweeper).</small>
              </div>
              <div class="field">
                <label>CTA Buton Metni (TR)</label>
                <input v-model="settings.campaignCta" placeholder="Satın Al" :disabled="!settings.campaignEnabled" />
              </div>
            </div>

            <div v-if="settings.campaignEnabled && settings.campaignEndsAt" class="campaign-preview">
              <h4 style="margin-bottom: 10px; font-size: 13px; color: var(--color-text-muted);">CANLI ÖNİZLEME</h4>
              <CountdownPreview
                :ends-at="settings.campaignEndsAt"
                :title="settings.campaignTitle"
                :cta="settings.campaignCta"
              />
            </div>
          </div>
        </div>

        <!-- TRUST BADGES -->
        <div v-show="activeTab === 'trust'">
          <div class="form-section">
            <h3>Güven Rozetleri</h3>
            <p class="help-text">Ana sayfa ürün listesinin altındaki bar.</p>
            <div v-for="(badge, i) in settings.trustBadges" :key="badge.id" class="dynamic-row">
              <button type="button" @click="openMediaSelector('trustBadge', Number(i))" class="btn-media">🖼️ Medya Seç</button>
              <input v-model="badge.icon" class="w-small" placeholder="İkon URL / Text" />
              <input v-model="badge.title" placeholder="Başlık" />
              <input v-model="badge.desc" placeholder="Açıklama" />
              <label class="toggle"><input type="checkbox" v-model="badge.isActive"/> Aktif</label>
              <button type="button" @click="removeTrustBadge(Number(i))" class="btn-del">🗑️</button>
            </div>
            <button type="button" class="btn-add" @click="addTrustBadge">+ Rozet Ekle</button>
          </div>
        </div>

        <!-- SERTIFIKALAR -->
        <div v-show="activeTab === 'certificates'">
          <div class="form-section">
            <h3>📜 Sertifikalar</h3>
            <p class="help-text">Ana sayfada görüntülenecek sertifika logoları ve isimleri. Sertifika görseli için medya kütüphanesinden .png/.webp yükleyin.</p>
            <div v-for="(badge, i) in settings.trustBadges" :key="badge.id" class="dynamic-row">
              <button type="button" @click="openMediaSelector('trustBadge', Number(i))" class="btn-media">🖼️ Logo Seç</button>
              <input v-model="badge.icon" placeholder="Logo URL" />
              <input v-model="badge.title" placeholder="Sertifika Adı" />
              <input v-model="badge.desc" placeholder="Açıklama (opsiyonel)" />
              <label class="toggle"><input type="checkbox" v-model="badge.isActive"/> Aktif</label>
              <button type="button" @click="removeTrustBadge(Number(i))" class="btn-del">🗑️</button>
            </div>
            <button type="button" class="btn-add" @click="addTrustBadge">+ Sertifika Ekle</button>
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
              <button type="button" @click="openMediaSelector('partner', Number(i))" class="btn-media">🖼️ Logo Seç</button>
              <input v-model="partner.logoUrl" placeholder="Logo Resim URL'si" />
              <label class="toggle"><input type="checkbox" v-model="partner.isActive"/> Aktif</label>
              <button type="button" @click="removePartner(Number(i))" class="btn-del">🗑️</button>
            </div>
            <button type="button" class="btn-add" @click="addPartner">+ Partner Ekle</button>
          </div>
        </div>

        <!-- FAQ (SSS) -->
        <div v-show="activeTab === 'faq'">
          <div class="form-section">
            <h3>❓ Sıkça Sorulan Sorular</h3>
            <p class="help-text">Müşteri Destek sayfasında görünen S.S.S. listesini buradan yönetin. Sıralamak için okları kullanın.</p>
            <div v-for="(faq, i) in settings.faqItems" :key="faq.id" class="faq-edit-row">
              <div class="faq-edit-order">
                <button type="button" class="btn-ord" :disabled="i === 0" @click="moveFaq(Number(i), -1)" title="Yukarı">▲</button>
                <span class="faq-num">{{ Number(i) + 1 }}</span>
                <button type="button" class="btn-ord" :disabled="i === settings.faqItems.length - 1" @click="moveFaq(Number(i), 1)" title="Aşağı">▼</button>
              </div>
              <div class="faq-edit-fields">
                <input v-model="faq.q" placeholder="Soru (örn: Kargo kaç günde ulaşır?)" />
                <textarea v-model="faq.a" rows="2" placeholder="Cevap"/>
              </div>
              <button type="button" @click="removeFaq(Number(i))" class="btn-del" title="Sil">🗑️</button>
            </div>
            <div v-if="settings.faqItems.length === 0" class="help-text" style="padding: 12px 0;">Henüz soru eklenmemiş.</div>
            <button type="button" class="btn-add" @click="addFaq">+ Soru Ekle</button>
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
            <div class="form-row">
              <div class="field">
                <label>Marka Altı Açıklama</label>
                <textarea v-model="settings.footerLinks.description" rows="3"/>
              </div>
            </div>

            <h4 style="margin-top:20px; color:var(--color-primary);">Sosyal Medya Logoları/İkonları</h4>
            <div v-for="(social, i) in settings.footerLinks.socials" :key="social.id" class="dynamic-row">
              <button type="button" @click="openMediaSelector('social', Number(i))" class="btn-media">🖼️ İkon Seç</button>
              <input v-model="social.icon" class="w-small" placeholder="İkon URL" />
              <input v-model="social.url" placeholder="Profil URL'si" />
              <button type="button" @click="removeSocial(Number(i))" class="btn-del">🗑️</button>
            </div>
            <button type="button" class="btn-add" @click="addSocial">+ Sosyal Medya Ekle</button>

            <h4 style="margin-top:40px; color:var(--color-primary); border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">Menü Sütunları</h4>
            <div v-for="(col, colIdx) in settings.footerLinks.columns" :key="col.id" style="background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; margin-top:16px; border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <input v-model="col.title" placeholder="Sütun Başlığı" style="background:transparent; border:none; color:#fff; font-size:16px; font-weight:bold; border-bottom:1px dashed rgba(255,255,255,0.3); padding-bottom:4px; outline:none;" />
                <button type="button" @click="removeFooterCol(Number(colIdx))" class="btn-del" style="padding:4px 8px;">🗑️ Sütunu Sil</button>
              </div>
              
              <div v-for="(link, linkIdx) in col.links" :key="link.id" class="dynamic-row" style="background:rgba(0,0,0,0.3);">
                <input v-model="link.title" placeholder="Link Metni" />
                <input v-model="link.url" placeholder="URL (/about vb.)" />
                <button type="button" @click="removeFooterLink(Number(colIdx), Number(linkIdx))" class="btn-del">✕</button>
              </div>
              <button type="button" class="btn-add" @click="addFooterLink(Number(colIdx))">+ Link Ekle</button>
            </div>
            <button type="button" class="btn-add" style="margin-top:16px; background:rgba(255,255,255,0.1);" @click="addFooterCol">+ Yeni Sütun Ekle</button>

          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Kaydediliyor...' : '💾 Kaydet' }}</button>
          <span v-if="saved" class="saved-msg">✅ Ayarlar başarıyla kaydedildi!</span>
        </div>
      </form>
    </div>

    <!-- Media Selector Modal -->
    <Teleport to="body">
      <MediaSelectorModal 
        :is-open="isMediaModalOpen" 
        @close="isMediaModalOpen = false" 
        @select="handleMediaSelect" 
      />
    </Teleport>
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
.dynamic-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; background: var(--surface-card, rgba(0,0,0,.02)); padding: 12px; border-radius: 8px; border: 1px solid var(--surface-inset, rgba(0,0,0,0.05)); }
.dynamic-row input { flex: 1; padding: 8px 12px; background: var(--surface-page, rgba(255,255,255,.9)); border: 1px solid var(--surface-inset, rgba(0,0,0,.1)); border-radius: 6px; color: var(--text-primary, #333); font-size: 13px; outline: none; }
.dynamic-row .w-small { flex: 0 0 100px; }
.dynamic-row .w-medium { flex: 0 0 150px; }
.btn-del { background: rgba(245,54,92,.1); border: 1px solid rgba(245,54,92,.3); color: #f5365c; border-radius: 6px; cursor: pointer; padding: 8px 12px; font-size: 14px; transition: .2s; }
.btn-del:hover { background: rgba(245,54,92,.2); }
.btn-media { background: rgba(0, 150, 255, 0.1); border: 1px solid rgba(0, 150, 255, 0.3); color: #007bff; border-radius: 6px; cursor: pointer; padding: 8px 12px; font-size: 13px; font-weight: 600; white-space: nowrap; transition: .2s; }
.btn-media:hover { background: rgba(0, 150, 255, 0.2); }
.btn-add { background: var(--surface-card, rgba(0,0,0,.02)); border: 1px dashed var(--surface-inset, rgba(0,0,0,.2)); color: var(--text-primary, #333); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: .2s; margin-top: 4px; }
.btn-add:hover { background: var(--surface-inset, rgba(0,0,0,.05)); }

/* FAQ editor rows */
.faq-edit-row { display: flex; gap: 12px; margin-bottom: 12px; align-items: stretch; background: var(--surface-card, rgba(0,0,0,.02)); padding: 12px; border-radius: 8px; border: 1px solid var(--surface-inset, rgba(0,0,0,0.05)); }
.faq-edit-order { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0; }
.faq-num { font-size: 12px; font-weight: 700; color: var(--text-secondary, #666); }
.btn-ord { background: var(--surface-page, rgba(255,255,255,.9)); border: 1px solid var(--surface-inset, rgba(0,0,0,.1)); color: var(--text-secondary, #666); border-radius: 5px; width: 26px; height: 22px; cursor: pointer; font-size: 10px; line-height: 1; transition: .2s; }
.btn-ord:hover:not(:disabled) { background: var(--surface-inset, rgba(0,0,0,.06)); color: var(--text-primary, #333); }
.btn-ord:disabled { opacity: 0.35; cursor: not-allowed; }
.faq-edit-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.faq-edit-fields input, .faq-edit-fields textarea { width: 100%; padding: 8px 12px; background: var(--surface-page, rgba(255,255,255,.9)); border: 1px solid var(--surface-inset, rgba(0,0,0,.1)); border-radius: 6px; color: var(--text-primary, #333); font-size: 13px; outline: none; font-family: inherit; box-sizing: border-box; resize: vertical; }
.faq-edit-fields input { font-weight: 600; }

.toggle { font-size: 13px; color: var(--text-secondary, #666); display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0 8px; }
.toggle--big {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-main, #fff);
  background: rgba(188, 74, 60, 0.10);
  border: 1px solid rgba(188, 74, 60, 0.30);
  padding: 12px 16px;
  border-radius: 10px;
  margin: 12px 0;
  display: inline-flex;
}
.toggle--big input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--pv-red, #BC4A3C);
  cursor: pointer;
}

.campaign-preview {
  margin-top: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px dashed rgba(255, 255, 255, 0.10);
  border-radius: 12px;
}
.campaign-preview h4 {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-muted, #999);
  margin: 0 0 10px 0;
}

/* Logo */
.logo-row { display: flex; align-items: center; gap: 20px; }
.logo-preview img { height: auto; max-height: 50px; width: auto; border-radius: 6px; background: rgba(0,0,0,.03); padding: 6px; transition: max-height .15s ease; }

/* Logo boyutu (ölçek) kontrolü */
.logo-scale-row { margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.06); max-width: 460px; }
.logo-scale-label { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; }
.logo-scale-value { font-variant-numeric: tabular-nums; color: var(--color-primary); font-weight: 700; }
.logo-scale-controls { display: flex; align-items: center; gap: 12px; }
.logo-scale-slider { flex: 1; accent-color: var(--color-primary); height: 4px; cursor: pointer; }
.logo-scale-reset { flex-shrink: 0; padding: 6px 10px; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); background: var(--surface-inset); border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; cursor: pointer; }
.logo-scale-reset:hover { color: var(--color-primary); }
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
