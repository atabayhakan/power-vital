<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
  <div class="not-found">
    <div class="nf-card">
      <div class="nf-icon">🔍</div>
      <h1>404</h1>
      <h2>{{ t('notFound.title') }}</h2>
      <p>{{ t('notFound.description') }}</p>
      <router-link to="/" class="btn-primary nf-btn">🏠 {{ t('notFound.button') }}</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-page);
  font-family: var(--font-body);
}
.nf-card {
  text-align: center;
  max-width: 440px;
  padding: 48px 40px;
}
.nf-icon { font-size: 64px; margin-bottom: 16px; }
h1 { font-family: var(--font-display); font-size: 80px; font-weight: 900; color: var(--pv-red); margin: 0; line-height: 1; }
h2 { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 12px 0 8px; }
p { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 28px; }
.nf-btn {
  display: inline-flex;
  text-decoration: none;
}
</style>
