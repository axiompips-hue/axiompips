// File: src/app/calculators/spread-cost/SpreadCostCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS } from "@/lib/constants/options";
import { useSmartCalculation, useCalculatorDefaults, useCalculatorHistory } from "@/lib/hooks";
import { CalculatorHistory } from "@/components/ui/CalculatorHistory";
import { ShareableLink } from "@/components/ui/ShareableLink";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  currencyPair: string;
  lotSize: string;
  spread: string;
  accountCurrency: string;
  currentPrice: string;
  tradesPerDay: string;
}

interface SpreadResult {
  spreadCostPerTrade: number;
  spreadCostPerLot: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  annualCost: number;
  pipValue: number;
  spreadInCurrency: number;
  breakEvenPips: number;
  contractSize: number;
}

interface LotScenario {
  lots: number;
  label: string;
  costPerTrade: number;
  monthlyCost: number;
  color: string;
  border: string;
  bg: string;
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
const ERROR_DISPLAY_DURATION = 3000;

const DEFAULT_STATE: FormState = {
  currencyPair: "EURUSD",
  lotSize: "1.00",
  spread: "1.5",
  accountCurrency: "USD",
  currentPrice: "1.0850",
  tradesPerDay: "3",
};

const LOT_SIZE_PRESETS = [
  { value: "0.01", label: "Micro (0.01)" },
  { value: "0.10", label: "Mini (0.10)" },
  { value: "1.00", label: "Standard (1.00)" },
  { value: "5.00", label: "5 Lots" },
  { value: "10.00", label: "10 Lots" },
];

const TRADES_PER_DAY_OPTIONS = [
  { value: "1", label: "1 trade/day" },
  { value: "2", label: "2 trades/day" },
  { value: "3", label: "3 trades/day" },
  { value: "5", label: "5 trades/day" },
  { value: "10", label: "10 trades/day" },
  { value: "20", label: "20 trades/day" },
];

const COMMON_SPREADS = [
  { pair: "EURUSD", typical: 0.8, high: 1.5 },
  { pair: "GBPUSD", typical: 1.0, high: 2.0 },
  { pair: "USDJPY", typical: 0.9, high: 1.8 },
  { pair: "AUDUSD", typical: 1.0, high: 2.0 },
  { pair: "USDCAD", typical: 1.2, high: 2.5 },
  { pair: "USDCHF", typical: 1.1, high: 2.2 },
  { pair: "NZDUSD", typical: 1.3, high: 2.5 },
  { pair: "EURJPY", typical: 1.4, high: 2.8 },
  { pair: "GBPJPY", typical: 2.0, high: 4.0 },
  { pair: "XAUUSD", typical: 25.0, high: 45.0 },
];

const LOT_SCENARIOS = [
  { lots: 0.01, label: "Micro", color: "text-green-400", border: "border-green-800/50", bg: "bg-green-950/20" },
  { lots: 0.1, label: "Mini", color: "text-emerald-400", border: "border-emerald-800/50", bg: "bg-emerald-950/20" },
  { lots: 1.0, label: "Standard", color: "text-blue-400", border: "border-blue-800/50", bg: "bg-blue-950/20" },
  { lots: 5.0, label: "5 Lots", color: "text-amber-400", border: "border-amber-800/50", bg: "bg-amber-950/20" },
];

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
  if (pair === "XAUUSD") return 100;
  if (pair === "XAGUSD") return 5000;
  return 100000;
}

function getDecimalPlaces(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  if (jpyPairs.includes(pair)) return 3;
  if (pair === "XAUUSD") return 2;
  return 5;
}

