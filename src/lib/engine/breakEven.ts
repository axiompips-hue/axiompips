// File: src/lib/engine/breakEven.ts
import {
  add,
  subtract,
  divide,
  multiply,
  toDecimal,
  toFixed,
  round,
  isZero,
  Decimal,
} from "@/lib/decimal";
import { getPipSize, getPipDecimalPlaces } from "@/lib/forex/pairs";
import { getCurrencyDecimals } from "@/lib/forex/currencies";
import { BreakEvenInput, BreakEvenResult, ValidationResult } from "./types";

/**
 * Validates break-even calculator inputs.
 */
export function validateBreakEvenInput(input: BreakEvenInput): ValidationResult {
  const errors: string[] = [];

  const entry = toDecimal(input.entryPrice);

  if (!entry.isPositive()) {
    errors.push("Entry price must be greater than zero");
  }

  if (input.spreadPips) {
    const spread = toDecimal(input.spreadPips);
    if (spread.isNegative()) {
      errors.push("Spread cannot be negative");
    }
  }

  if (input.commissionPerLot) {
    const commission = toDecimal(input.commissionPerLot);
    if (commission.isNegative()) {
      errors.push("Commission cannot be negative");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates the break-even price for a trade.
 *
 * Break-even is the price at which you neither make nor lose money,
 * accounting for spread and commissions.
 *
 * For a BUY trade:
 * - You enter at the ASK (higher) and exit at the BID (lower)
 * - Break-even = Entry + (Total Costs in Pips * Pip Size)
 *
 * For a SELL trade:
 * - You enter at the BID (lower) and exit at the ASK (higher)
 * - Break-even = Entry - (Total Costs in Pips * Pip Size)
 *
 * Total costs include:
 * - Spread (already paid on entry)
 * - Commission (converted to pips)
 *
 * @param input - Break-even calculation inputs
 * @returns Break-even price and costs
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const entry = toDecimal(input.entryPrice);
  const pipSize = toDecimal(getPipSize(input.currencyPair));
  const priceDecimals = getPipDecimalPlaces(input.currencyPair) + 1; // One more decimal than pips

  // Start with spread as the base cost in pips
  let totalCostPips = toDecimal(input.spreadPips ?? 0);

  // Add commission converted to pips (if provided)
  let totalCostMoney = toDecimal(0);
  if (input.commissionPerLot && input.lotSize && input.pipValue) {
    const commission = toDecimal(input.commissionPerLot);
    const lotSize = toDecimal(input.lotSize);
    const pipValue = toDecimal(input.pipValue);

    // Total commission = Commission per lot * Lot size
    const totalCommission = multiply(commission, lotSize);
    totalCostMoney = totalCommission;

    // Convert commission to pips
    // Commission Pips = Commission / Pip Value
    if (!isZero(pipValue)) {
      const commissionPips = divide(totalCommission, multiply(pipValue, lotSize));
      totalCostPips = add(totalCostPips, commissionPips);
    }
  }

  // Calculate break-even price
  const costInPrice = multiply(totalCostPips, pipSize);

  let breakEvenPrice: Decimal;
  if (input.direction === "buy") {
    // For buy: price must go UP to cover costs
    breakEvenPrice = add(entry, costInPrice);
  } else {
    // For sell: price must go DOWN to cover costs
    breakEvenPrice = subtract(entry, costInPrice);
  }

  const result: BreakEvenResult = {
    breakEvenPrice: toFixed(round(breakEvenPrice, priceDecimals), priceDecimals),
    breakEvenPips: toFixed(round(totalCostPips, 1), 1),
  };

  // Add cost in money if we calculated it
  if (!isZero(totalCostMoney)) {
    result.breakEvenCost = toFixed(round(totalCostMoney, 2), 2);
  }

  return result;
}