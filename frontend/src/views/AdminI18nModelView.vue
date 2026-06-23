<script setup lang="ts">
// AdminI18nModelView — compact inline translation editor (2026-06 redesign).
//
// Improvements over previous version:
//   1. Sticky header (top + first 4 columns stay visible during scroll)
//   2. Tighter textarea max-width so all 4 locales fit without horizontal scroll
//   3. Sticky first column (TR + ID) so the admin never loses context
//   4. Cleaner empty state with model-specific messaging
//   5. Compact mode toggle (less padding) when many records are visible
//
// URL: /i18n/:model  where :model ∈ { products, categories, pages,
//        sliders, store-reviews, site-settings }
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useToast } from '../composables/useToast';
import { useTranslate } from '../composables/useTranslate';

const toast = useToast();
const route = useRoute();
const router = useRouter();
const { t } = useTranslate();

interface FieldPayload {
  tr: string;
  ru: string;
  kg: string;
  en: string;
  trHash: string;
  srcHash?: string;
  changed: boolean;
}

interface BatchResponse {
  [recordId: string]: {
    fields: Record<string, FieldPayload>;
  };
}

const MODEL_ROUTES: Record<string, { model: string; label: string; icon: string; schema: string[]; description: string }> = {
  products: { model: 'Product', label: 'Ürünler', icon: '💊', schema: ['name', 'description'], description: 'Ürün adı, açıklama, faydalar, accordion' },
  categories: { model: 'Category', label: 'Kategoriler', icon: '🗂️', schema: ['name', 'description'], description: 'Kategori adı ve açıklaması' },
  pages: { model: 'Page', label: 'Sayfalar', icon: '📄', schema: ['title', 'content'], description: 'CMS sayfaları (Hakkımızda, vb.)' },
  sliders: { model: 'HeroSlide', label: 'Slider / Banner', icon: '🖼️', schema: ['title', 'subtitle', 'buttonText'], description: 'Anasayfa slider başlık ve alt yazı' },
  'store-reviews': { model: 'StoreReview', label: 'Mağaza Yorumları', icon: '💬', schema: ['text'], description: 'Mağaza değerlendirmeleri' },
  'site-settings': { model: 'SiteSettings', label: 'Site Ayarları', icon: '⚙️', schema: ['companyName', 'address', 'topbarShippingMsg', 'copyrightText', 'campaignTitle', 'campaignCta'], description: 'Genel mağaza ayarları' }
};

const slug = computed(() => String(route.params.model || 'products'));
const config = computed(() => MODEL_ROUTES[slug.value]);
const fields = computed(() => config.value?.schema || ['name']);

interface RecordItem {
  id: string;
  title: string;
  coveragePct: number;
  perLocale: Record<string, number>;
  hasMissing: boolean;
}

const records = ref<RecordItem[]>([]);
const totalRecords = ref(0);
const isLoading = ref(false);
const errorMsg = ref('');

interface FieldValues { [field: string]: { tr: string; ru: string; kg: string; en: string } }
const fieldValues = reactive<Record<string, FieldValues>>({});
const changedFields = reactive<Record<string, Set<string>>>({});
const isSaving = ref<Record<string, boolean>>({});
const flashKey = ref<Record<string, number>>({});

const onlyMissing = ref(true);
const compactMode = ref(false);
const isImporting = ref(false);
const importInput = ref<HTMLInputElement | null>(null);
const search = ref('');

const visibleRecords = computed(() => {
  if (!search.value) return records.value;
  const q = search.value.toLowerCase();
  return records.value.filter((r) => {
    const fv = fieldValues[r.id];
    if (!fv) return false;
    for (const f of fields.value) {
      if (fv[f]?.tr?.toLowerCase().includes(q)) return true;
      for (const loc of TARGET_LOCALES) {
        if (fv[f]?.[loc]?.toLowerCase().includes(q)) return true;
      }
    }
    return false;
  });
});

const TARGET_LOCALES = ['ru', 'kg', 'en'] as const;

const FIELD_LABEL: Record<string, string> = {
  name: 'Ad',
  description: 'Açıklama',
  title: 'Başlık',
  content: 'İçerik',
  subtitle: 'Alt başlık',
  buttonText: 'Buton metni',
  text: 'Yorum',
  companyName: 'Şirket adı',
  address: 'Adres',
  topbarShippingMsg: 'Üst bar kargo mesajı',
  copyrightText: 'Telif hakkı metni',
  campaignTitle: 'Kampanya başlığı',
  campaignCta: 'Kampanya CTA'
};

const fieldLabel = (f: string) => FIELD_LABEL[f] || f;

