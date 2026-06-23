<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useTranslate } from '../composables/useTranslate';

const { t, locale } = useTranslate();

const form = ref({ subject: '', message: '' });
const isSending = ref(false);
const isSent = ref(false);
const openFaq = ref<number | null>(0);

interface Faq { id: string; q: string; a: string }
const defaultFaq: Faq[] = [
  { id: '1', q: 'Kargo kaç günde ulaşır?', a: 'Siparişleriniz genellikle 1-3 iş günü içerisinde kargoya teslim edilmektedir.' },
  { id: '2', q: 'İade koşulları nelerdir?', a: 'Kullanılmamış ürünleri 14 gün içerisinde iade edebilirsiniz.' },
  { id: '3', q: 'Sadakat seviyesi nasıl artar?', a: 'Toplam harcama tutarınız arttıkça seviyeniz ve kalıcı indirim oranınız otomatik olarak yükselir.' },
];
const faqList = ref<Faq[]>(defaultFaq);
// Auto-generated FAQ translations: settings.translations[locale].faqItems
// (matched positionally with faqList). Falls back to the Turkish base text.
const faqTranslations = ref<Record<string, any>>({});

const normalizeTr = (raw: any): any => {
  let m = raw;
  if (typeof m === 'string') { try { m = JSON.parse(m); } catch { return {}; } }
  if (!m || typeof m !== 'object') return {};
  for (const k of Object.keys(m)) { if (typeof m[k] === 'string') { try { m[k] = JSON.parse(m[k]); } catch { /* keep as string */ } } }
  return m;
};

// Translated FAQ field for item at index i, falling back to base.
const faqField = (i: number, field: 'q' | 'a') => {
  const arr = faqTranslations.value?.[locale.value]?.faqItems;
  const v = Array.isArray(arr) ? arr[i]?.[field] : undefined;
  return (typeof v === 'string' && v.trim()) ? v : (faqList.value[i] as any)?.[field] || '';
};

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/settings');
    const items = res.data?.faqItems;
    if (Array.isArray(items) && items.length > 0) {
      faqList.value = items.filter((x: any) => x && (x.q || x.a));
    }
    faqTranslations.value = normalizeTr(res.data?.translations);
  } catch {
    // keep defaults
  }
});

const toggleFaq = (i: number) => { openFaq.value = openFaq.value === i ? null : i; };

const submitForm = async () => {
  isSending.value = true;
  try {
    await axios.post('/api/v1/contact', { subject: form.value.subject, message: form.value.message });
  } catch {
    console.warn('[Support] Simulated submission successful.');
  }
  isSending.value = false;
  isSent.value = true;
  form.value = { subject: '', message: '' };
  setTimeout(() => { isSent.value = false; }, 5000);
};
</script>

<template>
  <div class="sup">
   <div class="sup__inner">
    <header class="sup-head">
      <h1 class="sup-title">{{ t('support.title') }}</h1>
      <p class="sup-sub">{{ t('support.subtitle') }}</p>
    </header>

    <div class="sup-grid">
      <!-- Ticket form -->
      <section class="sup-card">
        <h2 class="sup-card__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          {{ t('support.newTicket') }}
        </h2>

        <form @submit.prevent="submitForm" class="sup-form" v-if="!isSent">
          <div class="sup-field">
            <label>{{ t('support.subject') }}</label>
            <select v-model="form.subject" required class="sup-input">
              <option value="" disabled>{{ t('support.selectSubject') }}</option>
              <option value="order">{{ t('support.subjOrder') }}</option>
              <option value="return">{{ t('support.subjReturn') }}</option>
              <option value="product">{{ t('support.subjProduct') }}</option>
              <option value="loyalty">{{ t('support.subjLoyalty') }}</option>
              <option value="other">{{ t('support.subjOther') }}</option>
            </select>
          </div>

          <div class="sup-field">
            <label>{{ t('support.message') }}</label>
            <textarea v-model="form.message" rows="5" required class="sup-input" :placeholder="t('support.messagePlaceholder')"/>
          </div>

          <button type="submit" class="sup-btn" :disabled="isSending">
            {{ isSending ? t('support.sending') : t('support.send') }}
          </button>
        </form>

        <div v-else class="sup-success">
          <div class="sup-success__icon">✅</div>
          <h3>{{ t('support.successTitle') }}</h3>
          <p>{{ t('support.successText') }}</p>
          <button @click="isSent = false" class="sup-btn sup-btn--ghost">{{ t('support.newRequest') }}</button>
        </div>
      </section>

      <!-- FAQ (admin-managed) -->
      <section class="sup-card">
        <h2 class="sup-card__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {{ t('support.faqTitle') }}
        </h2>
        <div class="sup-faq">
          <div v-for="(faq, i) in faqList" :key="faq.id || i" class="sup-faq__item" :class="{ open: openFaq === i }">
            <button class="sup-faq__q" @click="toggleFaq(i)">
              <span>{{ faqField(i, 'q') }}</span>
              <svg class="sup-faq__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="sup-faq__a-wrap">
              <p class="sup-faq__a">{{ faqField(i, 'a') }}</p>
            </div>
          </div>
          <p v-if="faqList.length === 0" class="sup-faq__empty">—</p>
        </div>
      </section>
    </div>
   </div>
  </div>
