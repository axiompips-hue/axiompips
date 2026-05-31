// File: src/app/journal/TradeJournal.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { Crown, Cloud, HardDrive, Lock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ResultDisplay, ResultItem } from "@/components/ui/ResultDisplay";
import { LineChart } from "@/components/charts";
import { PAIR_OPTIONS, DIRECTION_OPTIONS } from "@/lib/constants/options";
import { TradeDirection } from "@/lib/engine";
import {
  JournalEntry,
  JournalStats,
  calculateJournalStats,
  generateEquityCurve,
} from "@/lib/journal";
import {
  initializeSync,
  syncAddEntry,
  syncDeleteEntry,
  syncUpdateEntry,
  SyncStatus,
} from "@/lib/journal/sync";
import {
  getPremiumStatus,
  getUsageLimits,
  incrementJournalEntry,
  type PremiumStatus,
  type UsageLimits,
} from "@/lib/premium/service";

// ============================================================================
// Types
// ============================================================================

interface NewTradeForm {
  date: string;
  currencyPair: string;
  direction: TradeDirection;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
  resultR: string;
  profitLoss: string;
  outcome: "win" | "loss" | "breakeven";
  notes: string;
  tags: string;
}

type InsightSeverity = "success" | "warning" | "danger" | "neutral" | "info";

interface AIInsight {
  id: string;
  title: string;
  message: string;
  severity: InsightSeverity;
  confidence: number;
  category: "performance" | "behavior" | "pattern" | "risk" | "opportunity";
  actionable?: string;
}

interface SlTpValidation {
  isValid: boolean;
  slError: string;
  tpError: string;
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  timestamp: number;
}

interface TagStat {
  tag: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgR: number;
  totalR: number;
}

interface CalendarDay {
  date: string;
  pnl: number;
  r: number;
  count: number;
  hasData: boolean;
}

type SortOption = "date-desc" | "date-asc" | "pnl-desc" | "pnl-asc" | "r-desc" | "r-asc";
type OutcomeFilter = "all" | "win" | "loss" | "breakeven";
type DirectionFilter = "all" | "buy" | "sell";
type StatsTab = "overview" | "tags" | "calendar";

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);
const TOAST_DURATION = 3000;

const DEFAULT_FORM: NewTradeForm = {
  date: new Date().toISOString().split("T")[0],
  currencyPair: "EURUSD",
  direction: "buy",
  entryPrice: "",
  exitPrice: "",
  stopLoss: "",
  takeProfit: "",
  lotSize: "0.1",
  resultR: "",
  profitLoss: "",
  outcome: "breakeven",
  notes: "",
  tags: "",
};

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "pnl-desc", label: "Highest P/L" },
  { value: "pnl-asc", label: "Lowest P/L" },
  { value: "r-desc", label: "Best R" },
  { value: "r-asc", label: "Worst R" },
];

const OUTCOME_FILTER_OPTIONS = [
  { value: "all", label: "All Outcomes" },
  { value: "win", label: "Wins Only" },
  { value: "loss", label: "Losses Only" },
  { value: "breakeven", label: "Break-even" },
];