const load = async () => {
  if (!config.value) {
    errorMsg.value = 'Bilinmeyen model: ' + slug.value;
    return;
  }
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const res = await axios.get('/api/v1/admin/i18n/records', {
      params: { model: config.value.model, onlyMissing: onlyMissing.value ? 1 : 0, pageSize: 200 }
    });
    records.value = res.data.items;
    totalRecords.value = res.data.total;
    await loadFieldValues();
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || e.message;
  } finally {
    isLoading.value = false;
  }
};

const loadFieldValues = async () => {
  for (const k of Object.keys(fieldValues)) delete fieldValues[k];
  for (const k of Object.keys(changedFields)) delete changedFields[k];

  if (records.value.length === 0) return;
  const ids = records.value.map((r) => r.id).join(',');
  try {
    const res = await axios.get('/api/v1/admin/i18n/records-batch', {
      params: { model: config.value.model, ids }
    });
    const items: BatchResponse = res.data.items;
    for (const r of records.value) {
      const data = items[r.id];
      const fv: any = {};
      const changed = new Set<string>();
      if (data) {
        for (const f of fields.value) {
          const fp = data.fields[f];
          if (fp) {
            fv[f] = { tr: fp.tr, ru: fp.ru, kg: fp.kg, en: fp.en };
            if (fp.changed) changed.add(f);
          } else {
            fv[f] = { tr: r.title, ru: '', kg: '', en: '' };
          }
        }
      } else {
        for (const f of fields.value) {
          fv[f] = { tr: r.title, ru: '', kg: '', en: '' };
        }
      }
      fieldValues[r.id] = fv;
      changedFields[r.id] = changed;
    }
  } catch (e: any) {
    errorMsg.value = 'Çeviriler yüklenemedi: ' + (e?.response?.data?.error || e.message);
  }
};

onMounted(load);
watch(onlyMissing, load);
watch(() => route.params.model, load);

const setFieldValue = (recordId: string, field: string, locale: 'ru' | 'kg' | 'en', value: string) => {
  if (!fieldValues[recordId]?.[field]) return;
  fieldValues[recordId][field][locale] = value;
};

const saveField = async (recordId: string, field: string, locale: 'ru' | 'kg' | 'en') => {
  const key = `${recordId}|${field}|${locale}`;
  isSaving.value[key] = true;
  try {
    const v = fieldValues[recordId]?.[field]?.[locale] ?? '';
    await axios.patch(`/api/v1/admin/i18n/record/${config.value.model}/${recordId}`, {
      locale, field, value: v
    });
    changedFields[recordId]?.delete(field);
    flashKey.value[key] = Date.now();
    setTimeout(() => { delete flashKey.value[key]; }, 1200);
  } catch (e: any) {
    toast.error('Kaydedilemedi', e?.response?.data?.error || e.message);
  } finally {
    delete isSaving.value[key];
  }
};

const onBlur = (recordId: string, field: string, locale: 'ru' | 'kg' | 'en') => {
  saveField(recordId, field, locale);
};

// ── Manual-translation helpers ──────────────────────────────────────────
// One-click "draft from TR": copy the Turkish source into a single target
// cell as a starting point. The admin then refines it in place — far faster
// than retyping long descriptions from scratch. Saves immediately.
const copyTrToCell = (recordId: string, field: string, locale: 'ru' | 'kg' | 'en') => {
  const tr = fieldValues[recordId]?.[field]?.tr ?? '';
  if (!tr.trim()) return;
  setFieldValue(recordId, field, locale, tr);
  saveField(recordId, field, locale);
};

// Cell status drives the per-cell marker:
//   'empty'  → nothing entered yet (customer sees TR fallback)
//   'sametr' → filled but identical to the TR source ⇒ not really translated
//   'ok'     → filled and different from TR ⇒ genuine translation
const cellState = (recordId: string, field: string, locale: 'ru' | 'kg' | 'en'): 'empty' | 'sametr' | 'ok' => {
  const fv = fieldValues[recordId]?.[field];
  if (!fv) return 'empty';
  const val = (fv[locale] || '').trim();
  if (!val) return 'empty';
  if (val === (fv.tr || '').trim()) return 'sametr';
  return 'ok';
};

// Ctrl/⌘+Enter saves the focused cell without having to tab/click away —
// keeps the keyboard-only flow fast for bulk manual entry.
const onCellKeydown = (e: KeyboardEvent, recordId: string, field: string, locale: 'ru' | 'kg' | 'en') => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    saveField(recordId, field, locale);
  }
};

// How many target cells are still empty across the rows currently shown —
// a live "remaining work" counter for the header.
const emptyCellCount = computed(() => {
  let n = 0;
  for (const r of visibleRecords.value) {
    for (const f of fields.value) {
      for (const loc of TARGET_LOCALES) {
        if (cellState(r.id, f, loc) === 'empty') n++;
      }
    }
  }
  return n;
});

