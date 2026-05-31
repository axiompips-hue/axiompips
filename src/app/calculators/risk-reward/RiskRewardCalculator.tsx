// File: src/app/calculators/risk-reward/RiskRewardCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS, DIRECTION_OPTIONS } from "@/lib/constants/options";
import { calculateRiskReward, RiskRewardResult, TradeDirection } from "@/lib/engine";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  entryPrice: string;
  stopLossPrice: string;
  takeProfitPrice: string;
  direction: TradeDirection;
  currencyPair: string;
  lotSize: string;
  accountCurrency: string;
  exchangeRate: string;
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

interface RRScenario {
  ratio: number;
  label: string;
  tpPrice: number;
  rewardPips: number;
  rewardAmount: number;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: FormState = {
  entryPrice: "1.0850",
  stopLossPrice: "1.0800",
  takeProfitPrice: "1.0950",
  direction: "buy",
  currencyPair: "EURUSD",
  lotSize: "1",
  accountCurrency: "USD",
  exchangeRate: "1.0850",
};

const ERROR_DISPLAY_DURATION = 3000;

const RR_RATINGS = [
  { min: 3, label: "Excellent", color: "text-green-400", bg: "bg-green-950/20", border: "border-green-800/50" },
  { min: 2, label: "Very Good", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-800/50" },
  { min: 1.5, label: "Good", color: "text-teal-400", bg: "bg-teal-950/20", border: "border-teal-800/50" },
  { min: 1, label: "Acceptable", color: "text-yellow-400", bg: "bg-yellow-950/20", border: "border-yellow-800/50" },
  { min: 0, label: "Poor", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-800/50" },
];

const SCENARIO_RATIOS = [1, 1.5, 2, 2.5, 3];

// ============================================================================
// Utility Functions
// ============================================================================

function getPipMultiplier(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  return jpyPairs.includes(pair) ? 100 : 10000;
}

function getRRRating(ratio: number): typeof RR_RATINGS[0] {
  for (const rating of RR_RATINGS) {
    if (ratio >= rating.min) return rating;
  }
  return RR_RATINGS[RR_RATINGS.length - 1];
}

function calculateRRScenarios(
  entryPrice: number,
  riskPips: number,
  pipValue: number,
  direction: TradeDirection,
  currencyPair: string
): RRScenario[] {
  const pipMultiplier = getPipMultiplier(currencyPair);
  const pipSize = 1 / pipMultiplier;

  return SCENARIO_RATIOS.map((ratio) => {
    const rewardPips = riskPips * ratio;
    const priceChange = rewardPips * pipSize;
    const tpPrice = direction === "buy" 
      ? entryPrice + priceChange 
      : entryPrice - priceChange;
    const rewardAmount = rewardPips * pipValue;

    return {
      ratio,
      label: `1:${ratio}`,
      tpPrice,
      rewardPips,
      rewardAmount,
    };
  });
}

function getWinRateRequired(rr: number): number {
  // Break-even win rate = 1 / (1 + RR)
  return (1 / (1 + rr)) * 100;
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
  colorClass,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  description?: string;
  colorClass?: string;
}) {
  const defaultColor = highlight
    ? "text-indigo-400 border-indigo-800/50 bg-indigo-950/20"
    : "text-zinc-400 border-zinc-800 bg-zinc-900/50";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${colorClass || defaultColor}`}
    >
      <div className="flex flex-col">
        <span className="font-medium text-sm text-zinc-300">{label}</span>
        {description && (
          <span className="text-xs text-zinc-500 mt-0.5">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold ${highlight ? "text-indigo-400" : "text-zinc-200"}`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// RR Scenario Row Component
// ============================================================================

const RRScenarioRow = memo(function RRScenarioRow({
  scenario,
  accountCurrency,
  currencyPair,
  isSelected,
}: {
  scenario: RRScenario;
  accountCurrency: string;
  currencyPair: string;
  isSelected: boolean;
}) {
  const rating = getRRRating(scenario.ratio);
  const pipMultiplier = getPipMultiplier(currencyPair);
  const decimalPlaces = pipMultiplier === 100 ? 3 : 5;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${rating.bg} ${rating.border}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-zinc-300">
            {scenario.label} R:R
            {isSelected && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Current
              </span>
            )}
          </span>
          <span className="text-xs text-zinc-500 mt-0.5">
            TP: {scenario.tpPrice.toFixed(decimalPlaces)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <span className="text-xs text-zinc-500 block">Reward</span>
          <span className={`font-mono text-sm ${rating.color}`}>
            +{scenario.rewardPips.toFixed(1)} pips
          </span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Profit</span>
          <span className={`font-mono font-bold ${rating.color}`}>
            +{scenario.rewardAmount.toFixed(2)}
          </span>
        </div>
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
  onCopy,
}: {
  result: RiskRewardResult | null;
  form: FormState;
  onCopy: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="Risk/Reward Analysis">
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
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">
            Enter valid price levels to calculate risk/reward
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Entry, stop loss, and take profit are required
          </p>
        </div>
      </ResultDisplay>
    );
  }

  if (!result.isValid) {
    return (
      <ResultDisplay title="Risk/Reward Analysis">
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-950/50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-red-400 text-sm font-medium">Invalid Trade Setup</p>
          <p className="text-zinc-500 text-xs mt-1">{result.validationMessage}</p>
        </div>
      </ResultDisplay>
    );
  }

  const rrValue = parseFloat(result.riskRewardRatio);
  const rating = getRRRating(rrValue);
  const winRateRequired = getWinRateRequired(rrValue);
  const isBuy = form.direction === "buy";
  
  const riskPips = parseFloat(result.riskPips);
  const pipValue = result.riskAmount && result.rewardAmount
    ? parseFloat(result.riskAmount) / riskPips
    : 10;
  const entryPrice = parseFloat(form.entryPrice);
  
  const scenarios = calculateRRScenarios(
    entryPrice,
    riskPips,
    pipValue,
    form.direction,
    form.currencyPair
  );

  return (
    <>
      {/* Summary Card */}
      <div className={`bg-gradient-to-br ${
        rrValue >= 2
          ? "from-green-950/30 to-emerald-950/20 border-green-800/30"
          : rrValue >= 1
          ? "from-yellow-950/30 to-amber-950/20 border-yellow-800/30"
          : "from-red-950/30 to-rose-950/20 border-red-800/30"
      } border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${rating.color}`}>
            {rating.label} Risk/Reward
          </h3>
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

        {/* Highlight Box - R:R Ratio */}
        <div className={`${rating.bg} ${rating.border} border rounded-lg p-4 mb-3`}>
          <div className="text-center">
            <span className="text-zinc-400 text-sm">Risk to Reward Ratio</span>
            <p className={`text-4xl font-mono font-bold mt-1 ${rating.color}`}>
              {result.ratioDisplay}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              Risk 1 to gain {rrValue.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Risk</span>
            <p className="font-mono font-semibold text-red-400">{result.riskPips} pips</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Reward</span>
            <p className="font-mono font-semibold text-green-400">{result.rewardPips} pips</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Direction</span>
            <p className={`font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}>
              {isBuy ? "Buy" : "Sell"}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Min Win Rate</span>
            <p className="font-mono font-semibold text-amber-400">{winRateRequired.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* R:R Visual Gauge */}
      <div className={`border rounded-lg p-4 ${rating.bg} ${rating.border}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${rating.color.replace("text-", "bg-")} animate-pulse`} />
          <span className={`text-sm font-medium ${rating.color}`}>
            R:R Quality: {rating.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden flex">
              {/* Risk portion (red) */}
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${(1 / (1 + rrValue)) * 100}%` }}
              />
              {/* Reward portion (green) */}
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(rrValue / (1 + rrValue)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-zinc-500">
              <span>Risk: {result.riskPips} pips</span>
              <span>Reward: {result.rewardPips} pips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Break-Even Win Rate */}
      <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-amber-400">Break-Even Analysis</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          With a <strong className="text-zinc-300">{result.ratioDisplay}</strong> R:R ratio, you need to win at least{" "}
          <strong className="text-amber-300">{winRateRequired.toFixed(1)}%</strong> of your trades to be profitable.
          {winRateRequired <= 40 && " This is a favorable setup!"}
        </p>
      </div>

      {/* Price Levels */}
      <ResultDisplay title="Price Levels">
        <div className="space-y-2">
          <ResultRow
            label="Entry Price"
            value={form.entryPrice}
            description="Position entry point"
          />
          <ResultRow
            label="Stop Loss"
            value={form.stopLossPrice}
            description={`${result.riskPips} pips from entry`}
            colorClass="text-red-400 border-red-800/50 bg-red-950/20"
          />
          <ResultRow
            label="Take Profit"
            value={form.takeProfitPrice}
            description={`${result.rewardPips} pips from entry`}
            colorClass="text-green-400 border-green-800/50 bg-green-950/20"
          />
        </div>
      </ResultDisplay>

      {/* Monetary Analysis */}
      {result.riskAmount && result.rewardAmount && (
        <ResultDisplay title="Monetary Analysis">
          <div className="space-y-2">
            <ResultRow
              label="Position Size"
              value={form.lotSize}
              suffix="lots"
              description={`${(parseFloat(form.lotSize) * 100000).toLocaleString()} units`}
            />
            <ResultRow
              label="Risk Amount"
              value={result.riskAmount}
              suffix={form.accountCurrency}
              description="Maximum potential loss"
              colorClass="text-red-400 border-red-800/50 bg-red-950/20"
            />
            <ResultRow
              label="Reward Amount"
              value={result.rewardAmount}
              suffix={form.accountCurrency}
              description="Maximum potential profit"
              colorClass="text-green-400 border-green-800/50 bg-green-950/20"
            />
          </div>
        </ResultDisplay>
      )}

      {/* R:R Scenarios */}
      <ResultDisplay title="R:R Scenarios">
        <p className="text-xs text-zinc-500 mb-3">
          See take profit levels for different risk/reward ratios based on your stop loss
        </p>
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <RRScenarioRow
              key={scenario.ratio}
              scenario={scenario}
              accountCurrency={form.accountCurrency}
              currencyPair={form.currencyPair}
              isSelected={Math.abs(scenario.ratio - rrValue) < 0.1}
            />
          ))}
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">R:R Guidelines</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">1:3+</strong> - Excellent (33% win rate needed)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span><strong className="text-zinc-300">1:2</strong> - Very Good (33% win rate needed)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span><strong className="text-zinc-300">1:1.5</strong> - Good (40% win rate needed)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">1:1</strong> - Minimum (50% win rate needed)</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Best Practices</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Aim for minimum 1:1.5 R:R</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Set SL at technical levels</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Never move SL further away</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Consider partial take profits</span>
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

const FormRow = memo(function FormRow({ 
  children,
  columns = 2,
}: { 
  children: React.ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid grid-cols-1 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
      {children}
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function RiskRewardCalculator() {
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

  // Debounce form values for performance
  const { calculationInput: debouncedForm, triggerCalculate, hasPendingChanges } = useSmartCalculation(form, 150);

  // Calculate results
  const result = useMemo<RiskRewardResult | null>(() => {
    if (!debouncedForm) return null;
    const entry = parseFloat(debouncedForm.entryPrice);
    const sl = parseFloat(debouncedForm.stopLossPrice);
    const tp = parseFloat(debouncedForm.takeProfitPrice);
    const lot = parseFloat(debouncedForm.lotSize);
    const rate = parseFloat(debouncedForm.exchangeRate);

    if (isNaN(entry) || entry <= 0) return null;
    if (isNaN(sl) || sl <= 0) return null;
    if (isNaN(tp) || tp <= 0) return null;
    if (isNaN(lot) || lot <= 0) return null;
    if (isNaN(rate) || rate <= 0) return null;

    return calculateRiskReward({
      entryPrice: debouncedForm.entryPrice,
      stopLossPrice: debouncedForm.stopLossPrice,
      takeProfitPrice: debouncedForm.takeProfitPrice,
      direction: debouncedForm.direction,
      currencyPair: debouncedForm.currencyPair,
      lotSize: debouncedForm.lotSize,
      accountCurrency: debouncedForm.accountCurrency,
      exchangeRate: debouncedForm.exchangeRate,
    });
  }, [debouncedForm]);

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Form field handlers
  const handleFieldChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Swap SL and TP
  const handleSwapLevels = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      stopLossPrice: prev.takeProfitPrice,
      takeProfitPrice: prev.stopLossPrice,
      direction: prev.direction === "buy" ? "sell" : "buy",
    }));
  }, []);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (!result || !result.isValid) return;

    const lines = [
      `Risk/Reward Analysis - ${form.currencyPair}`,
      ``,
      `R:R Ratio: ${result.ratioDisplay}`,
      `Risk: ${result.riskPips} pips`,
      `Reward: ${result.rewardPips} pips`,
      ``,
      `Trade Setup:`,
      `  Direction: ${form.direction === "buy" ? "Buy (Long)" : "Sell (Short)"}`,
      `  Entry: ${form.entryPrice}`,
      `  Stop Loss: ${form.stopLossPrice}`,
      `  Take Profit: ${form.takeProfitPrice}`,
      `  Lot Size: ${form.lotSize} lots`,
    ];

    if (result.riskAmount && result.rewardAmount) {
      lines.push(``);
      lines.push(`Monetary:`,);
      lines.push(`  Risk: ${result.riskAmount} ${form.accountCurrency}`);
      lines.push(`  Reward: ${result.rewardAmount} ${form.accountCurrency}`);
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("R:R analysis copied to clipboard!");
    }).catch(() => {
      setErrors((prev) => [...prev, {
        id: generateId(),
        field: "Copy Failed",
        message: "Could not copy to clipboard",
        timestamp: Date.now(),
      }]);
    });
  }, [result, form]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Risk/Reward Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Analyze the risk-to-reward ratio of your trade setup before entering a position.
              Calculate the minimum win rate needed for profitability.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Trade Setup">
                  <FormRow>
                    <Select
                      label="Currency Pair"
                      options={PAIR_OPTIONS}
                      value={form.currencyPair}
                      onChange={handleFieldChange("currencyPair")}
                    />
                    <Select
                      label="Direction"
                      options={DIRECTION_OPTIONS}
                      value={form.direction}
                      onChange={handleFieldChange("direction")}
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Price Levels">
                  <FormRow columns={3}>
                    <Input
                      label="Entry Price"
                      type="number"
                      value={form.entryPrice}
                      onChange={handleFieldChange("entryPrice")}
                      placeholder="1.0850"
                      min="0"
                      step="0.00001"
                    />
                    <Input
                      label="Stop Loss"
                      type="number"
                      value={form.stopLossPrice}
                      onChange={handleFieldChange("stopLossPrice")}
                      placeholder="1.0800"
                      min="0"
                      step="0.00001"
                    />
                    <Input
                      label="Take Profit"
                      type="number"
                      value={form.takeProfitPrice}
                      onChange={handleFieldChange("takeProfitPrice")}
                      placeholder="1.0950"
                      min="0"
                      step="0.00001"
                    />
                  </FormRow>
                  <Button variant="secondary" size="small" onClick={handleSwapLevels}>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                      Swap SL/TP (Reverse Trade)
                    </span>
                  </Button>
                </FormSection>

                <FormSection title="Position Size (Optional)">
                  <FormRow>
                    <Input
                      label="Lot Size"
                      type="number"
                      value={form.lotSize}
                      onChange={handleFieldChange("lotSize")}
                      placeholder="1"
                      min="0.01"
                      step="0.01"
                      suffix="lots"
                      helper="For monetary calculation"
                    />
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={form.accountCurrency}
                      onChange={handleFieldChange("accountCurrency")}
                    />
                  </FormRow>
                  <Input
                    label="Exchange Rate"
                    type="number"
                    value={form.exchangeRate}
                    onChange={handleFieldChange("exchangeRate")}
                    placeholder="1.0850"
                    min="0"
                    step="0.00001"
                    helper="Current market price"
                  />
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
                    <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Aim for at least <strong className="text-zinc-400">1:1.5 R:R</strong> minimum</li>
                    <li>- <strong className="text-zinc-400">1:2 or better</strong> allows 50% losses and still profit</li>
                    <li>- Place SL at <strong className="text-zinc-400">technical levels</strong>, not arbitrary pips</li>
                    <li>- Check <strong className="text-zinc-400">R:R Scenarios</strong> for optimal TP placement</li>
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

      {/* Error Toasts */}
      <ErrorToast errors={errors} onDismiss={dismissError} />

      {/* Success Toast */}
      <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
    </>
  );
}