import api from './api';

export type SmoothingMode = 'NONE' | 'NEAREST_50' | 'NEAREST_100' | 'PSYCHOLOGICAL_90';

export interface FinanceSettings {
  exchangeRate: number;
  smoothingMode: SmoothingMode;
  autoRateFetch?: boolean;
  rateSource?: string;
  lastRateUpdate?: string | null;
  mbankAccount?: string;
  kaspiAccount?: string;
  optimaAccount?: string;
  customQrUrl?: string;

  checkoutShippingThresholdUsd?: number;
  checkoutContinueShoppingText?: string;
  checkoutShippingCheckboxText?: string;
  checkoutFreeShippingSuccessText?: string;
}

let currentSettings: FinanceSettings = {
  exchangeRate: 88.5,
  smoothingMode: 'NEAREST_100',
  autoRateFetch: true,
  rateSource: 'cache',
  lastRateUpdate: null,
  mbankAccount: '',
  kaspiAccount: '',
  optimaAccount: '',
  customQrUrl: '',
  checkoutShippingThresholdUsd: 100,
  checkoutContinueShoppingText: 'Siparişiniz 100$ altında kaldı. Alışverişe devam etmek için tıklayınız.',
  checkoutShippingCheckboxText: 'Siparişi ödemesini yapıyorum, 100$ altında sipariş verdiğim için kargo ücretini ödemeyi kabul ediyorum.',
  checkoutFreeShippingSuccessText: '🎉 Tebrikle, kargonuz ücretsizdir!'
};

export const fetchFinanceSettings = async () => {
  try {
    // Fetch both: smoothing mode/auto-toggle (from SiteSettings.financeSettings)
    // and the live exchange rate (from /finance/exchange-rate, fed by NBKR/exchangerate-api).
    const [settingsRes, rateRes] = await Promise.allSettled([
      api.get('/settings'),
      api.get('/finance/exchange-rate')
    ]);

    let nextSettings: FinanceSettings = { ...currentSettings };

    if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.financeSettings) {
      const fs = settingsRes.value.data.financeSettings;
      nextSettings = {
        ...nextSettings,
        smoothingMode: fs.smoothingMode || nextSettings.smoothingMode,
        exchangeRate: Number(fs.exchangeRate) || nextSettings.exchangeRate,
        autoRateFetch: fs.autoRateFetch !== false,
        rateSource: fs.rateSource || nextSettings.rateSource,
        lastRateUpdate: fs.lastRateUpdate || nextSettings.lastRateUpdate,
        mbankAccount: fs.mbankAccount || '',
        kaspiAccount: fs.kaspiAccount || '',
        optimaAccount: fs.optimaAccount || '',
        customQrUrl: fs.customQrUrl || '',
        checkoutShippingThresholdUsd: fs.checkoutShippingThresholdUsd !== undefined ? Number(fs.checkoutShippingThresholdUsd) : nextSettings.checkoutShippingThresholdUsd,
        checkoutContinueShoppingText: fs.checkoutContinueShoppingText || nextSettings.checkoutContinueShoppingText,
        checkoutShippingCheckboxText: fs.checkoutShippingCheckboxText || nextSettings.checkoutShippingCheckboxText,
        checkoutFreeShippingSuccessText: fs.checkoutFreeShippingSuccessText || nextSettings.checkoutFreeShippingSuccessText
      };
    }

    // Only override with the live rate from ExchangeRate table if autoRateFetch is ON.
    // If it's OFF, the manual rate stored in SiteSettings should be respected.
    if (nextSettings.autoRateFetch && rateRes.status === 'fulfilled' && rateRes.value.data?.rate) {
      const liveRate = Number(rateRes.value.data.rate);
      if (isFinite(liveRate) && liveRate > 0) {
        nextSettings.exchangeRate = liveRate;
        nextSettings.rateSource = rateRes.value.data.source || 'cache';
        nextSettings.lastRateUpdate = rateRes.value.data.updatedAt || new Date().toISOString();
      }
    } else if (!nextSettings.autoRateFetch) {
      nextSettings.rateSource = 'manual';
    }

    currentSettings = nextSettings;
  } catch (e) {
    console.error('Failed to load finance settings', e);
  }
};

export const getFinanceSettings = (): FinanceSettings => {
  return currentSettings;
};

export const saveFinanceSettings = async (settings: FinanceSettings) => {
  currentSettings = settings;
  try {
    await api.put('/settings', { financeSettings: settings });
  } catch (e) {
    console.error('Failed to save finance settings', e);
  }
};

export const calculatePrice = (basePriceUsd: number | null | undefined, discountRate: number = 0): number => {
  const safeUsd = Number(basePriceUsd);
  if (!isFinite(safeUsd) || isNaN(safeUsd) || safeUsd <= 0) return 0;
  
  // Apply the Gamified Ascension Discount
  const discountedUsd = safeUsd * (1 - (discountRate / 100));
  
  const { exchangeRate, smoothingMode } = getFinanceSettings();
  const safeRate = Number(exchangeRate);
  const rate = isFinite(safeRate) && safeRate > 0 ? safeRate : 88.5;
  const rawKgs = discountedUsd * rate;

  if (smoothingMode === 'NONE') return Number(rawKgs.toFixed(2));

  if (smoothingMode === 'NEAREST_50') {
    const rounded = Math.round(rawKgs / 50) * 50;
    return rounded === 0 && rawKgs > 0 ? 50 : rounded;
  }
  if (smoothingMode === 'NEAREST_100') {
    const rounded = Math.round(rawKgs / 100) * 100;
    return rounded === 0 && rawKgs > 0 ? 100 : rounded;
  }
  if (smoothingMode === 'PSYCHOLOGICAL_90') {
    const nearest100 = Math.round(rawKgs / 100) * 100;
    const finalPrice = nearest100 > 10 ? nearest100 - 10 : Number(rawKgs.toFixed(2));
    return finalPrice <= 0 && rawKgs > 0 ? 90 : finalPrice;
  }

  return rawKgs;
};

export const formatPrice = (price: number | null | undefined): string => {
  const safe = Number(price);
  if (!isFinite(safe) || isNaN(safe)) return '0';
  return Math.round(safe).toLocaleString('tr-TR');
};
