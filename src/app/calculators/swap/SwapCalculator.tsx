// File: src/app/calculators/swap/SwapCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { CURRENCY_OPTIONS, PAIR_OPTIONS } from "@/lib/constants/options";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  currencyPair: string;
  positionType: "long" | "short";
  lotSize: string;
  swapLong: string;
  swapShort: string;
  currentPrice: string;
  accountCurrency: string;
  holdingDays: string;
  includeTripleSwap: boolean;
}

interface SwapResult {
  dailySwap: number;
  weeklySwap: number;
  monthlySwap: number;
  annualSwap: number;
  totalSwap: number;
  holdingDays: number;
  swapRate: number;
  isPositive: boolean;
  tripleSwapDay: number;
  regularDays: number;
  tripleDays: number;
  perLotDaily: number;
  breakEvenPips: number;
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

interface SwapPreset {
  pair: string;
  swapLong: number;
  swapShort: number;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: FormState = {
  currencyPair: "EURUSD",
  positionType: "long",
  lotSize: "1.00",
  swapLong: "-6.50",
  swapShort: "1.20",
  currentPrice: "1.0850",
  accountCurrency: "USD",
  holdingDays: "7",
  includeTripleSwap: true,
};

const POSITION_OPTIONS = [
  { value: "long", label: "Long (Buy)" },
  { value: "short", label: "Short (Sell)" },
];

// Typical swap rates for popular pairs (in points) - these are examples
const SWAP_PRESETS: SwapPreset[] = [
  { pair: "EURUSD", swapLong: -6.50, swapShort: 1.20, description: "Euro / US Dollar" },
  { pair: "GBPUSD", swapLong: -4.80, swapShort: 0.50, description: "British Pound / US Dollar" },
  { pair: "USDJPY", swapLong: 8.50, swapShort: -15.20, description: "US Dollar / Japanese Yen" },
  { pair: "AUDUSD", swapLong: -2.10, swapShort: -1.80, description: "Australian Dollar / US Dollar" },
  { pair: "USDCAD", swapLong: -3.20, swapShort: -2.10, description: "US Dollar / Canadian Dollar" },
  { pair: "USDCHF", swapLong: 4.50, swapShort: -9.80, description: "US Dollar / Swiss Franc" },
  { pair: "NZDUSD", swapLong: -1.50, swapShort: -2.30, description: "New Zealand Dollar / US Dollar" },
  { pair: "EURJPY", swapLong: 7.20, swapShort: -14.50, description: "Euro / Japanese Yen" },
  { pair: "GBPJPY", swapLong: 12.80, swapShort: -22.10, description: "British Pound / Japanese Yen" },
  { pair: "XAUUSD", swapLong: -25.50, swapShort: 8.20, description: "Gold / US Dollar" },
];

const LOT_SIZE_PRESETS = [
  { value: "0.01", label: "Micro (0.01)" },
  { value: "0.10", label: "Mini (0.10)" },
  { value: "1.00", label: "Standard (1.00)" },
  { value: "10.00", label: "10 Lots" },
];

const HOLDING_PERIOD_PRESETS = [
  { value: "1", label: "1 Day" },
  { value: "7", label: "1 Week" },
  { value: "30", label: "1 Month" },
  { value: "90", label: "3 Months" },
  { value: "365", label: "1 Year" },
];

const ERROR_DISPLAY_DURATION = 3000;

// ============================================================================
// Utility Functions
// ============================================================================

function getPipMultiplier(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  const metalPairs = ["XAUUSD", "XAGUSD"];
  
  if (jpyPairs.includes(pair)) return 100;
  if (metalPairs.includes(pair)) return 10;
  return 10000;
}

function getContractSize(pair: string): number {
  if (pair === "XAUUSD") return 100; // 100 oz per lot
  if (pair === "XAGUSD") return 5000; // 5000 oz per lot
  return 100000; // Standard forex lot
}

function getPointValue(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  
  if (jpyPairs.includes(pair)) return 0.01;
  if (pair === "XAUUSD") return 0.01;
  if (pair === "XAGUSD") return 0.001;
  return 0.00001;
}

function formatCurrency(value: number, currency: string): string {
  const absValue = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  
  return `${sign}${absValue.toLocaleString("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function calculateSwap(
  lotSize: number,
  swapRate: number,
  currentPrice: number,
  pair: string,
  accountCurrency: string,
  holdingDays: number,
  includeTripleSwap: boolean
): SwapResult | null {
  if (lotSize <= 0 || holdingDays <= 0) return null;
  
  const contractSize = getContractSize(pair);
  const pointValue = getPointValue(pair);
  
  // Calculate pip value in account currency
  // For pairs where USD is quote currency (EURUSD, GBPUSD, etc.)
  // Pip value = Contract Size x Point Value
  // For pairs where USD is base currency (USDCAD, USDJPY, etc.)
  // Pip value = Contract Size x Point Value / Current Price
  
  let pipValueInQuote = contractSize * pointValue;
  
  // Convert to account currency if needed
  // This is simplified - in production, you'd use live exchange rates
  const quoteIsSameAsAccount = pair.endsWith(accountCurrency);
  
  let pipValue: number;
  if (quoteIsSameAsAccount) {
    pipValue = pipValueInQuote;
  } else {
    // Simplified conversion using current price
    pipValue = pipValueInQuote / currentPrice;
  }
  
  // Daily swap = Lot Size x Swap Rate (points) x Point Value
  const dailySwapPerLot = swapRate * pointValue * contractSize;
  const dailySwap = dailySwapPerLot * lotSize;
  
  // Calculate triple swap days (typically Wednesday = 3x for forex)
  const fullWeeks = Math.floor(holdingDays / 7);
  const remainingDays = holdingDays % 7;
  
  let tripleDays = fullWeeks; // One triple day per week
  let regularDays = holdingDays - tripleDays;
  
  // Adjust if not including triple swap
  if (!includeTripleSwap) {
    tripleDays = 0;
    regularDays = holdingDays;
  }
  
  // Total swap calculation
  const totalSwap = includeTripleSwap
    ? (regularDays * dailySwap) + (tripleDays * dailySwap * 3)
    : dailySwap * holdingDays;
  
  // Weekly (5 trading days + 2 weekend = 7 days worth of swap)
  const weeklySwap = dailySwap * 7;
  
  // Monthly (approximately 22 trading days, but swaps apply for weekends too)
  const monthlySwap = dailySwap * 30;
  
  // Annual
  const annualSwap = dailySwap * 365;
  
  // Break-even calculation - how many pips needed to cover daily swap
  const pipValuePerLot = pair.endsWith("USD") ? 10 : 10 / currentPrice;
  const breakEvenPips = Math.abs(dailySwap) / (pipValuePerLot * lotSize);
  
  return {
    dailySwap,
    weeklySwap,
    monthlySwap,
    annualSwap,
    totalSwap,
    holdingDays,
    swapRate,
    isPositive: dailySwap >= 0,
    tripleSwapDay: dailySwap * 3,
    regularDays,
    tripleDays,
    perLotDaily: dailySwapPerLot,
    breakEvenPips,
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
// Swap Rate Card Component
// ============================================================================

const SwapRateCard = memo(function SwapRateCard({
  label,
  value,
  currency,
  isPositive,
  isPrimary = false,
  subtitle,
}: {
  label: string;
  value: number;
  currency: string;
  isPositive: boolean;
  isPrimary?: boolean;
  subtitle?: string;
}) {
  const colorClass = isPositive
    ? "text-green-400"
    : "text-red-400";
  
  const bgClass = isPrimary
    ? isPositive
      ? "bg-green-950/30 border-green-800/30"
      : "bg-red-950/30 border-red-800/30"
    : "bg-zinc-900/50 border-zinc-800";

  return (
    <div className={`rounded-lg p-3 border ${bgClass}`}>
      <span className="text-zinc-500 text-xs">{label}</span>
      {subtitle && <span className="text-zinc-600 text-xs ml-1">({subtitle})</span>}
      <p className={`font-mono font-semibold ${isPrimary ? "text-lg" : ""} ${colorClass}`}>
        {formatCurrency(value, currency)}
      </p>
    </div>
  );
});

// ============================================================================
// Swap Preset Button
// ============================================================================

const SwapPresetButton = memo(function SwapPresetButton({
  preset,
  isActive,
  onClick,
}: {
  preset: SwapPreset;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-start p-3 rounded-lg border transition-all duration-200
        ${isActive
          ? "bg-teal-950/30 border-teal-700 text-teal-300"
          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
        }
      `}
    >
      <span className="font-semibold text-sm">{preset.pair}</span>
      <div className="flex gap-3 mt-1 text-xs">
        <span className={preset.swapLong >= 0 ? "text-green-500" : "text-red-500"}>
          L: {preset.swapLong > 0 ? "+" : ""}{preset.swapLong}
        </span>
        <span className={preset.swapShort >= 0 ? "text-green-500" : "text-red-500"}>
          S: {preset.swapShort > 0 ? "+" : ""}{preset.swapShort}
        </span>
      </div>
    </button>
  );
});

