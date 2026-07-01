<script setup lang="ts">
import { useTranslate } from '../composables/useTranslate';
const { t } = useTranslate();
</script>

<template>
  <div class="page-wrap">
    <main class="container page-main">
      <section class="about-hero">
        <h1>{{ t('about.title') }}</h1>
        <p class="subtitle">{{ t('about.subtitle') }}</p>
      </section>

      <section class="about-content">
        <div class="about-block">
          <h2>{{ t('about.missionTitle') }}</h2>
          <p>{{ t('about.missionText') }}</p>
        </div>

        <div class="about-block">
          <h2>{{ t('about.visionTitle') }}</h2>
          <p>{{ t('about.visionText') }}</p>
        </div>

        <div class="about-stats">
          <div class="stat-card">
            <span class="stat-num">{{ t('about.stat1Num') }}</span>
            <span class="stat-label">{{ t('about.stat1Label') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ t('about.stat2Num') }}</span>
            <span class="stat-label">{{ t('about.stat2Label') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ t('about.stat3Num') }}</span>
            <span class="stat-label">{{ t('about.stat3Label') }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ t('about.stat4Num') }}</span>
            <span class="stat-label">{{ t('about.stat4Label') }}</span>
          </div>
        </div>

        <div class="about-block">
          <h2>{{ t('about.whyTitle') }}</h2>
          <ul class="feature-list">
            <li><strong>{{ t('about.feature1Title') }}:</strong> {{ t('about.feature1Text') }}</li>
            <li><strong>{{ t('about.feature2Title') }}:</strong> {{ t('about.feature2Text') }}</li>
            <li><strong>{{ t('about.feature3Title') }}:</strong> {{ t('about.feature3Text') }}</li>
            <li><strong>{{ t('about.feature4Title') }}:</strong> {{ t('about.feature4Text') }}</li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page-wrap { min-height: 100vh; width: 100%; background: var(--surface-page); font-family: var(--font-body); color: var(--text-primary); overflow-y: auto; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.page-main { padding: 48px 20px; }
.about-hero { text-align: center; margin-bottom: 56px; }
.about-hero h1 { font-family: var(--font-display); font-size: 36px; font-weight: 900; margin-bottom: 10px; letter-spacing: -0.03em; }
.about-hero .subtitle { font-size: 16px; color: var(--text-muted); }

.about-content { max-width: 800px; margin: 0 auto; }
.about-block { margin-bottom: 40px; }
.about-block h2 { font-family: var(--font-display); font-size: 22px; font-weight: 800; margin-bottom: 12px; color: var(--text-primary); }
.about-block p { font-size: 15px; color: var(--text-body); line-height: 1.8; }

.about-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 48px 0; }
.stat-card { text-align: center; padding: 24px 16px; background: var(--surface-card); border-radius: var(--radius-lg); box-shadow: var(--clay-shadow-sm); }
.stat-num { display: block; font-family: var(--font-display); font-size: 28px; font-weight: 900; color: var(--pv-red); }
.stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.feature-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.feature-list li { padding: 16px; background: var(--surface-card); border-radius: var(--radius-md); box-shadow: var(--clay-shadow-sm); font-size: 14px; color: var(--text-body); line-height: 1.7; }
.feature-list strong { color: var(--text-primary); }

@media (max-width: 768px) {
  .about-stats { grid-template-columns: repeat(2, 1fr); }
  .about-hero h1 { font-size: 28px; }
}
</style>
