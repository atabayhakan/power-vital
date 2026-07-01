<script setup lang="ts">
// SearchBar — an inline search input for the global navbar. As the
// visitor types, we fire a debounced query to /api/v1/products?search=
// and show the first 5 hits as a dropdown. Picking one navigates to
// the PDP; pressing Enter navigates to /katalog?q= for the full
// results page.
//
// We deliberately cap the live suggestions at 5 to keep the dropdown
// tight and to avoid hammering the backend on every keystroke.
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useTranslate } from '../../composables/useTranslate';

const router = useRouter();
const { t } = useTranslate();

const query = ref('');
const suggestions = ref<any[]>([]);
const isOpen = ref(false);
const isLoading = ref(false);
const activeIndex = ref(-1);
let debounceHandle: number | null = null;
let abortCtrl: AbortController | null = null;

const isActive = computed(() => isOpen.value && (query.value.trim().length >= 2));
const hasResults = computed(() => isActive.value && suggestions.value.length > 0);

const fetchSuggestions = async (q: string) => {
  if (abortCtrl) abortCtrl.abort();
  abortCtrl = new AbortController();
  isLoading.value = true;
  try {
    const res = await axios.get(`/api/v1/products?search=${encodeURIComponent(q)}&limit=5`, {
      signal: abortCtrl.signal
    });
    if (Array.isArray(res.data)) {
      suggestions.value = res.data;
    }
  } catch (e: any) {
    if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
      suggestions.value = [];
    }
  } finally {
    isLoading.value = false;
  }
};

watch(query, (newQ) => {
  if (debounceHandle) window.clearTimeout(debounceHandle);
  const trimmed = newQ.trim();
  if (trimmed.length < 2) {
    suggestions.value = [];
    isOpen.value = false;
    return;
  }
  isOpen.value = true;
  debounceHandle = window.setTimeout(() => fetchSuggestions(trimmed), 280);
});

const onSelect = (p: any) => {
  isOpen.value = false;
  query.value = '';
  router.push(`/product/${p.id}`);
};

const onEnter = () => {
  const q = query.value.trim();
  if (!q) return;
  isOpen.value = false;
  router.push({ path: '/katalog', query: { q } });
};

