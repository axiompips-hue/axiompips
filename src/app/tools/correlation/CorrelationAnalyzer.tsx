// File: src/app/tools/correlation/CorrelationAnalyzer.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useSmartCalculation } from "@/lib/hooks";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, DIRECTION_OPTIONS } from "@/lib/constants/options";
import {
  analyzeCorrelation,
  ExposureTrade,
  CorrelationAnalysisResult,
  TradeDirection,
} from "@/lib/engine";

// ============================================================================
// Types
// ============================================================================

interface TradeFormState {
  currencyPair: string;
  direction: TradeDirection;
  lotSize: string;
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

interface CurrencyExposure {
  currency: string;
  longLots: string;
  shortLots: string;
  netLots: string;
  netDirection: "long" | "short" | "neutral";
  exposureLevel: "low" | "medium" | "high";
}

interface PairCorrelation {
  pair1: string;
  pair2: string;
  correlation: number;
  correlationLevel: string;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_TRADE: TradeFormState = {
  currencyPair: "EURUSD",
  direction: "buy",
  lotSize: "1",
};

const ERROR_DISPLAY_DURATION = 3000;

const COMMON_PORTFOLIOS = [
  {
    label: "USD Hedge",
    trades: [
      { currencyPair: "EURUSD", direction: "buy" as TradeDirection, lotSize: "1" },
      { currencyPair: "GBPUSD", direction: "buy" as TradeDirection, lotSize: "1" },
    ],
  },
  {
    label: "JPY Basket",
    trades: [
      { currencyPair: "USDJPY", direction: "buy" as TradeDirection, lotSize: "0.5" },
      { currencyPair: "EURJPY", direction: "buy" as TradeDirection, lotSize: "0.5" },
      { currencyPair: "GBPJPY", direction: "buy" as TradeDirection, lotSize: "0.5" },
    ],
  },
  {
    label: "Diversified",
    trades: [
      { currencyPair: "EURUSD", direction: "buy" as TradeDirection, lotSize: "1" },
      { currencyPair: "USDJPY", direction: "sell" as TradeDirection, lotSize: "0.5" },
      { currencyPair: "AUDUSD", direction: "buy" as TradeDirection, lotSize: "0.5" },
    ],
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

function getExposureLevelColor(level: string): { bg: string; border: string; text: string } {
  switch (level) {
    case "high":
      return { bg: "bg-red-950/30", border: "border-red-800/50", text: "text-red-400" };
    case "medium":
      return { bg: "bg-yellow-950/20", border: "border-yellow-800/30", text: "text-yellow-400" };
    default:
      return { bg: "bg-zinc-900/50", border: "border-zinc-800", text: "text-zinc-400" };
  }
}

function getCorrelationColor(level: string, value: number): string {
  if (level === "strong_positive") return "text-green-400";
  if (level === "strong_negative") return "text-red-400";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-orange-400";
  return "text-zinc-400";
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
// Trade Position Row Component
// ============================================================================

const TradePositionRow = memo(function TradePositionRow({
  trade,
  onRemove,
}: {
  trade: ExposureTrade & TradeFormState;
  onRemove: (id: string) => void;
}) {
  const isBuy = trade.direction === "buy";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
        isBuy ? "bg-green-950/20 border-green-800/50" : "bg-red-950/20 border-red-800/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            isBuy ? "bg-green-950/50 text-green-400" : "bg-red-950/50 text-red-400"
          }`}
        >
          {isBuy ? "BUY" : "SELL"}
        </span>
        <span className="text-sm font-medium text-zinc-100">{trade.currencyPair}</span>
        <span className="text-xs text-zinc-500">{trade.lotSize} lots</span>
      </div>
      <button
        onClick={() => onRemove(trade.id)}
        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
        aria-label="Remove trade"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

// ============================================================================
// Currency Exposure Row Component
// ============================================================================

const CurrencyExposureRow = memo(function CurrencyExposureRow({
  exposure,
}: {
  exposure: CurrencyExposure;
}) {
  const colors = getExposureLevelColor(exposure.exposureLevel);
  const hasLong = parseFloat(exposure.longLots) > 0;
  const hasShort = parseFloat(exposure.shortLots) > 0;

  return (
    <div
      className={`grid grid-cols-5 gap-2 items-center p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${colors.bg} ${colors.border}`}
    >
      <span className="font-bold text-zinc-100">{exposure.currency}</span>
      <span className="text-center text-green-400 font-mono text-sm">
        {hasLong ? `+${exposure.longLots}` : "-"}
      </span>
      <span className="text-center text-red-400 font-mono text-sm">
        {hasShort ? `-${exposure.shortLots}` : "-"}
      </span>
      <span
        className={`text-center font-mono text-sm font-bold ${
          exposure.netDirection === "long"
            ? "text-green-400"
            : exposure.netDirection === "short"
            ? "text-red-400"
            : "text-zinc-500"
        }`}
      >
        {exposure.netDirection === "long" ? "+" : exposure.netDirection === "short" ? "-" : ""}
        {exposure.netLots}
      </span>
      <span className={`text-center text-xs font-medium uppercase ${colors.text}`}>
        {exposure.exposureLevel}
      </span>
    </div>
  );
});

// ============================================================================
// Correlation Row Component
// ============================================================================

const CorrelationRow = memo(function CorrelationRow({
  correlation,
}: {
  correlation: PairCorrelation;
}) {
  const color = getCorrelationColor(correlation.correlationLevel, correlation.correlation);
  const absValue = Math.abs(correlation.correlation);
  const isPositive = correlation.correlation >= 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-100">{correlation.pair1}</span>
        <span className="text-zinc-600">/</span>
        <span className="text-sm font-medium text-zinc-100">{correlation.pair2}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 rounded-full overflow-hidden bg-zinc-700 relative">
          <div
            className={`h-full rounded-full ${isPositive ? "bg-green-500" : "bg-red-500"}`}
            style={{
              width: `${absValue * 100}%`,
              marginLeft: isPositive ? 0 : "auto",
            }}
          />
        </div>
        <span className={`font-mono text-sm font-bold w-16 text-right ${color}`}>
          {isPositive ? "+" : ""}{correlation.correlation.toFixed(2)}
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
  trades,
  onCopy,
}: {
  result: CorrelationAnalysisResult | null;
  trades: (ExposureTrade & TradeFormState)[];
  onCopy: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="Correlation Analysis">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">No positions added</p>
          <p className="text-zinc-600 text-xs mt-1">
            Add your open or planned positions to analyze currency exposure
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const hasWarnings = result.warnings.length > 0;
  const hasCorrelations = result.pairCorrelations.length > 0;

  return (
    <>
      {/* Warnings */}
      {hasWarnings && (
        <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <h3 className="text-lg font-semibold text-yellow-400">Risk Warnings</h3>
          </div>
          <ul className="space-y-2">
            {result.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-yellow-200">
                <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-indigo-400">Exposure Summary</h3>
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

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 text-center">
            <span className="text-zinc-400 text-sm block">Total Long</span>
            <p className="text-2xl font-mono font-bold text-green-400 mt-1">
              {result.totalLongExposure}
              <span className="text-sm ml-1 text-green-300">lots</span>
            </p>
          </div>
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-center">
            <span className="text-zinc-400 text-sm block">Total Short</span>
            <p className="text-2xl font-mono font-bold text-red-400 mt-1">
              {result.totalShortExposure}
              <span className="text-sm ml-1 text-red-300">lots</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Positions</span>
            <p className="font-mono font-semibold text-zinc-200">{trades.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Currencies</span>
            <p className="font-mono font-semibold text-zinc-200">{result.currencyExposures.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Correlations</span>
            <p className="font-mono font-semibold text-zinc-200">{result.pairCorrelations.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Warnings</span>
            <p className={`font-mono font-semibold ${hasWarnings ? "text-yellow-400" : "text-green-400"}`}>
              {result.warnings.length}
            </p>
          </div>
        </div>
      </div>

      {/* Currency Exposure */}
      <ResultDisplay title="Currency Exposure">
        <p className="text-xs text-zinc-500 mb-3">
          Net exposure to each currency across all positions
        </p>
        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-zinc-500 uppercase mb-2 px-3">
          <span>Currency</span>
          <span className="text-center">Long</span>
          <span className="text-center">Short</span>
          <span className="text-center">Net</span>
          <span className="text-center">Level</span>
        </div>
        <div className="space-y-2">
          {result.currencyExposures.map((exposure) => (
            <CurrencyExposureRow key={exposure.currency} exposure={exposure} />
          ))}
        </div>
      </ResultDisplay>

      {/* Pair Correlations */}
      {hasCorrelations && (
        <ResultDisplay title="Pair Correlations">
          <p className="text-xs text-zinc-500 mb-3">
            Correlation between pairs in your portfolio (-1 to +1)
          </p>
          <div className="space-y-2">
            {result.pairCorrelations.map((corr, index) => (
              <CorrelationRow key={`${corr.pair1}-${corr.pair2}-${index}`} correlation={corr} />
            ))}
          </div>
        </ResultDisplay>
      )}

      {/* Correlation Legend */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
        <h4 className="text-sm font-medium text-zinc-300 mb-2">Correlation Scale</h4>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-zinc-400">-1.0 (Inverse)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-500" />
            <span className="text-zinc-400">0.0 (None)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-zinc-400">+1.0 (Same)</span>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Currency Exposure</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">Buy EUR/USD</strong> = Long EUR, Short USD</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">Sell EUR/USD</strong> = Short EUR, Long USD</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span><strong className="text-zinc-300">High exposure</strong> = Concentrated risk</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Correlation Impact</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">+0.8 to +1.0</strong> = Move together</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">-0.8 to -1.0</strong> = Move opposite</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                <span><strong className="text-zinc-300">-0.3 to +0.3</strong> = Independent</span>
              </li>
            </ul>
          </div>
        </div>
      </ResultDisplay>

      {/* Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-amber-400">Note</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Correlation values are historical estimates and may change based on market conditions.
          Always monitor your actual exposure and adjust positions accordingly.
        </p>
      </div>
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
// Preset Button Component
// ============================================================================

const PresetButton = memo(function PresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-indigo-600 hover:text-indigo-400"
    >
      {label}
    </button>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function CorrelationAnalyzer() {
  const [trades, setTrades] = useState<(ExposureTrade & TradeFormState)[]>([]);
  const [newTrade, setNewTrade] = useState<TradeFormState>(DEFAULT_TRADE);
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

  // Smart calculation mode
  const { calculationInput: committedTrades, triggerCalculate, hasPendingChanges } = useSmartCalculation(trades, 150);

  // Calculate results
  const result = useMemo<CorrelationAnalysisResult | null>(() => {
    if (!committedTrades || committedTrades.length === 0) return null;
    return analyzeCorrelation(committedTrades);
  }, [committedTrades]);

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

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

  // Form field handlers
  const handleFieldChange = useCallback(
    (field: keyof TradeFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewTrade((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Add trade
  const handleAddTrade = useCallback(() => {
    const lotSize = parseFloat(newTrade.lotSize);

    if (isNaN(lotSize) || lotSize <= 0) {
      addError("Lot Size", "Please enter a valid lot size");
      return;
    }

    if (trades.length >= 20) {
      addError("Limit Reached", "Maximum 20 positions allowed");
      return;
    }

    const trade: ExposureTrade & TradeFormState = {
      ...newTrade,
      id: generateId(),
    };
    setTrades((prev) => [...prev, trade]);
    setNewTrade(DEFAULT_TRADE);
    setSuccessMessage(`Added ${newTrade.direction.toUpperCase()} ${newTrade.currencyPair}`);
  }, [newTrade, trades.length, addError]);

  // Remove trade
  const handleRemoveTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Clear all trades
  const handleClearAll = useCallback(() => {
    setTrades([]);
    setNewTrade(DEFAULT_TRADE);
  }, []);

  // Apply preset portfolio
  const handleApplyPreset = useCallback((preset: typeof COMMON_PORTFOLIOS[0]) => {
    const newTrades = preset.trades.map((t) => ({
      ...t,
      id: generateId(),
    }));
    setTrades(newTrades);
    setSuccessMessage(`Loaded ${preset.label} portfolio`);
  }, []);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (!result) return;

    const lines = [
      `Correlation Analysis`,
      ``,
      `Positions (${trades.length}):`,
      ...trades.map((t) => `  ${t.direction.toUpperCase()} ${t.currencyPair} ${t.lotSize} lots`),
      ``,
      `Exposure Summary:`,
      `  Total Long: ${result.totalLongExposure} lots`,
      `  Total Short: ${result.totalShortExposure} lots`,
      ``,
      `Currency Exposure:`,
      ...result.currencyExposures.map(
        (e) => `  ${e.currency}: ${e.netDirection === "long" ? "+" : e.netDirection === "short" ? "-" : ""}${e.netLots} (${e.exposureLevel})`
      ),
    ];

    if (result.pairCorrelations.length > 0) {
      lines.push(``);
      lines.push(`Pair Correlations:`);
      result.pairCorrelations.forEach((c) => {
        lines.push(`  ${c.pair1}/${c.pair2}: ${c.correlation > 0 ? "+" : ""}${c.correlation.toFixed(2)}`);
      });
    }

    if (result.warnings.length > 0) {
      lines.push(``);
      lines.push(`Warnings:`);
      result.warnings.forEach((w) => lines.push(`  - ${w}`));
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Analysis copied to clipboard!");
    }).catch(() => {
      addError("Copy Failed", "Could not copy to clipboard");
    });
  }, [result, trades, addError]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Correlation Analyzer</h1>
            <p className="mt-2 text-zinc-400">
              Analyze currency exposure and detect correlated positions in your portfolio.
              Avoid over-concentration in correlated pairs.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Add Position">
                  <Select
                    label="Currency Pair"
                    options={PAIR_OPTIONS}
                    value={newTrade.currencyPair}
                    onChange={handleFieldChange("currencyPair")}
                  />
                  <FormRow>
                    <Select
                      label="Direction"
                      options={DIRECTION_OPTIONS}
                      value={newTrade.direction}
                      onChange={handleFieldChange("direction")}
                    />
                    <Input
                      label="Lot Size"
                      type="number"
                      value={newTrade.lotSize}
                      onChange={handleFieldChange("lotSize")}
                      min="0.01"
                      step="0.01"
                      suffix="lots"
                    />
                  </FormRow>
                  <Button fullWidth onClick={handleAddTrade}>
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Position
                    </span>
                  </Button>
                </FormSection>

                <FormSection title="Quick Portfolios">
                  <div className="flex flex-wrap gap-2">
                    {COMMON_PORTFOLIOS.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        label={preset.label}
                        onClick={() => handleApplyPreset(preset)}
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection title={`Active Positions (${trades.length}/20)`}>
                  {trades.length === 0 ? (
                    <p className="text-zinc-500 text-sm py-4 text-center">
                      No positions added yet
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                        {trades.map((trade) => (
                          <TradePositionRow
                            key={trade.id}
                            trade={trade}
                            onRemove={handleRemoveTrade}
                          />
                        ))}
                      </div>
                      <Button variant="secondary" size="small" onClick={handleClearAll}>
                        Clear All
                      </Button>
                      {triggerCalculate && (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={triggerCalculate}
                          className={hasPendingChanges ? "ring-2 ring-accent-400/50" : ""}
                        >
                          Analyze
                        </Button>
                      )}
                    </>
                  )}
                </FormSection>

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
                    <li>- <strong className="text-zinc-400">EUR/USD and GBP/USD</strong> are highly correlated</li>
                    <li>- <strong className="text-zinc-400">Same direction</strong> on correlated pairs = more risk</li>
                    <li>- <strong className="text-zinc-400">Opposite directions</strong> can hedge exposure</li>
                    <li>- Watch for <strong className="text-zinc-400">high currency concentration</strong></li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection result={result} trades={trades} onCopy={handleCopy} />
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