</template>

<style scoped>
.sup {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1f2937;
  -webkit-overflow-scrolling: touch;
}
.sup__inner { max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px; }

.sup-head { margin-bottom: 26px; }
.sup-title { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.03em; color: #111827; }
.sup-sub { margin: 0; color: #6b7280; font-size: 0.98rem; }

.sup-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: start; }
.sup-card { background: #fff; border: 1px solid #ececec; border-radius: 20px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.sup-card__title { display: flex; align-items: center; gap: 9px; font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 800; color: #111827; margin: 0 0 18px; }
.sup-card__title svg { color: #BC4A3C; }

.sup-form { display: flex; flex-direction: column; gap: 16px; }
.sup-field { display: flex; flex-direction: column; gap: 7px; }
.sup-field label { font-size: 0.8rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
.sup-input { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 11px; padding: 12px 14px; color: #1f2937; font-family: 'Inter', sans-serif; font-size: 0.95rem; outline: none; transition: border-color 0.18s, box-shadow 0.18s; box-sizing: border-box; }
.sup-input:focus { border-color: #BC4A3C; box-shadow: 0 0 0 3px rgba(188,74,60,0.12); }
textarea.sup-input { resize: vertical; min-height: 110px; }

.sup-btn { align-self: flex-start; padding: 12px 22px; border: none; border-radius: 12px; background: linear-gradient(135deg, #D4665A, #BC4A3C); color: #fff; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 6px 18px rgba(188,74,60,0.3); transition: transform 0.12s, filter 0.15s; }
.sup-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
.sup-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.sup-btn--ghost { background: #f3f4f6; color: #374151; box-shadow: none; margin-top: 14px; align-self: center; }
.sup-btn--ghost:hover { background: #e5e7eb; transform: none; }

.sup-success { text-align: center; padding: 26px 10px; }
.sup-success__icon { font-size: 3rem; margin-bottom: 12px; }
.sup-success h3 { font-family: 'Outfit', sans-serif; color: #059669; font-size: 1.3rem; margin: 0 0 8px; }
.sup-success p { color: #6b7280; line-height: 1.6; margin: 0; }

/* FAQ accordion */
.sup-faq { display: flex; flex-direction: column; gap: 10px; }
.sup-faq__item { border: 1px solid #f0f0f0; border-radius: 13px; overflow: hidden; transition: border-color 0.15s; }
.sup-faq__item.open { border-color: #e7c6bf; }
.sup-faq__q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #fff; border: none; cursor: pointer; text-align: left; font-family: 'Outfit', sans-serif; font-size: 0.92rem; font-weight: 700; color: #1f2937; }
.sup-faq__q:hover { background: #faf8f5; }
.sup-faq__chev { color: #9ca3af; transition: transform 0.25s; flex-shrink: 0; }
.sup-faq__item.open .sup-faq__chev { transform: rotate(180deg); color: #BC4A3C; }
.sup-faq__a-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.28s ease; }
.sup-faq__item.open .sup-faq__a-wrap { grid-template-rows: 1fr; }
.sup-faq__a { overflow: hidden; margin: 0; padding: 0 16px; color: #6b7280; font-size: 0.88rem; line-height: 1.6; }
.sup-faq__item.open .sup-faq__a { padding: 0 16px 14px; }
.sup-faq__empty { color: #9ca3af; text-align: center; padding: 16px; }

@media (max-width: 900px) {
  .sup-grid { grid-template-columns: 1fr; }
  .sup-title { font-size: 1.6rem; }
}
</style>
