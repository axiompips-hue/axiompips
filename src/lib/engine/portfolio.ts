// File: src/lib/engine/portfolio.ts
import {
  add,
  subtract,
  multiply,
  divide,
  toDecimal,
  toFixed,
  round,
  isZero,
  Decimal,
  percentage,
} from "@/lib/decimal";
import { getPair } from "@/lib/forex/pairs";
import { getCurrencyDecimals } from "@/lib/forex/currencies";
import { getPipValuePerLot } from "./pipValue";
import { TradeDirection } from "./types";

/**
 * Represents a single trade in the portfolio.
 */
export interface PortfolioTrade {
  id: string;
  currencyPair: string;
  direction: TradeDirection;
  lotSize: string | number;
  stopLossPips: string | number;
  entryPrice?: string | number;
  exchangeRate: string | number;
  quoteToAccountRate?: string | number;
}

/**
 * Input for portfolio risk calculation.
 */
export interface PortfolioRiskInput {
  trades: PortfolioTrade[];
  accountBalance: string | number;
  accountCurrency: string;
  riskThresholdPercent?: string | number;
}

/**
 * Individual trade risk breakdown.
 */
export interface TradeRiskDetail {
  id: string;
  currencyPair: string;
  direction: TradeDirection;
  lotSize: string;
  stopLossPips: string;
  riskAmount: string;
  riskPercent: string;
  pipValue: string;
}

/**
 * Portfolio risk calculation result.
 */
export interface PortfolioRiskResult {
  trades: TradeRiskDetail[];
  totalRiskAmount: string;
  totalRiskPercent: string;
  accountBalance: string;
  accountCurrency: string;
  isOverThreshold: boolean;
  thresholdPercent: string;
  remainingRiskAmount: string;
  remainingRiskPercent: string;
}

/**
 * Calculates combined risk for a portfolio of trades.
 *
 * For each trade:
 * Risk Amount = Stop Loss Pips * Pip Value * Lot Size
 *
 * Total Risk = Sum of all individual trade risks
 * Total Risk % = (Total Risk / Account Balance) * 100
 *
 * @param input - Portfolio risk input
 * @returns Portfolio risk analysis
 */
export function calculatePortfolioRisk(
  input: PortfolioRiskInput
): PortfolioRiskResult {
  const accountBalance = toDecimal(input.accountBalance);
  const accountCurrency = input.accountCurrency.toUpperCase();
  const thresholdPercent = toDecimal(input.riskThresholdPercent ?? 5);
  const currencyDecimals = getCurrencyDecimals(accountCurrency);

  let totalRisk = toDecimal(0);
  const tradeDetails: TradeRiskDetail[] = [];

  for (const trade of input.trades) {
    const lotSize = toDecimal(trade.lotSize);
    const stopLossPips = toDecimal(trade.stopLossPips);

    // Get pip value per lot
    const pipValuePerLot = getPipValuePerLot(
      trade.currencyPair,
      accountCurrency,
      trade.exchangeRate,
      trade.quoteToAccountRate
    );

    // Calculate risk for this trade
    const riskAmount = multiply(multiply(stopLossPips, pipValuePerLot), lotSize);
    const riskPercent = isZero(accountBalance)
      ? toDecimal(0)
      : multiply(divide(riskAmount, accountBalance), 100);

    totalRisk = add(totalRisk, riskAmount);

    tradeDetails.push({
      id: trade.id,
      currencyPair: trade.currencyPair,
      direction: trade.direction,
      lotSize: toFixed(lotSize, 2),
      stopLossPips: toFixed(stopLossPips, 1),
      riskAmount: toFixed(round(riskAmount, currencyDecimals), currencyDecimals),
      riskPercent: toFixed(round(riskPercent, 2), 2),
      pipValue: toFixed(round(pipValuePerLot, 4), 4),
    });
  }

  // Calculate total risk percentage
  const totalRiskPercent = isZero(accountBalance)
    ? toDecimal(0)
    : multiply(divide(totalRisk, accountBalance), 100);

  // Calculate remaining risk capacity
  const thresholdAmount = percentage(accountBalance, thresholdPercent);
  const remainingRiskAmount = subtract(thresholdAmount, totalRisk);
  const remainingRiskPercent = subtract(thresholdPercent, totalRiskPercent);

  return {
    trades: tradeDetails,
    totalRiskAmount: toFixed(round(totalRisk, currencyDecimals), currencyDecimals),
    totalRiskPercent: toFixed(round(totalRiskPercent, 2), 2),
    accountBalance: toFixed(round(accountBalance, currencyDecimals), currencyDecimals),
    accountCurrency,
    isOverThreshold: totalRiskPercent.greaterThan(thresholdPercent),
    thresholdPercent: toFixed(thresholdPercent, 1),
    remainingRiskAmount: toFixed(
      round(remainingRiskAmount, currencyDecimals),
      currencyDecimals
    ),
    remainingRiskPercent: toFixed(round(remainingRiskPercent, 2), 2),
  };
}