// ── Array fields (faydalar / accordion) inline editing ──────────────────────
// Products carry two translatable arrays the scalar grid can't reach:
//   • benefits   — indexed list of plain strings ("Faydaları")
//   • accordions — keyed objects with title + content
// The backend PATCH already supports both shapes; we lazy-load each record's
// array payload on expand (via GET /record/:model/:id) to keep the list light.
const ARRAY_MODELS = new Set(['products']); // mirrors backend arrayFields support
const hasArrays = computed(() => ARRAY_MODELS.has(slug.value));

interface ArrItem { key: string; index: number; tr: any; locales: Record<string, any>; }
interface ArrInfo { name: string; itemType?: string; matchBy: string; fields: string[]; items: ArrItem[]; }
const arrayData = reactive<Record<string, ArrInfo[]>>({});
const arrayOpen = reactive<Record<string, boolean>>({});
const arrayLoading = reactive<Record<string, boolean>>({});

const ARRAY_LABEL: Record<string, string> = { benefits: 'Faydalar', accordions: 'Accordion', faqItems: 'SSS' };
const SUB_LABEL: Record<string, string> = { title: 'Başlık', content: 'İçerik', q: 'Soru', a: 'Cevap' };
const arrayLabel = (n: string) => ARRAY_LABEL[n] || n;
const subLabel = (s: string) => SUB_LABEL[s] || s;

const loadArrays = async (recordId: string) => {
  if (arrayData[recordId]) return;
  arrayLoading[recordId] = true;
  try {
    const res = await axios.get(`/api/v1/admin/i18n/record/${config.value.model}/${recordId}`);
    arrayData[recordId] = (res.data?.arrays || []).filter((a: ArrInfo) => a.items?.length > 0);
  } catch (e: any) {
    toast.error('Diziler yüklenemedi', e?.response?.data?.error || e.message);
  } finally {
    arrayLoading[recordId] = false;
  }
};

const toggleArrays = (recordId: string) => {
  arrayOpen[recordId] = !arrayOpen[recordId];
  if (arrayOpen[recordId]) loadArrays(recordId);
};

const arrKey = (recordId: string, arr: ArrInfo, item: ArrItem, sf: string | null, loc: string) =>
  `arr|${recordId}|${arr.name}|${sf ? item.key : item.index}|${sf || '_'}|${loc}`;

// Read/normalise the editable target value for a cell.
const arrVal = (item: ArrItem, sf: string | null, loc: string): string =>
  sf ? (item.locales?.[loc]?.[sf] ?? '') : (item.locales?.[loc] ?? '');
const arrTr = (item: ArrItem, sf: string | null): string =>
  sf ? (item.tr?.[sf] ?? '') : (item.tr ?? '');

const setArrVal = (item: ArrItem, sf: string | null, loc: string, value: string) => {
  if (sf) {
    if (typeof item.locales[loc] !== 'object' || !item.locales[loc]) item.locales[loc] = {};
    item.locales[loc][sf] = value;
  } else {
    item.locales[loc] = value;
  }
};

const arrCellState = (item: ArrItem, sf: string | null, loc: string): 'empty' | 'sametr' | 'ok' => {
  const v = arrVal(item, sf, loc).trim();
  if (!v) return 'empty';
  if (v === arrTr(item, sf).trim()) return 'sametr';
  return 'ok';
};

const saveArrayCell = async (recordId: string, arr: ArrInfo, item: ArrItem, sf: string | null, loc: string) => {
  const value = arrVal(item, sf, loc);
  const sk = arrKey(recordId, arr, item, sf, loc);
  isSaving.value[sk] = true;
  try {
    const body: any = { locale: loc, value };
    if (arr.itemType === 'string') { body.arrayField = arr.name; body.index = item.index; }
    else { body.arrayField = arr.name; body.key = item.key; body.subField = sf; }
    await axios.patch(`/api/v1/admin/i18n/record/${config.value.model}/${recordId}`, body);
    flashKey.value[sk] = Date.now();
    setTimeout(() => { delete flashKey.value[sk]; }, 1200);
  } catch (e: any) {
    toast.error('Kaydedilemedi', e?.response?.data?.error || e.message);
  } finally {
    delete isSaving.value[sk];
  }
};

const copyTrToArrayCell = (recordId: string, arr: ArrInfo, item: ArrItem, sf: string | null, loc: string) => {
  const tr = arrTr(item, sf);
  if (!String(tr).trim()) return;
  setArrVal(item, sf, loc, tr);
  saveArrayCell(recordId, arr, item, sf, loc);
};

const goBack = () => router.push('/i18n');

const exportCsv = () => {
  const url = `/api/v1/admin/i18n/export/${config.value.model}.csv?locales=ru,kg,en`;
  window.open(url, '_blank');
};

