<script setup lang="ts">
// AdminI18nUiStringsView — edit the STATIC storefront UI strings (button
// labels, nav, system messages) that ship in the bundled locale JSON.
//
// The bundled tr/ru/kg JSON files are the source of truth for the KEY LIST and
// the DEFAULT text. The admin's edits are stored as overrides in the backend
// (SiteSettings.uiTranslations) and merged into vue-i18n at storefront boot,
// so any on-screen text becomes editable without a code change / rebuild.
//
// URL: /i18n/ui-strings
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet, apiPatch } from '@/api/openapi-client';
import { useToast } from '../composables/useToast';
import { useTranslate } from '../composables/useTranslate';
import trDefaults from '../locales/tr.json';
import ruDefaults from '../locales/ru.json';
import kgDefaults from '../locales/kg.json';

const toast = useToast();
const router = useRouter();
const { t } = useTranslate();

type UiLocale = 'tr' | 'ru' | 'kg';
const LOCALES: UiLocale[] = ['tr', 'ru', 'kg'];
const FLAG: Record<UiLocale, string> = { tr: '🇹🇷', ru: '🇷🇺', kg: '🇰🇬' };
const LOC_LABEL: Record<UiLocale, string> = { tr: 'TR (Kaynak)', ru: 'RU', kg: 'KG' };

// ── Flatten a nested locale object into { "a.b.c": "value" } ───────────────
const flatten = (obj: any, prefix = '', out: Record<string, string> = {}): Record<string, string> => {
  for (const k of Object.keys(obj || {})) {
    const val = obj[k];
    const path = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        if (v && typeof v === 'object') flatten(v, `${path}.${i}`, out);
        else out[`${path}.${i}`] = v == null ? '' : String(v);
      });
    } else if (val && typeof val === 'object') {
      flatten(val, path, out);
    } else {
      out[path] = val == null ? '' : String(val);
    }
  }
  return out;
};

const defaults: Record<UiLocale, Record<string, string>> = {
  tr: flatten(trDefaults),
  ru: flatten(ruDefaults),
  kg: flatten(kgDefaults),
};

// Master key list — union across locales (TR is source, others have parity).
const allKeys: string[] = (() => {
  const set = new Set<string>();
  for (const loc of LOCALES) for (const k of Object.keys(defaults[loc])) set.add(k);
  return Array.from(set).sort();
})();

// Overrides (flattened) loaded from the backend + a draft the inputs bind to.
const overrides = reactive<Record<UiLocale, Record<string, string>>>({ tr: {}, ru: {}, kg: {} });
const draft = reactive<Record<string, Record<UiLocale, string>>>({});

const isLoading = ref(false);
const search = ref('');
const onlyOverridden = ref(false);
const onlySameTr = ref(false);
const expanded = reactive<Record<string, boolean>>({});
const isSaving = reactive<Record<string, boolean>>({});
const flash = reactive<Record<string, number>>({});

const effective = (key: string, loc: UiLocale) =>
  overrides[loc]?.[key] ?? defaults[loc]?.[key] ?? '';

const load = async () => {
  isLoading.value = true;
  try {
    const { data } = await apiGet('/api/v1/admin/i18n/ui-strings');
    const ov = (data as unknown as { overrides?: Record<string, Record<string, string>> }).overrides || {};
    for (const loc of LOCALES) overrides[loc] = flatten(ov[loc] || {});
    for (const k of allKeys) {
      draft[k] = { tr: effective(k, 'tr'), ru: effective(k, 'ru'), kg: effective(k, 'kg') };
    }
  } catch (e: any) {
    toast.error('Yüklenemedi', e?.response?.data?.error || e.message);
  } finally {
    isLoading.value = false;
  }
};
onMounted(load);

// ── Filtering ──────────────────────────────────────────────────────────────
const isOverridden = (key: string, loc?: UiLocale) =>
  loc ? overrides[loc]?.[key] != null
      : (overrides.tr[key] != null || overrides.ru[key] != null || overrides.kg[key] != null);

const isSameTr = (key: string, loc: UiLocale) => {
  if (loc === 'tr') return false;
  const v = (draft[key]?.[loc] ?? '').trim();
  return v.length > 0 && v === (draft[key]?.tr ?? '').trim();
};

const matches = (k: string): boolean => {
  if (onlyOverridden.value && !isOverridden(k)) return false;
  if (onlySameTr.value && !(isSameTr(k, 'ru') || isSameTr(k, 'kg'))) return false;
  if (search.value) {
    const q = search.value.toLowerCase();
    if (k.toLowerCase().includes(q)) return true;
    for (const loc of LOCALES) if ((draft[k]?.[loc] || '').toLowerCase().includes(q)) return true;
    return false;
  }
  return true;
};

