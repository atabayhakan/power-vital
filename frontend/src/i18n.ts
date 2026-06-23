import { createI18n } from 'vue-i18n';

// 🛡️ Vite/Rollup in production build was tree-shaking individual translation
// strings (e.g. ru.featuredSub, reviews.empty) because they look like "unused
// object properties" to the bundler — even though they're accessed at runtime
// through vue-i18n's dynamic lookup. Importing as ?raw + JSON.parse keeps
// the entire string table intact, since the bundler can't reason about
// which key the consumer will pass to `t()` later.
import trRaw from './locales/tr.json?raw';
import ruRaw from './locales/ru.json?raw';
import kgRaw from './locales/kg.json?raw';

const messages = {
  tr: JSON.parse(trRaw),
  ru: JSON.parse(ruRaw),
  kg: JSON.parse(kgRaw)
};

// Default opening language is Kyrgyz (kg). A returning visitor's saved choice
// (pv_lang) is respected; only first-time visitors default to kg.
const savedLocale = localStorage.getItem('pv_lang') || 'kg';

const i18n = createI18n({
  legacy: false, // Set to false to use Composition API
  locale: savedLocale,
  fallbackLocale: 'tr', // TR is the authored source — missing keys fall back to it
  messages,
});

export default i18n;
