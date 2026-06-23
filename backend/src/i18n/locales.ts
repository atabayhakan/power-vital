// ────────────────────────────────────────────────────────────────────────────
// Supported UI / data translation locales.
//
// To add a language: append the code here, ensure frontend locale files exist
// (frontend/src/locales/<code>.json) and a backend label.
// ────────────────────────────────────────────────────────────────────────────
export type LocaleCode = 'tr' | 'ru' | 'kg' | 'en';

export const LOCALES: LocaleCode[] = ['tr', 'ru', 'kg', 'en'];

export const DEFAULT_LOCALE: LocaleCode = 'tr';

export const LOCALE_LABELS: Record<LocaleCode, string> = {
  tr: 'Türkçe',
  ru: 'Русский',
  kg: 'Кыргызча',
  en: 'English'
};

// Languages the AI translator will *automatically* fill for data records when
// missing. EN is intentionally excluded by default (avoid surprise for the
// customer base which is RU/KG-first); admin can trigger EN explicitly.
export const AI_TARGET_LOCALES: LocaleCode[] = ['ru', 'kg'];

export const isSupportedLocale = (s: string): s is LocaleCode =>
  (LOCALES as string[]).includes(s);

export const normaliseLocale = (s?: string | null): LocaleCode => {
  if (!s) return DEFAULT_LOCALE;
  const lower = s.toLowerCase().slice(0, 2);
  return isSupportedLocale(lower) ? lower : DEFAULT_LOCALE;
};