// ============================================================================
// Result Section
// ============================================================================

const ResultSection = memo(function ResultSection({
  result,
  accountCurrency,
  positionType,
  currencyPair,
  lotSize,
  onCopyResults,
}: {
  result: SwapResult | null;
  accountCurrency: string;
  positionType: string;
  currencyPair: string;
  lotSize: string;
  onCopyResults: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="Swap Calculation">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">
            Enter your position details to calculate swap fees
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Swap rates are charged for holding positions overnight
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const isPositive = result.isPositive;
  const statusText = isPositive ? "Swap Credit" : "Swap Cost";
  const statusColor = isPositive ? "text-green-400" : "text-red-400";
  const statusBg = isPositive ? "bg-green-500/20" : "bg-red-500/20";

  return (
    <>
      {/* Summary Card */}
      <div className={`bg-gradient-to-br ${isPositive ? "from-green-950/30 to-teal-950/20 border-green-800/30" : "from-red-950/30 to-orange-950/20 border-red-800/30"} border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${statusBg} flex items-center justify-center`}>
              {isPositive ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${statusColor}`}>{statusText}</h3>
              <p className="text-zinc-500 text-sm">
                {currencyPair} - {positionType === "long" ? "Long" : "Short"} - {lotSize} Lot{parseFloat(lotSize) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="small" onClick={onCopyResults}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </span>
          </Button>
        </div>

        {/* Primary Result */}
        <div className={`text-center py-4 rounded-lg ${isPositive ? "bg-green-950/40" : "bg-red-950/40"}`}>
          <p className="text-zinc-400 text-sm mb-1">Total for {result.holdingDays} day{result.holdingDays !== 1 ? "s" : ""}</p>
          <p className={`text-3xl font-bold font-mono ${statusColor}`}>
            {formatCurrency(result.totalSwap, accountCurrency)}
          </p>
          {result.tripleDays > 0 && (
            <p className="text-zinc-500 text-xs mt-2">
              Includes {result.tripleDays} triple swap day{result.tripleDays !== 1 ? "s" : ""} (typically Wednesday)
            </p>
          )}
        </div>
      </div>

      {/* Daily Breakdown */}
      <ResultDisplay title="Daily Breakdown">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SwapRateCard
            label="Daily Swap"
            value={result.dailySwap}
            currency={accountCurrency}
            isPositive={isPositive}
            isPrimary
          />
          <SwapRateCard
            label="Triple Swap Day"
            value={result.tripleSwapDay}
            currency={accountCurrency}
            isPositive={isPositive}
            subtitle="Wed"
          />
          <SwapRateCard
            label="Per Lot Daily"
            value={result.perLotDaily}
            currency={accountCurrency}
            isPositive={isPositive}
          />
          <SwapRateCard
            label="Swap Rate"
            value={result.swapRate}
            currency="pts"
            isPositive={isPositive}
          />
        </div>
      </ResultDisplay>

      {/* Projections */}
      <ResultDisplay title="Swap Projections">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SwapRateCard
            label="Weekly"
            subtitle="7 days"
            value={result.weeklySwap}
            currency={accountCurrency}
            isPositive={isPositive}
          />
          <SwapRateCard
            label="Monthly"
            subtitle="30 days"
            value={result.monthlySwap}
            currency={accountCurrency}
            isPositive={isPositive}
          />
          <SwapRateCard
            label="Annual"
            subtitle="365 days"
            value={result.annualSwap}
            currency={accountCurrency}
            isPositive={isPositive}
          />
        </div>
      </ResultDisplay>

      {/* Trading Insight */}
      <ResultDisplay title="Trading Insight">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">Break-Even Movement</p>
              <p className="text-xs text-zinc-500 mt-1">
                Price needs to move <span className="text-amber-400 font-semibold">{result.breakEvenPips.toFixed(1)} pips</span> daily in your favor to offset swap {isPositive ? "gains" : "costs"}.
              </p>
            </div>
          </div>

          {isPositive ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-950/30 border border-green-800/30">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-300">Positive Carry Trade</p>
                <p className="text-xs text-zinc-500 mt-1">
                  This position earns you money while you sleep! Consider holding longer to maximize swap income.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/30 border border-red-800/30">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-300">Negative Carry Trade</p>
                <p className="text-xs text-zinc-500 mt-1">
                  This position costs you money overnight. Consider shorter holding periods or swing trading instead.
                </p>
              </div>
            </div>
          )}
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Understanding Swaps">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">What is Swap?</h4>
            <ul className="space-y-1 text-zinc-500 text-xs">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span>Swap is the interest paid or earned for holding a position overnight</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span>Based on interest rate differential between two currencies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span>Charged at 5:00 PM EST (New York close)</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Triple Swap Wednesday</h4>
            <ul className="space-y-1 text-zinc-500 text-xs">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>Wednesday swap = 3x normal rate (covers weekend)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>Some brokers apply triple swap on Friday instead</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>Swap rates change based on central bank policies</span>
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

export function SwapCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  const result = useMemo<SwapResult | null>(() => {
    if (!debouncedForm) return null;
    const lotSize = parseFloat(debouncedForm.lotSize);
    const swapLong = parseFloat(debouncedForm.swapLong);
    const swapShort = parseFloat(debouncedForm.swapShort);
    const currentPrice = parseFloat(debouncedForm.currentPrice);
    const holdingDays = parseInt(debouncedForm.holdingDays, 10);

    if (isNaN(lotSize) || lotSize <= 0) return null;
    if (isNaN(currentPrice) || currentPrice <= 0) return null;
    if (isNaN(holdingDays) || holdingDays <= 0) return null;

    const swapRate = debouncedForm.positionType === "long" ? swapLong : swapShort;
    if (isNaN(swapRate)) return null;

    return calculateSwap(
      lotSize,
      swapRate,
      currentPrice,
      debouncedForm.currencyPair,
      debouncedForm.accountCurrency,
      holdingDays,
      debouncedForm.includeTripleSwap
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

  // Form field handlers
  const handleFieldChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === "checkbox" 
          ? (e.target as HTMLInputElement).checked 
          : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  // Handle checkbox change
  const handleCheckboxChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.checked }));
      },
    []
  );

  // Apply preset
  const handleApplyPreset = useCallback((preset: SwapPreset) => {
    setForm((prev) => ({
      ...prev,
      currencyPair: preset.pair,
      swapLong: preset.swapLong.toString(),
      swapShort: preset.swapShort.toString(),
    }));
  }, []);

  // Apply lot size preset
  const handleLotSizePreset = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, lotSize: value }));
  }, []);

  // Apply holding period preset
  const handleHoldingPreset = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, holdingDays: value }));
  }, []);

  // Copy results to clipboard
  const handleCopyResults = useCallback(() => {
    if (!result) return;

    const text = `Swap Calculator Results
===========================
Pair: ${form.currencyPair}
Position: ${form.positionType === "long" ? "Long (Buy)" : "Short (Sell)"}
Lot Size: ${form.lotSize}
Holding Period: ${result.holdingDays} days

Daily Swap: ${formatCurrency(result.dailySwap, form.accountCurrency)}
Weekly Swap: ${formatCurrency(result.weeklySwap, form.accountCurrency)}
Monthly Swap: ${formatCurrency(result.monthlySwap, form.accountCurrency)}
Annual Swap: ${formatCurrency(result.annualSwap, form.accountCurrency)}

Total for ${result.holdingDays} days: ${formatCurrency(result.totalSwap, form.accountCurrency)}
===========================
Generated by AxiomPips Swap Calculator`;

    navigator.clipboard.writeText(text).then(() => {
      setSuccessMessage("Results copied to clipboard!");
    }).catch(() => {
      addError("Copy Failed", "Could not copy to clipboard");
    });
  }, [result, form, addError]);

  // Reset form
  const handleReset = useCallback(() => {
    setForm(DEFAULT_STATE);
  }, []);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Swap Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Calculate overnight rollover fees and swap credits for holding forex positions 
              across trading sessions. Estimate costs for any holding period.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Quick Presets">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SWAP_PRESETS.slice(0, 6).map((preset) => (
                      <SwapPresetButton
                        key={preset.pair}
                        preset={preset}
                        isActive={form.currencyPair === preset.pair}
                        onClick={() => handleApplyPreset(preset)}
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Position Details">
                  <FormRow>
                    <Select
                      label="Currency Pair"
                      options={PAIR_OPTIONS}
                      value={form.currencyPair}
                      onChange={handleFieldChange("currencyPair")}
                    />
                    <Select
                      label="Position Type"
                      options={POSITION_OPTIONS}
                      value={form.positionType}
                      onChange={handleFieldChange("positionType")}
                    />
                  </FormRow>
                  
                  <FormRow>
                    <Input
                      label="Lot Size"
                      type="number"
                      value={form.lotSize}
                      onChange={handleFieldChange("lotSize")}
                      placeholder="1.00"
                      min="0.01"
                      step="0.01"
                    />
                    <Input
                      label="Current Price"
                      type="number"
                      value={form.currentPrice}
                      onChange={handleFieldChange("currentPrice")}
                      placeholder="1.0850"
                      min="0"
                      step="0.00001"
                    />
                  </FormRow>

                  {/* Lot Size Quick Select */}
                  <div className="flex flex-wrap gap-2">
                    {LOT_SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleLotSizePreset(preset.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          form.lotSize === preset.value
                            ? "bg-teal-950/50 border-teal-700 text-teal-300"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Swap Rates (Points)">
                  <FormRow>
                    <Input
                      label="Swap Long (Buy)"
                      type="number"
                      value={form.swapLong}
                      onChange={handleFieldChange("swapLong")}
                      placeholder="-6.50"
                      step="0.01"
                      helper="Get this from your broker"
                    />
                    <Input
                      label="Swap Short (Sell)"
                      type="number"
                      value={form.swapShort}
                      onChange={handleFieldChange("swapShort")}
                      placeholder="1.20"
                      step="0.01"
                      helper="Positive = credit, Negative = cost"
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Holding Period">
                  <FormRow>
                    <Input
                      label="Days to Hold"
                      type="number"
                      value={form.holdingDays}
                      onChange={handleFieldChange("holdingDays")}
                      placeholder="7"
                      min="1"
                      step="1"
                    />
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={form.accountCurrency}
                      onChange={handleFieldChange("accountCurrency")}
                    />
                  </FormRow>

                  {/* Holding Period Quick Select */}
                  <div className="flex flex-wrap gap-2">
                    {HOLDING_PERIOD_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleHoldingPreset(preset.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          form.holdingDays === preset.value
                            ? "bg-teal-950/50 border-teal-700 text-teal-300"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Triple Swap Toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.includeTripleSwap}
                      onChange={handleCheckboxChange("includeTripleSwap")}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-300">Include Triple Swap</span>
                      <p className="text-xs text-zinc-500">Wednesday = 3x swap (covers weekend)</p>
                    </div>
                  </label>
                </FormSection>

                <div className="flex gap-3 pt-2">
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
                  <Button variant="secondary" size="small" onClick={handleReset}>
                    Reset
                  </Button>
                </div>

                {/* Pro Tips */}
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- <strong className="text-zinc-400">Carry trades</strong>: Buy currencies with higher interest rates</li>
                    <li>- <strong className="text-zinc-400">Avoid Wednesday</strong> rollovers if swap is negative</li>
                    <li>- <strong className="text-zinc-400">Check your broker</strong>: Swap rates vary significantly</li>
                    <li>- <strong className="text-zinc-400">Islamic accounts</strong> are typically swap-free</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection
                result={result}
                accountCurrency={form.accountCurrency}
                positionType={form.positionType}
                currencyPair={form.currencyPair}
                lotSize={form.lotSize}
                onCopyResults={handleCopyResults}
              />
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