const onImportClick = () => importInput.value?.click();
const onImportFile = async (ev: Event) => {
  const f = (ev.target as HTMLInputElement).files?.[0];
  if (!f) return;
  isImporting.value = true;
  try {
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new Error('CSV boş');
    const header = lines[0].replace(/^\uFEFF/, '').split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const idx = (n: string) => header.indexOf(n);
    const cRecord = idx('record_id'), cPath = idx('path');
    const localeIdx: Record<'ru' | 'kg' | 'en', number> = { ru: idx('ru'), kg: idx('kg'), en: idx('en') };
    if (cRecord < 0 || cPath < 0) throw new Error('CSV başlığı eksik (record_id, path gerekli)');

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      for (const loc of TARGET_LOCALES) {
        const v = cols[localeIdx[loc]];
        if (v != null && v !== '') {
          rows.push({ recordId: cols[cRecord], locale: loc, path: cols[cPath], value: v });
        }
      }
    }
    const res = await axios.post(`/api/v1/admin/i18n/import/${config.value.model}`, { rows });
    toast.success(`✅ ${res.data.updatedRecords} kayıt, ${res.data.updatedFields} hücre güncellendi`);
    await load();
  } catch (e: any) {
    toast.error('İçe aktarım başarısız', e?.response?.data?.error || e.message);
  } finally {
    isImporting.value = false;
    if (importInput.value) importInput.value.value = '';
  }
};

const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuote = false;
      else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') inQuote = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
};

</script>

