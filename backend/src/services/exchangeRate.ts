import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';


/**
 * Providers tried in order. First successful non-null result wins.
 * 1. NBKR (Kyrgyz Republic National Bank) — official source, updated daily ~15:00 Bishkek time
 * 2. exchangerate-api.com — global fallback, no key required
 */
const NBKR_URL = 'https://www.nbkr.kg/XML/daily.xml';
const EXCHANGERATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export interface RateFetchResult {
  success: boolean;
  rate: number | null;
  source: string;
  error?: string;
  tried: string[];
}

/**
 * Parses a single currency's rate from NBKR's daily XML feed.
 * Returns the official USD→KGS rate, or null on failure.
 */
const parseNbkrRate = async (): Promise<number | null> => {
  try {
    const response = await axios.get(NBKR_URL, { timeout: 10000 });
    const xml = response.data;
    const result = await parseStringPromise(xml);
    const currencies = result?.CurrencyRates?.Currency;
    if (!Array.isArray(currencies)) return null;
    const usdData = currencies.find((c: any) => c?.$?.ISOCode === 'USD');
    if (!usdData?.Value?.[0]) return null;
    const rateString = String(usdData.Value[0]).replace(',', '.');
    const rate = parseFloat(rateString);
    return isFinite(rate) && rate > 0 ? rate : null;
  } catch (e) {
    console.warn('[ExchangeRate] NBKR fetch failed:', (e as Error).message);
    return null;
  }
};

/**
 * Fetches the global USD→KGS rate from exchangerate-api.com (free, no key).
 */
const parseExchangerateApi = async (): Promise<number | null> => {
  try {
    const response = await axios.get(EXCHANGERATE_API_URL, { timeout: 10000 });
    const rate = response.data?.rates?.KGS;
    const parsed = Number(rate);
    return isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch (e) {
    console.warn('[ExchangeRate] exchangerate-api.com fetch failed:', (e as Error).message);
    return null;
  }
};

/**
 * Tries each provider in order and returns the first successful rate.
 * Used by the route handlers and the background scheduler.
 */
export const fetchRateFromProvider = async (
  _currency: string = 'USD'
): Promise<RateFetchResult> => {
  const tried: string[] = [];

  // 1. NBKR (official, but XML is occasionally unavailable on weekends/holidays)
  tried.push('NBKR');
  const nbkrRate = await parseNbkrRate();
  if (nbkrRate !== null) {
    return { success: true, rate: nbkrRate, source: 'NBKR (Kırgızistan Ulusal Bankası)', tried };
  }

  // 2. exchangerate-api.com (global fallback)
  tried.push('exchangerate-api.com');
  const exRate = await parseExchangerateApi();
  if (exRate !== null) {
    return { success: true, rate: exRate, source: 'exchangerate-api.com (global)', tried };
  }

  return {
    success: false,
    rate: null,
    source: 'none',
    error: 'Tüm kur sağlayıcıları başarısız oldu',
    tried
  };
};

/**
 * Fetches the latest USD→KGS rate and persists it in the ExchangeRate table.
 * Backwards-compatible wrapper around fetchRateFromProvider().
 */
export const updateExchangeRates = async (): Promise<RateFetchResult> => {
  try {
    logger.info('[ExchangeRate] Fetching latest rates...');
    const result = await fetchRateFromProvider('USD');
    if (!result.success || !result.rate) {
      console.error('[ExchangeRate] All providers failed. Tried:', result.tried);
      return result;
    }
    await prisma.exchangeRate.upsert({
      where: { currency: 'USD' },
      update: { rateToKgs: result.rate },
      create: { currency: 'USD', rateToKgs: result.rate }
    });
    logger.info(`[ExchangeRate] ✓ USD→KGS updated: ${result.rate} (source: ${result.source})`);
    return result;
  } catch (error) {
    logger.error({ err: error }, '[ExchangeRate] updateExchangeRates error:');
    return {
      success: false,
      rate: null,
      source: 'none',
      error: (error as Error).message,
      tried: []
    };
  }
};

/**
 * Background scheduler — fetches the rate at boot, then once every 24 hours.
 * Reads SiteSettings.financeSettings.autoRateFetch to decide whether to run.
 * Logs every attempt for diagnostics.
 */
let schedulerStarted = false;
let schedulerInterval: NodeJS.Timeout | null = null;

export const startExchangeRateScheduler = async () => {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // financeSettings is stored as a JSON STRING in the DB — it must be parsed
  // before reading flags, otherwise `finance.autoRateFetch` is always undefined
  // and the admin's "disable auto-fetch" toggle is silently ignored.
  const readAutoRateFetch = (raw: unknown): boolean => {
    if (!raw) return true; // default ON
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed?.autoRateFetch !== false;
    } catch {
      return true;
    }
  };

  // Wait 5s after boot so DB connection is stable
  setTimeout(async () => {
    try {
      const settings = await prisma.siteSettings.findFirst();
      if (!readAutoRateFetch(settings?.financeSettings)) {
        logger.info('[ExchangeRate] Auto-fetch is DISABLED in settings. Skipping initial fetch.');
      } else {
        logger.info('[ExchangeRate] Auto-fetch is ENABLED. Running initial fetch...');
        await updateExchangeRates();
      }
    } catch (e) {
      logger.error({ err: e }, '[ExchangeRate] Initial fetch error:');
    }
  }, 5000);

  // Daily schedule (24h = 86_400_000 ms)
  schedulerInterval = setInterval(async () => {
    try {
      const settings = await prisma.siteSettings.findFirst();
      if (!readAutoRateFetch(settings?.financeSettings)) {
        logger.info('[ExchangeRate] Auto-fetch is DISABLED. Skipping scheduled fetch.');
        return;
      }
      logger.info('[ExchangeRate] Daily scheduled fetch running...');
      await updateExchangeRates();
    } catch (e) {
      logger.error({ err: e }, '[ExchangeRate] Scheduled fetch error:');
    }
  }, 24 * 60 * 60 * 1000);

  logger.info('[ExchangeRate] Scheduler started (interval: 24h).');
};

export const stopExchangeRateScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    schedulerStarted = false;
    logger.info('[ExchangeRate] Scheduler stopped.');
  }
};