const DIRECTION_FILTER_OPTIONS = [
  { value: "all", label: "All Directions" },
  { value: "buy", label: "Buy Only" },
  { value: "sell", label: "Sell Only" },
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ============================================================================
// Utility Functions
// ============================================================================

function safeParseFloat(value: string | undefined | null): number {
  if (!value || value === "" || value === "NaN") return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
}

function formatCurrency(value: number): string {
  if (!isFinite(value)) return "$0.00";
  const prefix = value >= 0 ? "+$" : "-$";
  return prefix + Math.abs(value).toFixed(2);
}

function formatR(value: string | number): string {
  const num = typeof value === "string" ? safeParseFloat(value) : value;
  if (num === 0) return "0R";
  const prefix = num >= 0 ? "+" : "";
  return prefix + num.toFixed(2) + "R";
}

function getDateFromString(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

function calculateTradeData(form: NewTradeForm): {
  outcome: JournalEntry["outcome"];
  profitLoss: string;
  resultR: string;
} {
  const entry = safeParseFloat(form.entryPrice);
  const exit = safeParseFloat(form.exitPrice);
  const stop = safeParseFloat(form.stopLoss);
  const lot = safeParseFloat(form.lotSize);
  const direction = form.direction;
  const currencyPair = form.currencyPair;

  if (entry <= 0 || exit <= 0 || lot <= 0) {
    return { outcome: "breakeven", profitLoss: "", resultR: "" };
  }

  const priceDiff = direction === "buy" ? exit - entry : entry - exit;
  const isJPYPair = currencyPair.toUpperCase().includes("JPY");
  const pipMultiplier = isJPYPair ? 100 : 10000;
  const pipsDiff = priceDiff * pipMultiplier;
  const pipValuePerStandardLot = 10;
  const calculatedProfitLoss = pipsDiff * pipValuePerStandardLot * lot;

  let calculatedResultR: number | null = null;
  if (stop > 0 && stop !== entry) {
    const riskPriceDiff = Math.abs(entry - stop);
    const riskPips = riskPriceDiff * pipMultiplier;
    if (riskPips > 0) {
      calculatedResultR = pipsDiff / riskPips;
    }
  }

  const R_BUFFER = 0.05;
  const PL_BUFFER = 0.5;

  let calculatedOutcome: JournalEntry["outcome"] = "breakeven";
  if (calculatedResultR !== null && isFinite(calculatedResultR)) {
    if (calculatedResultR > R_BUFFER) calculatedOutcome = "win";
    else if (calculatedResultR < -R_BUFFER) calculatedOutcome = "loss";
  } else if (isFinite(calculatedProfitLoss)) {
    if (calculatedProfitLoss > PL_BUFFER) calculatedOutcome = "win";
    else if (calculatedProfitLoss < -PL_BUFFER) calculatedOutcome = "loss";
  }

  return {
    outcome: calculatedOutcome,
    profitLoss: isFinite(calculatedProfitLoss) ? calculatedProfitLoss.toFixed(2) : "",
    resultR:
      calculatedResultR !== null && isFinite(calculatedResultR)
        ? calculatedResultR.toFixed(2)
        : "",
  };
}

function validateSlTpWithEntry(
  direction: TradeDirection,
  entryPrice: string,
  stopLoss: string,
  takeProfit: string
): SlTpValidation {
  const entry = safeParseFloat(entryPrice);
  const sl = safeParseFloat(stopLoss);
  const tp = safeParseFloat(takeProfit);

  let slError = "";
  let tpError = "";

  if (entry > 0) {
    if (sl > 0) {
      if (direction === "buy" && sl >= entry) {
        slError = "For BUY trades, Stop Loss must be below Entry Price.";
      } else if (direction === "sell" && sl <= entry) {
        slError = "For SELL trades, Stop Loss must be above Entry Price.";
      }
    }
    if (tp > 0) {
      if (direction === "buy" && tp <= entry) {
        tpError = "For BUY trades, Take Profit must be above Entry Price.";
      } else if (direction === "sell" && tp >= entry) {
        tpError = "For SELL trades, Take Profit must be below Entry Price.";
      }
    }
  }

  if (tpError === "" && sl > 0 && tp > 0) {
    if (direction === "buy" && tp <= sl) {
      tpError = "For BUY trades, Take Profit must be greater than Stop Loss.";
    } else if (direction === "sell" && tp >= sl) {
      tpError = "For SELL trades, Take Profit must be less than Stop Loss.";
    }
  }

  return { isValid: slError === "" && tpError === "", slError, tpError };
}

// ============================================================================
// Tag Analytics Engine
// ============================================================================

function calculateTagStats(entries: JournalEntry[]): TagStat[] {
  const tagMap: Record<string, { wins: number; losses: number; total: number; totalR: number }> = {};
  entries.forEach((entry) => {
    const r = safeParseFloat(entry.resultR);
    entry.tags.forEach((rawTag) => {
      const tag = rawTag.trim().toLowerCase();
      if (!tag) return;
      if (!tagMap[tag]) tagMap[tag] = { wins: 0, losses: 0, total: 0, totalR: 0 };
      tagMap[tag].total++;
      tagMap[tag].totalR += r;
      if (entry.outcome === "win") tagMap[tag].wins++;
      if (entry.outcome === "loss") tagMap[tag].losses++;
    });
  });
  return Object.entries(tagMap)
    .map(([tag, s]) => ({
      tag,
      total: s.total,
      wins: s.wins,
      losses: s.losses,
      winRate: s.total > 0 ? parseFloat(((s.wins / s.total) * 100).toFixed(1)) : 0,
      avgR: s.total > 0 ? parseFloat((s.totalR / s.total).toFixed(2)) : 0,
      totalR: parseFloat(s.totalR.toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total);
}

// ============================================================================
// Calendar Engine
// ============================================================================

function buildCalendarData(entries: JournalEntry[], year: number, month: number): CalendarDay[][] {
  const dayMap: Record<string, { pnl: number; r: number; count: number }> = {};
  entries.forEach((entry) => {
    const d = getDateFromString(entry.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    if (!dayMap[entry.date]) dayMap[entry.date] = { pnl: 0, r: 0, count: 0 };
    dayMap[entry.date].pnl += safeParseFloat(entry.profitLoss);
    dayMap[entry.date].r += safeParseFloat(entry.resultR);
    dayMap[entry.date].count++;
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  for (let i = 0; i < startDow; i++) {
    currentWeek.push({ date: "", pnl: 0, r: 0, count: 0, hasData: false });
  }
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    const data = dayMap[dateStr];
    currentWeek.push({
      date: dateStr,
      pnl: data ? parseFloat(data.pnl.toFixed(2)) : 0,
      r: data ? parseFloat(data.r.toFixed(2)) : 0,
      count: data ? data.count : 0,
      hasData: !!data,
    });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", pnl: 0, r: 0, count: 0, hasData: false });
    }
    weeks.push(currentWeek);
  }
  return weeks;
}

// ============================================================================
// AI Insight Engine
// ============================================================================

function generateAIInsights(entries: JournalEntry[]): AIInsight[] {
  const insights: AIInsight[] = [];

  if (entries.length < 3) {
    return [
      {
        id: "onboarding",
        title: "Building Your Trading Profile",
        message:
          "I need at least 3 trades to begin pattern recognition. Continue logging your trades, and I will start identifying behavioral patterns, optimal conditions, and areas for improvement.",
        severity: "info",
        confidence: 100,
        category: "pattern",
        actionable: "Log more trades to unlock personalized insights.",
      },
    ];
  }

  const safeEntries = entries.map((e) => ({
    ...e,
    resultR: safeParseFloat(e.resultR),
    profitLoss: safeParseFloat(e.profitLoss),
    lotSize: safeParseFloat(e.lotSize),
  }));

  const pairStats: Record<string, { wins: number; total: number; totalR: number }> = {};
  safeEntries.forEach((t) => {
    const p = t.currencyPair;
    if (!pairStats[p]) pairStats[p] = { wins: 0, total: 0, totalR: 0 };
    pairStats[p].total++;
    pairStats[p].totalR += t.resultR;
    if (t.outcome === "win") pairStats[p].wins++;
  });

  Object.entries(pairStats).forEach(([pair, stat]) => {
    if (stat.total < 3) return;
    const winRate = (stat.wins / stat.total) * 100;
    const avgR = stat.totalR / stat.total;

    if (winRate >= 70 && avgR > 0.5) {
      insights.push({
        id: `strength-${pair}`,
        title: `${pair}: Your Edge Asset`,
        message: `Your performance on ${pair} is exceptional. With a ${winRate.toFixed(0)}% win rate and ${avgR.toFixed(2)}R average, this pair aligns well with your trading style.`,
        severity: "success",
        confidence: Math.min(95, 70 + stat.total * 2),
        category: "opportunity",
        actionable: `Prioritize ${pair} setups and consider slightly larger position sizes when conditions are optimal.`,
      });
    } else if (winRate <= 35 && stat.total >= 4) {
      insights.push({
        id: `weakness-${pair}`,
        title: `${pair}: Consistent Losses Detected`,
        message: `Analysis shows ${pair} is eroding your account with only a ${winRate.toFixed(0)}% win rate across ${stat.total} trades.`,
        severity: "danger",
        confidence: Math.min(95, 75 + stat.total * 2),
        category: "risk",
        actionable: `Reduce or eliminate ${pair} from your watchlist.`,
      });
    }
  });

  const dayStats: Record<number, { pnl: number; count: number; wins: number }> = {};
  safeEntries.forEach((t) => {
    const d = getDateFromString(t.date).getDay();
    if (!dayStats[d]) dayStats[d] = { pnl: 0, count: 0, wins: 0 };
    dayStats[d].pnl += t.resultR;
    dayStats[d].count++;
    if (t.outcome === "win") dayStats[d].wins++;
  });

  let worstDay = { idx: -1, pnl: 0, count: 0 };
  let bestDay = { idx: -1, pnl: 0, count: 0 };

  Object.entries(dayStats).forEach(([dStr, s]) => {
    const d = parseInt(dStr);
    if (s.count >= 2) {
      if (s.pnl < worstDay.pnl) worstDay = { idx: d, pnl: s.pnl, count: s.count };
      if (s.pnl > bestDay.pnl) bestDay = { idx: d, pnl: s.pnl, count: s.count };
    }
  });

  if (worstDay.idx !== -1 && worstDay.pnl < -1) {
    insights.push({
      id: "worst-day",
      title: `${WEEKDAYS[worstDay.idx]}: Your Blind Spot`,
      message: `Data indicates ${WEEKDAYS[worstDay.idx]}s are problematic. Net loss of ${Math.abs(worstDay.pnl).toFixed(1)}R across ${worstDay.count} trades.`,
      severity: "warning",
      confidence: Math.min(90, 65 + worstDay.count * 3),
      category: "behavior",
      actionable: `Consider sitting out on ${WEEKDAYS[worstDay.idx]}s or trading reduced size.`,
    });
  }

  if (bestDay.idx !== -1 && bestDay.pnl > 1) {
    insights.push({
      id: "best-day",
      title: `${WEEKDAYS[bestDay.idx]}: Peak Performance Day`,
      message: `Your edge is sharpest on ${WEEKDAYS[bestDay.idx]}s with +${bestDay.pnl.toFixed(1)}R profit across ${bestDay.count} trades.`,
      severity: "success",
      confidence: Math.min(90, 65 + bestDay.count * 3),
      category: "opportunity",
      actionable: `Plan your highest conviction trades for ${WEEKDAYS[bestDay.idx]}s.`,
    });
  }

  let lossFollowUpWins = 0;
  let lossFollowUpTotal = 0;

  for (let i = 1; i < safeEntries.length; i++) {
    const prev = safeEntries[i - 1];
    const curr = safeEntries[i];
    if (prev.outcome === "loss") {
      lossFollowUpTotal++;
      if (curr.outcome === "win") lossFollowUpWins++;
    }
  }

  if (lossFollowUpTotal >= 4) {
    const recoveryRate = (lossFollowUpWins / lossFollowUpTotal) * 100;
    const overallWinRate =
      (safeEntries.filter((e) => e.outcome === "win").length / safeEntries.length) * 100;

    if (recoveryRate < overallWinRate - 20) {
      insights.push({
        id: "tilt-detected",
        title: "Tilt Trading Pattern Identified",
        message: `After a loss, your win rate drops to ${recoveryRate.toFixed(0)}% (vs your normal ${overallWinRate.toFixed(0)}%). This suggests revenge trading or emotional decision-making.`,
        severity: "danger",
        confidence: 88,
        category: "behavior",
        actionable: "Implement a mandatory 1-hour break after any losing trade.",
      });
    }
  }

  const winsWithR = safeEntries.filter((e) => e.outcome === "win" && e.resultR > 0);
  const lossesWithR = safeEntries.filter((e) => e.outcome === "loss" && e.resultR < 0);

  if (winsWithR.length >= 3 && lossesWithR.length >= 3) {
    const avgWin = winsWithR.reduce((a, b) => a + b.resultR, 0) / winsWithR.length;
    const avgLoss =
      Math.abs(lossesWithR.reduce((a, b) => a + b.resultR, 0) / lossesWithR.length);
    const rrRatio = avgWin / avgLoss;

    if (rrRatio < 1) {
      insights.push({
        id: "rr-issue",
        title: "Risk-Reward Imbalance",
        message: `Your average win (${avgWin.toFixed(2)}R) is smaller than your average loss (${avgLoss.toFixed(2)}R). You need to win more than ${(100 / (1 + rrRatio)).toFixed(0)}% of trades just to break even.`,
        severity: "warning",
        confidence: 90,
        category: "risk",
        actionable: "Let winners run longer or tighten stop losses. Aim for minimum 1.5:1 R:R.",
      });
    } else if (rrRatio >= 2) {
      insights.push({
        id: "rr-excellent",
        title: "Strong Risk-Reward Management",
        message: `Excellent risk management. Your average win (${avgWin.toFixed(2)}R) is ${rrRatio.toFixed(1)}x your average loss.`,
        severity: "success",
        confidence: 90,
        category: "performance",
      });
    }
  }

  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}

// ============================================================================
// Toast System
// ============================================================================

const Toast = memo(function Toast({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-start gap-3 animate-slide-in ${
            toast.type === "success"
              ? "bg-green-950/90 border border-green-800"
              : toast.type === "error"
              ? "bg-red-950/90 border border-red-800"
              : "bg-blue-950/90 border border-blue-800"
          }`}
        >
          <div
            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              toast.type === "success"
                ? "bg-green-500/20"
                : toast.type === "error"
                ? "bg-red-500/20"
                : "bg-blue-500/20"
            }`}
          >
            {toast.type === "success" && (
              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === "info" && (
              <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${toast.type === "success" ? "text-green-200" : toast.type === "error" ? "text-red-200" : "text-blue-200"}`}>
              {toast.title}
            </p>
            <p className={`text-sm mt-0.5 ${toast.type === "success" ? "text-green-300/80" : toast.type === "error" ? "text-red-300/80" : "text-blue-300/80"}`}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className={`flex-shrink-0 transition-colors ${toast.type === "success" ? "text-green-400 hover:text-green-300" : toast.type === "error" ? "text-red-400 hover:text-red-300" : "text-blue-400 hover:text-blue-300"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// Form Section Components
// ============================================================================

const FormSection = memo(function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
});

const FormRow = memo(function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
});

// ============================================================================
// Trade Card Component
// ============================================================================

const TradeCard = memo(function TradeCard({
  entry,
  onDelete,
  onEdit,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: JournalEntry) => void;
}) {
  const resultR = safeParseFloat(entry.resultR);
  const profitLoss = safeParseFloat(entry.profitLoss);

  return (
    <Card className="p-4 hover:border-zinc-600 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`h-12 rounded-lg flex items-center justify-center font-bold px-3 min-w-[4rem] ${
              entry.outcome === "win"
                ? "bg-green-950/50 text-green-400 border border-green-800/50"
                : entry.outcome === "loss"
                ? "bg-red-950/50 text-red-400 border border-red-800/50"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            }`}
          >
            {entry.resultR ? formatR(resultR) : "N/A"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-100">{entry.currencyPair}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  entry.direction === "buy"
                    ? "bg-green-950/50 text-green-400"
                    : "bg-red-950/50 text-red-400"
                }`}
              >
                {entry.direction.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              {getDateFromString(entry.date).toLocaleDateString()} | {entry.lotSize} lots
            </p>
            {entry.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {entry.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className={`font-mono font-bold ${
                entry.outcome === "win"
                  ? "text-green-400"
                  : entry.outcome === "loss"
                  ? "text-red-400"
                  : "text-zinc-400"
              }`}
            >
              {entry.profitLoss ? formatCurrency(profitLoss) : "-"}
            </p>
            <p className="text-xs text-zinc-500">
              Entry: {entry.entryPrice} | Exit: {entry.exitPrice}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="small"
              onClick={() => onEdit(entry)}
              className="text-zinc-500 hover:text-accent-400 text-xs"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => onDelete(entry.id)}
              className="text-zinc-500 hover:text-red-400 text-xs"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      {entry.notes && (
        <p className="mt-3 text-sm text-zinc-400 border-t border-zinc-800 pt-3">{entry.notes}</p>
      )}
    </Card>
  );
});

// ============================================================================
// Edit Trade Modal
// ============================================================================

const EditTradeModal = memo(function EditTradeModal({
  entry,
  onSave,
  onClose,
}: {
  entry: JournalEntry;
  onSave: (updated: JournalEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewTradeForm>({
    date: entry.date,
    currencyPair: entry.currencyPair,
    direction: entry.direction,
    entryPrice: entry.entryPrice,
    exitPrice: entry.exitPrice,
    stopLoss: entry.stopLoss,
    takeProfit: entry.takeProfit,
    lotSize: entry.lotSize,
    resultR: entry.resultR,
    profitLoss: entry.profitLoss,
    outcome: entry.outcome,
    notes: entry.notes,
    tags: entry.tags.join(", "),
  });
  const [isSaving, setIsSaving] = useState(false);

  const slTpValidation = useMemo(
    () => validateSlTpWithEntry(form.direction, form.entryPrice, form.stopLoss, form.takeProfit),
    [form.direction, form.entryPrice, form.stopLoss, form.takeProfit]
  );

  useEffect(() => {
    const { outcome, profitLoss, resultR } = calculateTradeData(form);
    setForm((prev) => ({ ...prev, outcome, profitLoss, resultR }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.entryPrice, form.exitPrice, form.stopLoss, form.lotSize, form.direction, form.currencyPair]);

  const handleField = useCallback(
    (field: keyof NewTradeForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const updated: JournalEntry = {
      ...entry,
      date: form.date,
      currencyPair: form.currencyPair,
      direction: form.direction,
      entryPrice: form.entryPrice,
      exitPrice: form.exitPrice,
      stopLoss: form.stopLoss,
      takeProfit: form.takeProfit,
      lotSize: form.lotSize,
      resultR: form.resultR,
      profitLoss: form.profitLoss,
      outcome: form.outcome,
      notes: form.notes,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    try {
      await onSave(updated);
    } finally {
      setIsSaving(false);
    }
  }, [form, entry, onSave]);

  const hasCalcValues = form.entryPrice && form.exitPrice && form.lotSize;
  const canSave = !isSaving && (slTpValidation.isValid || (!form.stopLoss && !form.takeProfit));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-neutral-900 z-10">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Edit Trade</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {entry.currencyPair} &middot; {getDateFromString(entry.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <FormSection title="Trade Details">
            <FormRow>
              <Input label="Date" type="date" value={form.date} onChange={handleField("date")} required />
              <Select label="Currency Pair" options={PAIR_OPTIONS} value={form.currencyPair} onChange={handleField("currencyPair")} />
            </FormRow>
            <FormRow>
              <Select label="Direction" options={DIRECTION_OPTIONS} value={form.direction} onChange={handleField("direction")} />
              <Input label="Lot Size" type="number" value={form.lotSize} onChange={handleField("lotSize")} step="0.01" min="0.01" required />
            </FormRow>
          </FormSection>

          <FormSection title="Price Levels">
            <FormRow>
              <Input label="Entry Price" type="number" value={form.entryPrice} onChange={handleField("entryPrice")} step="0.00001" min="0" required />
              <Input label="Exit Price" type="number" value={form.exitPrice} onChange={handleField("exitPrice")} step="0.00001" min="0" required />
            </FormRow>
            <FormRow>
              <div className="space-y-1.5">
                <Input label="Stop Loss" type="number" value={form.stopLoss} onChange={handleField("stopLoss")} step="0.00001" min="0" />
                {slTpValidation.slError && <p className="text-xs text-red-400">{slTpValidation.slError}</p>}
              </div>
              <div className="space-y-1.5">
                <Input label="Take Profit" type="number" value={form.takeProfit} onChange={handleField("takeProfit")} step="0.00001" min="0" />
                {slTpValidation.tpError && <p className="text-xs text-red-400">{slTpValidation.tpError}</p>}
              </div>
            </FormRow>
          </FormSection>

          {/* Auto-calculated results */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Result (R)</p>
              <p className={`text-lg font-bold font-mono ${form.resultR ? (parseFloat(form.resultR) >= 0 ? "text-green-400" : "text-red-400") : "text-zinc-500"}`}>
                {form.resultR ? formatR(form.resultR) : "-"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Est. P/L</p>
              <p className={`text-lg font-bold font-mono ${form.profitLoss ? (parseFloat(form.profitLoss) >= 0 ? "text-green-400" : "text-red-400") : "text-zinc-500"}`}>
                {form.profitLoss ? formatCurrency(parseFloat(form.profitLoss)) : "-"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Outcome</p>
              <p className={`text-lg font-bold capitalize ${hasCalcValues ? (form.outcome === "win" ? "text-green-400" : form.outcome === "loss" ? "text-red-400" : "text-zinc-400") : "text-zinc-500"}`}>
                {hasCalcValues ? (form.outcome === "breakeven" ? "B/E" : form.outcome) : "-"}
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center -mt-3">Auto-calculated from entry, exit, and stop loss prices</p>

          <FormSection title="Additional Info">
            <Input
              label="Tags"
              type="text"
              value={form.tags}
              onChange={handleField("tags")}
              placeholder="trend, breakout, scalp"
              helper="Comma-separated tags for categorization"
            />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={handleField("notes")}
                rows={3}
                className="w-full px-3 py-2 bg-neutral-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors resize-none"
                placeholder="What was your thought process? What did you learn?"
              />
            </div>
          </FormSection>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={!canSave}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// AI Insight Card
// ============================================================================

const InsightCard = memo(function InsightCard({ insight }: { insight: AIInsight }) {
  const getSeverityStyles = () => {
    switch (insight.severity) {
      case "success": return "bg-green-950/30 border-green-800/50 text-green-200";
      case "danger": return "bg-red-950/30 border-red-800/50 text-red-200";
      case "warning": return "bg-amber-950/30 border-amber-800/50 text-amber-200";
      case "info": return "bg-blue-950/30 border-blue-800/50 text-blue-200";
      default: return "bg-zinc-800/50 border-zinc-700/50 text-zinc-300";
    }
  };

  const getCategoryBadge = () => {
    const styles: Record<string, string> = {
      performance: "bg-purple-500/20 text-purple-300",
      behavior: "bg-amber-500/20 text-amber-300",
      pattern: "bg-blue-500/20 text-blue-300",
      risk: "bg-red-500/20 text-red-300",
      opportunity: "bg-green-500/20 text-green-300",
    };
    return styles[insight.category] || "bg-zinc-500/20 text-zinc-300";
  };

  return (
    <div className={`p-4 rounded-xl border ${getSeverityStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <strong className="font-semibold">{insight.title}</strong>
            <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryBadge()}`}>
              {insight.category}
            </span>
            <span className="text-xs text-zinc-500">{insight.confidence}% confidence</span>
          </div>
          <p className="text-sm opacity-90 leading-relaxed">{insight.message}</p>
          {insight.actionable && (
            <div className="mt-2 p-2 bg-black/20 rounded-lg">
              <p className="text-xs font-medium opacity-80">
                <span className="inline-block mr-1.5">Action:</span>
                {insight.actionable}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Quick Stats
// ============================================================================

const QuickStats = memo(function QuickStats({ stats }: { stats: JournalStats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <p className="text-xs text-zinc-500 mb-1">Total Trades</p>
        <p className="text-xl font-bold text-zinc-100">{stats.totalTrades}</p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <p className="text-xs text-zinc-500 mb-1">Win Rate</p>
        <p className="text-xl font-bold text-accent-400">{stats.winRate}%</p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <p className="text-xs text-zinc-500 mb-1">Avg R</p>
        <p className={`text-xl font-bold ${parseFloat(stats.averageR) >= 0 ? "text-green-400" : "text-red-400"}`}>
          {formatR(stats.averageR)}
        </p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <p className="text-xs text-zinc-500 mb-1">Total R</p>
        <p className={`text-xl font-bold ${parseFloat(stats.totalR) >= 0 ? "text-green-400" : "text-red-400"}`}>
          {formatR(stats.totalR)}
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// Tag Analytics Component
// ============================================================================

const TagAnalytics = memo(function TagAnalytics({ entries }: { entries: JournalEntry[] }) {
  const tagStats = useMemo(() => calculateTagStats(entries), [entries]);

  if (tagStats.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
          <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <p className="text-zinc-400 font-medium">No tags found</p>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs mx-auto">
          Add comma-separated tags to your trades (e.g. trend, breakout, scalp) to see strategy performance here.
        </p>
      </Card>
    );
  }

  const bestStrategy = [...tagStats].sort((a, b) => b.avgR - a.avgR)[0];
  const worstStrategy = [...tagStats].sort((a, b) => a.avgR - b.avgR)[0];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {tagStats.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-950/20 border border-green-800/40 rounded-xl p-4">
            <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-1">Best Strategy</p>
            <p className="font-bold text-zinc-100 capitalize text-lg">{bestStrategy.tag}</p>
            <p className="text-green-400 font-mono text-sm mt-0.5">
              {formatR(bestStrategy.avgR)} avg R &middot; {bestStrategy.winRate}% win rate
            </p>
          </div>
          <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4">
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Needs Work</p>
            <p className="font-bold text-zinc-100 capitalize text-lg">{worstStrategy.tag}</p>
            <p className="text-red-400 font-mono text-sm mt-0.5">
              {formatR(worstStrategy.avgR)} avg R &middot; {worstStrategy.winRate}% win rate
            </p>
          </div>
        </div>
      )}

      {/* Tag breakdown table */}
      <Card className="p-5">
        <CardTitle className="text-base mb-4">Performance by Strategy Tag</CardTitle>
        <div className="space-y-3">
          {tagStats.map((stat) => {
            const winRateColor =
              stat.winRate >= 60 ? "text-green-400" : stat.winRate >= 45 ? "text-amber-400" : "text-red-400";
            const barColor =
              stat.winRate >= 60 ? "bg-green-500" : stat.winRate >= 45 ? "bg-amber-500" : "bg-red-500";
            const rColor = stat.avgR >= 0 ? "text-green-400" : "text-red-400";
            return (
              <div
                key={stat.tag}
                className="flex items-center gap-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
              >
                <div className="w-24 flex-shrink-0">
                  <span className="text-sm font-semibold text-zinc-200 capitalize">{stat.tag}</span>
                  <p className="text-xs text-zinc-500">{stat.total} trades</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${stat.winRate}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold font-mono ${winRateColor} w-12 text-right`}>
                      {stat.winRate}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600">{stat.wins}W / {stat.losses}L</p>
                </div>
                <div className="text-right flex-shrink-0 w-28">
                  <p className={`text-sm font-bold font-mono ${rColor}`}>{formatR(stat.avgR)}/trade</p>
                  <p className={`text-xs font-mono ${rColor} opacity-70`}>{formatR(stat.totalR)} total</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
});

// ============================================================================
// Calendar Heatmap Component
// ============================================================================

const CalendarHeatmap = memo(function CalendarHeatmap({ entries }: { entries: JournalEntry[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const weeks = useMemo(() => buildCalendarData(entries, year, month), [entries, year, month]);

  const monthTotals = useMemo(() => {
    let totalR = 0;
    let totalPnl = 0;
    let count = 0;
    weeks.forEach((week) =>
      week.forEach((day) => {
        if (day.hasData) {
          totalR += day.r;
          totalPnl += day.pnl;
          count += day.count;
        }
      })
    );
    return {
      r: parseFloat(totalR.toFixed(2)),
      pnl: parseFloat(totalPnl.toFixed(2)),
      count,
    };
  }, [weeks]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const getDayColor = (day: CalendarDay): string => {
    if (!day.date) return "";
    if (!day.hasData) return "bg-zinc-800/40 hover:bg-zinc-800/60";
    if (day.r > 1.5) return "bg-green-600 hover:bg-green-500";
    if (day.r > 0.5) return "bg-green-700/80 hover:bg-green-600/80";
    if (day.r > 0) return "bg-green-900/70 hover:bg-green-800/70";
    if (day.r === 0) return "bg-zinc-700 hover:bg-zinc-600";
    if (day.r > -0.5) return "bg-red-900/70 hover:bg-red-800/70";
    if (day.r > -1.5) return "bg-red-700/80 hover:bg-red-600/80";
    return "bg-red-600 hover:bg-red-500";
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        {/* Month Nav */}
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-base">Monthly Performance Calendar</CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-zinc-200 min-w-[90px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Month Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-zinc-900/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Trades</p>
            <p className="text-lg font-bold text-zinc-200">{monthTotals.count}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Total R</p>
            <p className={`text-lg font-bold font-mono ${monthTotals.r >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatR(monthTotals.r)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">P/L</p>
            <p className={`text-lg font-bold font-mono ${monthTotals.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatCurrency(monthTotals.pnl)}
            </p>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs text-zinc-600 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={
                    day.hasData
                      ? `${day.date}: ${formatR(day.r)} (${day.count} trade${day.count !== 1 ? "s" : ""})`
                      : day.date || ""
                  }
                  className={`aspect-square rounded-md flex flex-col items-center justify-center cursor-default transition-colors ${getDayColor(day)}`}
                >
                  {day.date && (
                    <>
                      <span className="text-xs font-medium text-zinc-300 leading-none">
                        {parseInt(day.date.split("-")[2])}
                      </span>
                      {day.hasData && (
                        <span
                          className={`leading-none mt-0.5 font-mono ${day.r >= 0 ? "text-green-200" : "text-red-200"}`}
                          style={{ fontSize: "0.55rem" }}
                        >
                          {formatR(day.r)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-zinc-600">Scale:</span>
          {[
            { color: "bg-red-600", label: "< -1.5R" },
            { color: "bg-red-700/80", label: "Loss" },
            { color: "bg-zinc-700", label: "0R" },
            { color: "bg-green-900/70", label: "Small win" },
            { color: "bg-green-700/80", label: "Win" },
            { color: "bg-green-600", label: "> 1.5R" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-xs text-zinc-600">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function TradeJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewTradeForm>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState<"trades" | "stats">("trades");
  const [statsTab, setStatsTab] = useState<StatsTab>("overview");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");

  // Premium state
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [showExportUpgrade, setShowExportUpgrade] = useState(false);
  const [showEntryLimitUpgrade, setShowEntryLimitUpgrade] = useState(false);

  useEffect(() => {
    Promise.all([getPremiumStatus(), getUsageLimits()])
      .then(([s, l]) => {
        setPremiumStatus(s);
        setUsageLimits(l);
      })
      .catch(() => {});
  }, []);

  const isUnlimited = premiumStatus?.isPremium || premiumStatus?.isOnTrial;
  const cloudSyncAllowed = premiumStatus?.isPremium === true;
  const exportAllowed = isUnlimited ?? false;

  const journalRemaining = usageLimits
    ? Math.max(0, usageLimits.maxJournalEntries - usageLimits.journalEntries)
    : null;
  const canAddEntry =
    isUnlimited || usageLimits === null || usageLimits.journalEntries < usageLimits.maxJournalEntries;

  useEffect(() => {
    if (premiumStatus === null) return;
    const unsubscribePromise = initializeSync(
      (syncedEntries) => setEntries(syncedEntries),
      (status) => setSyncStatus(cloudSyncAllowed ? status : "offline")
    );
    return () => { unsubscribePromise.then((cleanup) => cleanup()); };
  }, [premiumStatus, cloudSyncAllowed]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) => {
      const elapsed = Date.now() - toast.timestamp;
      const remaining = Math.max(0, TOAST_DURATION - elapsed);
      return setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, remaining);
    });
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const addToast = useCallback(
    (type: ToastMessage["type"], title: string, message: string) => {
      const newToast: ToastMessage = { id: generateId(), type, title, message, timestamp: Date.now() };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const safeEntries = useMemo(() => {
    return entries.map((e) => ({
      ...e,
      resultR: e.resultR && e.resultR !== "" && e.resultR !== "NaN" ? e.resultR : "0",
      profitLoss: e.profitLoss && e.profitLoss !== "" && e.profitLoss !== "NaN" ? e.profitLoss : "0",
      lotSize: e.lotSize && e.lotSize !== "" && e.lotSize !== "NaN" ? e.lotSize : "0",
    }));
  }, [entries]);

  const stats = useMemo<JournalStats>(() => calculateJournalStats(safeEntries), [safeEntries]);

  const equityCurve = useMemo(() => {
    const curve = generateEquityCurve(safeEntries);
    return curve.map((point) => ({ x: point.tradeNumber, y: point.cumulativeR }));
  }, [safeEntries]);

  const aiInsights = useMemo(() => generateAIInsights(safeEntries), [safeEntries]);

  const displayedEntries = useMemo(() => {
    let result = [...entries];
    if (outcomeFilter !== "all") result = result.filter((e) => e.outcome === outcomeFilter);
    if (directionFilter !== "all") result = result.filter((e) => e.direction === directionFilter);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.currencyPair.toLowerCase().includes(query) ||
          e.notes.toLowerCase().includes(query) ||
          e.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "pnl-desc": return safeParseFloat(b.profitLoss) - safeParseFloat(a.profitLoss);
        case "pnl-asc": return safeParseFloat(a.profitLoss) - safeParseFloat(b.profitLoss);
        case "r-desc": return safeParseFloat(b.resultR) - safeParseFloat(a.resultR);
        case "r-asc": return safeParseFloat(a.resultR) - safeParseFloat(b.resultR);
        default: return 0;
      }
    });
    return result;
  }, [entries, outcomeFilter, directionFilter, sortBy, searchQuery]);

  const slTpValidation = useMemo(
    () => validateSlTpWithEntry(form.direction, form.entryPrice, form.stopLoss, form.takeProfit),
    [form.direction, form.entryPrice, form.stopLoss, form.takeProfit]
  );

  useEffect(() => {
    if (!showForm) return;
    const { outcome, profitLoss, resultR } = calculateTradeData(form);
    if (form.outcome !== outcome || form.profitLoss !== profitLoss || form.resultR !== resultR) {
      setForm((prev) => ({ ...prev, outcome, profitLoss, resultR }));
    }
  }, [form.entryPrice, form.exitPrice, form.stopLoss, form.lotSize, form.direction, form.currencyPair, showForm]);

  const handleFieldChange = useCallback(
    (field: keyof NewTradeForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canAddEntry) { setShowEntryLimitUpgrade(true); return; }
      const entryNum = safeParseFloat(form.entryPrice);
      const exitNum = safeParseFloat(form.exitPrice);
      const lotNum = safeParseFloat(form.lotSize);
      if (entryNum <= 0 || exitNum <= 0 || lotNum <= 0) {
        addToast("error", "Validation Error", "Please fill in valid Entry Price, Exit Price, and Lot Size.");
        return;
      }
      if (!slTpValidation.isValid && (form.stopLoss || form.takeProfit)) {
        addToast("error", "Invalid SL/TP", slTpValidation.slError || slTpValidation.tpError);
        return;
      }
      try {
        await syncAddEntry({
          date: form.date,
          currencyPair: form.currencyPair,
          direction: form.direction,
          entryPrice: form.entryPrice,
          exitPrice: form.exitPrice,
          stopLoss: form.stopLoss,
          takeProfit: form.takeProfit,
          lotSize: form.lotSize,
          resultR: form.resultR,
          profitLoss: form.profitLoss,
          outcome: form.outcome,
          notes: form.notes,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        });
        if (!isUnlimited) {
          await incrementJournalEntry();
          const fresh = await getUsageLimits();
          setUsageLimits(fresh);
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
        addToast("success", "Trade Logged", `${form.currencyPair} ${form.direction.toUpperCase()} trade saved successfully.`);
      } catch (error) {
        console.error("Error adding trade:", error);
        addToast("error", "Save Failed", "Failed to save trade. Please try again.");
      }
    },
    [form, slTpValidation, addToast, canAddEntry, isUnlimited]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this trade?")) {
        try {
          await syncDeleteEntry(id);
          addToast("info", "Trade Deleted", "The trade has been removed from your journal.");
        } catch (error) {
          console.error("Error deleting trade:", error);
          addToast("error", "Delete Failed", "Failed to delete trade. Please try again.");
        }
      }
    },
    [addToast]
  );

  const handleEditOpen = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
  }, []);

  const handleEditSave = useCallback(
    async (updated: JournalEntry) => {
      try {
        await syncUpdateEntry(updated.id, updated);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setEditingEntry(null);
        addToast("success", "Trade Updated", `${updated.currencyPair} trade has been updated.`);
      } catch (error) {
        console.error("Error updating trade:", error);
        addToast("error", "Update Failed", "Failed to update trade. Please try again.");
      }
    },
    [addToast]
  );

  const handleEditClose = useCallback(() => {
    setEditingEntry(null);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!exportAllowed) { setShowExportUpgrade(true); return; }
    if (entries.length === 0) { addToast("error", "No Data", "You have no trades to export."); return; }
    const headers = ["Date", "Pair", "Direction", "Entry", "Exit", "SL", "TP", "Lot Size", "Result R", "P/L", "Outcome", "Notes", "Tags"];
    const rows = entries.map((e) => [
      e.date, e.currencyPair, e.direction, e.entryPrice, e.exitPrice, e.stopLoss, e.takeProfit,
      e.lotSize, e.resultR, e.profitLoss, e.outcome,
      `"${e.notes.replace(/"/g, '""')}"`,
      e.tags.join(";"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-journal-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Export Complete", `${entries.length} trades exported to CSV.`);
  }, [entries, addToast, exportAllowed]);

  const hasCalculatedValues = form.entryPrice && form.exitPrice && form.lotSize;

  return (
    <>
      <style jsx global>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
      `}</style>

      <section className="py-8 md:py-12">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Trade Journal</h1>
                <p className="mt-2 text-zinc-400">
                  Log your trades, track performance metrics, and receive AI-powered insights.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
                {cloudSyncAllowed ? (
                  <>
                    {syncStatus === "synced" && (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-400">Synced</span>
                      </>
                    )}
                    {syncStatus === "syncing" && (
                      <>
                        <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm text-blue-400">Syncing...</span>
                      </>
                    )}
                    {(syncStatus === "offline" || syncStatus === "error") && (
                      <>
                        <Cloud className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-400">Offline</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Local Only</span>
                    <Link href="/premium" className="ml-1 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                      <Crown className="w-3 h-3" />
                      Upgrade
                    </Link>
                  </>
                )}
              </div>
            </div>

            {!isUnlimited && journalRemaining !== null && (
              <div className="mt-4 flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-400">
                  Journal entries:{" "}
                  <span className={journalRemaining <= 5 ? "text-red-400 font-semibold" : journalRemaining <= 15 ? "text-amber-400 font-semibold" : "text-zinc-300"}>
                    {usageLimits?.journalEntries} / {usageLimits?.maxJournalEntries} used
                  </span>
                </p>
                <Link href="/premium" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Unlimited
                </Link>
              </div>
            )}
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Sidebar */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-base">Performance Overview</CardTitle>
                  <Button variant="secondary" size="small" onClick={() => setActiveTab("stats")}>
                    Details
                  </Button>
                </div>
                <QuickStats stats={stats} />
              </Card>

              <Card className="p-4 bg-gradient-to-br from-accent-950/40 to-neutral-900 border-accent-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-base">AI Trading Coach</CardTitle>
                    <p className="text-xs text-zinc-500">Pattern recognition &amp; insights</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {aiInsights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <CardTitle className="text-base mb-3">Quick Actions</CardTitle>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      if (!canAddEntry) { setShowEntryLimitUpgrade(true); return; }
                      setShowForm(!showForm);
                    }}
                    className="w-full justify-center"
                  >
                    {showForm ? "Cancel" : "+ Log New Trade"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleExportCSV}
                    className="w-full justify-center"
                    disabled={entries.length === 0}
                  >
                    <span className="flex items-center gap-2">
                      {exportAllowed ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Export CSV
                      {!exportAllowed && (
                        <span className="text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-900 px-1.5 py-0.5 rounded-full font-bold">
                          PRO
                        </span>
                      )}
                    </span>
                  </Button>
                </div>
              </Card>

              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Pro Tips
                </h4>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>- Log every trade to get accurate AI insights</li>
                  <li>- Use <strong className="text-zinc-400">tags</strong> to categorize strategies</li>
                  <li>- Add <strong className="text-zinc-400">notes</strong> about your thought process</li>
                  <li>- Review your <strong className="text-zinc-400">statistics</strong> weekly</li>
                </ul>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Add Trade Form */}
              {showForm && (
                <Card className="p-6 border-accent-800/30">
                  <CardTitle className="mb-4">Log New Trade</CardTitle>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <FormSection title="Trade Details">
                      <FormRow>
                        <Input label="Date" type="date" value={form.date} onChange={handleFieldChange("date")} required />
                        <Select label="Currency Pair" options={PAIR_OPTIONS} value={form.currencyPair} onChange={handleFieldChange("currencyPair")} />
                      </FormRow>
                      <FormRow>
                        <Select label="Direction" options={DIRECTION_OPTIONS} value={form.direction} onChange={handleFieldChange("direction")} />
                        <Input label="Lot Size" type="number" value={form.lotSize} onChange={handleFieldChange("lotSize")} step="0.01" min="0.01" required />
                      </FormRow>
                    </FormSection>

                    <FormSection title="Price Levels">
                      <FormRow>
                        <Input label="Entry Price" type="number" value={form.entryPrice} onChange={handleFieldChange("entryPrice")} step="0.00001" min="0" required />
                        <Input label="Exit Price" type="number" value={form.exitPrice} onChange={handleFieldChange("exitPrice")} step="0.00001" min="0" required />
                      </FormRow>
                      <FormRow>
                        <div className="space-y-1.5">
                          <Input
                            label="Stop Loss"
                            type="number"
                            value={form.stopLoss}
                            onChange={handleFieldChange("stopLoss")}
                            step="0.00001"
                            min="0"
                            helper={form.direction === "buy" ? "Must be below Entry for BUY" : "Must be above Entry for SELL"}
                          />
                          {slTpValidation.slError && <p className="text-xs text-red-400">{slTpValidation.slError}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Input
                            label="Take Profit"
                            type="number"
                            value={form.takeProfit}
                            onChange={handleFieldChange("takeProfit")}
                            step="0.00001"
                            min="0"
                            helper={form.direction === "buy" ? "Must be above Entry for BUY" : "Must be below Entry for SELL"}
                          />
                          {slTpValidation.tpError && <p className="text-xs text-red-400">{slTpValidation.tpError}</p>}
                        </div>
                      </FormRow>
                    </FormSection>

                    <FormSection title="Calculated Results">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-zinc-500 mb-1">Result (R)</p>
                          <p className={`text-lg font-bold font-mono ${form.resultR ? (parseFloat(form.resultR) >= 0 ? "text-green-400" : "text-red-400") : "text-zinc-500"}`}>
                            {form.resultR ? formatR(form.resultR) : "-"}
                          </p>
                        </div>
                        <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-zinc-500 mb-1">Est. P/L</p>
                          <p className={`text-lg font-bold font-mono ${form.profitLoss ? (parseFloat(form.profitLoss) >= 0 ? "text-green-400" : "text-red-400") : "text-zinc-500"}`}>
                            {form.profitLoss ? formatCurrency(parseFloat(form.profitLoss)) : "-"}
                          </p>
                        </div>
                        <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-zinc-500 mb-1">Outcome</p>
                          <p className={`text-lg font-bold capitalize ${hasCalculatedValues ? (form.outcome === "win" ? "text-green-400" : form.outcome === "loss" ? "text-red-400" : "text-zinc-400") : "text-zinc-500"}`}>
                            {hasCalculatedValues ? (form.outcome === "breakeven" ? "B/E" : form.outcome) : "-"}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 text-center">
                        Auto-calculated from entry, exit, and stop loss prices
                      </p>
                    </FormSection>

                    <FormSection title="Additional Info">
                      <Input label="Tags" type="text" value={form.tags} onChange={handleFieldChange("tags")} placeholder="trend, breakout, scalp" helper="Comma-separated tags for categorization" />
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes</label>
                        <textarea
                          value={form.notes}
                          onChange={handleFieldChange("notes")}
                          rows={3}
                          className="w-full px-3 py-2 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors resize-none"
                          placeholder="What was your thought process? What did you learn?"
                        />
                      </div>
                    </FormSection>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={!slTpValidation.isValid && (!!form.stopLoss || !!form.takeProfit)}>
                        Save Trade
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Main Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("trades")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "trades" ? "bg-accent-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"}`}
                >
                  Trades ({entries.length})
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "stats" ? "bg-accent-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"}`}
                >
                  Statistics
                </button>
              </div>

              {activeTab === "trades" ? (
                <>
                  {entries.length > 0 && (
                    <div className="space-y-3">
                      <Input type="text" placeholder="Search by pair, notes, or tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select label="Outcome" options={OUTCOME_FILTER_OPTIONS} value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value as OutcomeFilter)} />
                        <Select label="Direction" options={DIRECTION_FILTER_OPTIONS} value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)} />
                        <Select label="Sort By" options={SORT_OPTIONS} value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {displayedEntries.length === 0 ? (
                      <Card className="text-center py-12">
                        {entries.length === 0 ? (
                          <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-zinc-400 mb-2">No trades logged yet</p>
                            <p className="text-sm text-zinc-500 mb-4">Start logging your trades to track your performance.</p>
                            <Button onClick={() => setShowForm(true)}>Log Your First Trade</Button>
                          </>
                        ) : (
                          <>
                            <p className="text-zinc-400">No trades match your filters</p>
                            <p className="text-sm text-zinc-500 mt-1">Try adjusting your search or filter criteria.</p>
                          </>
                        )}
                      </Card>
                    ) : (
                      displayedEntries.map((entry) => (
                        <TradeCard key={entry.id} entry={entry} onDelete={handleDelete} onEdit={handleEditOpen} />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {entries.length === 0 ? (
                    <Card className="text-center py-12">
                      <p className="text-zinc-400">Log some trades to see your statistics.</p>
                    </Card>
                  ) : (
                    <>
                      {/* Stats Sub-tabs */}
                      <div className="flex gap-1.5 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800 w-fit">
                        {(["overview", "tags", "calendar"] as StatsTab[]).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setStatsTab(tab)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                              statsTab === tab
                                ? "bg-zinc-700 text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Overview Tab */}
                      {statsTab === "overview" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="text-center p-4">
                              <p className="text-sm text-zinc-400">Win Rate</p>
                              <p className="text-2xl font-bold text-accent-400 mt-1">{stats.winRate}%</p>
                            </Card>
                            <Card className="text-center p-4">
                              <p className="text-sm text-zinc-400">Profit Factor</p>
                              <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.profitFactor}</p>
                            </Card>
                            <Card className="text-center p-4">
                              <p className="text-sm text-zinc-400">Expectancy</p>
                              <p className={`text-2xl font-bold mt-1 ${parseFloat(stats.expectancy) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {formatR(stats.expectancy)}
                              </p>
                            </Card>
                            <Card className="text-center p-4">
                              <p className="text-sm text-zinc-400">Total R</p>
                              <p className={`text-2xl font-bold mt-1 ${parseFloat(stats.totalR) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {formatR(stats.totalR)}
                              </p>
                            </Card>
                          </div>

                          {equityCurve.length > 1 && (
                            <Card className="p-4">
                              <CardTitle>Equity Curve (R)</CardTitle>
                              <CardDescription>Cumulative R-multiple over time</CardDescription>
                              <div className="mt-4 overflow-x-auto">
                                <LineChart
                                  data={equityCurve}
                                  width={700}
                                  height={250}
                                  lineColor={parseFloat(stats.totalR) >= 0 ? "#22c55e" : "#ef4444"}
                                  fillColor={parseFloat(stats.totalR) >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                                  yAxisLabel="Cumulative R"
                                  xAxisLabel="Trade Number"
                                  showDots={equityCurve.length <= 50}
                                />
                              </div>
                            </Card>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ResultDisplay title="Performance Metrics">
                              <ResultItem label="Total Trades" value={stats.totalTrades} />
                              <ResultItem label="Wins" value={stats.wins} />
                              <ResultItem label="Losses" value={stats.losses} />
                              <ResultItem label="Break-evens" value={stats.breakevens} />
                              <ResultItem label="Win Rate" value={stats.winRate} suffix="%" highlight />
                              <ResultItem label="Profit Factor" value={stats.profitFactor} />
                            </ResultDisplay>
                            <ResultDisplay title="Trade Analysis">
                              <ResultItem label="Average Win" value={stats.averageWin} suffix="R" />
                              <ResultItem label="Average Loss" value={stats.averageLoss} suffix="R" />
                              <ResultItem label="Largest Win" value={stats.largestWin} suffix="R" />
                              <ResultItem label="Largest Loss" value={stats.largestLoss} suffix="R" />
                              <ResultItem label="Best Trade" value={stats.bestTrade} suffix="R" />
                              <ResultItem label="Worst Trade" value={stats.worstTrade} suffix="R" />
                            </ResultDisplay>
                          </div>

                          <Card className="p-4">
                            <CardTitle>Trading Streaks</CardTitle>
                            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-sm text-zinc-400">Current Streak</p>
                                <p className={`text-xl font-bold mt-1 ${stats.currentStreak.type === "win" ? "text-green-400" : stats.currentStreak.type === "loss" ? "text-red-400" : "text-zinc-400"}`}>
                                  {stats.currentStreak.count > 0 ? `${stats.currentStreak.count} ${stats.currentStreak.type}${stats.currentStreak.count > 1 ? "s" : ""}` : "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-zinc-400">Max Win Streak</p>
                                <p className="text-xl font-bold text-green-400 mt-1">{stats.maxWinStreak}</p>
                              </div>
                              <div>
                                <p className="text-sm text-zinc-400">Max Loss Streak</p>
                                <p className="text-xl font-bold text-red-400 mt-1">{stats.maxLossStreak}</p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* Tags Tab */}
                      {statsTab === "tags" && <TagAnalytics entries={safeEntries} />}

                      {/* Calendar Tab */}
                      {statsTab === "calendar" && <CalendarHeatmap entries={safeEntries} />}
                    </>
                  )}
                </div>
              )}

              <Card className="p-4" variant="outline">
                <CardTitle className="text-base">About the Journal</CardTitle>
                <div className="mt-3 text-sm text-zinc-400 space-y-2">
                  <p>
                    <strong className="text-zinc-300">Cloud Sync:</strong>{" "}
                    {cloudSyncAllowed
                      ? "Your trades are automatically synced to the cloud and accessible from any device."
                      : "Upgrade to Premium to enable cloud sync and access your journal from any device."}
                  </p>
                  <p>
                    <strong className="text-zinc-300">R-Multiple:</strong> A normalized measure of trade results. If you risked $100 and made $200, that is +2R.
                  </p>
                  <p>
                    <strong className="text-zinc-300">AI Coach:</strong> The AI analyzes your trading patterns and provides actionable insights. Accuracy improves with more trades.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Edit Trade Modal */}
      {editingEntry && (
        <EditTradeModal
          entry={editingEntry}
          onSave={handleEditSave}
          onClose={handleEditClose}
        />
      )}

      {/* Export Upgrade Modal */}
      {showExportUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowExportUpgrade(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Export is a Premium Feature</h3>
              <p className="text-zinc-400 text-sm">Upgrade to premium to export your trading journal to CSV, PDF, or Excel.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/premium" className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-center transition-all">
                Upgrade to Premium
              </Link>
              <button onClick={() => setShowExportUpgrade(false)} className="w-full py-3 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                Maybe Later
              </button>
            </div>
            <p className="text-xs text-zinc-500">7-day free trial &middot; From $4.99/month</p>
          </div>
        </div>
      )}

      {/* Journal Entry Limit Modal */}
      {showEntryLimitUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEntryLimitUpgrade(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Journal Entry Limit Reached</h3>
              <p className="text-zinc-400 text-sm">
                You have used all{" "}
                <span className="text-white font-medium">{usageLimits?.maxJournalEntries} free journal entries</span>.
                Upgrade to premium for unlimited entries and cloud sync.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/premium" className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-center transition-all">
                Upgrade to Premium
              </Link>
              <button onClick={() => setShowEntryLimitUpgrade(false)} className="w-full py-3 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                Maybe Later
              </button>
            </div>
            <p className="text-xs text-zinc-500">7-day free trial &middot; From $4.99/month</p>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