const filteredKeys = computed(() => allKeys.filter(matches));

// Group by top-level namespace (first path segment).
const groups = computed(() => {
  const g: Record<string, string[]> = {};
  for (const k of filteredKeys.value) {
    const ns = k.includes('.') ? k.split('.')[0] : '(genel)';
    (g[ns] = g[ns] || []).push(k);
  }
  return g;
});
const groupNames = computed(() => Object.keys(groups.value).sort());

const overriddenCount = computed(() => allKeys.filter((k) => isOverridden(k)).length);
const sameTrCount = computed(() => allKeys.filter((k) => isSameTr(k, 'ru') || isSameTr(k, 'kg')).length);

const searching = computed(() => !!search.value || onlyOverridden.value || onlySameTr.value);
const isExpanded = (ns: string) => searching.value || !!expanded[ns];
const toggleGroup = (ns: string) => { expanded[ns] = !expanded[ns]; };
const groupOverridden = (ns: string) => groups.value[ns].filter((k) => isOverridden(k)).length;

// ── Saving ───────────────────────────────────────────────────────────────
const onSave = async (key: string, loc: UiLocale) => {
  const val = draft[key]?.[loc] ?? '';
  const def = defaults[loc]?.[key] ?? '';
  // Editing back to the bundled default removes the override (revert).
  const sendVal = val === def ? '' : val;
  const existing = overrides[loc]?.[key];
  if (sendVal === '' && existing == null) return;     // already default, nothing stored
  if (sendVal !== '' && existing === sendVal) return; // unchanged from stored override

  const sk = `${key}|${loc}`;
  isSaving[sk] = true;
  try {
    await apiPatch('/api/v1/admin/i18n/ui-strings', {
      locale: loc as 'tr' | 'ru' | 'kg',
      key,
      value: sendVal,
    });
    if (sendVal === '') delete overrides[loc][key];
    else overrides[loc][key] = val;
    flash[sk] = Date.now();
    setTimeout(() => { delete flash[sk]; }, 1000);
  } catch (e: any) {
    toast.error('Kaydedilemedi', e?.response?.data?.error || e.message);
  } finally {
    delete isSaving[sk];
  }
};

const revert = (key: string, loc: UiLocale) => {
  draft[key][loc] = defaults[loc]?.[key] ?? '';
  onSave(key, loc);
};

// Copy TR into a target cell as a starting draft.
const copyTr = (key: string, loc: 'ru' | 'kg') => {
  draft[key][loc] = draft[key]?.tr ?? '';
  onSave(key, loc);
};

const onKeydown = (e: KeyboardEvent, key: string, loc: UiLocale) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    onSave(key, loc);
  }
};

const goBack = () => router.push('/i18n');
const clearFilters = () => { search.value = ''; onlyOverridden.value = false; onlySameTr.value = false; };
</script>

