import api from './api';

export interface FinanceSettings {
  mbankAccount?: string;
  kaspiAccount?: string;
  optimaAccount?: string;
  customQrUrl?: string;

  checkoutShippingThresholdKgs?: number;
  checkoutContinueShoppingText?: string;
  checkoutShippingCheckboxText?: string;
  checkoutFreeShippingSuccessText?: string;
}

let currentSettings: FinanceSettings = {
  mbankAccount: '',
  kaspiAccount: '',
  optimaAccount: '',
  customQrUrl: '',
  checkoutShippingThresholdKgs: 9000,
  checkoutContinueShoppingText: 'Siparişiniz 9.000 сом altında kaldı. Alışverişe devam etmek için tıklayınız.',
  checkoutShippingCheckboxText: 'Siparişi ödemesini yapıyorum, 9.000 сом altında sipariş verdiğim için kargo ücretini ödemeyi kabul ediyorum.',
  checkoutFreeShippingSuccessText: '🎉 Tebrikle, kargonuz ücretsizdir!'
};

export const fetchFinanceSettings = async () => {
  try {
    const settingsRes = await api.get('/settings');
    const fs = settingsRes.data?.financeSettings;
    if (!fs) return;

    currentSettings = {
      ...currentSettings,
      mbankAccount: fs.mbankAccount || '',
      kaspiAccount: fs.kaspiAccount || '',
      optimaAccount: fs.optimaAccount || '',
      customQrUrl: fs.customQrUrl || '',
      checkoutShippingThresholdKgs: fs.checkoutShippingThresholdKgs !== undefined ? Number(fs.checkoutShippingThresholdKgs) : currentSettings.checkoutShippingThresholdKgs,
      checkoutContinueShoppingText: fs.checkoutContinueShoppingText || currentSettings.checkoutContinueShoppingText,
      checkoutShippingCheckboxText: fs.checkoutShippingCheckboxText || currentSettings.checkoutShippingCheckboxText,
      checkoutFreeShippingSuccessText: fs.checkoutFreeShippingSuccessText || currentSettings.checkoutFreeShippingSuccessText
    };
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

// Fixed KGS price minus the customer's loyalty discount — no exchange rate,
// no rounding/smoothing. The admin-entered basePriceKgs is the real price.
export const calculatePrice = (basePriceKgs: number | null | undefined, discountRate: number = 0): number => {
  const safeKgs = Number(basePriceKgs);
  if (!isFinite(safeKgs) || isNaN(safeKgs) || safeKgs <= 0) return 0;

  const discounted = safeKgs * (1 - (discountRate / 100));
  return Number(discounted.toFixed(2));
};

export const formatPrice = (price: number | null | undefined): string => {
  const safe = Number(price);
  if (!isFinite(safe) || isNaN(safe)) return '0';
  return Math.round(safe).toLocaleString('tr-TR');
};
