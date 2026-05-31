// File: src/lib/engine/margin.ts
import {
  multiply,
  divide,
  toDecimal,
  toFixed,
  round,
  isPositive,
  isZero,
  Decimal,
} from "@/lib/decimal";
import { getPair } from "@/lib/forex/pairs";
import { getCurrencyDecimals } from "@/lib/forex/currencies";
import { MarginInput, MarginResult, ValidationResult } from "./types";

/**
 * Standard lot size.
 */
const STANDARD_LOT = 100000;

/**
 * Validates margin calculator inputs.
 */
export function validateMarginInput(input: MarginInput): ValidationResult {
  const errors: string[] = [];

  const lotSize = toDecimal(input.lotSize);
  const leverage = toDecimal(input.leverage);
  const exchangeRate = toDecimal(input.exchangeRate);

  if (!isPositive(lotSize)) {
    errors.push("Lot size must be greater than zero");
  }

  if (!isPositive(leverage)) {
    errors.push("Leverage must be greater than zero");
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
 * Calculates the required margin for a position.
 *
 * Formula:
 * Required Margin = (Lot Size * Contract Size * Base Currency Rate) / Leverage
 *
 * The "Base Currency Rate" is the rate to convert the base currency to account currency.
 *
 * Examples:
 * 1. EURUSD with USD account:
 *    - Base = EUR, need EUR to USD rate = EURUSD price
 *    - Margin = (1 * 100000 * 1.10) / 100 = 1100 USD for 1 lot at 1:100
 *
 * 2. USDJPY with USD account:
 *    - Base = USD, already in account currency, rate = 1
 *    - Margin = (1 * 100000 * 1) / 100 = 1000 USD for 1 lot at 1:100
 *
 * 3. EURGBP with USD account:
 *    - Base = EUR, need EUR to USD rate = EURUSD price (provided as baseToAccountRate)
 *    - Margin = (1 * 100000 * 1.10) / 100 = 1100 USD for 1 lot at 1:100
 *
 * @param input - Margin calculation inputs
 * @returns Margin requirements
 */
export function calculateMargin(input: MarginInput): MarginResult {
  const pair = getPair(input.currencyPair);
  const contractSize = pair?.contractSize ?? STANDARD_LOT;
  const lotSize = toDecimal(input.lotSize);
  const leverage = toDecimal(input.leverage);
  const exchangeRate = toDecimal(input.exchangeRate);
  const accountCurrency = input.accountCurrency.toUpperCase();

  // Determine base currency
  const baseCurrency = pair?.base ?? input.currencyPair.slice(0, 3).toUpperCase();

  // Calculate position value in base currency units
  const positionUnits = multiply(lotSize, contractSize);

  // Determine the rate to convert base currency to account currency
  let baseToAccountRate: Decimal;

  if (baseCurrency === accountCurrency) {
    // Base currency is account currency (e.g., USDJPY with USD account)
    baseToAccountRate = toDecimal(1);
  } else if (input.baseToAccountRate) {
    // Use provided conversion rate
    baseToAccountRate = toDecimal(input.baseToAccountRate);
  } else {
    // Assume the exchange rate IS the base to account rate
    // This works for pairs like EURUSD when account is USD
    baseToAccountRate = exchangeRate;
  }

  // Position value in account currency
  const positionValue = multiply(positionUnits, baseToAccountRate);

  // Required margin = Position Value / Leverage
  let requiredMargin: Decimal;
  if (isZero(leverage)) {
    requiredMargin = positionValue; // No leverage means full margin
  } else {
    requiredMargin = divide(positionValue, leverage);
  }

  // Calculate effective leverage (Position Value / Margin)
  const effectiveLeverage = isZero(requiredMargin)
    ? toDecimal(0)
    : divide(positionValue, requiredMargin);

  const currencyDecimals = getCurrencyDecimals(accountCurrency);

  return {
    requiredMargin: toFixed(round(requiredMargin, currencyDecimals), currencyDecimals),
    positionValue: toFixed(round(positionValue, currencyDecimals), currencyDecimals),
    effectiveLeverage: toFixed(round(effectiveLeverage, 2), 2),
  };
}