<template>
  <div class="ui18n">
    <!-- Header -->
    <header class="ui-head">
      <div class="ui-head-row">
        <button class="ui-back" @click="goBack" title="Çeviri Merkezi'ne dön">← Geri</button>
        <div class="ui-title">
          <h1>🔤 {{ t('admin.i18nUi.title') }} <span class="ui-count">({{ filteredKeys.length }}/{{ allKeys.length }})</span></h1>
          <p class="ui-sub">
            {{ t('admin.i18nUi.subtitle') }}
            <span class="ui-stat">{{ t('admin.i18nUi.overridden', { n: overriddenCount }) }}</span>
            <span v-if="sameTrCount" class="ui-stat ui-stat--warn">{{ t('admin.i18nUi.sameAsTr', { n: sameTrCount }) }}</span>
          </p>
        </div>
        <div class="ui-actions">
          <input v-model="search" type="text" class="ui-search" placeholder="🔍 Anahtar veya metin ara…" />
          <button class="ui-toggle" :class="{ on: onlyOverridden }" @click="onlyOverridden = !onlyOverridden" title="Sadece değiştirilenler">
            {{ t('admin.i18nUi.modified') }}
          </button>
          <button class="ui-toggle" :class="{ on: onlySameTr }" @click="onlySameTr = !onlySameTr" title="RU/KG değeri TR ile birebir aynı (çevrilmemiş)">
            = TR
          </button>
          <button class="ui-btn" :disabled="isLoading" @click="load" title="Yenile"><span :class="{ spin: isLoading }">↻</span></button>
        </div>
      </div>
    </header>

    <!-- States -->
    <div v-if="isLoading" class="ui-state"><div class="ui-state__icon">⏳</div><p>{{ t('admin.i18nUi.loading') }}</p></div>
    <div v-else-if="filteredKeys.length === 0" class="ui-state">
      <div class="ui-state__icon">🔍</div>
      <h3>{{ t('admin.i18nUi.noResults') }}</h3>
      <p><button class="ui-link" @click="clearFilters">Filtreleri temizle</button></p>
    </div>

    <!-- Groups -->
    <div v-else class="ui-groups">
      <section v-for="ns in groupNames" :key="ns" class="ui-group">
        <button class="ui-group-head" @click="toggleGroup(ns)">
          <span class="ui-group-caret" :class="{ open: isExpanded(ns) }">▸</span>
          <span class="ui-group-name">{{ ns }}</span>
          <span class="ui-group-meta">{{ groups[ns].length }} anahtar</span>
          <span v-if="groupOverridden(ns)" class="ui-group-badge">✎ {{ groupOverridden(ns) }}</span>
        </button>

        <div v-if="isExpanded(ns)" class="ui-rows">
          <div v-for="k in groups[ns]" :key="k" class="ui-row">
            <div class="ui-key">
              <code>{{ k }}</code>
              <span v-if="isOverridden(k)" class="ui-key-badge" title="Bu anahtar değiştirildi">✎</span>
            </div>
            <div class="ui-cells">
              <div
                v-for="loc in LOCALES"
                :key="loc"
                class="ui-cell"
                :class="{
                  flash: !!flash[k + '|' + loc],
                  'cell-override': isOverridden(k, loc),
                  'cell-sametr': isSameTr(k, loc)
                }"
              >
                <div class="ui-cell-head">
                  <span class="flag">{{ FLAG[loc] }}</span> {{ LOC_LABEL[loc] }}
                  <span v-if="isSaving[k + '|' + loc]" class="ui-mk ui-mk--saving">⏳</span>
                  <span v-else-if="isSameTr(k, loc)" class="ui-mk ui-mk--sametr" title="TR ile birebir aynı — henüz çevrilmedi">= TR</span>
                  <span v-else-if="isOverridden(k, loc)" class="ui-mk ui-mk--ok" title="Değiştirildi">✎</span>
                  <button v-if="loc !== 'tr' && !(draft[k]?.[loc] || '').trim()" class="ui-copytr" type="button" title="TR metnini kopyala" @click="copyTr(k, loc as 'ru'|'kg')">⤵ TR</button>
                  <button v-if="isOverridden(k, loc)" class="ui-revert" type="button" title="Varsayılana döndür" @click="revert(k, loc)">↺</button>
                </div>
                <textarea
                  class="ui-input"
                  :value="draft[k]?.[loc] || ''"
                  :placeholder="defaults[loc]?.[k] || '—'"
                  :disabled="!!isSaving[k + '|' + loc]"
                  rows="1"
                  @input="(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    if (draft[k]) draft[k][loc] = el.value;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }"
                  @focus="(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }"
                  @keydown="(e) => onKeydown(e as KeyboardEvent, k, loc)"
                  @blur="onSave(k, loc)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ui18n {
  padding: 16px 20px 24px;
  color: #1a1a1a;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Header */
