// File: src/lib/engine/positionSize.ts
import {
  multiply,
  divide,
  percentage,
  toDecimal,
  toFixed,
  round,
  isPositive,
  isZero,
  Decimal,
} from "@/lib/decimal";
import { getPair } from "@/lib/forex/pairs";
import { getCurrencyDecimals } from "@/lib/forex/currencies";
import { PositionSizeInput, PositionSizeResult, ValidationResult } from "./types";
import { getPipValuePerLot } from "./pipValue";

/**
 * Standard lot sizes in forex.
 */
const STANDARD_LOT = 100000;
const MINI_LOT = 10000;
const MICRO_LOT = 1000;

/**
 * Validates position size calculator inputs.
 */
export function validatePositionSizeInput(
  input: PositionSizeInput
): ValidationResult {
  const errors: string[] = [];

  const balance = toDecimal(input.accountBalance);
  const riskPercent = toDecimal(input.riskPercent);
  const stopLossPips = toDecimal(input.stopLossPips);
  const exchangeRate = toDecimal(input.exchangeRate);

  if (!isPositive(balance)) {
    errors.push("Account balance must be greater than zero");
  }

  if (!isPositive(riskPercent)) {
    errors.push("Risk percentage must be greater than zero");
  }

  if (riskPercent.greaterThan(100)) {
    errors.push("Risk percentage cannot exceed 100%");
  }

  if (!isPositive(stopLossPips)) {
    errors.push("Stop loss must be greater than zero pips");
  }

  if (!isPositive(exchangeRate)) {
    errors.push("Exchange rate must be greater than zero");
  }

  if (!getPair(input.currencyPair)) {
    errors.push("Invalid or unsupported currency pair");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates the optimal position size based on risk parameters.
 *
 * Formula:
 * Position Size (lots) = Risk Amount / (Stop Loss Pips * Pip Value Per Lot)
 *
 * Where:
 * - Risk Amount = Account Balance * (Risk Percent / 100)
 * - Pip Value Per Lot = value of 1 pip for 1 standard lot
 *
 * Example:
 * - Account: 10,000 USD
 * - Risk: 1% = 100 USD
 * - Stop Loss: 50 pips
 * - Pair: EURUSD (pip value = 10 USD per lot)
 * - Position Size = 100 / (50 * 10) = 0.2 lots = 20,000 units
 *
 * @param input - Position size calculation inputs
 * @returns Position size in various lot formats
 */
export function calculatePositionSize(
  input: PositionSizeInput
): PositionSizeResult {
  const balance = toDecimal(input.accountBalance);
  const riskPercent = toDecimal(input.riskPercent);
  const stopLossPips = toDecimal(input.stopLossPips);

  // Calculate risk amount in account currency
  const riskAmount = percentage(balance, riskPercent);

  // Get pip value per standard lot
  const pipValuePerLot = getPipValuePerLot(
    input.currencyPair,
    input.accountCurrency,
    input.exchangeRate,
    input.quoteToAccountRate
  );

  // Calculate position size in lots
  // Position Size = Risk Amount / (Stop Loss Pips * Pip Value Per Lot)
  const riskPerPip = multiply(stopLossPips, pipValuePerLot);

  // Avoid division by zero
  let lots: Decimal;
  if (isZero(riskPerPip)) {
    lots = toDecimal(0);
  } else {
    lots = divide(riskAmount, riskPerPip);
  }

  // Calculate units
  const units = multiply(lots, STANDARD_LOT);

  // Calculate mini lots and micro lots
  const miniLots = multiply(lots, 10); // 1 lot = 10 mini lots
  const microLots = multiply(lots, 100); // 1 lot = 100 micro lots

  // Get currency decimal places for formatting
  const currencyDecimals = getCurrencyDecimals(input.accountCurrency);

  return {
    lots: toFixed(round(lots, 2), 2),
    miniLots: toFixed(round(miniLots, 1), 1),
    microLots: toFixed(round(microLots, 0), 0),
    units: toFixed(round(units, 0), 0),
    riskAmount: toFixed(round(riskAmount, currencyDecimals), currencyDecimals),
    pipValue: toFixed(round(pipValuePerLot, 4), 4),
  };
}