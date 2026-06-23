<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useTranslation } from '../composables/useTranslation';
import { useTranslate } from '../composables/useTranslate';

const { tField } = useTranslation();
const { t } = useTranslate();

const settings = ref({
  companyName: 'Power Vital',
  logoUrl: '',
  address: 'İstanbul, Türkiye',
  phone: '+90 850 123 45 67',
  email: 'info@powervital.com',
  copyrightText: '© 2026 Power Vital. Tüm hakları saklıdır.',
  footerLinks: {
    description: 'Sağlık ve enerjinin yeni adresi. Doğadan gelen mucize formüllerle bağışıklığınızı güçlendirin.',
    socials: [
      { id: 1, icon: '📷', url: '#', name: 'Instagram' },
      { id: 2, icon: '🐦', url: '#', name: 'Twitter' },
      { id: 3, icon: '📘', url: '#', name: 'Facebook' },
      { id: 4, icon: '🎵', url: '#', name: 'TikTok' }
    ],
    columns: [
      {
        id: 1, title: 'Hızlı Menü', links: [
          { title: 'Ana Sayfa', url: '/' },
          { title: 'Katalog', url: '/katalog' },
          { title: 'İletişim', url: '/iletisim' },
          { title: 'Hakkımızda', url: '/about' }
        ]
      },
      {
        id: 2, title: 'Sözleşmeler', links: [
          { title: 'Gizlilik Politikası', url: '/gizlilik' },
          { title: 'Kullanım Koşulları', url: '/kullanim' },
          { title: 'Mesafeli Satış', url: '/mesafeli-satis' },
          { title: 'İade Koşulları', url: '/iade' }
        ]
      }
    ]
  } as any,
  translations: {} as Record<string, any>
});

const newsletterEmail = ref('');
const newsletterStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');

const subscribeNewsletter = async () => {
  if (!newsletterEmail.value.includes('@')) {
    newsletterStatus.value = 'error';
    return;
  }
  newsletterStatus.value = 'loading';
  // Mock: gerçek backend endpoint'i burada
  setTimeout(() => {
    newsletterStatus.value = 'success';
    newsletterEmail.value = '';
    setTimeout(() => { newsletterStatus.value = 'idle'; }, 3000);
  }, 800);
};

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    if (res.data) {
      settings.value.companyName = res.data.companyName || settings.value.companyName;
      settings.value.logoUrl = res.data.logoUrl || '';
      settings.value.address = res.data.address || settings.value.address;
      settings.value.phone = res.data.phone || settings.value.phone;
      settings.value.email = res.data.email || settings.value.email;
      settings.value.copyrightText = res.data.copyrightText || settings.value.copyrightText;
      let tr = (typeof res.data.translations === 'string' ? JSON.parse(res.data.translations) : res.data.translations) || {};
      // 🛡️ Legacy data: per-locale values may be stringified JSON — normalise
      // to objects so footerCols/links translations resolve via direct access.
      for (const k of Object.keys(tr)) {
        if (typeof tr[k] === 'string') { try { tr[k] = JSON.parse(tr[k]); } catch { /* keep */ } }
      }
      settings.value.translations = tr;

      let parsedFooter = res.data.footerLinks;
      if (typeof parsedFooter === 'string') parsedFooter = JSON.parse(parsedFooter);

      if (Array.isArray(parsedFooter)) {
        settings.value.footerLinks.columns[0].links = parsedFooter;
      } else if (parsedFooter && typeof parsedFooter === 'object' && parsedFooter.columns) {
        settings.value.footerLinks = parsedFooter;
      }
    }
  } catch (e) {
    console.error('Failed to load settings for footer', e);
  }
});