.ui-head { flex-shrink: 0; background: #fafaf7; border-bottom: 1px solid #e8e4d8; margin: -16px -20px 12px; padding: 12px 20px 8px; }
.ui-head-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ui-back { background: #fff; border: 1px solid #d6d2c8; color: #1a1a1a; padding: 6px 12px; border-radius: 8px; font-family: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.ui-back:hover { background: #f3efe7; }
.ui-title { flex: 1; min-width: 220px; }
.ui-title h1 { font-size: 1.2rem; font-weight: 800; margin: 0 0 2px; display: flex; align-items: center; gap: 6px; }
.ui-count { font-size: 0.85rem; color: #737373; font-weight: 600; }
.ui-sub { color: #525252; margin: 0; font-size: 0.78rem; line-height: 1.45; max-width: 760px; }
.ui-stat { font-weight: 700; color: #525252; }
.ui-stat--warn { color: #b45309; }
.ui-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ui-search { padding: 6px 10px; border: 1px solid #d6d2c8; border-radius: 8px; font-family: inherit; font-size: 0.82rem; min-width: 200px; }
.ui-search:focus { outline: none; border-color: #BC4A3C; box-shadow: 0 0 0 3px rgba(188,74,60,0.12); }
.ui-btn, .ui-toggle { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 10px; border: 1px solid #d6d2c8; border-radius: 8px; background: #fff; color: #1a1a1a; font-family: inherit; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.ui-btn:hover, .ui-toggle:hover { background: #f3efe7; }
.ui-toggle.on { background: #BC4A3C; color: #fff; border-color: #BC4A3C; }
.spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* States */
.ui-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #525252; padding: 48px 16px; }
.ui-state__icon { font-size: 3rem; margin-bottom: 10px; }
.ui-state h3 { margin: 0 0 6px; color: #1a1a1a; }
.ui-link { background: none; border: none; color: #BC4A3C; cursor: pointer; font-weight: 600; text-decoration: underline; font-family: inherit; font-size: inherit; }

/* Groups */
.ui-groups { flex: 1; overflow-y: auto; padding-bottom: 24px; }
.ui-groups::-webkit-scrollbar { width: 8px; }
.ui-groups::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
.ui-group { margin-bottom: 10px; border: 1px solid #e8e4d8; border-radius: 12px; overflow: hidden; background: #fff; }
.ui-group-head { width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #faf7ef; border: none; cursor: pointer; font-family: inherit; text-align: left; }
.ui-group-head:hover { background: #f3efe7; }
.ui-group-caret { display: inline-block; transition: transform 0.15s; color: #737373; font-size: 0.8rem; }
.ui-group-caret.open { transform: rotate(90deg); }
.ui-group-name { font-weight: 800; font-size: 0.95rem; color: #1a1a1a; }
.ui-group-meta { font-size: 0.75rem; color: #737373; }
.ui-group-badge { margin-left: auto; background: #dcfce7; color: #166534; font-weight: 700; font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; }

.ui-rows { border-top: 1px solid #e8e4d8; }
.ui-row { padding: 10px 16px; border-bottom: 1px solid #f1ede4; }
.ui-row:last-child { border-bottom: none; }
.ui-key { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.ui-key code { font-family: 'SF Mono', Menlo, monospace; font-size: 0.74rem; color: #525252; background: #ebe7de; padding: 2px 7px; border-radius: 5px; word-break: break-all; }
.ui-key-badge { color: #166534; font-size: 0.72rem; font-weight: 800; }

.ui-cells { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.ui-cell { display: flex; flex-direction: column; background: #fafaf7; border: 1px solid #e8e4d8; border-radius: 8px; padding: 8px; }
.ui-cell.cell-override { border-color: #bbf7d0; background: #f6fdf8; }
.ui-cell.cell-sametr { border-color: #fde68a; background: #fffdf5; }
.ui-cell-head { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; color: #525252; margin-bottom: 6px; }
.flag { font-size: 0.85rem; }
.ui-mk { margin-left: auto; font-size: 0.7rem; font-weight: 700; }
.ui-mk--ok { color: #16a34a; }
.ui-mk--saving { color: #737373; }
.ui-mk--sametr { color: #92400e; background: #fef3c7; padding: 1px 5px; border-radius: 4px; font-size: 0.62rem; }
.ui-copytr { margin-left: 6px; border: 1px solid #d6d2c8; background: #fff; color: #BC4A3C; font-family: inherit; font-size: 0.62rem; font-weight: 800; padding: 1px 6px; border-radius: 5px; cursor: pointer; }
.ui-copytr:hover { background: #fbeae6; border-color: #BC4A3C; }
.ui-mk + .ui-copytr, .ui-mk + .ui-revert { margin-left: 6px; }
.ui-revert { margin-left: 6px; border: 1px solid #d6d2c8; background: #fff; color: #737373; font-family: inherit; font-size: 0.72rem; font-weight: 700; padding: 0 6px; border-radius: 5px; cursor: pointer; line-height: 1.4; }
.ui-revert:hover { background: #f3efe7; color: #1a1a1a; }
.ui-input { width: 100%; border: 1px solid #d6d2c8; border-radius: 6px; padding: 7px; font-family: inherit; font-size: 0.84rem; line-height: 1.4; background: #fff; resize: none; overflow-y: hidden; box-sizing: border-box; min-height: 34px; transition: border-color 0.15s, box-shadow 0.15s; }
.ui-input:focus { outline: none; border-color: #BC4A3C; box-shadow: 0 0 0 2px rgba(188,74,60,0.15); }
.ui-input:disabled { opacity: 0.6; }
.flash { animation: flashfx 1s ease-out; }
@keyframes flashfx { 0% { background: #d1fae5; border-color: #34d399; } 100% { background: #fafaf7; border-color: #e8e4d8; } }

@media (max-width: 900px) { .ui-cells { grid-template-columns: 1fr; } }
</style>
