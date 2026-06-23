<script setup lang="ts">
// AdminI18nProductView — kept as a thin redirect to the new generic
// /i18n/:model page (which now handles all models in one component).
// Old URL stays alive so any bookmarks keep working.
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTranslate } from '../composables/useTranslate';

const router = useRouter();
const { t } = useTranslate();
onMounted(() => { router.replace('/i18n/products'); });
</script>

<template>
  <div class="i18n-redirect">
    <p>{{ t('admin.i18nProduct.redirecting') }}</p>
  </div>
</template>

<style scoped>
.i18n-redirect { padding: 32px; color: #525252; text-align: center; }
</style>
