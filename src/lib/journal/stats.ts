// File: src/lib/journal/stats.ts
import { JournalEntry, JournalStats, EquityPoint } from "./types";
import {
  add,
  subtract,
  divide,
  multiply,
  toDecimal,
  toFixed,
  round,
  abs,
  isPositive,
  isNegative,
  Decimal,
} from "@/lib/decimal";

/**
 * Calculates journal statistics from entries.
 */
export function calculateJournalStats(entries: JournalEntry[]): JournalStats {
  if (entries.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: "0.00",
      averageR: "0.00",
      totalR: "0.00",
      bestTrade: "0.00",
      worstTrade: "0.00",
      profitFactor: "0.00",
      expectancy: "0.00",
      averageWin: "0.00",
      averageLoss: "0.00",
      largestWin: "0.00",
      largestLoss: "0.00",
      currentStreak: { type: "none", count: 0 },
      maxWinStreak: 0,
      maxLossStreak: 0,
    };
  }

  // Sort entries by date for streak calculation
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalR = toDecimal(0);
  let totalWinR = toDecimal(0);
  let totalLossR = toDecimal(0);
  let bestTrade = toDecimal("-999999");
  let worstTrade = toDecimal("999999");
  let largestWin = toDecimal(0);
  let largestLoss = toDecimal(0);

  // Streak tracking
  let currentStreakType: "win" | "loss" | "none" = "none";
  let currentStreakCount = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  for (const entry of sortedEntries) {
    const r = toDecimal(entry.resultR);
    totalR = add(totalR, r);

    // Track best/worst
    if (r.greaterThan(bestTrade)) {
      bestTrade = r;
    }
    if (r.lessThan(worstTrade)) {
      worstTrade = r;
    }

    if (entry.outcome === "win") {
      wins++;
      totalWinR = add(totalWinR, r);
      if (r.greaterThan(largestWin)) {
        largestWin = r;
      }

      // Streak
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > maxWinStreak) {
        maxWinStreak = tempWinStreak;
      }
      currentStreakType = "win";
      currentStreakCount = tempWinStreak;
    } else if (entry.outcome === "loss") {
      losses++;
      totalLossR = add(totalLossR, abs(r));
      if (r.lessThan(largestLoss)) {
        largestLoss = r;
      }

      // Streak
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > maxLossStreak) {
        maxLossStreak = tempLossStreak;
      }
      currentStreakType = "loss";
      currentStreakCount = tempLossStreak;
    } else {
      breakevens++;
      tempWinStreak = 0;
      tempLossStreak = 0;
    }
  }

  const totalTrades = entries.length;
  const tradesWithOutcome = wins + losses;

  // Calculate stats
  const winRate = tradesWithOutcome > 0
    ? multiply(divide(toDecimal(wins), toDecimal(tradesWithOutcome)), 100)
    : toDecimal(0);

  const averageR = totalTrades > 0
    ? divide(totalR, toDecimal(totalTrades))
    : toDecimal(0);

  const averageWin = wins > 0
    ? divide(totalWinR, toDecimal(wins))
    : toDecimal(0);

  const averageLoss = losses > 0
    ? divide(totalLossR, toDecimal(losses))
    : toDecimal(0);

  // Profit factor = gross wins / gross losses
  const profitFactor = totalLossR.greaterThan(0)
    ? divide(totalWinR, totalLossR)
    : totalWinR.greaterThan(0)
    ? toDecimal(999)
    : toDecimal(0);

  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
  const winPercent = tradesWithOutcome > 0 ? divide(toDecimal(wins), toDecimal(tradesWithOutcome)) : toDecimal(0);
  const lossPercent = tradesWithOutcome > 0 ? divide(toDecimal(losses), toDecimal(tradesWithOutcome)) : toDecimal(0);
  const expectancy = subtract(
    multiply(winPercent, averageWin),
    multiply(lossPercent, averageLoss)
  );

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate: toFixed(round(winRate, 2), 2),
    averageR: toFixed(round(averageR, 2), 2),
    totalR: toFixed(round(totalR, 2), 2),
    bestTrade: toFixed(round(bestTrade, 2), 2),
    worstTrade: toFixed(round(worstTrade, 2), 2),
    profitFactor: toFixed(round(profitFactor, 2), 2),
    expectancy: toFixed(round(expectancy, 4), 4),
    averageWin: toFixed(round(averageWin, 2), 2),
    averageLoss: toFixed(round(averageLoss, 2), 2),
    largestWin: toFixed(round(largestWin, 2), 2),
    largestLoss: toFixed(round(largestLoss, 2), 2),
    currentStreak: {
      type: currentStreakType,
      count: currentStreakCount,
    },
    maxWinStreak,
    maxLossStreak,
  };
}

/**
 * Generates equity curve data from journal entries.
 */
export function generateEquityCurve(
  entries: JournalEntry[],
  startingBalance: number = 10000,
  riskPerTrade: number = 100
): EquityPoint[] {
  if (entries.length === 0) return [];

  // Sort by date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const points: EquityPoint[] = [
    {
      tradeNumber: 0,
      date: "Start",
      cumulativeR: 0,
      balance: startingBalance,
    },
  ];

  let cumulativeR = 0;
  let balance = startingBalance;

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const r = parseFloat(entry.resultR);
    cumulativeR += r;
    balance = startingBalance + cumulativeR * riskPerTrade;

    points.push({
      tradeNumber: i + 1,
      date: entry.date,
      cumulativeR,
      balance,
    });
  }

  return points;
}