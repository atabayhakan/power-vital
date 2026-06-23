<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { locale } = useI18n();

const languages = [
  { code: 'kg', label: 'KG', flag: '🇰🇬' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'tr', label: 'TR', flag: '🇹🇷' }
];

const currentLang = ref(languages.find(l => l.code === locale.value) || languages[0]);

const changeLanguage = (langCode: string) => {
  locale.value = langCode;
  localStorage.setItem('pv_lang', langCode);
  currentLang.value = languages.find(l => l.code === langCode) || languages[0];
};
</script>

<template>
  <div class="lang-boxes">
    <button 
      v-for="lang in languages" 
      :key="lang.code"
      class="lang-box glass-panel"
      :class="{ active: lang.code === currentLang.code }"
      @click="changeLanguage(lang.code)"
      :title="lang.label"
    >
      <span class="code">{{ lang.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.lang-boxes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.lang-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-heading, 'Outfit'), sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text-muted, #9ca3af);
  transition: all 0.2s;
}

.lang-box:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-text-main, #ffffff);
  transform: translateY(-2px);
}

.lang-box.active {
  background: linear-gradient(135deg, var(--color-primary, #BC4A3C), #FF6B5C);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(188, 74, 60, 0.3);
}

.code {
  letter-spacing: 0.5px;
}
</style>
