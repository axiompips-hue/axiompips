// File: src/lib/journal/types.ts
import { TradeDirection } from "@/lib/engine/types";

/**
 * A single trade entry in the journal.
 */
export interface JournalEntry {
  id: string;
  /** Trade date (ISO string) */
  date: string;
  /** Currency pair */
  currencyPair: string;
  /** Trade direction */
  direction: TradeDirection;
  /** Entry price */
  entryPrice: string;
  /** Exit price */
  exitPrice: string;
  /** Stop loss price */
  stopLoss: string;
  /** Take profit price */
  takeProfit: string;
  /** Position size in lots */
  lotSize: string;
  /** Result in R-multiple (e.g., 2 means 2R win, -1 means 1R loss) */
  resultR: string;
  /** Profit/loss in account currency */
  profitLoss: string;
  /** Trade outcome */
  outcome: "win" | "loss" | "breakeven";
  /** User notes */
  notes: string;
  /** Tags for categorization */
  tags: string[];
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Journal statistics.
 */
export interface JournalStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: string;
  averageR: string;
  totalR: string;
  bestTrade: string;
  worstTrade: string;
  profitFactor: string;
  expectancy: string;
  averageWin: string;
  averageLoss: string;
  largestWin: string;
  largestLoss: string;
  currentStreak: {
    type: "win" | "loss" | "none";
    count: number;
  };
  maxWinStreak: number;
  maxLossStreak: number;
}

/**
 * Equity curve data point.
 */
export interface EquityPoint {
  tradeNumber: number;
  date: string;
  cumulativeR: number;
  balance: number;
}