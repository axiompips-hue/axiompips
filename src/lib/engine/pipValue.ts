// File: src/lib/engine/pipValue.ts
import {
  multiply,
  divide,
  toDecimal,
  toFixed,
  round,
  Decimal,
  DecimalInput,
} from "@/lib/decimal";
import { getPair, getPipSize, CurrencyPair } from "@/lib/forex/pairs";
import { PipValueInput, PipValueResult } from "./types";

/**
 * Standard forex lot size in units.
 */
const STANDARD_LOT = 100000;

/**
 * Calculates the pip value for a given currency pair and position size.
 *
 * The pip value calculation depends on the quote currency and account currency:
 *
 * 1. If quote currency = account currency (e.g., EURUSD with USD account):
 *    Pip Value = Lot Size * Contract Size * Pip Size
 *    For 1 lot EURUSD: 100000 * 0.0001 = 10 USD per pip
 *
 * 2. If quote currency != account currency (e.g., EURGBP with USD account):
 *    Pip Value = (Lot Size * Contract Size * Pip Size) * Quote-to-Account Rate
 *    Need to convert from quote currency (GBP) to account currency (USD)
 *
 * 3. For JPY pairs (e.g., USDJPY with USD account):
 *    Pip Value = (Lot Size * Contract Size * Pip Size) / Exchange Rate
 *    Then convert to account currency if needed
 *
 * @param input - The pip value calculation inputs
 * @returns The pip value result
 */
export function calculatePipValue(input: PipValueInput): PipValueResult {
  const pair = getPair(input.currencyPair);
  const pipSize = toDecimal(pair?.pipSize ?? getPipSize(input.currencyPair));
  const contractSize = pair?.contractSize ?? STANDARD_LOT;
  const lotSize = toDecimal(input.lotSize);
  const exchangeRate = toDecimal(input.exchangeRate);
  const accountCurrency = input.accountCurrency.toUpperCase();

  // Get quote currency from pair
  const quoteCurrency = pair?.quote ?? input.currencyPair.slice(3, 6).toUpperCase();
  const baseCurrency = pair?.base ?? input.currencyPair.slice(0, 3).toUpperCase();

  let pipValuePerLot: Decimal;

  // Calculate pip value per standard lot
  if (quoteCurrency === accountCurrency) {
    // Quote currency matches account currency
    // Pip Value = Contract Size * Pip Size
    // e.g., EURUSD with USD account: 100000 * 0.0001 = 10 USD
    pipValuePerLot = multiply(contractSize, pipSize);
  } else if (baseCurrency === accountCurrency) {
    // Base currency matches account currency
    // Need to divide by exchange rate
    // e.g., USDJPY with USD account: (100000 * 0.01) / 150 = 6.67 USD
    pipValuePerLot = divide(multiply(contractSize, pipSize), exchangeRate);
  } else {
    // Neither matches - need conversion rate
    // Pip Value = Contract Size * Pip Size * Quote-to-Account Rate
    const quoteToAccountRate = toDecimal(input.quoteToAccountRate ?? 1);
    const basePipValue = multiply(contractSize, pipSize);

    // For cross pairs, we need to convert
    // e.g., EURGBP with USD account: 100000 * 0.0001 * GBPUSD rate
    if (quoteCurrency === "JPY") {
      // JPY quote currency with non-JPY account
      pipValuePerLot = multiply(
        divide(basePipValue, exchangeRate),
        quoteToAccountRate
      );
    } else {
      pipValuePerLot = multiply(basePipValue, quoteToAccountRate);
    }
  }

  // Calculate total pip value for the given lot size
  const totalPipValue = multiply(pipValuePerLot, lotSize);

  // Calculate pip value for exactly 1 pip movement
  const pipValue = totalPipValue;

  return {
    pipValue: toFixed(pipValue, 4),
    pipValuePerLot: toFixed(pipValuePerLot, 4),
    totalPipValue: toFixed(totalPipValue, 4),
  };
}

/**
 * Calculates pip value per lot for a standard lot.
 * Simplified version for internal use.
 */
export function getPipValuePerLot(
  currencyPair: string,
  accountCurrency: string,
  exchangeRate: DecimalInput,
  quoteToAccountRate?: DecimalInput
): Decimal {
  const result = calculatePipValue({
    currencyPair,
    lotSize: 1,
    accountCurrency,
    exchangeRate,
    quoteToAccountRate,
  });
  return toDecimal(result.pipValuePerLot);
}