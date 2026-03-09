/**
 * Supported currencies and their metadata
 */

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  country: string;
}

export const CURRENCIES: Record<string, CurrencyOption> = {
  MWK: {
    code: 'MWK',
    name: 'Malawian Kwacha',
    symbol: 'MK',
    country: 'Malawi',
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    country: 'South Africa',
  },
  ZWL: {
    code: 'ZWL',
    name: 'Zimbabwe Dollar',
    symbol: 'Z$',
    country: 'Zimbabwe',
  },
  TZS: {
    code: 'TZS',
    name: 'Tanzania Shilling',
    symbol: 'TSh',
    country: 'Tanzania',
  },
  ZMW: {
    code: 'ZMW',
    name: 'Zambian Kwacha',
    symbol: 'ZK',
    country: 'Zambia',
  },
};

export const DEFAULT_CURRENCY = 'MWK';

export const CURRENCY_OPTIONS = Object.values(CURRENCIES);

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.symbol || '$';
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.name || currencyCode;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