const onKeyDown = (e: KeyboardEvent) => {
  if (!isActive.value) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (e.key === 'Enter') {
    if (activeIndex.value >= 0 && activeIndex.value < suggestions.value.length) {
      e.preventDefault();
      onSelect(suggestions.value[activeIndex.value]);
    } else {
      onEnter();
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false;
  }
};

const onBlur = () => {
  // Delay close so a click on a suggestion can still register.
  setTimeout(() => { isOpen.value = false; }, 150);
};
const onFocus = () => {
  if (query.value.trim().length >= 2) isOpen.value = true;
};

const priceFor = (p: any): string => {
  const kgs = Number(p.basePriceKgs || 0);
  if (!isFinite(kgs) || kgs <= 0) return '';
  return `${Math.round(kgs).toLocaleString('tr-TR')} KGS`;
};

const imageOf = (p: any): string => {
  const img = Array.isArray(p.images) ? p.images[0] : null;
  return typeof img === 'string' ? img : (img?.imageUrl || '');
};

onBeforeUnmount(() => {
  if (debounceHandle) window.clearTimeout(debounceHandle);
  if (abortCtrl) abortCtrl.abort();
});
</script>

<template>
  <div class="gs-wrap" :class="{ 'is-open': hasResults }">
    <form class="gs-form" @submit.prevent="onEnter" role="search">
      <span class="gs-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"/>
          <path d="m20 20-3.5-3.5"/>
        </svg>
      </span>
      <input
        v-model="query"
        type="search"
        class="gs-input"
        :placeholder="t('search.placeholder')"
        :aria-label="t('search.placeholder')"
        autocomplete="off"
        @keydown="onKeyDown"
        @focus="onFocus"
        @blur="onBlur"
      />
      <button v-if="query" type="button" class="gs-clear" :aria-label="t('search.clear')" @click="query = ''; isOpen = false;">
        ✕
      </button>
    </form>

    <div v-if="isOpen" class="gs-dropdown" role="listbox">
      <div v-if="isLoading" class="gs-status">{{ t('search.searching') }}</div>
      <div v-else-if="suggestions.length === 0" class="gs-status">
        {{ t('search.noResults', { q: query }) }}
      </div>
      <button
        v-for="(p, idx) in suggestions"
        :key="p.id"
        type="button"
        class="gs-item"
        :class="{ 'is-active': idx === activeIndex }"
        @mousedown.prevent="onSelect(p)"
        @mouseenter="activeIndex = idx"
        role="option"
      >
        <span class="gs-thumb">
          <img v-if="imageOf(p)" :src="imageOf(p)" :alt="p.name" />
          <span v-else class="gs-noimg">📦</span>
        </span>
        <span class="gs-info">
          <span class="gs-name">{{ p.name }}</span>
          <span class="gs-cat" v-if="p.category">{{ p.category }}</span>
        </span>
        <span class="gs-price">{{ priceFor(p) }}</span>
      </button>
      <button v-if="suggestions.length > 0" type="button" class="gs-all" @mousedown.prevent="onEnter">
        {{ t('search.viewAll', { q: query }) }} →
      </button>
    </div>
  </div>
</template>

<style scoped>
.gs-wrap {
  position: relative;
  width: 100%;
  max-width: 520px;
}

.gs-form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  background: var(--surface-white, #fff);
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.gs-form:focus-within {
  border-color: var(--pv-red, #BC4A3C);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--pv-red, #BC4A3C) 18%, transparent);
}

.gs-icon {
  display: flex;
  align-items: center;
  color: var(--text-muted, #71717a);
  flex-shrink: 0;
}

.gs-input {
  border: none;
  background: transparent;
  flex: 1;
  font-family: var(--font-body);
  font-size: 0.92rem;
  color: var(--text-primary, #18181b);
  outline: none;
  width: 100%;
  padding: 0;
  min-width: 0;
}
.gs-input::placeholder { color: var(--text-muted, #71717a); }
/* Hide the native search-clear X — we provide our own */
.gs-input::-webkit-search-cancel-button { -webkit-appearance: none; }

.gs-clear {
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-muted, #71717a);
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}
.gs-clear:hover { background: rgba(0, 0, 0, 0.12); }

/* Dropdown */
.gs-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--surface-white, #fff);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.10),
    0 2px 8px rgba(0, 0, 0, 0.04);
  z-index: 200;
  max-height: 460px;
  overflow-y: auto;
  padding: 6px;
}

.gs-status {
  padding: 16px 14px;
  text-align: center;
  color: var(--text-muted, #71717a);
  font-size: 0.88rem;
}

.gs-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: background 0.12s;
}
.gs-item:hover,
.gs-item.is-active { background: rgba(188, 74, 60, 0.06); }

.gs-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.gs-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 2px; }
.gs-noimg { font-size: 1.2rem; opacity: 0.4; }

.gs-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.gs-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary, #18181b);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gs-cat {
  font-size: 0.74rem;
  color: var(--text-muted, #71717a);
  margin-top: 2px;
}

.gs-price {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--pv-red, #BC4A3C);
  flex-shrink: 0;
}

.gs-all {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--pv-red, #BC4A3C);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.86rem;
  text-align: center;
  cursor: pointer;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0 0 10px 10px;
  margin-top: 4px;
}
.gs-all:hover { background: rgba(188, 74, 60, 0.06); }

@media (max-width: 640px) {
  .gs-wrap { max-width: 100%; }
  .gs-form { height: 36px; }
  .gs-input { font-size: 0.86rem; }
}
</style>
