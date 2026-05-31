// File: src/lib/engine/profitLoss.ts
import {
  subtract,
  multiply,
  divide,
  abs,
  toDecimal,
  toFixed,
  round,
  isPositive,
  isNegative,
  Decimal,
} from "@/lib/decimal";
import { getPipSize, getPipDecimalPlaces, getPair } from "@/lib/forex/pairs";
import { getCurrencyDecimals } from "@/lib/forex/currencies";
import { ProfitLossInput, ProfitLossResult, ValidationResult } from "./types";
import { getPipValuePerLot } from "./pipValue";

/**
 * Validates profit/loss calculator inputs.
 */
export function validateProfitLossInput(
  input: ProfitLossInput
): ValidationResult {
  const errors: string[] = [];

  const entry = toDecimal(input.entryPrice);
  const exit = toDecimal(input.exitPrice);
  const lotSize = toDecimal(input.lotSize);
  const exchangeRate = toDecimal(input.exchangeRate);

  if (!isPositive(entry)) {
    errors.push("Entry price must be greater than zero");
  }

  if (!isPositive(exit)) {
    errors.push("Exit price must be greater than zero");
  }

  if (!isPositive(lotSize)) {
    errors.push("Lot size must be greater than zero");
  }

  if (!isPositive(exchangeRate)) {
    errors.push("Exchange rate must be greater than zero");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates profit or loss for a completed trade.
 *
 * Formula:
 * 1. Calculate price movement: Exit - Entry
 * 2. Apply direction: positive for profitable direction, negative otherwise
 * 3. Convert to pips: Movement / Pip Size
 * 4. Calculate P/L: Pips * Pip Value * Lot Size
 *
 * For BUY trades: profit when Exit > Entry
 * For SELL trades: profit when Exit < Entry
 *
 * @param input - Profit/loss calculation inputs
 * @returns Profit/loss in pips and account currency
 */
export function calculateProfitLoss(input: ProfitLossInput): ProfitLossResult {
  const entry = toDecimal(input.entryPrice);
  const exit = toDecimal(input.exitPrice);
  const lotSize = toDecimal(input.lotSize);
  const pipSize = toDecimal(getPipSize(input.currencyPair));
  const pair = getPair(input.currencyPair);
  const contractSize = pair?.contractSize ?? 100000;

  // Calculate raw price movement
  const priceMovement = subtract(exit, entry);

  // Apply direction: for buy, positive movement = profit
  // For sell, negative movement = profit (we flip the sign)
  let adjustedMovement: Decimal;
  if (input.direction === "buy") {
    adjustedMovement = priceMovement;
  } else {
    adjustedMovement = multiply(priceMovement, -1);
  }

  // Convert to pips
  const pips = divide(adjustedMovement, pipSize);

  // Get pip value per lot
  const pipValuePerLot = getPipValuePerLot(
    input.currencyPair,
    input.accountCurrency,
    input.exchangeRate,
    input.quoteToAccountRate
  );

  // Calculate profit/loss in account currency
  const profitLoss = multiply(multiply(pips, pipValuePerLot), lotSize);

  // Determine if profitable
  const isProfit = isPositive(profitLoss);

  // Calculate position value for percentage return
  // Position Value = Lot Size * Contract Size * Entry Price (simplified)
  const positionValue = multiply(multiply(lotSize, contractSize), entry);
  const percentageReturn = multiply(divide(profitLoss, positionValue), 100);

  const currencyDecimals = getCurrencyDecimals(input.accountCurrency);

  return {
    pips: toFixed(round(pips, 1), 1),
    profitLoss: toFixed(round(profitLoss, currencyDecimals), currencyDecimals),
    pipValue: toFixed(round(pipValuePerLot, 4), 4),
    isProfit,
    percentageReturn: toFixed(round(percentageReturn, 2), 2),
  };
}