function calculateSpreadCost(
  lotSize: number,
  spread: number,
  currentPrice: number,
  pair: string,
  accountCurrency: string,
  tradesPerDay: number
): SpreadResult | null {
  if (lotSize <= 0 || spread <= 0 || currentPrice <= 0 || tradesPerDay <= 0) return null;

  const contractSize = getContractSize(pair);
  const pipMultiplier = getPipMultiplier(pair);
  const pipSize = 1 / pipMultiplier;

  // Pip value in quote currency
  const pipValueInQuote = (pipSize * contractSize * lotSize);

  // Convert pip value to account currency
  // If pair ends in account currency, no conversion needed
  // Simplified: for USD account, most major pairs use this formula
  let pipValue: number;
  const quoteCurrency = pair.slice(-3);

  if (quoteCurrency === accountCurrency) {
    pipValue = pipValueInQuote;
  } else if (pair.startsWith(accountCurrency)) {
    pipValue = pipValueInQuote / currentPrice;
  } else {
    // Cross pair - simplified conversion using current price
    pipValue = pipValueInQuote / currentPrice;
  }

  // Spread cost per trade = spread (pips) x pip value
  const spreadCostPerTrade = spread * pipValue;
  const spreadCostPerLot = spread * (pipValueInQuote / lotSize) / currentPrice;

  const dailyCost = spreadCostPerTrade * tradesPerDay;
  const weeklyCost = dailyCost * 5; // Trading days
  const monthlyCost = dailyCost * 22; // Avg trading days per month
  const annualCost = dailyCost * 252; // Avg trading days per year

  const breakEvenPips = spread; // You need to move this many pips to cover the spread

  return {
    spreadCostPerTrade,
    spreadCostPerLot: spreadCostPerTrade / lotSize,
    dailyCost,
    weeklyCost,
    monthlyCost,
    annualCost,
    pipValue,
    spreadInCurrency: spreadCostPerTrade,
    breakEvenPips: spread,
    contractSize,
  };
}

