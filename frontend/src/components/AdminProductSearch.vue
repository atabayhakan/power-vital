<script setup lang="ts">
// AdminProductSearch — typeahead search for admin product management.
// Searches by name or barcode; shows price + stock so the admin can
// spot low-stock items at a glance.

import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGet } from '@/api/openapi-client';
import { useSearchAutocomplete } from '../composables/useSearchAutocomplete';

const { t } = useI18n();

export interface ProductResult {
  id: string;
  name: string;
  barcode: string;
  priceKgs: number;
  priceUsd: number;
  stock: number;
  lowStock: boolean;
  category: { id: string; name: string } | null;
}

const emit = defineEmits<{
  (e: 'select', product: ProductResult): void;
  (e: 'submit', product: ProductResult): void;
}>();

const search = useSearchAutocomplete<ProductResult>({
  fetcher: async (q) => {
    const { data } = await apiGet('/api/v1/admin/search/products', { query: { q, limit: 10 } });
    const envelope = data as unknown as { results?: ProductResult[] };
    return envelope.results || [];
  },
  debounceMs: 200,
  minLength: 2
});

const highlightedIndex = ref(-1);
watch(search.query, () => { highlightedIndex.value = -1; });

const onKeyDown = (e: KeyboardEvent) => {
  if (!search.isOpen.value || search.results.value.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex.value = Math.min(search.results.value.length - 1, highlightedIndex.value + 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex.value = Math.max(0, highlightedIndex.value - 1);
  } else if (e.key === 'Enter' && highlightedIndex.value >= 0) {
    e.preventDefault();
    const item = search.results.value[highlightedIndex.value];
    emit('submit', item);
    search.select(item);
  } else if (e.key === 'Escape') {
    search.clear();
  }
};

const fmtKgs = (n: number) => n.toLocaleString('ru-RU');
</script>

<template>
  <div class="aps-wrap">
    <div class="aps-input-row">
      <span class="aps-icon">🔍</span>
      <input
        v-model="search.query.value"
        class="aps-input"
        type="search"
        :placeholder="t('admin.search.productPlaceholder')"
        autocomplete="off"
        spellcheck="false"
        @keydown="onKeyDown"
        @blur="search.onBlur()"
        @focus="search.hasQuery.value && (search.isOpen.value = search.results.value.length > 0)"
        aria-autocomplete="list"
        :aria-expanded="search.isOpen.value"
        aria-controls="aps-listbox"
      />
      <button
        v-if="search.query.value"
        class="aps-clear"
        type="button"
        @click="search.clear()"
        :aria-label="t('common.close')"
      >×</button>
    </div>

    <div v-if="search.loading.value" class="aps-state">⏳ {{ t('common.loading') }}</div>
    <div v-else-if="search.error.value" class="aps-state aps-state--err">❌ {{ search.error.value }}</div>
    <div
      v-else-if="search.isOpen.value && search.results.value.length === 0"
      class="aps-state"
    >{{ t('admin.search.noResults') }}</div>

    <ul
      v-if="search.isOpen.value && search.results.value.length > 0"
      id="aps-listbox"
      class="aps-list"
      role="listbox"
    >
      <li
        v-for="(p, i) in search.results.value"
        :key="p.id"
        class="aps-item"
        :class="{ 'aps-item--highlight': i === highlightedIndex, 'aps-item--low': p.lowStock }"
        role="option"
        :aria-selected="i === highlightedIndex"
        @mousedown.prevent="emit('select', p); search.select(p)"
      >
        <div class="aps-item__main">
          <div class="aps-item__name">
            {{ p.name }}
            <span v-if="p.lowStock" class="aps-low-badge" :title="t('admin.search.lowStock')">⚠️ {{ t('admin.search.lowStock') }}</span>
          </div>
          <div class="aps-item__barcode">{{ p.barcode }}</div>
        </div>
        <div class="aps-item__meta">
          <span v-if="p.category" class="aps-cat">{{ p.category.name }}</span>
          <span class="aps-price">{{ fmtKgs(p.priceKgs) }} KGS</span>
          <span class="aps-stock" :class="{ 'aps-stock--low': p.stock <= 5 }">{{ p.stock }} {{ t('admin.search.pcs') }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.aps-wrap { position: relative; width: 100%; }
.aps-input-row {
  display: flex; align-items: center;
  background: #fff; border: 1px solid #d1d5db; border-radius: 8px;
  padding: 0 0.5rem; transition: border-color 0.15s, box-shadow 0.15s;
}
.aps-input-row:focus-within {
  border-color: #b91c1c;
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.15);
}
.aps-icon { color: #6b7280; margin-right: 0.4rem; font-size: 0.95rem; }
.aps-input {
  flex: 1; border: 0; outline: 0;
  padding: 0.55rem 0; font-size: 0.95rem; background: transparent;
  color: #1a1a1a;
}
.aps-clear {
  background: none; border: 0; cursor: pointer;
  color: #6b7280; font-size: 1.3rem; line-height: 1; padding: 0 0.4rem;
}
.aps-clear:hover { color: #1a1a1a; }

.aps-state {
  position: absolute; top: 100%; left: 0; right: 0;
  margin-top: 0.3rem; padding: 0.75rem 0.85rem;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  font-size: 0.85rem; color: #6b7280; z-index: 100;
}
.aps-state--err { color: #b91c1c; }

.aps-list {
  position: absolute; top: 100%; left: 0; right: 0;
  margin: 0.3rem 0 0; padding: 0.3rem 0;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  max-height: 320px; overflow-y: auto;
  list-style: none; z-index: 100;
}
.aps-item {
  display: flex; justify-content: space-between; align-items: center;
  gap: 0.75rem; padding: 0.55rem 0.85rem;
  cursor: pointer; transition: background 0.1s;
}
.aps-item:hover, .aps-item--highlight { background: #fef2f2; }
.aps-item--low { border-left: 3px solid #f59e0b; }
.aps-item__main { min-width: 0; flex: 1; }
.aps-item__name {
  font-weight: 600; color: #1a1a1a;
  display: flex; gap: 0.4rem; align-items: center;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.aps-item__barcode {
  font-size: 0.75rem; color: #6b7280; font-family: ui-monospace, monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.aps-item__meta {
  display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0;
  font-size: 0.78rem;
}
.aps-cat { color: #6b7280; font-weight: 600; }
.aps-price { color: #b91c1c; font-weight: 700; font-family: ui-monospace, monospace; }
.aps-stock { color: #047857; font-weight: 600; }
.aps-stock--low { color: #b91c1c; }
.aps-low-badge {
  font-size: 0.7rem; font-weight: 700;
  padding: 0.1rem 0.4rem; border-radius: 999px;
  background: #fef3c7; color: #92400e;
}
</style>
