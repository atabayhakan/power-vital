// useCurrency — single source of truth for "which currency does this
// user see prices in?"
//
// Power Vital's primary sales channel is Kyrgyzstan (KGS). International
// users (TR / EN) prefer USD. We infer the right default from the active
// locale the visitor is browsing in, and let them override via a small
// UI switcher that persists in localStorage.
//
//   • Locale  → currency mapping:
//       kg, ru → KGS  (local customers)
//       tr, en → USD  (international)
//
//   • formatPrice(kgsValue)  → "12 500 KGS" or "$165.00 USD"
//     (The kgs value comes from PriceEngine.calculatePrice; this composable
//      only adds the symbol + currency code on top, no re-calculation.)
//
//   • formatUsdRaw(usdValue) → for cart thresholds like "100$" in topbar
//     that should always read as USD (the threshold itself is in USD).
//
// localStorage key: 'pv_currency'

import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getFinanceSettings } from '../utils/PriceEngine';

export type Currency = 'KGS' | 'USD';

const STORAGE_KEY = 'pv_currency';

const LOCALE_TO_CURRENCY: Record<string, Currency> = {
  kg: 'KGS',
  ru: 'KGS',
  tr: 'USD',
  en: 'USD'
};

// Module-level shared state so every component that calls useCurrency()
// sees the same value (avoids 4 instances of the toggle in a single page).
const activeCurrency = ref<Currency>('KGS');
let initialized = false;

const readStored = (): Currency | null => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'KGS' || v === 'USD') return v;
  } catch { /* localStorage may be unavailable in tests */ }
  return null;
};

const inferFromLocale = (locale: string): Currency => {
  const short = (locale || 'kg').slice(0, 2).toLowerCase();
  return LOCALE_TO_CURRENCY[short] ?? 'KGS';
};

const writeStored = (c: Currency): void => {
  try { localStorage.setItem(STORAGE_KEY, c); } catch { /* noop */ }
};

const initializeOnce = (locale: string) => {
  if (initialized) return;
  initialized = true;
  // 1) Stored override wins
  const stored = readStored();
  if (stored) {
    activeCurrency.value = stored;
    return;
  }
  // 2) Otherwise infer from the active locale
  activeCurrency.value = inferFromLocale(locale);
};

export function useCurrency() {
  const { locale } = useI18n();

  // Lazy initialise on first use (locale is ready by then).
  initializeOnce(locale.value);

  // Re-infer when the visitor switches language — but only if they
  // haven't pinned a currency manually (stored preference takes over).
  watch(locale, (newLocale) => {
    const stored = readStored();
    if (stored) {
      activeCurrency.value = stored;
    } else {
      activeCurrency.value = inferFromLocale(newLocale);
    }
  });

  const setCurrency = (c: Currency) => {
    activeCurrency.value = c;
    writeStored(c);
  };

  const toggleCurrency = () => {
    setCurrency(activeCurrency.value === 'KGS' ? 'USD' : 'KGS');
  };

  /**
   * Convert a KGS value to USD using the live exchange rate from
   * PriceEngine. Returns the same KGS value when active currency is KGS.
   */
  const convertFromKgs = (kgs: number): number => {
    if (activeCurrency.value === 'KGS') return kgs;
    const { exchangeRate } = getFinanceSettings();
    const rate = Number(exchangeRate);
    if (!isFinite(rate) || rate <= 0) return kgs;
    return kgs / rate;
  };

  /**
   * Format a price for display. Accepts the KGS value produced by
   * PriceEngine.calculatePrice and renders in the active currency.
   */
  const formatPrice = (kgsValue: number | null | undefined): string => {
    if (kgsValue == null) return '—';
    const safe = Number(kgsValue);
    if (!isFinite(safe) || isNaN(safe)) return '—';
    if (activeCurrency.value === 'KGS') {
      // KGS — integer rounded, thousand separator, currency code suffix
      return `${Math.round(safe).toLocaleString('tr-TR')} KGS`;
    }
    // USD — two decimals, $ prefix
    const usd = convertFromKgs(safe);
    return `$${usd.toFixed(2)}`;
  };

  /**
   * Format a USD value (already in USD, not KGS) for display. Used by
   * the topbar "100$+ free shipping" banner where the threshold is
   * stored in USD and we only swap the symbol/code by visitor locale.
   */
  const formatUsdRaw = (usdValue: number | null | undefined): string => {
    if (usdValue == null) return '—';
    const safe = Number(usdValue);
    if (!isFinite(safe) || isNaN(safe)) return '—';
    if (activeCurrency.value === 'KGS') {
      const { exchangeRate } = getFinanceSettings();
      const rate = Number(exchangeRate);
      const kgs = isFinite(rate) && rate > 0 ? safe * rate : safe;
      return `${Math.round(kgs).toLocaleString('tr-TR')} KGS`;
    }
    return `$${safe.toFixed(0)}`;
  };

  const isKgs = computed(() => activeCurrency.value === 'KGS');
  const isUsd = computed(() => activeCurrency.value === 'USD');

  return {
    currency: activeCurrency,
    setCurrency,
    toggleCurrency,
    formatPrice,
    formatUsdRaw,
    isKgs,
    isUsd
  };
}

export default useCurrency;
