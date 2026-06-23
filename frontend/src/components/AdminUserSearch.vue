<script setup lang="ts">
// AdminUserSearch — typeahead search input for admin user management.
//
// Wraps useSearchAutocomplete with a simple dropdown UI. Emits the
// selected user object so the parent (UserManagementView) can do
// something useful — typically: navigate to the detail page, open an
// action menu, or add the user to a bulk-select list.

import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGet } from '@/api/openapi-client';
import { useSearchAutocomplete } from '../composables/useSearchAutocomplete';

const { t } = useI18n();

export interface UserResult {
  id: string;
  name: string;
  email: string;
  role: string;
  walletKgs: number;
  walletUsd: number;
  isActive: boolean;
}

const emit = defineEmits<{
  (e: 'select', user: UserResult): void;
  (e: 'submit', user: UserResult): void; // Enter on highlighted item
}>();

const search = useSearchAutocomplete<UserResult>({
  fetcher: async (q) => {
    const { data } = await apiGet('/api/v1/admin/search/users', { query: { q, limit: 10 } });
    const envelope = data as unknown as { results?: UserResult[] };
    return envelope.results || [];
  },
  debounceMs: 200,
  minLength: 2
});

// Keyboard navigation: ArrowDown/Up + Enter.
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

const roleLabel = (role: string) => t(`admin.role.${role}`, role);

const fmtKgs = (n: number) => n.toLocaleString('ru-RU');
</script>

<template>
  <div class="aus-wrap">
    <div class="aus-input-row">
      <span class="aus-icon">🔍</span>
      <input
        v-model="search.query.value"
        class="aus-input"
        type="search"
        :placeholder="t('admin.search.userPlaceholder')"
        autocomplete="off"
        spellcheck="false"
        @keydown="onKeyDown"
        @blur="search.onBlur()"
        @focus="search.hasQuery.value && (search.isOpen.value = search.results.value.length > 0)"
        aria-autocomplete="list"
        :aria-expanded="search.isOpen.value"
        aria-controls="aus-listbox"
      />
      <button
        v-if="search.query.value"
        class="aus-clear"
        type="button"
        @click="search.clear()"
        :aria-label="t('common.close')"
      >×</button>
    </div>

    <div v-if="search.loading.value" class="aus-state">⏳ {{ t('common.loading') }}</div>
    <div v-else-if="search.error.value" class="aus-state aus-state--err">❌ {{ search.error.value }}</div>
    <div
      v-else-if="search.isOpen.value && search.results.value.length === 0"
      class="aus-state"
    >{{ t('admin.search.noResults') }}</div>

    <ul
      v-if="search.isOpen.value && search.results.value.length > 0"
      id="aus-listbox"
      class="aus-list"
      role="listbox"
    >
      <li
        v-for="(u, i) in search.results.value"
        :key="u.id"
        class="aus-item"
        :class="{ 'aus-item--highlight': i === highlightedIndex }"
        role="option"
        :aria-selected="i === highlightedIndex"
        @mousedown.prevent="emit('select', u); search.select(u)"
      >
        <div class="aus-item__main">
          <div class="aus-item__name">{{ u.name }}</div>
          <div class="aus-item__email">{{ u.email }}</div>
        </div>
        <div class="aus-item__meta">
          <span class="aus-role" :class="`aus-role--${u.role}`">{{ roleLabel(u.role) }}</span>
          <span v-if="u.walletKgs > 0" class="aus-wallet">{{ fmtKgs(u.walletKgs) }} KGS</span>
          <span v-if="!u.isActive" class="aus-flag">⚠️</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.aus-wrap {
  position: relative; width: 100%;
}
.aus-input-row {
  display: flex; align-items: center;
  background: #fff; border: 1px solid #d1d5db; border-radius: 8px;
  padding: 0 0.5rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.aus-input-row:focus-within {
  border-color: #b91c1c;
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.15);
}
.aus-icon { color: #6b7280; margin-right: 0.4rem; font-size: 0.95rem; }
.aus-input {
  flex: 1; border: 0; outline: 0;
  padding: 0.55rem 0;
  font-size: 0.95rem; background: transparent;
  color: #1a1a1a;
}
.aus-clear {
  background: none; border: 0; cursor: pointer;
  color: #6b7280; font-size: 1.3rem; line-height: 1;
  padding: 0 0.4rem;
}
.aus-clear:hover { color: #1a1a1a; }

.aus-state {
  position: absolute; top: 100%; left: 0; right: 0;
  margin-top: 0.3rem; padding: 0.75rem 0.85rem;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  font-size: 0.85rem; color: #6b7280; z-index: 100;
}
.aus-state--err { color: #b91c1c; }

.aus-list {
  position: absolute; top: 100%; left: 0; right: 0;
  margin: 0.3rem 0 0; padding: 0.3rem 0;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  max-height: 320px; overflow-y: auto;
  list-style: none; z-index: 100;
}
.aus-item {
  display: flex; justify-content: space-between; align-items: center;
  gap: 0.75rem; padding: 0.55rem 0.85rem;
  cursor: pointer; transition: background 0.1s;
}
.aus-item:hover, .aus-item--highlight {
  background: #fef2f2;
}
.aus-item__main { min-width: 0; flex: 1; }
.aus-item__name {
  font-weight: 600; color: #1a1a1a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.aus-item__email {
  font-size: 0.75rem; color: #6b7280; font-family: ui-monospace, monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.aus-item__meta {
  display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0;
}
.aus-role {
  display: inline-block; padding: 0.15rem 0.5rem;
  border-radius: 999px; font-size: 0.7rem; font-weight: 700;
  background: #e5e7eb; color: #4b5563;
}
.aus-role--admin { background: #fee2e2; color: #991b1b; }
.aus-role--distributor { background: #dbeafe; color: #1e3a8a; }
.aus-role--cashier { background: #fef3c7; color: #92400e; }
.aus-role--dealer { background: #d1fae5; color: #065f46; }
.aus-wallet {
  font-size: 0.75rem; color: #4b5563;
  font-family: ui-monospace, monospace;
}
.aus-flag {
  font-size: 0.9rem;
}
</style>
