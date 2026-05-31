// File: src/app/calculators/dca/DCACalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS } from "@/lib/constants/options";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface DCAEntry {
  id: string;
  entryPrice: string;
  positionSize: string;
}

interface FormState {
  currencyPair: string;
  accountCurrency: string;
  currentPrice: string;
  targetPrice: string;
  entries: DCAEntry[];
}

interface DCAResult {
  averageEntry: number;
  totalPositionLots: number;
  totalPositionMini: number;
  totalPositionMicro: number;
  totalUnits: number;
  unrealizedPL: number;
  unrealizedPips: number;
  targetPL: number;
  targetPips: number;
  breakEvenPrice: number;
  entryBreakdown: EntryBreakdown[];
  isProfit: boolean;
  isTargetProfit: boolean;
}

interface EntryBreakdown {
  id: string;
  entryPrice: number;
  positionSize: number;
  weight: number;
  contribution: number;
  individualPL: number;
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyEntry = (): DCAEntry => ({
  id: generateId(),
  entryPrice: "",
  positionSize: "",
});

const DEFAULT_STATE: FormState = {
  currencyPair: "EURUSD",
  accountCurrency: "USD",
  currentPrice: "1.0850",
  targetPrice: "1.1000",
  entries: [
    { id: generateId(), entryPrice: "1.0900", positionSize: "0.5" },
    { id: generateId(), entryPrice: "1.0800", positionSize: "1.0" },
  ],
};

const DCA_INTERVAL_OPTIONS = [
  { value: "1", label: "1% intervals" },
  { value: "2", label: "2% intervals" },
  { value: "3", label: "3% intervals" },
  { value: "5", label: "5% intervals" },
];

const DCA_ENTRIES_OPTIONS = [
  { value: "3", label: "3 entries" },
  { value: "4", label: "4 entries" },
  { value: "5", label: "5 entries" },
  { value: "6", label: "6 entries" },
];

const ALLOCATION_OPTIONS = [
  { value: "equal", label: "Equal Size" },
  { value: "increasing", label: "Increasing (Martingale)" },
  { value: "decreasing", label: "Decreasing (Pyramid)" },
];

const ERROR_DISPLAY_DURATION = 3000;

// ============================================================================
// Utility Functions
// ============================================================================

function getPipMultiplier(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  return jpyPairs.includes(pair) ? 100 : 10000;
}

function getPipValue(
  pair: string,
  accountCurrency: string,
  currentPrice: number,
  lotSize: number
): number {
  const pipMultiplier = getPipMultiplier(pair);
  const quoteCurrency = pair.substring(3, 6);
  const standardLotUnits = 100000;

  let pipValueQuote = (1 / pipMultiplier) * standardLotUnits * lotSize;

  if (quoteCurrency === accountCurrency) {
    return pipValueQuote;
  }

  if (accountCurrency === "USD") {
    if (quoteCurrency === "USD") {
      return pipValueQuote;
    }
    return pipValueQuote / currentPrice;
  }

  return pipValueQuote;
}

function calculateDCA(
  entries: DCAEntry[],
  currentPrice: number,
  targetPrice: number,
  currencyPair: string,
  accountCurrency: string
): DCAResult | null {
  const validEntries = entries.filter((entry) => {
    const price = parseFloat(entry.entryPrice);
    const size = parseFloat(entry.positionSize);
    return !isNaN(price) && price > 0 && !isNaN(size) && size > 0;
  });

  if (validEntries.length === 0) {
    return null;
  }

  const pipMultiplier = getPipMultiplier(currencyPair);

  let totalWeightedPrice = 0;
  let totalPosition = 0;
  const entryBreakdown: EntryBreakdown[] = [];

  validEntries.forEach((entry) => {
    const price = parseFloat(entry.entryPrice);
    const size = parseFloat(entry.positionSize);
    totalWeightedPrice += price * size;
    totalPosition += size;
  });

  const averageEntry = totalWeightedPrice / totalPosition;

  validEntries.forEach((entry) => {
    const price = parseFloat(entry.entryPrice);
    const size = parseFloat(entry.positionSize);
    const weight = (size / totalPosition) * 100;
    const contribution = ((price * size) / totalWeightedPrice) * 100;
    const pipDiff = (currentPrice - price) * pipMultiplier;
    const pipValue = getPipValue(currencyPair, accountCurrency, currentPrice, size);
    const individualPL = pipDiff * pipValue;

    entryBreakdown.push({
      id: entry.id,
      entryPrice: price,
      positionSize: size,
      weight,
      contribution,
      individualPL,
    });
  });

  const pipValue = getPipValue(currencyPair, accountCurrency, currentPrice, totalPosition);
  const unrealizedPips = (currentPrice - averageEntry) * pipMultiplier;
  const unrealizedPL = unrealizedPips * (pipValue / totalPosition) * totalPosition;

  const targetPips = (targetPrice - averageEntry) * pipMultiplier;
  const targetPL = targetPips * (pipValue / totalPosition) * totalPosition;

  return {
    averageEntry,
    totalPositionLots: totalPosition,
    totalPositionMini: totalPosition * 10,
    totalPositionMicro: totalPosition * 100,
    totalUnits: totalPosition * 100000,
    unrealizedPL,
    unrealizedPips,
    targetPL,
    targetPips,
    breakEvenPrice: averageEntry,
    entryBreakdown,
    isProfit: unrealizedPL >= 0,
    isTargetProfit: targetPL >= 0,
  };
}

// ============================================================================
// Error Toast Component
// ============================================================================

const ErrorToast = memo(function ErrorToast({
  errors,
  onDismiss,
}: {
  errors: ValidationError[];
  onDismiss: (id: string) => void;
}) {
  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {errors.map((error) => (
        <div
          key={error.id}
          className="bg-red-950/90 border border-red-800 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-start gap-3"
          style={{ animation: "slideIn 0.3s ease-out forwards" }}
        >
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-200">{error.field}</p>
            <p className="text-sm text-red-300/80 mt-0.5">{error.message}</p>
          </div>
          <button
            onClick={() => onDismiss(error.id)}
            className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
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
// Success Toast Component
// ============================================================================

const SuccessToast = memo(function SuccessToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="bg-green-950/90 border border-green-800 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3"
        style={{ animation: "slideIn 0.3s ease-out forwards" }}
      >
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm text-green-200">{message}</p>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-green-400 hover:text-green-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// Entry Row Component
// ============================================================================

const EntryRow = memo(function EntryRow({
  entry,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  entry: DCAEntry;
  index: number;
  canRemove: boolean;
  onChange: (id: string, field: "entryPrice" | "positionSize", value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex-shrink-0 w-6 flex items-center justify-center mb-2">
        <span className="text-xs text-zinc-600 font-medium">{index + 1}</span>
      </div>
      <div className="flex-1">
        <Input
          label={index === 0 ? "Entry Price" : undefined}
          type="number"
          value={entry.entryPrice}
          onChange={(e) => onChange(entry.id, "entryPrice", e.target.value)}
          placeholder="1.0850"
          min="0"
          step="0.00001"
        />
      </div>
      <div className="flex-1">
        <Input
          label={index === 0 ? "Position (Lots)" : undefined}
          type="number"
          value={entry.positionSize}
          onChange={(e) => onChange(entry.id, "positionSize", e.target.value)}
          placeholder="0.1"
          min="0.01"
          step="0.01"
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        disabled={!canRemove}
        className={`
          flex-shrink-0 w-10 h-10 rounded-lg border transition-all duration-200
          flex items-center justify-center mb-[2px]
          ${
            canRemove
              ? "border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-800 hover:bg-red-950/30"
              : "border-zinc-800 text-zinc-700 cursor-not-allowed"
          }
        `}
        aria-label="Remove entry"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
});

// ============================================================================
// Entry Breakdown Row Component
// ============================================================================

const EntryBreakdownRow = memo(function EntryBreakdownRow({
  entry,
  index,
  isLargest,
}: {
  entry: EntryBreakdown;
  index: number;
  isLargest: boolean;
}) {
  const getRowColor = () => {
    if (isLargest) return "text-cyan-400 border-cyan-800/50 bg-cyan-950/20";
    if (entry.individualPL >= 0) return "text-green-400 border-green-800/50 bg-green-950/20";
    return "text-red-400 border-red-800/50 bg-red-950/20";
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getRowColor()}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-zinc-300">
            Entry #{index + 1}
            {isLargest && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Largest
              </span>
            )}
          </span>
          <span className="text-xs text-zinc-500 mt-0.5">
            {entry.positionSize.toFixed(2)} lots @ {entry.entryPrice.toFixed(5)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${entry.weight}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 w-12 text-right">{entry.weight.toFixed(1)}%</span>
        </div>
        <span
          className={`font-mono font-bold min-w-[80px] text-right ${
            entry.individualPL >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {entry.individualPL >= 0 ? "+" : ""}
          {entry.individualPL.toFixed(2)}
        </span>
      </div>
    </div>
  );
});

// ============================================================================
// Result Section Component
// ============================================================================

const ResultSection = memo(function ResultSection({
  result,
  form,
  onCopyAll,
}: {
  result: DCAResult | null;
  form: FormState;
  onCopyAll: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="DCA Analysis">
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">
            Add at least one valid entry to calculate DCA results
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Enter both price and position size for each entry
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const pipMultiplier = getPipMultiplier(form.currencyPair);
  const pipsToBreakEven = (result.breakEvenPrice - parseFloat(form.currentPrice)) * pipMultiplier;
  const largestEntryIndex = result.entryBreakdown.reduce(
    (maxIdx, entry, idx, arr) => (entry.positionSize > arr[maxIdx].positionSize ? idx : maxIdx),
    0
  );

  return (
    <>
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-cyan-950/30 to-teal-950/20 border border-cyan-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-cyan-400">DCA Position Summary</h3>
          <Button variant="secondary" size="small" onClick={onCopyAll}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy All
            </span>
          </Button>
        </div>

        {/* Highlight Box - Average Entry */}
        <div className="bg-cyan-900/30 border border-cyan-700/50 rounded-lg p-4 mb-3">
          <div className="text-center">
            <span className="text-zinc-400 text-sm">Average Entry Price</span>
            <p className="text-3xl font-mono font-bold text-cyan-400 mt-1">
              {result.averageEntry.toFixed(5)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Total Position</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.totalPositionLots.toFixed(2)} lots
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Total Units</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.totalUnits.toLocaleString()}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Break-Even</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.breakEvenPrice.toFixed(5)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs"># Entries</span>
            <p className="font-mono font-semibold text-cyan-400">
              {result.entryBreakdown.length}
            </p>
          </div>
        </div>
      </div>

      {/* Unrealized P/L */}
      <div
        className={`border rounded-lg p-4 ${
          result.isProfit
            ? "bg-green-950/20 border-green-800/30"
            : "bg-red-950/20 border-red-800/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${
              result.isProfit ? "bg-green-400" : "bg-red-400"
            } animate-pulse`}
          />
          <span className={`text-sm font-medium ${result.isProfit ? "text-green-400" : "text-red-400"}`}>
            Unrealized P/L
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            Current: <span className="font-mono text-zinc-300">{form.currentPrice}</span>
            <span className="mx-2">-</span>
            <span className={result.unrealizedPips >= 0 ? "text-green-400" : "text-red-400"}>
              {result.unrealizedPips >= 0 ? "+" : ""}
              {result.unrealizedPips.toFixed(1)} pips
            </span>
          </div>
          <span
            className={`text-xl font-bold font-mono ${
              result.isProfit ? "text-green-400" : "text-red-400"
            }`}
          >
            {result.unrealizedPL >= 0 ? "+" : ""}
            {result.unrealizedPL.toFixed(2)} {form.accountCurrency}
          </span>
        </div>
      </div>

      {/* Target P/L */}
      <div
        className={`border rounded-lg p-4 ${
          result.isTargetProfit
            ? "bg-emerald-950/20 border-emerald-800/30"
            : "bg-orange-950/20 border-orange-800/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <svg
            className={`w-4 h-4 ${result.isTargetProfit ? "text-emerald-400" : "text-orange-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span
            className={`text-sm font-medium ${
              result.isTargetProfit ? "text-emerald-400" : "text-orange-400"
            }`}
          >
            Projected P/L at Target
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            Target: <span className="font-mono text-zinc-300">{form.targetPrice}</span>
            <span className="mx-2">-</span>
            <span className={result.targetPips >= 0 ? "text-emerald-400" : "text-orange-400"}>
              {result.targetPips >= 0 ? "+" : ""}
              {result.targetPips.toFixed(1)} pips
            </span>
          </div>
          <span
            className={`text-xl font-bold font-mono ${
              result.isTargetProfit ? "text-emerald-400" : "text-orange-400"
            }`}
          >
            {result.targetPL >= 0 ? "+" : ""}
            {result.targetPL.toFixed(2)} {form.accountCurrency}
          </span>
        </div>
      </div>

      {/* Break-Even Info */}
      <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-sm font-medium text-purple-400">Break-Even Analysis</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Price needs to move{" "}
          <strong className="text-zinc-300">
            {pipsToBreakEven >= 0 ? "+" : ""}
            {pipsToBreakEven.toFixed(1)} pips
          </strong>{" "}
          ({((result.breakEvenPrice - parseFloat(form.currentPrice)) / parseFloat(form.currentPrice) * 100).toFixed(3)}%)
          to reach break-even at <strong className="text-purple-300">{result.breakEvenPrice.toFixed(5)}</strong>
        </p>
      </div>

      {/* Entry Breakdown */}
      <ResultDisplay title="Entry Breakdown">
        <div className="space-y-2">
          {result.entryBreakdown.map((entry, index) => (
            <EntryBreakdownRow
              key={entry.id}
              entry={entry}
              index={index}
              isLargest={index === largestEntryIndex}
            />
          ))}
        </div>
      </ResultDisplay>

      {/* Position Sizes */}
      <ResultDisplay title="Position Size Breakdown">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
            <span className="text-zinc-500 text-xs block">Standard Lots</span>
            <p className="font-mono font-bold text-lg text-zinc-200">
              {result.totalPositionLots.toFixed(2)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
            <span className="text-zinc-500 text-xs block">Mini Lots</span>
            <p className="font-mono font-bold text-lg text-zinc-200">
              {result.totalPositionMini.toFixed(1)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
            <span className="text-zinc-500 text-xs block">Micro Lots</span>
            <p className="font-mono font-bold text-lg text-zinc-200">
              {result.totalPositionMicro.toFixed(0)}
            </p>
          </div>
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">DCA Strategies</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span><strong className="text-zinc-300">Equal</strong> - Same size each entry</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span><strong className="text-zinc-300">Martingale</strong> - Increase on loss</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span><strong className="text-zinc-300">Pyramid</strong> - Decrease on profit</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Key Points</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>Larger positions at lower prices reduce avg</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>Set max entries to limit risk</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>Calculate total exposure before trading</span>
              </li>
            </ul>
          </div>
        </div>
      </ResultDisplay>
    </>
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
// Main Component
// ============================================================================

export function DCACalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoFillConfig, setAutoFillConfig] = useState({
    startPrice: "",
    interval: "2",
    numEntries: "4",
    allocation: "equal",
    baseSize: "0.1",
  });
  const [showAutoFill, setShowAutoFill] = useState(false);

  // Auto-dismiss errors after 3 seconds
  useEffect(() => {
    if (errors.length === 0) return;

    const timers = errors.map((error) => {
      const elapsed = Date.now() - error.timestamp;
      const remaining = Math.max(0, ERROR_DISPLAY_DURATION - elapsed);

      return setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== error.id));
      }, remaining);
    });

    return () => timers.forEach(clearTimeout);
  }, [errors]);

  // Auto-dismiss success message
  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // Debounce form values
  const { calculationInput: debouncedForm, triggerCalculate, hasPendingChanges } = useSmartCalculation(form, 150);

  // Calculate results
  const result = useMemo<DCAResult | null>(() => {
    if (!debouncedForm) return null;
    const currentPrice = parseFloat(debouncedForm.currentPrice);
    const targetPrice = parseFloat(debouncedForm.targetPrice);

    if (isNaN(currentPrice) || currentPrice <= 0) return null;
    if (isNaN(targetPrice) || targetPrice <= 0) return null;

    return calculateDCA(
      debouncedForm.entries,
      currentPrice,
      targetPrice,
      debouncedForm.currencyPair,
      debouncedForm.accountCurrency
    );
  }, [debouncedForm]);

  // Add error helper
  const addError = useCallback((field: string, message: string) => {
    const newError: ValidationError = {
      id: generateId(),
      field,
      message,
      timestamp: Date.now(),
    };
    setErrors((prev) => [...prev.filter((e) => e.field !== field), newError]);
  }, []);

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Entry management handlers
  const handleEntryChange = useCallback(
    (id: string, field: "entryPrice" | "positionSize", value: string) => {
      setForm((prev) => ({
        ...prev,
        entries: prev.entries.map((entry) =>
          entry.id === id ? { ...entry, [field]: value } : entry
        ),
      }));
    },
    []
  );

  const handleAddEntry = useCallback(() => {
    if (form.entries.length >= 10) {
      addError("Entry Limit", "Maximum 10 entries allowed");
      return;
    }
    setForm((prev) => ({
      ...prev,
      entries: [...prev.entries, createEmptyEntry()],
    }));
  }, [form.entries.length, addError]);

  const handleRemoveEntry = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.id !== id),
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      entries: [createEmptyEntry()],
    }));
  }, []);

  // Reset form
  const handleReset = useCallback(() => {
    setForm(DEFAULT_STATE);
    setShowAutoFill(false);
  }, []);

  // Form field handlers
  const handleFieldChange = useCallback(
    (field: keyof Omit<FormState, "entries">) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Auto-fill handlers
  const handleAutoFillChange = useCallback(
    (field: keyof typeof autoFillConfig) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setAutoFillConfig((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const handleGenerateEntries = useCallback(() => {
    const startPrice = parseFloat(autoFillConfig.startPrice);
    const interval = parseFloat(autoFillConfig.interval);
    const numEntries = parseInt(autoFillConfig.numEntries);
    const baseSize = parseFloat(autoFillConfig.baseSize);

    if (isNaN(startPrice) || startPrice <= 0) {
      addError("Starting Price", "Please enter a valid starting price");
      return;
    }

    if (isNaN(baseSize) || baseSize <= 0) {
      addError("Base Size", "Please enter a valid base position size");
      return;
    }

    const newEntries: DCAEntry[] = [];

    for (let i = 0; i < numEntries; i++) {
      const priceMultiplier = 1 - (interval * i) / 100;
      const entryPrice = startPrice * priceMultiplier;

      let size = baseSize;
      if (autoFillConfig.allocation === "increasing") {
        size = baseSize * Math.pow(1.5, i);
      } else if (autoFillConfig.allocation === "decreasing") {
        size = baseSize / Math.pow(1.3, i);
      }

      newEntries.push({
        id: generateId(),
        entryPrice: entryPrice.toFixed(5),
        positionSize: size.toFixed(2),
      });
    }

    setForm((prev) => ({
      ...prev,
      entries: newEntries,
    }));
    setShowAutoFill(false);
    setSuccessMessage(`Generated ${numEntries} DCA entries`);
  }, [autoFillConfig, addError]);

  // Copy all to clipboard
  const handleCopyAll = useCallback(() => {
    if (!result) return;

    const lines = [
      `DCA Analysis - ${form.currencyPair}`,
      ``,
      `Average Entry: ${result.averageEntry.toFixed(5)}`,
      `Total Position: ${result.totalPositionLots.toFixed(2)} lots`,
      `Break-Even: ${result.breakEvenPrice.toFixed(5)}`,
      ``,
      `Current Price: ${form.currentPrice}`,
      `Unrealized P/L: ${result.unrealizedPL >= 0 ? "+" : ""}${result.unrealizedPL.toFixed(2)} ${form.accountCurrency}`,
      ``,
      `Target Price: ${form.targetPrice}`,
      `Projected P/L: ${result.targetPL >= 0 ? "+" : ""}${result.targetPL.toFixed(2)} ${form.accountCurrency}`,
      ``,
      `Entries:`,
      ...result.entryBreakdown.map(
        (e, i) =>
          `  ${i + 1}. ${e.entryPrice.toFixed(5)} @ ${e.positionSize.toFixed(2)} lots (${e.weight.toFixed(1)}%)`
      ),
    ];

    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => {
        setSuccessMessage("DCA analysis copied to clipboard!");
      })
      .catch(() => {
        addError("Copy Failed", "Could not copy to clipboard");
      });
  }, [result, form, addError]);

  return (
    <>
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <section className="py-8 md:py-12">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">DCA Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Calculate your average entry price across multiple positions. Plan dollar cost
              averaging strategies and analyze profit/loss at target prices.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Trade Settings">
                  <FormRow>
                    <Select
                      label="Currency Pair"
                      options={PAIR_OPTIONS}
                      value={form.currencyPair}
                      onChange={handleFieldChange("currencyPair")}
                    />
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={form.accountCurrency}
                      onChange={handleFieldChange("accountCurrency")}
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Market Prices">
                  <FormRow>
                    <Input
                      label="Current Market Price"
                      type="number"
                      value={form.currentPrice}
                      onChange={handleFieldChange("currentPrice")}
                      placeholder="1.0850"
                      min="0"
                      step="0.00001"
                    />
                    <Input
                      label="Target Exit Price"
                      type="number"
                      value={form.targetPrice}
                      onChange={handleFieldChange("targetPrice")}
                      placeholder="1.1000"
                      min="0"
                      step="0.00001"
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="DCA Entries">
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 -mr-2">
                    {form.entries.map((entry, index) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        index={index}
                        canRemove={form.entries.length > 1}
                        onChange={handleEntryChange}
                        onRemove={handleRemoveEntry}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={handleAddEntry}
                      disabled={form.entries.length >= 10}
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </span>
                    </Button>
                    <Button variant="secondary" size="small" onClick={handleClearAll}>
                      Clear
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setShowAutoFill(!showAutoFill)}
                    >
                      {showAutoFill ? "Hide" : "Auto-Fill"}
                    </Button>
                    <Button variant="secondary" size="small" onClick={handleReset}>
                      Reset
                    </Button>
                    {triggerCalculate && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={triggerCalculate}
                        className={hasPendingChanges ? "ring-2 ring-accent-400/50" : ""}
                      >
                        Calculate
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600">{form.entries.length}/10 entries</p>
                </FormSection>

                {showAutoFill && (
                  <FormSection title="Auto-Fill DCA Levels">
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 space-y-4">
                      <FormRow>
                        <Input
                          label="Starting Price"
                          type="number"
                          value={autoFillConfig.startPrice}
                          onChange={handleAutoFillChange("startPrice")}
                          placeholder={form.currentPrice || "1.0900"}
                          min="0"
                          step="0.00001"
                        />
                        <Input
                          label="Base Position Size"
                          type="number"
                          value={autoFillConfig.baseSize}
                          onChange={handleAutoFillChange("baseSize")}
                          placeholder="0.1"
                          min="0.01"
                          step="0.01"
                          suffix="lots"
                        />
                      </FormRow>
                      <FormRow>
                        <Select
                          label="Price Interval"
                          options={DCA_INTERVAL_OPTIONS}
                          value={autoFillConfig.interval}
                          onChange={handleAutoFillChange("interval")}
                        />
                        <Select
                          label="Number of Entries"
                          options={DCA_ENTRIES_OPTIONS}
                          value={autoFillConfig.numEntries}
                          onChange={handleAutoFillChange("numEntries")}
                        />
                      </FormRow>
                      <Select
                        label="Size Allocation"
                        options={ALLOCATION_OPTIONS}
                        value={autoFillConfig.allocation}
                        onChange={handleAutoFillChange("allocation")}
                      />
                      <Button onClick={handleGenerateEntries} size="small" className="w-full">
                        Generate Entries
                      </Button>
                    </div>
                  </FormSection>
                )}

                {/* Pro Tips */}
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- <strong className="text-zinc-400">Larger positions</strong> at lower prices reduce average faster</li>
                    <li>- Use <strong className="text-zinc-400">Auto-Fill</strong> for systematic DCA planning</li>
                    <li>- <strong className="text-zinc-400">Martingale</strong> is high risk - use with caution</li>
                    <li>- Always calculate <strong className="text-zinc-400">total exposure</strong> before trading</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection result={result} form={form} onCopyAll={handleCopyAll} />
            </div>
          </div>
        </Container>
      </section>

      {/* Error Toasts */}
      <ErrorToast errors={errors} onDismiss={dismissError} />

      {/* Success Toast */}
      <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
    </>
  );
}