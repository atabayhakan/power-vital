import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { PrismaClient } from '../../prisma/generated/client';

const prisma = new PrismaClient({});
const NBKR_URL = 'https://www.nbkr.kg/XML/daily.xml';

/**
 * Fetches the latest USD to KGS exchange rate from the National Bank of the Kyrgyz Republic
 * and updates the ExchangeRate table in the database.
 */
export const updateExchangeRates = async () => {
  try {
    console.log('[ExchangeRate] Fetching latest rates from NBKR...');
    const response = await axios.get(NBKR_URL);
    const xml = response.data;
    
    const result = await parseStringPromise(xml);
    const currencies = result.CurrencyRates.Currency;
    
    // Find USD
    const usdData = currencies.find((c: any) => c.$.ISOCode === 'USD');
    if (!usdData) {
      throw new Error('USD rate not found in NBKR response');
    }

    // NBKR uses comma for decimals sometimes, parse safely
    const rateString = usdData.Value[0].replace(',', '.');
    const rateToKgs = parseFloat(rateString);

    if (isNaN(rateToKgs)) {
      throw new Error('Parsed USD rate is not a number');
    }

    // Update or create in Database
    await prisma.exchangeRate.upsert({
      where: { currency: 'USD' },
      update: { rateToKgs },
      create: { currency: 'USD', rateToKgs }
    });

    console.log(`[ExchangeRate] Successfully updated USD to KGS rate: 1 USD = ${rateToKgs} KGS`);
  } catch (error) {
    console.error('[ExchangeRate] Error updating exchange rates:', error);
  }
};
