// File: src/lib/forex/pairs.ts

/**
 * Represents a currency pair with its metadata.
 */
export interface CurrencyPair {
  /** Symbol like "EURUSD" */
  symbol: string;
  /** Base currency (first in pair) */
  base: string;
  /** Quote currency (second in pair) */
  quote: string;
  /** Number of decimal places for pip calculation (4 for most, 2 for JPY pairs) */
  pipDecimalPlaces: number;
  /** Pip size as a decimal (0.0001 for most, 0.01 for JPY pairs) */
  pipSize: string;
  /** Standard lot size in units (100000 for forex) */
  contractSize: number;
  /** Display name */
  displayName: string;
}

/**
 * Major currency pairs.
 * These are the most liquid pairs involving USD.
 */
export const MAJOR_PAIRS: CurrencyPair[] = [
  {
    symbol: "EURUSD",
    base: "EUR",
    quote: "USD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "EUR/USD",
  },
  {
    symbol: "GBPUSD",
    base: "GBP",
    quote: "USD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "GBP/USD",
  },
  {
    symbol: "USDJPY",
    base: "USD",
    quote: "JPY",
    pipDecimalPlaces: 2,
    pipSize: "0.01",
    contractSize: 100000,
    displayName: "USD/JPY",
  },
  {
    symbol: "USDCHF",
    base: "USD",
    quote: "CHF",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "USD/CHF",
  },
  {
    symbol: "AUDUSD",
    base: "AUD",
    quote: "USD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "AUD/USD",
  },
  {
    symbol: "USDCAD",
    base: "USD",
    quote: "CAD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "USD/CAD",
  },
  {
    symbol: "NZDUSD",
    base: "NZD",
    quote: "USD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "NZD/USD",
  },
];

/**
 * Cross pairs (pairs not involving USD directly).
 */
export const CROSS_PAIRS: CurrencyPair[] = [
  {
    symbol: "EURGBP",
    base: "EUR",
    quote: "GBP",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "EUR/GBP",
  },
  {
    symbol: "EURJPY",
    base: "EUR",
    quote: "JPY",
    pipDecimalPlaces: 2,
    pipSize: "0.01",
    contractSize: 100000,
    displayName: "EUR/JPY",
  },
  {
    symbol: "GBPJPY",
    base: "GBP",
    quote: "JPY",
    pipDecimalPlaces: 2,
    pipSize: "0.01",
    contractSize: 100000,
    displayName: "GBP/JPY",
  },
  {
    symbol: "EURCHF",
    base: "EUR",
    quote: "CHF",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "EUR/CHF",
  },
  {
    symbol: "GBPCHF",
    base: "GBP",
    quote: "CHF",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "GBP/CHF",
  },
  {
    symbol: "AUDJPY",
    base: "AUD",
    quote: "JPY",
    pipDecimalPlaces: 2,
    pipSize: "0.01",
    contractSize: 100000,
    displayName: "AUD/JPY",
  },
  {
    symbol: "CADJPY",
    base: "CAD",
    quote: "JPY",
    pipDecimalPlaces: 2,
    pipSize: "0.01",
    contractSize: 100000,
    displayName: "CAD/JPY",
  },
  {
    symbol: "CHFJPY",
    base: "CHF",
    quote: "JPY",
    pipDecimalPlaces: 2,
    pipSize: "0.01",
    contractSize: 100000,
    displayName: "CHF/JPY",
  },
  {
    symbol: "EURAUD",
    base: "EUR",
    quote: "AUD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "EUR/AUD",
  },
  {
    symbol: "EURCAD",
    base: "EUR",
    quote: "CAD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "EUR/CAD",
  },
  {
    symbol: "EURNZD",
    base: "EUR",
    quote: "NZD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "EUR/NZD",
  },
  {
    symbol: "GBPAUD",
    base: "GBP",
    quote: "AUD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "GBP/AUD",
  },
  {
    symbol: "GBPCAD",
    base: "GBP",
    quote: "CAD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "GBP/CAD",
  },
  {
    symbol: "GBPNZD",
    base: "GBP",
    quote: "NZD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "GBP/NZD",
  },
  {
    symbol: "AUDCAD",
    base: "AUD",
    quote: "CAD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "AUD/CAD",
  },
  {
    symbol: "AUDCHF",
    base: "AUD",
    quote: "CHF",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "AUD/CHF",
  },
  {
    symbol: "AUDNZD",
    base: "AUD",
    quote: "NZD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "AUD/NZD",
  },
  {
    symbol: "CADCHF",
    base: "CAD",
    quote: "CHF",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "CAD/CHF",
  },
  {
    symbol: "NZDJPY",
    base: "NZD",
    quote: "JPY",
    pipDecimalPlaces: 2,
    pipSize: "0.01",
    contractSize: 100000,
    displayName: "NZD/JPY",
  },
  {
    symbol: "NZDCAD",
    base: "NZD",
    quote: "CAD",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "NZD/CAD",
  },
  {
    symbol: "NZDCHF",
    base: "NZD",
    quote: "CHF",
    pipDecimalPlaces: 4,
    pipSize: "0.0001",
    contractSize: 100000,
    displayName: "NZD/CHF",
  },
];

/**
 * All supported currency pairs.
 */
export const ALL_PAIRS: CurrencyPair[] = [...MAJOR_PAIRS, ...CROSS_PAIRS];

/**
 * Lookup map for quick pair retrieval by symbol.
 */
export const PAIRS_MAP: Record<string, CurrencyPair> = ALL_PAIRS.reduce(
  (acc, pair) => {
    acc[pair.symbol] = pair;
    return acc;
  },
  {} as Record<string, CurrencyPair>
);

/**
 * Gets a currency pair by symbol.
 * Returns undefined if not found.
 */
export function getPair(symbol: string): CurrencyPair | undefined {
  return PAIRS_MAP[symbol.toUpperCase()];
}

/**
 * Checks if a pair involves JPY (different pip calculation).
 */
export function isJpyPair(symbol: string): boolean {
  const pair = getPair(symbol);
  return pair ? pair.quote === "JPY" : symbol.toUpperCase().includes("JPY");
}

/**
 * Gets the pip size for a currency pair.
 */
export function getPipSize(symbol: string): string {
  const pair = getPair(symbol);
  return pair ? pair.pipSize : isJpyPair(symbol) ? "0.01" : "0.0001";
}

/**
 * Gets the pip decimal places for a currency pair.
 */
export function getPipDecimalPlaces(symbol: string): number {
  const pair = getPair(symbol);
  return pair ? pair.pipDecimalPlaces : isJpyPair(symbol) ? 2 : 4;
}