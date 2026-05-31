// File: src/lib/forex/currencies.ts

/**
 * Represents a currency with its metadata.
 */
export interface Currency {
  /** ISO 4217 currency code */
  code: string;
  /** Currency name */
  name: string;
  /** Number of decimal places for display */
  decimals: number;
  /** Symbol for display (we use code instead per requirements) */
  symbol: string;
}

/**
 * Supported account currencies.
 */
export const ACCOUNT_CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", decimals: 2, symbol: "USD" },
  { code: "EUR", name: "Euro", decimals: 2, symbol: "EUR" },
  { code: "GBP", name: "British Pound", decimals: 2, symbol: "GBP" },
  { code: "JPY", name: "Japanese Yen", decimals: 0, symbol: "JPY" },
  { code: "CHF", name: "Swiss Franc", decimals: 2, symbol: "CHF" },
  { code: "AUD", name: "Australian Dollar", decimals: 2, symbol: "AUD" },
  { code: "CAD", name: "Canadian Dollar", decimals: 2, symbol: "CAD" },
  { code: "NZD", name: "New Zealand Dollar", decimals: 2, symbol: "NZD" },
];

/**
 * Lookup map for currencies.
 */
export const CURRENCIES_MAP: Record<string, Currency> = ACCOUNT_CURRENCIES.reduce(
  (acc, currency) => {
    acc[currency.code] = currency;
    return acc;
  },
  {} as Record<string, Currency>
);

/**
 * Gets a currency by code.
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES_MAP[code.toUpperCase()];
}

/**
 * Gets the number of decimal places for a currency.
 */
export function getCurrencyDecimals(code: string): number {
  const currency = getCurrency(code);
  return currency ? currency.decimals : 2;
}