function formatMoney(value: number, currency: string): string {
  const sign = value >= 0 ? "" : "-";
  const abs = Math.abs(value);
  return `${sign}${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function getSpreadRating(spread: number, pair: string): { label: string; color: string; description: string } {
  const info = COMMON_SPREADS.find((s) => s.pair === pair);
  if (!info) {
    if (spread <= 1.5) return { label: "Excellent", color: "text-green-400", description: "Very competitive spread" };
    if (spread <= 3.0) return { label: "Good", color: "text-emerald-400", description: "Reasonable spread" };
    if (spread <= 5.0) return { label: "Average", color: "text-amber-400", description: "Typical market spread" };
    return { label: "Wide", color: "text-red-400", description: "Consider a tighter-spread broker" };
  }
  if (spread <= info.typical) return { label: "Excellent", color: "text-green-400", description: "Better than market average" };
  if (spread <= info.high) return { label: "Good", color: "text-emerald-400", description: "Within typical range" };
  return { label: "Wide", color: "text-red-400", description: "Above average - shop around" };
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
// Result Row Component
// ============================================================================

const ResultRow = memo(function ResultRow({
  label,
  value,
  suffix,
  highlight,
  description,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  description?: string;
}) {
  const colorClass = highlight
    ? "text-rose-400 border-rose-800/50 bg-rose-950/20"
    : "text-zinc-400 border-zinc-800 bg-zinc-900/50";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${colorClass}`}
    >
      <div className="flex flex-col">
        <span className="font-medium text-sm text-zinc-300">{label}</span>
        {description && (
          <span className="text-xs text-zinc-500 mt-0.5">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold ${highlight ? "text-rose-400" : "text-zinc-200"}`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// Lot Scenario Row Component
// ============================================================================

const LotScenarioRow = memo(function LotScenarioRow({
  scenario,
  accountCurrency,
  isSelected,
}: {
  scenario: LotScenario;
  accountCurrency: string;
  isSelected: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${scenario.color} ${scenario.border} ${scenario.bg}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-zinc-300">
            {scenario.lots} lot{scenario.lots !== 1 ? "s" : ""}
            {isSelected && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Selected
              </span>
            )}
          </span>
          <span className="text-xs text-zinc-500 mt-0.5">{scenario.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <span className="text-xs text-zinc-500 block">Per Trade</span>
          <span className="font-mono text-sm text-zinc-300">
            {scenario.costPerTrade.toFixed(2)} {accountCurrency}
          </span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Monthly</span>
          <span className="font-mono font-bold text-zinc-200">
            {scenario.monthlyCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Result Section
// ============================================================================

const ResultSection = memo(function ResultSection({
  result,
  form,
  onCopy,
}: {
  result: SpreadResult | null;
  form: FormState;
  onCopy: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="Spread Cost Analysis">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">Enter valid values to calculate spread cost</p>
          <p className="text-zinc-600 text-xs mt-1">
            Currency pair, lot size, and spread are required
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const spread = parseFloat(form.spread);
  const lotSize = parseFloat(form.lotSize);
  const tradesPerDay = parseInt(form.tradesPerDay);
  const spreadRating = getSpreadRating(spread, form.currencyPair);

  // Build lot scenarios
  const lotScenarios: LotScenario[] = LOT_SCENARIOS.map((s) => ({
    ...s,
    costPerTrade: s.lots * result.spreadCostPerLot,
    monthlyCost: s.lots * result.spreadCostPerLot * tradesPerDay * 22,
  }));

  return (
    <>
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-rose-950/30 to-pink-950/20 border border-rose-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-rose-400">Spread Cost Analysis</h3>
          <Button variant="secondary" size="small" onClick={onCopy}>
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

        {/* Highlight Box - Cost Per Trade */}
        <div className="bg-rose-900/30 border border-rose-700/50 rounded-lg p-4 mb-3">
          <div className="text-center">
            <span className="text-zinc-400 text-sm">Cost Per Trade</span>
            <p className="text-3xl font-mono font-bold text-rose-400 mt-1">
              {result.spreadCostPerTrade.toFixed(2)}
              <span className="text-lg ml-2 text-rose-300">{form.accountCurrency}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {form.spread} pip spread on {form.lotSize} lot{parseFloat(form.lotSize) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Pip Value</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.pipValue.toFixed(2)} {form.accountCurrency}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Break-even</span>
            <p className="font-mono font-semibold text-zinc-200">{form.spread} pips</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Daily Cost</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.dailyCost.toFixed(2)} {form.accountCurrency}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Spread Quality</span>
            <p className={`font-semibold ${spreadRating.color}`}>{spreadRating.label}</p>
          </div>
        </div>
      </div>

      {/* Spread Quality Indicator */}
      <div
        className={`border rounded-lg p-4 ${
          spreadRating.label === "Excellent"
            ? "bg-green-950/20 border-green-800/30"
            : spreadRating.label === "Good"
            ? "bg-emerald-950/20 border-emerald-800/30"
            : spreadRating.label === "Average"
            ? "bg-amber-950/20 border-amber-800/30"
            : "bg-red-950/20 border-red-800/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              spreadRating.label === "Excellent"
                ? "bg-green-400"
                : spreadRating.label === "Good"
                ? "bg-emerald-400"
                : spreadRating.label === "Average"
                ? "bg-amber-400"
                : "bg-red-400"
            }`}
          />
          <span className={`text-sm font-medium ${spreadRating.color}`}>
            {spreadRating.label} Spread - {form.spread} pips on {form.currencyPair}
          </span>
        </div>
        <p className="text-xs text-zinc-500">{spreadRating.description}</p>
      </div>

      {/* Cost Breakdown */}
      <ResultDisplay title="Cost Breakdown">
        <div className="space-y-2">
          <ResultRow
            label="Cost Per Trade"
            value={result.spreadCostPerTrade.toFixed(2)}
            suffix={form.accountCurrency}
            highlight
            description="Spread cost on each trade entry"
          />
          <ResultRow
            label="Cost Per Lot"
            value={result.spreadCostPerLot.toFixed(2)}
            suffix={`${form.accountCurrency}/lot`}
            description="Normalized cost per standard lot"
          />
          <ResultRow
            label="Daily Cost"
            value={result.dailyCost.toFixed(2)}
            suffix={form.accountCurrency}
            description={`Based on ${form.tradesPerDay} trades per day`}
          />
          <ResultRow
            label="Weekly Cost"
            value={result.weeklyCost.toFixed(2)}
            suffix={form.accountCurrency}
            description="5 trading days per week"
          />
          <ResultRow
            label="Monthly Cost"
            value={result.monthlyCost.toFixed(2)}
            suffix={form.accountCurrency}
            description="22 trading days per month"
          />
          <ResultRow
            label="Annual Cost"
            value={result.annualCost.toFixed(2)}
            suffix={form.accountCurrency}
            description="252 trading days per year"
          />
        </div>
      </ResultDisplay>

      {/* Lot Size Scenarios */}
      <ResultDisplay title="Lot Size Scenarios">
        <div className="space-y-2">
          {lotScenarios.map((scenario) => (
            <LotScenarioRow
              key={scenario.lots}
              scenario={scenario}
              accountCurrency={form.accountCurrency}
              isSelected={Math.abs(scenario.lots - lotSize) < 0.001}
            />
          ))}
        </div>
      </ResultDisplay>

      {/* Pair Spread Reference */}
      <ResultDisplay title="Typical Spread Reference">
        <div className="space-y-2">
          {COMMON_SPREADS.slice(0, 6).map((ref) => (
            <div
              key={ref.pair}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                ref.pair === form.currencyPair
                  ? "border-rose-800/50 bg-rose-950/20"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              <span className={`text-sm font-semibold ${ref.pair === form.currencyPair ? "text-rose-400" : "text-zinc-300"}`}>
                {ref.pair}
                {ref.pair === form.currencyPair && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Current
                  </span>
                )}
              </span>
              <div className="flex items-center gap-6 text-right text-xs">
                <div>
                  <span className="text-zinc-500 block">Typical</span>
                  <span className="font-mono text-green-400 font-semibold">{ref.typical} pips</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">High</span>
                  <span className="font-mono text-amber-400 font-semibold">{ref.high} pips</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Spread Impact Rules</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">Under 1.0 pip</strong> - Excellent liquidity</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span><strong className="text-zinc-300">1-3 pips</strong> - Normal for majors</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">3+ pips</strong> - Consider switching broker</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Reduce Spread Costs</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Trade during London/NY session</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Avoid news events when spreads widen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Use ECN/raw spread accounts</span>
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

export function SpreadCostCalculator() {
  const defaults = useCalculatorDefaults();
  const [form, setForm] = useState<FormState>({
    ...DEFAULT_STATE,
    currencyPair: defaults.defaultPair,
    accountCurrency: defaults.accountCurrency,
  });
  const { history, addEntry, clearHistory } = useCalculatorHistory("spread-cost");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read URL params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const p: Partial<FormState> = {};
    (["currencyPair", "lotSize", "spread", "accountCurrency", "currentPrice", "tradesPerDay"] as const).forEach((k) => {
      const v = url.searchParams.get(k);
      if (v) p[k] = v;
    });
    if (Object.keys(p).length > 0) {
      setForm((prev) => ({ ...prev, ...p }));
    }
  }, []);

  // Auto-dismiss errors
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

  // Auto-dismiss success
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const { calculationInput: debouncedForm, triggerCalculate, hasPendingChanges } = useSmartCalculation(form, 150);

  const result = useMemo<SpreadResult | null>(() => {
    if (!debouncedForm) return null;
    const lotSize = parseFloat(debouncedForm.lotSize);
    const spread = parseFloat(debouncedForm.spread);
    const price = parseFloat(debouncedForm.currentPrice);
    const tradesPerDay = parseInt(debouncedForm.tradesPerDay);

    if (isNaN(lotSize) || lotSize <= 0) return null;
    if (isNaN(spread) || spread <= 0) return null;
    if (isNaN(price) || price <= 0) return null;
    if (isNaN(tradesPerDay) || tradesPerDay <= 0) return null;

    return calculateSpreadCost(
      lotSize,
      spread,
      price,
      debouncedForm.currencyPair,
      debouncedForm.accountCurrency,
      tradesPerDay
    );
  }, [debouncedForm]);

  // Save history when result changes
  useEffect(() => {
    if (!result) return;
    addEntry(
      `${form.spread} pip spread | ${form.currencyPair} | ${form.lotSize} lots`,
      {
        currencyPair: form.currencyPair,
        lotSize: form.lotSize,
        spread: form.spread,
        accountCurrency: form.accountCurrency,
        currentPrice: form.currentPrice,
        tradesPerDay: form.tradesPerDay,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Auto-fill price hint when pair changes
  const handlePairChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const pair = e.target.value;
      setForm((prev) => ({ ...prev, currencyPair: pair }));
    },
    []
  );

  const handleCopy = useCallback(() => {
    if (!result) return;

    const lines = [
      `Spread Cost Analysis - ${form.currencyPair}`,
      ``,
      `Trade Setup:`,
      `  Lot Size: ${form.lotSize} lots`,
      `  Spread: ${form.spread} pips`,
      `  Trades/Day: ${form.tradesPerDay}`,
      ``,
      `Cost Breakdown:`,
      `  Per Trade: ${result.spreadCostPerTrade.toFixed(2)} ${form.accountCurrency}`,
      `  Daily: ${result.dailyCost.toFixed(2)} ${form.accountCurrency}`,
      `  Weekly: ${result.weeklyCost.toFixed(2)} ${form.accountCurrency}`,
      `  Monthly: ${result.monthlyCost.toFixed(2)} ${form.accountCurrency}`,
      `  Annual: ${result.annualCost.toFixed(2)} ${form.accountCurrency}`,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Spread cost data copied to clipboard!");
    }).catch(() => {
      setErrors((prev) => [
        ...prev,
        {
          id: generateId(),
          field: "Copy Failed",
          message: "Could not copy to clipboard",
          timestamp: Date.now(),
        },
      ]);
    });
  }, [result, form]);

  const handleReset = useCallback(() => {
    setForm({
      ...DEFAULT_STATE,
      currencyPair: defaults.defaultPair,
      accountCurrency: defaults.accountCurrency,
    });
  }, [defaults]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Spread Cost Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Calculate the true cost of the bid-ask spread on every trade. Understand exactly how
              much you pay your broker and how it compounds across your trading activity.
            </p>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Trade Setup">
                  <FormRow>
                    <Select
                      label="Currency Pair"
                      options={PAIR_OPTIONS}
                      value={form.currencyPair}
                      onChange={handlePairChange}
                    />
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={form.accountCurrency}
                      onChange={handleFieldChange("accountCurrency")}
                    />
                  </FormRow>
                  <FormRow>
                    <Input
                      label="Current Price"
                      type="number"
                      value={form.currentPrice}
                      onChange={handleFieldChange("currentPrice")}
                      placeholder="1.0850"
                      min="0"
                      step="0.00001"
                      helper="Current pair price"
                    />
                    <Input
                      label="Lot Size"
                      type="number"
                      value={form.lotSize}
                      onChange={handleFieldChange("lotSize")}
                      placeholder="1.00"
                      min="0.01"
                      step="0.01"
                      suffix="lots"
                    />
                  </FormRow>

                  {/* Lot size presets */}
                  <div className="flex flex-wrap gap-2">
                    {LOT_SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setForm((prev) => ({ ...prev, lotSize: preset.value }))}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          form.lotSize === preset.value
                            ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                            : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Spread & Frequency">
                  <Input
                    label="Spread"
                    type="number"
                    value={form.spread}
                    onChange={handleFieldChange("spread")}
                    placeholder="1.5"
                    min="0.1"
                    step="0.1"
                    suffix="pips"
                    helper="Your broker's bid-ask spread"
                  />

                  <Select
                    label="Trades Per Day"
                    options={TRADES_PER_DAY_OPTIONS}
                    value={form.tradesPerDay}
                    onChange={handleFieldChange("tradesPerDay")}
                  />

                  {/* Common spread info */}
                  {(() => {
                    const info = COMMON_SPREADS.find((s) => s.pair === form.currencyPair);
                    if (!info) return null;
                    return (
                      <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50">
                        <p className="text-xs text-zinc-500 mb-1">
                          <strong className="text-zinc-400">{form.currencyPair}</strong> typical spreads:
                        </p>
                        <div className="flex gap-4 text-xs">
                          <span className="text-green-400">Typical: <strong>{info.typical} pips</strong></span>
                          <span className="text-amber-400">High vol: <strong>{info.high} pips</strong></span>
                        </div>
                      </div>
                    );
                  })()}
                </FormSection>

                <div className="flex gap-3 pt-2 flex-wrap">
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
                  <ShareableLink
                    params={{
                      currencyPair: form.currencyPair,
                      lotSize: form.lotSize,
                      spread: form.spread,
                      accountCurrency: form.accountCurrency,
                      currentPrice: form.currentPrice,
                      tradesPerDay: form.tradesPerDay,
                    }}
                  />
                </div>

                {/* Calculation History */}
                <CalculatorHistory
                  history={history}
                  onRestore={(params) => setForm((prev) => ({ ...prev, ...params }))}
                  onClear={clearHistory}
                />

                {/* Pro Tips */}
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Spread cost is <strong className="text-zinc-400">paid on entry</strong> — not on exit</li>
                    <li>- Frequent traders pay <strong className="text-zinc-400">exponentially more</strong> in spreads</li>
                    <li>- Trade during <strong className="text-zinc-400">London/NY overlap</strong> for tightest spreads</li>
                    <li>- <strong className="text-zinc-400">ECN accounts</strong> offer raw spreads with small commission</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection result={result} form={form} onCopy={handleCopy} />
            </div>
          </div>
        </Container>
      </section>

      <ErrorToast errors={errors} onDismiss={dismissError} />
      <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
    </>
  );
}
