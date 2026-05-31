// File: src/lib/engine/riskReward.ts
import {
  subtract,
  divide,
  multiply,
  abs,
  toDecimal,
  toFixed,
  round,
  isPositive,
  isGreaterThan,
  isLessThan,
  isZero,
  Decimal,
} from "@/lib/decimal";
import { getPipSize, getPipDecimalPlaces } from "@/lib/forex/pairs";
import { getCurrencyDecimals } from "@/lib/forex/currencies";
import { RiskRewardInput, RiskRewardResult, ValidationResult } from "./types";
import { getPipValuePerLot } from "./pipValue";

/**
 * Validates risk-reward calculator inputs.
 */
export function validateRiskRewardInput(
  input: RiskRewardInput
): ValidationResult {
  const errors: string[] = [];

  const entry = toDecimal(input.entryPrice);
  const sl = toDecimal(input.stopLossPrice);
  const tp = toDecimal(input.takeProfitPrice);

  if (!isPositive(entry)) {
    errors.push("Entry price must be greater than zero");
  }

  if (!isPositive(sl)) {
    errors.push("Stop loss price must be greater than zero");
  }

  if (!isPositive(tp)) {
    errors.push("Take profit price must be greater than zero");
  }

  // Validate direction logic
  if (input.direction === "buy") {
    if (isGreaterThan(sl, entry)) {
      errors.push("For buy trades, stop loss must be below entry price");
    }
    if (isLessThan(tp, entry)) {
      errors.push("For buy trades, take profit must be above entry price");
    }
  } else {
    if (isLessThan(sl, entry)) {
      errors.push("For sell trades, stop loss must be above entry price");
    }
    if (isGreaterThan(tp, entry)) {
      errors.push("For sell trades, take profit must be below entry price");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Converts a price difference to pips.
 */
function priceToPips(
  priceDiff: Decimal,
  currencyPair: string
): Decimal {
  const pipSize = toDecimal(getPipSize(currencyPair));
  return divide(abs(priceDiff), pipSize);
}

/**
 * Calculates risk-to-reward ratio for a trade setup.
 *
 * The risk-reward ratio compares the potential loss (risk) to the potential gain (reward).
 * A ratio of 1:2 means the potential reward is twice the risk.
 *
 * Formulas:
 * - Risk Pips = |Entry - Stop Loss| / Pip Size
 * - Reward Pips = |Take Profit - Entry| / Pip Size
 * - R:R Ratio = Reward Pips / Risk Pips
 *
 * If lot size is provided, also calculates monetary risk/reward:
 * - Risk Amount = Risk Pips * Pip Value * Lot Size
 * - Reward Amount = Reward Pips * Pip Value * Lot Size
 *
 * @param input - Risk-reward calculation inputs
 * @returns Risk-reward analysis
 */
export function calculateRiskReward(input: RiskRewardInput): RiskRewardResult {
  const entry = toDecimal(input.entryPrice);
  const sl = toDecimal(input.stopLossPrice);
  const tp = toDecimal(input.takeProfitPrice);

  // Validate trade direction
  const validation = validateRiskRewardInput(input);

  // Calculate risk and reward in price terms
  const riskPrice = abs(subtract(entry, sl));
  const rewardPrice = abs(subtract(tp, entry));

  // Convert to pips
  const riskPips = priceToPips(riskPrice, input.currencyPair);
  const rewardPips = priceToPips(rewardPrice, input.currencyPair);

  // Calculate ratio
  let riskRewardRatio: Decimal;
  if (isZero(riskPips)) {
    riskRewardRatio = toDecimal(0);
  } else {
    riskRewardRatio = divide(rewardPips, riskPips);
  }

  // Format ratio display
  const ratioDisplay = `1:${toFixed(riskRewardRatio, 2)}`;

  // Base result
  const result: RiskRewardResult = {
    riskPips: toFixed(round(riskPips, 1), 1),
    rewardPips: toFixed(round(rewardPips, 1), 1),
    riskRewardRatio: toFixed(round(riskRewardRatio, 2), 2),
    ratioDisplay,
    isValid: validation.isValid,
    validationMessage: validation.errors.join("; "),
  };

  // Calculate monetary values if lot size provided
  if (
    input.lotSize &&
    input.accountCurrency &&
    input.exchangeRate
  ) {
    const lotSize = toDecimal(input.lotSize);
    const pipValuePerLot = getPipValuePerLot(
      input.currencyPair,
      input.accountCurrency,
      input.exchangeRate,
      input.quoteToAccountRate
    );

    const riskAmount = multiply(multiply(riskPips, pipValuePerLot), lotSize);
    const rewardAmount = multiply(multiply(rewardPips, pipValuePerLot), lotSize);

    const currencyDecimals = getCurrencyDecimals(input.accountCurrency);

    result.riskAmount = toFixed(round(riskAmount, currencyDecimals), currencyDecimals);
    result.rewardAmount = toFixed(round(rewardAmount, currencyDecimals), currencyDecimals);
  }

  return result;
}