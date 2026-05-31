// File: src/lib/engine/compounding.ts
import {
  add,
  subtract,
  multiply,
  divide,
  toDecimal,
  toFixed,
  round,
  percentage,
  Decimal,
} from "@/lib/decimal";

/**
 * Input for compounding projection.
 */
export interface CompoundingInput {
  /** Starting account balance */
  startingBalance: string | number;
  /** Risk percentage per trade */
  riskPercent: string | number;
  /** Expected average R (reward multiple, e.g., 2 means 2R average win) */
  averageR: string | number;
  /** Win rate as percentage (e.g., 50 for 50%) */
  winRate: string | number;
  /** Number of trades to simulate */
  tradeCount: number;
  /** Whether to compound (reinvest profits) */
  compounding: boolean;
}

/**
 * Single trade result in the projection.
 */
export interface ProjectedTrade {
  tradeNumber: number;
  balanceBefore: string;
  riskAmount: string;
  outcome: "win" | "loss";
  profitLoss: string;
  balanceAfter: string;
  totalReturn: string;
  totalReturnPercent: string;
}

/**
 * Compounding projection result.
 */
export interface CompoundingResult {
  trades: ProjectedTrade[];
  summary: {
    startingBalance: string;
    endingBalance: string;
    totalProfit: string;
    totalReturnPercent: string;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: string;
    averageR: string;
    maxDrawdown: string;
    maxDrawdownPercent: string;
    peakBalance: string;
  };
  chartData: {
    labels: number[];
    balances: number[];
    peakLine: number[];
  };
}

/**
 * Calculates expected value per trade.
 * 
 * Formula: EV = (WinRate * AverageR * RiskPercent) - ((1 - WinRate) * RiskPercent)
 * 
 * Example with 50% win rate, 2R average, 1% risk:
 * EV = (0.5 * 2 * 1%) - (0.5 * 1%) = 1% - 0.5% = 0.5% per trade
 */
export function calculateExpectedValue(
  winRate: string | number,
  averageR: string | number,
  riskPercent: string | number
): string {
  const wr = divide(toDecimal(winRate), 100);
  const ar = toDecimal(averageR);
  const rp = toDecimal(riskPercent);

  const winComponent = multiply(multiply(wr, ar), rp);
  const lossComponent = multiply(subtract(toDecimal(1), wr), rp);
  const ev = subtract(winComponent, lossComponent);

  return toFixed(round(ev, 4), 4);
}

/**
 * Projects account growth with compounding.
 * 
 * This uses a deterministic simulation based on win rate.
 * For example, with 50% win rate over 10 trades, it alternates wins and losses
 * to show the expected progression.
 * 
 * @param input - Compounding parameters
 * @returns Projected growth with trade-by-trade breakdown
 */
export function calculateCompounding(input: CompoundingInput): CompoundingResult {
  const startingBalance = toDecimal(input.startingBalance);
  const riskPercent = toDecimal(input.riskPercent);
  const averageR = toDecimal(input.averageR);
  const winRate = divide(toDecimal(input.winRate), 100);
  const tradeCount = input.tradeCount;
  const compounding = input.compounding;

  const trades: ProjectedTrade[] = [];
  let currentBalance = startingBalance;
  let peakBalance = startingBalance;
  let maxDrawdown = toDecimal(0);
  let wins = 0;
  let losses = 0;

  // Determine win/loss pattern based on win rate
  // For a more realistic simulation, we distribute wins evenly
  const winsNeeded = Math.round(tradeCount * parseFloat(winRate.toString()));
  const winPattern: boolean[] = [];
  
  // Create a pattern that distributes wins evenly
  for (let i = 0; i < tradeCount; i++) {
    const expectedWins = Math.round((i + 1) * parseFloat(winRate.toString()));
    const currentWins = winPattern.filter(w => w).length;
    winPattern.push(expectedWins > currentWins);
  }

  // Chart data
  const labels: number[] = [0];
  const balances: number[] = [parseFloat(startingBalance.toString())];
  const peakLine: number[] = [parseFloat(startingBalance.toString())];

  for (let i = 0; i < tradeCount; i++) {
    const balanceBefore = currentBalance;
    
    // Calculate risk amount
    let riskAmount: Decimal;
    if (compounding) {
      riskAmount = percentage(currentBalance, riskPercent);
    } else {
      riskAmount = percentage(startingBalance, riskPercent);
    }

    // Determine outcome
    const isWin = winPattern[i];
    let profitLoss: Decimal;

    if (isWin) {
      // Win: profit = risk * averageR
      profitLoss = multiply(riskAmount, averageR);
      wins++;
    } else {
      // Loss: lose the risk amount
      profitLoss = multiply(riskAmount, -1);
      losses++;
    }

    currentBalance = add(currentBalance, profitLoss);

    // Track peak and drawdown
    if (currentBalance.greaterThan(peakBalance)) {
      peakBalance = currentBalance;
    }
    const currentDrawdown = subtract(peakBalance, currentBalance);
    if (currentDrawdown.greaterThan(maxDrawdown)) {
      maxDrawdown = currentDrawdown;
    }

    // Calculate total return
    const totalProfit = subtract(currentBalance, startingBalance);
    const totalReturnPercent = multiply(divide(totalProfit, startingBalance), 100);

    trades.push({
      tradeNumber: i + 1,
      balanceBefore: toFixed(round(balanceBefore, 2), 2),
      riskAmount: toFixed(round(riskAmount, 2), 2),
      outcome: isWin ? "win" : "loss",
      profitLoss: toFixed(round(profitLoss, 2), 2),
      balanceAfter: toFixed(round(currentBalance, 2), 2),
      totalReturn: toFixed(round(totalProfit, 2), 2),
      totalReturnPercent: toFixed(round(totalReturnPercent, 2), 2),
    });

    // Chart data
    labels.push(i + 1);
    balances.push(parseFloat(currentBalance.toFixed(2)));
    peakLine.push(parseFloat(peakBalance.toFixed(2)));
  }

  // Calculate summary
  const totalProfit = subtract(currentBalance, startingBalance);
  const totalReturnPercent = multiply(divide(totalProfit, startingBalance), 100);
  const maxDrawdownPercent = multiply(divide(maxDrawdown, peakBalance), 100);

  return {
    trades,
    summary: {
      startingBalance: toFixed(round(startingBalance, 2), 2),
      endingBalance: toFixed(round(currentBalance, 2), 2),
      totalProfit: toFixed(round(totalProfit, 2), 2),
      totalReturnPercent: toFixed(round(totalReturnPercent, 2), 2),
      totalTrades: tradeCount,
      wins,
      losses,
      winRate: toFixed(round(multiply(winRate, 100), 1), 1),
      averageR: toFixed(averageR, 2),
      maxDrawdown: toFixed(round(maxDrawdown, 2), 2),
      maxDrawdownPercent: toFixed(round(maxDrawdownPercent, 2), 2),
      peakBalance: toFixed(round(peakBalance, 2), 2),
    },
    chartData: {
      labels,
      balances,
      peakLine,
    },
  };
}