const paymentProviders = [
  { id: 'visa', name: 'Visa', svg: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z' },
  { id: 'mc', name: 'Mastercard', svg: 'M9 4h6v16H9z' },
  { id: 'mbank', name: 'MBank' },
  { id: 'omoney', name: 'O!Money' },
  { id: 'megapay', name: 'MegaPay' },
  { id: 'kaspi', name: 'Kaspi' }
];
</script>

<template>
  <footer class="global-footer">
    <!-- 2026: Top CTA band — newsletter + payment logos -->
    <div class="footer-cta-band">
      <div class="footer-cta-container">
        <div class="footer-cta-left">
          <h3 class="footer-cta-title">{{ t('footer.newsletterTitle') }}</h3>
          <p class="footer-cta-sub">{{ t('footer.newsletterSub') }}</p>
        </div>
        <form class="newsletter-form" @submit.prevent="subscribeNewsletter">
          <div class="newsletter-input-wrap">
            <input
              v-model="newsletterEmail"
              type="email"
              :placeholder="t('common.emailPlaceholder')"
              class="newsletter-input"
              required
              aria-label="E-posta adresi"
            />
            <button
              type="submit"
              class="newsletter-btn"
              :disabled="newsletterStatus === 'loading'"
            >
              {{ newsletterStatus === 'loading' ? '...' : newsletterStatus === 'success' ? '✓' : t('footer.subscribe') }}
            </button>
          </div>
          <Transition name="fade">
            <p v-if="newsletterStatus === 'success'" class="newsletter-msg success-msg">
              ✓ {{ t('footer.newsletterSuccess') }}
            </p>
            <p v-else-if="newsletterStatus === 'error'" class="newsletter-msg error-msg">
              {{ t('footer.newsletterError') }}
            </p>
          </Transition>
        </form>
      </div>
    </div>

    <!-- 2026: Mega footer — 5-column grid -->
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Col 1: Brand -->
        <div class="footer-brand">
          <img v-if="settings.logoUrl" :src="settings.logoUrl" :alt="settings.companyName" class="footer-logo-img" />
          <h2 v-else class="footer-logo">Power<span class="footer-logo__accent">Vital</span></h2>
          <p class="footer-desc">{{ settings.footerLinks.description }}</p>

          <div class="social-links">
            <a
              v-for="social in settings.footerLinks.socials"
              :key="social.id"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-icon"
              :aria-label="social.name"
              :title="social.name"
            >
              <!-- Icon is a URL (http, /, data:) → render as <img>; otherwise → emoji text -->
              <img
                v-if="social.icon && /^https?:|\/|data:/.test(social.icon)"
                :src="social.icon"
                :alt="social.name"
                class="social-icon__img"
              />
              <span v-else-if="social.icon" class="social-icon__emoji">{{ social.icon }}</span>
            </a>
          </div>

          <div class="footer-trustpilot">
            <div class="trustpilot-stars">★★★★★</div>
            <span class="trustpilot-text">Trustpilot'ta <strong>4.9/5</strong> (1.2k+ {{ t('footer.reviewsWord') }})</span>
          </div>
        </div>

        <!-- Col 2-3: Link columns -->
        <div class="footer-cols">
          <div class="footer-col" v-for="(col, index) in settings.footerLinks?.columns" :key="col.id">
            <h4>{{ settings.translations?.[useTranslation().locale.value]?.footerCols?.[index]?.title || col.title }}</h4>
            <ul>
              <li v-for="(link, lIndex) in col.links" :key="link.title">
                <router-link :to="link.url" class="footer-link">
                  {{ settings.translations?.[useTranslation().locale.value]?.footerCols?.[index]?.links?.[lIndex]?.title || link.title }}
                </router-link>
              </li>
            </ul>
          </div>
        </div>

        <!-- Col 4: Contact -->
        <div class="link-group link-group--contact">
          <h3>{{ t('footer.contact') }}</h3>
          <div class="footer-contact">
            <a v-if="settings.phone" :href="'tel:'+settings.phone.replace(/[^0-9+]/g, '')" class="contact-link">
              <span class="icon">📞</span>{{ settings.phone }}
            </a>
            <a v-if="settings.email" :href="'mailto:'+settings.email" class="contact-link">
              <span class="icon">✉️</span>{{ settings.email }}
            </a>
            <span v-if="settings.address" class="contact-link address">
              <span class="icon">📍</span>{{ tField(settings, 'address') || settings.address }}
            </span>
          </div>
          <div class="contact-hours">
            <strong>{{ t('footer.workingHours') }}</strong>
            <span>{{ t('footer.workingHoursValue') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2026: Payment + trust band -->
    <div class="footer-trust-band">
      <div class="trust-container">
        <div class="payment-providers">
          <span class="trust-label">{{ t('footer.securePayment') }}</span>
          <div class="payment-logos">
            <span v-for="p in paymentProviders" :key="p.id" class="payment-logo" :title="p.name">
              {{ p.id.toUpperCase() }}
            </span>
          </div>
        </div>
        <div class="security-badges">
          <span class="security-badge">
            <span class="badge-icon">🔒</span>
            <span>256-bit SSL</span>
          </span>
          <span class="security-badge">
            <span class="badge-icon">🛡️</span>
            <span>PCI DSS</span>
          </span>
          <span class="security-badge">
            <span class="badge-icon">📜</span>
            <span>ISO 27001</span>
          </span>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <!-- copyrightText is already a COMPLETE line (e.g. "© 2026 Power Vital. …"),
           so render it alone — prefixing "© {year} {company}." duplicated it. -->
      <p>{{ tField(settings, 'copyrightText') || `© ${new Date().getFullYear()} ${settings.companyName || 'Power Vital'}. Tüm hakları saklıdır.` }}</p>
    </div>
  </footer>
</template>

<style scoped>
.global-footer {
  background: var(--surface-card, #F9F6F1);
  color: var(--text-primary);
  border-top: 1px solid var(--surface-inset);
  font-family: var(--font-body);
  margin-top: 80px;
}

/* ═══ NEWSLETTER CTA BAND ═══ */
.footer-cta-band {
  background: transparent;
  padding: 40px 24px;
  position: relative;
  overflow: hidden;
  max-width: var(--container-max, 1440px);
  margin: 0 auto;
}
.footer-cta-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  position: relative;
  z-index: 1;
  background: var(--glass-bg, rgba(249, 246, 241, 0.88));
  backdrop-filter: var(--glass-blur, blur(20px) saturate(180%));
  border: var(--glass-border, 1px solid rgba(255, 255, 255, 0.5));
  box-shadow: var(--clay-shadow-lg, 12px 12px 32px rgba(210, 200, 185, 0.45), -12px -12px 32px rgba(255, 255, 255, 0.85));
  border-radius: var(--radius-xl, 32px);
  padding: 48px;
  overflow: hidden;
}
.footer-cta-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -20%;
  width: 60%;
  height: 200%;
  background: radial-gradient(circle, rgba(188, 74, 60, 0.08) 0%, transparent 60%);
  pointer-events: none;
}
.footer-cta-title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 900;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
  color: var(--pv-red, #BC4A3C);
}
.footer-cta-sub { font-size: 1.05rem; margin: 0; color: var(--text-secondary); font-weight: 500; }

.newsletter-form { display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 2; }
.newsletter-input-wrap {
  display: flex;
  background: var(--surface-white, #FFFFFF);
  border-radius: var(--radius-pill, 100px);
  padding: 6px;
  box-shadow: var(--clay-inset, inset 3px 3px 8px rgba(210, 200, 185, 0.45), inset -3px -3px 8px rgba(255, 255, 255, 0.85));
  gap: 6px;
}
.newsletter-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 24px;
  font-size: 0.95rem;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-weight: 600;
  outline: none;
  min-height: 0;
  border-radius: var(--radius-pill, 100px);
}
.newsletter-input::placeholder { color: var(--text-muted); font-weight: 500; }
.newsletter-btn {
  padding: 12px 32px;
  min-height: 52px;
  background: var(--pv-gradient, linear-gradient(135deg, #BC4A3C 0%, #D8412F 100%));
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-pill, 100px);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-spring);
  white-space: nowrap;
  box-shadow: var(--clay-brand-inset, inset 2px 2px 4px rgba(255,255,255,0.35), inset -2px -2px 6px rgba(120,20,10,0.3)), 0 4px 12px rgba(188, 74, 60, 0.25);
}
.newsletter-btn:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: var(--clay-brand-inset, inset 2px 2px 4px rgba(255,255,255,0.35), inset -2px -2px 6px rgba(120,20,10,0.3)), 0 8px 20px rgba(188, 74, 60, 0.4);
}
.newsletter-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.newsletter-btn:disabled { opacity: 0.7; cursor: wait; }
.newsletter-msg {
  font-size: 0.85rem;
  margin: 0;
  padding: 4px 16px 0;
  font-weight: 700;
}
.success-msg { color: var(--color-success, #2D8A56); }
.error-msg { color: var(--color-error, #C53030); }
.fade-enter-active, .fade-leave-active { transition: opacity var(--duration-fast); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .footer-cta-container {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 32px 24px;
    text-align: center;
  }
}

/* ═══ MEGA FOOTER GRID ═══ */
.footer-container {
  max-width: var(--container-max, 1440px);
  margin: 0 auto;
  padding: 64px 32px 48px;
}
.footer-grid {
  display: grid;
  /* Brand | Link columns (auto-fit) | Contact. Auto-fit keeps the layout
     correct regardless of how many link columns the admin has configured. */
  grid-template-columns: 1.8fr auto 1.2fr;
  gap: 48px;
  align-items: start;
}
.footer-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 32px;
}

/* ═══ Footer link columns — match design system (no default blue/underline) ═══ */
.footer-col { display: flex; flex-direction: column; gap: 12px; }
.footer-col h4 {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
}
.footer-col ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
  display: inline-flex;
  align-items: center;
  position: relative;
  width: fit-content;
  padding-left: 0;
  transition: color var(--duration-fast) var(--ease-smooth),
              padding-left var(--duration-fast) var(--ease-smooth);
}
.footer-link::before {
  content: '→';
  position: absolute;
  left: -16px;
  opacity: 0;
  color: var(--pv-red);
  transition: opacity var(--duration-fast) var(--ease-smooth),
              transform var(--duration-fast) var(--ease-smooth);
  transform: translateX(-4px);
}
.footer-link:hover {
  color: var(--pv-red);
  padding-left: 18px;
}
.footer-link:hover::before {
  opacity: 1;
  transform: translateX(0);
}

.footer-brand { display: flex; flex-direction: column; gap: 16px; }
.footer-logo {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
}
.footer-logo__accent { color: var(--pv-red, #BC4A3C); }
.footer-logo-img {
  max-width: 280px;
  height: auto;
  max-height: 80px;
  object-fit: contain;
  filter: brightness(1.1) contrast(1.2);
  mix-blend-mode: multiply;
}
.footer-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

.social-links {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.social-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--surface-inset);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all var(--duration-normal) var(--ease-clay);
  box-shadow: var(--clay-shadow-xs);
}
.social-icon:hover {
  background: var(--pv-red);
  color: var(--text-on-brand);
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 20px rgba(188, 74, 60, 0.3);
}
.social-icon img { max-width: 20px; max-height: 20px; object-fit: contain; }
.social-icon__img {
  width: 22px; height: 22px;
  object-fit: contain;
  /* ANTI-BLUR for tiny social icons */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: high-quality;
  filter: brightness(0) invert(1);  /* makes dark logos white on hover/light theme */
  transition: filter 0.2s;
}
.social-icon:hover .social-icon__img { filter: brightness(0) invert(1) drop-shadow(0 0 4px rgba(255,255,255,0.5)); }
.social-icon__emoji { font-size: 1.2rem; line-height: 1; }

.footer-trustpilot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding: 12px 16px;
  background: var(--surface-inset);
  border-radius: var(--radius-md);
  width: fit-content;
}
.trustpilot-stars { color: #00b67a; font-size: 0.9rem; letter-spacing: 2px; }
.trustpilot-text { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }
.trustpilot-text strong { color: var(--text-primary); }

.link-group {
  display: flex;
  flex-direction: column;
  gap: 12px;  /* uniform gap between title and links */
}
.link-group h3 {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0 0 4px 0;  /* tight under title, gap handles the rest */
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
}
.link-group a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
  transition: all var(--duration-fast) var(--ease-smooth);
  display: inline-block;  /* simpler than inline-flex for simple text */
  position: relative;
  padding-left: 0;  /* animated by ::before */
}
.link-group a::before {
  content: '→';
  opacity: 0;
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%) translateX(0);
  transition: all var(--duration-fast) var(--ease-smooth);
  color: var(--pv-red);
  font-weight: 800;
}
.link-group a:hover {
  color: var(--pv-red);
  padding-left: 18px;  /* slide right on hover */
}
.link-group a:hover::before {
  opacity: 1;
  left: 0;
}

.link-group--contact { gap: 12px; }
.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-decoration: none;
  line-height: 1.5;
  padding: 0;
  transition: color var(--duration-fast);
}
.contact-icon { font-size: 1.1rem; flex-shrink: 0; }
.contact-item:hover { color: var(--pv-red); padding-left: 0; }
.contact-hours {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  line-height: 1.5;
}
.contact-hours strong {
  color: var(--text-primary);
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.contact-hours span { color: var(--text-muted); }

/* ═══ TRUST BAND (Payment + Security) ═══ */
.footer-trust-band {
  background: var(--surface-page);
  border-top: 1px solid var(--surface-inset);
  padding: 24px 32px;
}
.trust-container {
  max-width: var(--container-max, 1440px);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.payment-providers { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.trust-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.payment-logos { display: flex; gap: 8px; flex-wrap: wrap; }
.payment-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  background: var(--surface-white);
  border: 1px solid var(--surface-inset);
  border-radius: var(--radius-xs);
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-secondary);
  font-family: var(--font-display);
  letter-spacing: 0.5px;
  box-shadow: var(--clay-shadow-xs);
}

.security-badges { display: flex; gap: 16px; }
.security-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}
.badge-icon { font-size: 0.9rem; }

/* ═══ COPYRIGHT ═══ */
.footer-bottom {
  background: var(--text-primary);
  color: var(--text-on-brand);
  padding: 16px 32px;
  text-align: center;
}
.footer-bottom p { margin: 0; font-size: 0.8rem; opacity: 0.8; }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 1024px) {
  .footer-grid { grid-template-columns: 1.5fr 1fr; gap: 32px; }
}
@media (max-width: 768px) {
  .footer-cta-band { padding: 32px 20px; }
  .footer-cta-container { grid-template-columns: 1fr; gap: 24px; text-align: center; }
  .newsletter-input-wrap { flex-direction: column; padding: 12px; border-radius: var(--radius-md); }
  .newsletter-btn { width: 100%; }
  .footer-container { padding: 48px 20px 32px; }
  .footer-grid { grid-template-columns: 1fr; gap: 36px; }
  .link-group { text-align: center; }
  .link-group a { justify-content: center; }
  .contact-item { justify-content: center; }
  .footer-brand { text-align: center; align-items: center; }
  .social-links { justify-content: center; }
  .footer-trust-band { padding: 20px 16px; }
  .trust-container { flex-direction: column; align-items: center; gap: 16px; }
  .payment-providers, .security-badges { justify-content: center; }
  .footer-bottom { padding: 14px 16px; }
}
</style>
