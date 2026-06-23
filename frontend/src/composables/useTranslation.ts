import { useI18n } from 'vue-i18n';

export function useTranslation() {
  const { locale } = useI18n();

  /**
   * Helper function to get translated field from an object with 'translations' JSON/Record.
   * If translation is not available for current locale, it falls back to the original field.
   * @param obj The object containing the base fields and translations (e.g. product, slide, settings)
   * @param fieldName The name of the field to translate
   */
  const tField = (obj: any, fieldName: string) => {
    if (!obj) return '';
    const currentLocale = locale.value;
    
    // Default locale is Turkish (tr)
    if (currentLocale === 'tr') return obj[fieldName] || '';
    
    // Check if translation exists
    if (obj.translations) {
      let trans = obj.translations;
      if (typeof trans === 'string') {
        try { trans = JSON.parse(trans); } catch(_e) { /* keep as string */ }
      }

      let langObj = trans && trans[currentLocale];
      // 🛡️ Legacy data: some records store the per-locale value as a
      // stringified JSON object (e.g. translations.ru = '{"name":"..."}').
      // Parse it so the field lookup still works.
      if (typeof langObj === 'string') {
        try { langObj = JSON.parse(langObj); } catch(_e) { /* keep as string */ }
      }

      if (langObj && typeof langObj === 'object' && langObj[fieldName]) {
        return langObj[fieldName];
      }
    }

    // Fallback to original
    return obj[fieldName] || '';
  };

  return { tField, locale };
}
