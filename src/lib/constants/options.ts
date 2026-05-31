// File: src/lib/constants/options.ts
import { ALL_PAIRS } from "@/lib/forex/pairs";
import { ACCOUNT_CURRENCIES } from "@/lib/forex/currencies";

/**
 * Select option type for dropdowns.
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Currency pair options for select dropdowns.
 */
export const PAIR_OPTIONS: SelectOption[] = ALL_PAIRS.map((pair) => ({
  value: pair.symbol,
  label: pair.displayName,
}));

/**
 * Account currency options for select dropdowns.
 */
export const CURRENCY_OPTIONS: SelectOption[] = ACCOUNT_CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} - ${currency.name}`,
}));

/**
 * Common leverage options.
 */
export const LEVERAGE_OPTIONS: SelectOption[] = [
  { value: "10", label: "1:10" },
  { value: "20", label: "1:20" },
  { value: "30", label: "1:30" },
  { value: "50", label: "1:50" },
  { value: "100", label: "1:100" },
  { value: "200", label: "1:200" },
  { value: "500", label: "1:500" },
  { value: "1000", label: "1:1000" },
];

/**
 * Trade direction options.
 */
export const DIRECTION_OPTIONS: SelectOption[] = [
  { value: "buy", label: "Buy (Long)" },
  { value: "sell", label: "Sell (Short)" },
];