<template>
  <div class="i18n-prod" :class="{ 'i18n-prod--compact': compactMode }">
    <!-- Sticky header -->
    <header class="ip-head">
      <div class="ip-head-row">
        <button class="ip-back" @click="goBack" title="Çeviri Merkezi'ne dön">← Geri</button>
        <div class="ip-title">
          <h1>{{ config?.icon }} {{ config?.label }} <span class="ip-count">({{ visibleRecords.length }})</span></h1>
          <p class="ip-sub">
            {{ config?.description }}. Toplam {{ totalRecords }} kayıt.
            <span v-if="emptyCellCount > 0" class="ip-empty-count">· {{ emptyCellCount }} boş hücre</span>
            <span v-else class="ip-empty-count ip-empty-count--done">· tüm hücreler dolu ✓</span>
          </p>
        </div>
        <div class="ip-actions">
          <input v-model="search" type="text" class="ip-search" placeholder="🔍 Ara…" />
          <button class="ip-toggle" :class="{ on: onlyMissing }" @click="onlyMissing = !onlyMissing" title="Sadece eksik hücreli olanları göster">
            {{ onlyMissing ? '✓ Eksik' : 'Tümü' }}
          </button>
          <button class="ip-toggle" :class="{ on: compactMode }" @click="compactMode = !compactMode" title="Sıkı mod (küçük padding)">
            {{ compactMode ? '◧ Kompakt' : '⊞ Geniş' }}
          </button>
          <button class="ip-btn" @click="exportCsv" title="CSV indir">📤</button>
          <button class="ip-btn" :disabled="isImporting" @click="onImportClick" title="CSV yükle">{{ isImporting ? '⏳' : '📥' }}</button>
          <input ref="importInput" type="file" accept=".csv" hidden @change="onImportFile" />
          <button class="ip-btn ip-btn--reload" :disabled="isLoading" @click="load" title="Yenile">
            <span :class="{ spin: isLoading }">↻</span>
          </button>
        </div>
      </div>
      <p v-if="errorMsg" class="ip-error">⚠️ {{ errorMsg }}</p>
    </header>

    <!-- Empty / loading -->
    <div v-if="isLoading" class="ip-state">
      <div class="ip-state__icon">⏳</div>
      <p>{{ t('admin.i18nModel.loading') }}</p>
    </div>
    <div v-else-if="visibleRecords.length === 0" class="ip-state">
      <div class="ip-state__icon">🎉</div>
      <h3 v-if="records.length === 0">{{ t('admin.i18nModel.noRecords', { model: config?.label }) }}</h3>
      <h3 v-else>{{ t('admin.i18nModel.noMissing') }}</h3>
      <p v-if="onlyMissing">{{ t('admin.i18nModel.onlyMissingHint') }} <button class="ip-link" @click="onlyMissing = false">{{ t('admin.i18nModel.showAll') }}</button></p>
      <p v-else-if="search">{{ t('admin.i18nModel.noSearchResults', { q: search }) }} <button class="ip-link" @click="search = ''">{{ t('admin.i18nModel.clearSearch') }}</button></p>
    </div>

    <!-- Main content — Card layout -->
    <div v-else class="ip-cards-wrap">
      <div v-for="r in visibleRecords" :key="r.id" class="ip-card">
        <!-- Card Header -->
        <div class="ip-card-header">
          <div class="ip-card-title">
            <code>{{ r.id.slice(0, 6) }}…</code>
            <span class="ip-card-name">{{ r.title || '(Başlıksız)' }}</span>
            <span v-if="changedFields[r.id]?.size" class="ip-warn" :title="`${changedFields[r.id].size} alan TR güncellendi`">
              {{ t('admin.i18nModel.fieldsChanged', { n: changedFields[r.id].size }) }}
            </span>
          </div>
          <div class="ip-card-cov">
            <!-- Per-locale coverage so the admin sees which language lags -->
            <div class="ip-loc-chips">
              <span
                v-for="loc in TARGET_LOCALES"
                :key="'chip-' + r.id + '-' + loc"
                class="ip-loc-chip"
                :class="{
                  'chip-full': (r.perLocale?.[loc] ?? 0) >= 100,
                  'chip-mid': (r.perLocale?.[loc] ?? 0) >= 60 && (r.perLocale?.[loc] ?? 0) < 100,
                  'chip-low': (r.perLocale?.[loc] ?? 0) < 60
                }"
                :title="`${loc.toUpperCase()} kapsamı: %${r.perLocale?.[loc] ?? 0}`"
              >
                {{ loc === 'ru' ? '🇷🇺' : loc === 'kg' ? '🇰🇬' : '🇺🇸' }} %{{ r.perLocale?.[loc] ?? 0 }}
              </span>
            </div>
            <div class="cov-bar" :title="`Toplam kapsam: %${r.coveragePct}`">
              <div class="cov-fill" :style="{ width: r.coveragePct + '%', background: r.coveragePct >= 90 ? '#10b981' : r.coveragePct >= 60 ? '#f59e0b' : '#ef4444' }" />
            </div>
          </div>
        </div>
        
        <!-- Card Fields -->
        <div class="ip-card-body">
          <div v-for="f in fields" :key="'f-' + r.id + '-' + f" class="ip-field-row">
            <div class="ip-field-label">
              <span class="ip-field-name">{{ fieldLabel(f) }}</span>
            </div>
            
            <div class="ip-field-content">
              <!-- TR Source -->
              <div class="ip-locale-box ip-locale-tr" :class="{ 'tr-stale': changedFields[r.id]?.has(f) }">
                <div class="ip-loc-head">
                  <span class="flag">🇹🇷</span> TR (Kaynak)
                  <span v-if="changedFields[r.id]?.has(f)" class="ip-stale-tag" :title="t('admin.i18nModel.saved')">{{ t('admin.i18nModel.saved') }}</span>
                </div>
                <div class="ip-loc-text">{{ fieldValues[r.id]?.[f]?.tr || '—' }}</div>
              </div>
              
              <!-- Targets (RU, KG, GB) -->
              <div
                v-for="loc in TARGET_LOCALES"
                :key="'loc-' + loc"
                class="ip-locale-box"
                :class="{
                  flash: !!flashKey[r.id + '|' + f + '|' + loc],
                  'box-empty': cellState(r.id, f, loc) === 'empty',
                  'box-sametr': cellState(r.id, f, loc) === 'sametr'
                }"
              >
                <div class="ip-loc-head">
                  <span class="flag">{{ loc === 'ru' ? '🇷🇺' : loc === 'kg' ? '🇰🇬' : '🇺🇸' }}</span> {{ loc.toUpperCase() }}
                  <!-- Cell status marker -->
                  <span v-if="isSaving[r.id + '|' + f + '|' + loc]" class="ip-status ip-status--saving">⏳</span>
                  <span v-else-if="cellState(r.id, f, loc) === 'ok'" class="ip-status ip-status--ok">✓</span>
                  <span v-else-if="cellState(r.id, f, loc) === 'sametr'" class="ip-status ip-status--sametr" title="TR ile birebir aynı — henüz çevrilmedi">= TR</span>
                  <span v-else class="ip-status ip-status--empty" :title="t('admin.i18nModel.empty')">{{ t('admin.i18nModel.empty') }}</span>
                  <!-- Draft-from-TR helper: fills this cell with the TR source -->
                  <button
                    v-if="cellState(r.id, f, loc) === 'empty' && (fieldValues[r.id]?.[f]?.tr || '').trim()"
                    class="ip-copytr"
                    type="button"
                    title="TR metnini buraya kopyala (taslak) — sonra düzenle"
                    @click="copyTrToCell(r.id, f, loc)"
                  >⤵ TR</button>
                </div>
                <textarea
                  class="ip-loc-input"
                  :value="fieldValues[r.id]?.[f]?.[loc] || ''"
                  :placeholder="fieldValues[r.id]?.[f]?.tr || '—'"
                  :disabled="!!isSaving[r.id + '|' + f + '|' + loc]"
                  @input="(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    setFieldValue(r.id, f, loc, el.value);
                    el.style.height = 'auto';
                    el.style.height = (el.scrollHeight) + 'px';
                  }"
                  @focus="(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = 'auto';
                    el.style.height = (el.scrollHeight) + 'px';
                  }"
                  @keydown="(e) => onCellKeydown(e as KeyboardEvent, r.id, f, loc)"
                  @blur="onBlur(r.id, f, loc)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Array fields: Faydalar (benefits) + Accordion. Lazy-loaded on open. -->
        <div v-if="hasArrays" class="ip-arr">
          <button class="ip-arr-toggle" :class="{ open: arrayOpen[r.id] }" @click="toggleArrays(r.id)">
            <span class="ip-arr-caret">▸</span>
            Diziler — Faydalar &amp; Accordion
            <span v-if="arrayLoading[r.id]" class="spin ip-arr-spin">↻</span>
          </button>
          <div v-if="arrayOpen[r.id]" class="ip-arr-body">
            <div v-if="arrayLoading[r.id] && !arrayData[r.id]" class="ip-arr-note">{{ t('admin.i18nModel.loading') }}</div>
            <div v-else-if="arrayData[r.id] && arrayData[r.id].length === 0" class="ip-arr-note">{{ t('admin.i18nModel.noArrays') }}</div>

            <div v-for="arr in arrayData[r.id] || []" :key="'arr-' + r.id + '-' + arr.name" class="ip-arr-group">
              <div class="ip-arr-name">{{ arrayLabel(arr.name) }} <span class="ip-arr-count">({{ arr.items.length }})</span></div>

              <div v-for="item in arr.items" :key="'it-' + arr.name + '-' + (item.key || item.index)" class="ip-arr-item">
                <div v-if="arr.itemType !== 'string'" class="ip-arr-itemkey">🔑 {{ item.key }}</div>

                <div
                  v-for="sf in (arr.itemType === 'string' ? [null] : arr.fields)"
                  :key="'sf-' + arr.name + '-' + (item.key || item.index) + '-' + (sf || 'v')"
                  class="ip-field-content ip-arr-row"
                >
                  <!-- TR source -->
                  <div class="ip-locale-box ip-locale-tr">
                    <div class="ip-loc-head">
                      <span class="flag">🇹🇷</span>
                      {{ arr.itemType === 'string' ? ('TR · #' + (item.index + 1)) : subLabel(sf as string) }}
                    </div>
                    <div class="ip-loc-text">{{ arrTr(item, sf) || '—' }}</div>
                  </div>

                  <!-- Targets RU / KG / EN -->
                  <div
                    v-for="loc in TARGET_LOCALES"
                    :key="'al-' + loc"
                    class="ip-locale-box"
                    :class="{
                      flash: !!flashKey[arrKey(r.id, arr, item, sf, loc)],
                      'box-empty': arrCellState(item, sf, loc) === 'empty',
                      'box-sametr': arrCellState(item, sf, loc) === 'sametr'
                    }"
                  >
                    <div class="ip-loc-head">
                      <span class="flag">{{ loc === 'ru' ? '🇷🇺' : loc === 'kg' ? '🇰🇬' : '🇺🇸' }}</span> {{ loc.toUpperCase() }}
                      <span v-if="isSaving[arrKey(r.id, arr, item, sf, loc)]" class="ip-status ip-status--saving">⏳</span>
                      <span v-else-if="arrCellState(item, sf, loc) === 'ok'" class="ip-status ip-status--ok">✓</span>
                      <span v-else-if="arrCellState(item, sf, loc) === 'sametr'" class="ip-status ip-status--sametr" title="TR ile birebir aynı — henüz çevrilmedi">= TR</span>
                      <span v-else class="ip-status ip-status--empty" title="Boş — müşteriye TR metni gösterilir">• Boş</span>
                      <button
                        v-if="arrCellState(item, sf, loc) === 'empty' && arrTr(item, sf).trim()"
                        class="ip-copytr" type="button" title="TR metnini buraya kopyala (taslak)"
                        @click="copyTrToArrayCell(r.id, arr, item, sf, loc)"
                      >⤵ TR</button>
                    </div>
                    <textarea
                      class="ip-loc-input"
                      :value="arrVal(item, sf, loc)"
                      :placeholder="arrTr(item, sf) || '—'"
                      :disabled="!!isSaving[arrKey(r.id, arr, item, sf, loc)]"
                      @input="(e) => {
                        const el = e.target as HTMLTextAreaElement;
                        setArrVal(item, sf, loc, el.value);
                        el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px';
                      }"
                      @focus="(e) => {
                        const el = e.target as HTMLTextAreaElement;
                        el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px';
                      }"
                      @keydown="(e) => { const ke = e as KeyboardEvent; if ((ke.ctrlKey || ke.metaKey) && ke.key === 'Enter') { ke.preventDefault(); saveArrayCell(r.id, arr, item, sf, loc); } }"
                      @blur="saveArrayCell(r.id, arr, item, sf, loc)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.i18n-prod {
  padding: 16px 20px 24px;
  max-width: 100%;
  color: #1a1a1a;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.i18n-prod::-webkit-scrollbar { width: 8px; height: 8px; }
.i18n-prod::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 4px; }

/* Sticky header */
.ip-head {
  flex-shrink: 0;
  background: #fafaf7;
  border-bottom: 1px solid #e8e4d8;
  margin: -16px -20px 12px;
  padding: 12px 20px 8px;
  z-index: 10;
}
.ip-head-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ip-back {
  background: #fff; border: 1px solid #d6d2c8; color: #1a1a1a;
  padding: 6px 12px; border-radius: 8px; font-family: inherit;
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
}
.ip-back:hover { background: #f3efe7; }
.ip-title { flex: 1; min-width: 200px; }
.ip-title h1 { font-size: 1.2rem; font-weight: 800; margin: 0 0 2px; color: #1a1a1a; display: flex; align-items: center; gap: 6px; }
.ip-count { font-size: 0.85rem; color: #737373; font-weight: 600; }
.ip-sub { color: #525252; margin: 0; font-size: 0.78rem; line-height: 1.4; }
.ip-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ip-search {
  padding: 6px 10px; border: 1px solid #d6d2c8; border-radius: 8px;
  font-family: inherit; font-size: 0.82rem; min-width: 160px;
}
.ip-search:focus { outline: none; border-color: #BC4A3C; box-shadow: 0 0 0 3px rgba(188,74,60,0.12); }
.ip-btn, .ip-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 32px; height: 32px; padding: 0 10px;
  border: 1px solid #d6d2c8; border-radius: 8px; background: #fff;
  color: #1a1a1a; font-family: inherit; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.ip-btn:hover, .ip-toggle:hover { background: #f3efe7; }
.ip-btn:disabled, .ip-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
.ip-toggle.on { background: #BC4A3C; color: #fff; border-color: #BC4A3C; }
.ip-btn--reload { font-size: 1rem; }
.spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.ip-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 8px 12px; border-radius: 8px; margin: 8px 0 0; font-size: 0.82rem; }

/* Empty / loading state */
.ip-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; color: #525252; padding: 48px 16px;
}
.ip-state__icon { font-size: 3.5rem; margin-bottom: 12px; }
.ip-state h3 { font-size: 1.1rem; font-weight: 700; color: #1a1a1a; margin: 0 0 6px; }
.ip-state p { margin: 0; font-size: 0.88rem; }
.ip-link { background: none; border: none; color: #BC4A3C; cursor: pointer; font-weight: 600; padding: 0; text-decoration: underline; font-family: inherit; font-size: inherit; }

/* Cards Layout Container */
.ip-cards-wrap {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
}
.ip-cards-wrap::-webkit-scrollbar { width: 8px; height: 8px; }
.ip-cards-wrap::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 4px; }

.ip-card {
  background: #fff;
  border: 1px solid #e8e4d8;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  overflow: hidden;
}

.ip-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #faf7ef;
  border-bottom: 1px solid #e8e4d8;
}

.ip-card-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ip-card-title code {
  font-family: 'SF Mono', Menlo, monospace; font-size: 0.75rem; color: #737373;
  background: #ebe7de; padding: 2px 6px; border-radius: 4px;
}
.ip-card-name { font-weight: 700; color: #1a1a1a; font-size: 1rem; }
.ip-warn {
  background: #fef3c7; color: #92400e; font-weight: 700;
  font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
}

.ip-card-cov { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; min-width: 180px; }
.ip-loc-chips { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.ip-loc-chip {
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 999px;
  white-space: nowrap; border: 1px solid transparent;
}
.ip-loc-chip.chip-full { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
.ip-loc-chip.chip-mid  { background: #fef3c7; color: #92400e; border-color: #fde68a; }
.ip-loc-chip.chip-low  { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
.cov-text { font-size: 0.8rem; font-weight: 700; color: #525252; min-width: 32px; text-align: right; }
.cov-bar { width: 100%; background: #e8e4d8; height: 6px; border-radius: 3px; overflow: hidden; }
.cov-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }

.ip-card-body { padding: 0; }

.ip-field-row {
  border-bottom: 1px solid #f1ede4;
}
.ip-field-row:last-child { border-bottom: none; }

.ip-field-label {
  padding: 12px 16px 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ip-field-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 0 16px 16px;
}

.ip-locale-box {
  display: flex; flex-direction: column;
  background: #fafaf7; border: 1px solid #e8e4d8;
  border-radius: 8px; padding: 10px;
  position: relative;
}
.ip-locale-tr { background: #f3efe7; border-color: #d6d2c8; }
.ip-loc-head {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem; font-weight: 700; color: #525252;
  margin-bottom: 8px;
}
.flag { font-size: 0.9rem; }

.ip-loc-text {
  font-size: 0.85rem; color: #1a1a1a; line-height: 1.4;
  white-space: pre-wrap; word-wrap: break-word;
}
.tr-stale .ip-loc-text { color: #92400e; }
.ip-stale-tag {
  background: #fde68a; color: #92400e; font-size: 0.65rem; padding: 1px 4px; border-radius: 3px; text-transform: uppercase; margin-left: auto;
}

.ip-loc-input {
  width: 100%; border: 1px solid #d6d2c8; border-radius: 6px;
  padding: 8px; font-family: inherit; font-size: 0.85rem;
  line-height: 1.4; background: #fff; resize: none; overflow-y: hidden;
  box-sizing: border-box; min-height: 40px; transition: border-color 0.15s, box-shadow 0.15s;
}
.ip-loc-input:focus { outline: none; border-color: #BC4A3C; box-shadow: 0 0 0 2px rgba(188,74,60,0.15); }
.ip-loc-input:disabled { opacity: 0.6; cursor: not-allowed; }

.flash { animation: flash 1.2s ease-out; }
@keyframes flash {
  0% { background: #d1fae5; border-color: #34d399; }
  100% { background: #fafaf7; border-color: #e8e4d8; }
}

.ip-status { margin-left: auto; font-size: 0.8rem; }
.ip-status--ok { color: #10b981; }
.ip-status--saving { color: #737373; }
.ip-status--sametr { color: #92400e; font-size: 0.62rem; font-weight: 800; background: #fef3c7; padding: 1px 5px; border-radius: 4px; letter-spacing: 0.02em; }
.ip-status--empty { color: #b45309; font-size: 0.66rem; font-weight: 700; }

/* Draft-from-TR mini button (only shown on empty cells) */
.ip-copytr {
  margin-left: 6px; border: 1px solid #d6d2c8; background: #fff; color: #BC4A3C;
  font-family: inherit; font-size: 0.64rem; font-weight: 800; letter-spacing: 0.02em;
  padding: 1px 6px; border-radius: 5px; cursor: pointer; transition: background 0.12s, border-color 0.12s;
}
.ip-copytr:hover { background: #fbeae6; border-color: #BC4A3C; }

/* Cell state accents — make empty / untranslated cells pop at a glance */
.ip-locale-box.box-empty { border-color: #fcd9b6; background: #fffaf3; }
.ip-locale-box.box-empty .ip-loc-input { border-color: #f3c79a; }
.ip-locale-box.box-sametr { border-color: #fde68a; background: #fffdf5; }

/* Header remaining-work counter */
.ip-empty-count { font-weight: 700; color: #b45309; }
.ip-empty-count--done { color: #10b981; }

/* Responsive adjustments */
@media (max-width: 1200px) {
  .ip-field-content { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .ip-field-content { grid-template-columns: 1fr; }
}

/* Array fields (Faydalar + Accordion) */
.ip-arr { border-top: 1px solid #e8e4d8; background: #fcfbf7; }
.ip-arr-toggle {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: none; border: none; cursor: pointer;
  font-family: inherit; font-size: 0.82rem; font-weight: 700; color: #525252; text-align: left;
}
.ip-arr-toggle:hover { background: #f3efe7; }
.ip-arr-caret { display: inline-block; transition: transform 0.15s; color: #737373; }
.ip-arr-toggle.open .ip-arr-caret { transform: rotate(90deg); }
.ip-arr-spin { margin-left: 6px; font-size: 0.9rem; }
.ip-arr-body { padding: 4px 16px 14px; }
.ip-arr-note { color: #737373; font-size: 0.82rem; padding: 8px 0; }
.ip-arr-group { margin-top: 10px; }
.ip-arr-name { font-size: 0.78rem; font-weight: 800; color: #BC4A3C; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
.ip-arr-count { color: #737373; font-weight: 600; }
.ip-arr-item { border: 1px solid #ece8dd; border-radius: 8px; padding: 8px; margin-bottom: 8px; background: #fff; }
.ip-arr-itemkey { font-family: 'SF Mono', Menlo, monospace; font-size: 0.74rem; color: #525252; margin-bottom: 6px; }
.ip-arr-row { padding: 0 0 8px; }
.ip-arr-row:last-child { padding-bottom: 0; }

/* Compact mode */
.i18n-prod--compact .ip-card-header { padding: 8px 12px; }
.i18n-prod--compact .ip-field-label { padding: 8px 12px 4px; font-size: 0.75rem; }
.i18n-prod--compact .ip-field-content { padding: 0 12px 12px; gap: 8px; }
.i18n-prod--compact .ip-locale-box { padding: 8px; }
.i18n-prod--compact .ip-loc-input { min-height: 32px; padding: 6px; font-size: 0.8rem; }
.i18n-prod--compact .ip-loc-text { font-size: 0.8rem; }
</style>
