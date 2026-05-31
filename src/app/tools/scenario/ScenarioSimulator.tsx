// File: src/app/tools/scenario/ScenarioSimulator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS, DIRECTION_OPTIONS } from "@/lib/constants/options";
import {
  calculateRiskReward,
  calculateProfitLoss,
  calculatePositionSize,
  RiskRewardResult,
  ProfitLossResult,
  PositionSizeResult,
  TradeDirection,
} from "@/lib/engine";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface ScenarioState {
  currencyPair: string;
  direction: TradeDirection;
  accountBalance: string;
  accountCurrency: string;
  riskPercent: string;
  entryPrice: string;
  exchangeRate: string;
  stopLossPips: number;
  takeProfitPips: number;
  lotSize: number;
}

interface ScenarioResults {
  rr: RiskRewardResult;
  win: ProfitLossResult;
  loss: ProfitLossResult;
  position: PositionSizeResult;
  slPrice: string;
  tpPrice: string;
  actualRiskPercent: string;
  riskAmount: string;
  rewardAmount: string;
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

const DEFAULT_STATE: ScenarioState = {
  currencyPair: "EURUSD",
  direction: "buy",
  accountBalance: "10000",
  accountCurrency: "USD",
  riskPercent: "1",
  entryPrice: "1.0850",
  exchangeRate: "1.0850",
  stopLossPips: 30,
  takeProfitPips: 60,
  lotSize: 0.5,
};

const ERROR_DISPLAY_DURATION = 3000;

const SCENARIO_PRESETS = [
  { label: "Scalp", sl: 10, tp: 15, lot: 0.5 },
  { label: "Day Trade", sl: 30, tp: 60, lot: 0.3 },
  { label: "Swing", sl: 50, tp: 150, lot: 0.1 },
  { label: "Position", sl: 100, tp: 300, lot: 0.05 },
];

const RR_THRESHOLDS = {
  excellent: 2.5,
  veryGood: 2,
  good: 1.5,
  acceptable: 1,
};

// ============================================================================
// Utility Functions
// ============================================================================

function getRRStatus(ratio: number): { label: string; color: string; bg: string; border: string } {
  if (ratio >= RR_THRESHOLDS.excellent) {
    return { label: "Excellent", color: "text-green-400", bg: "bg-green-950/30", border: "border-green-800/50" };
  } else if (ratio >= RR_THRESHOLDS.veryGood) {
    return { label: "Very Good", color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-800/50" };
  } else if (ratio >= RR_THRESHOLDS.good) {
    return { label: "Good", color: "text-teal-400", bg: "bg-teal-950/30", border: "border-teal-800/50" };
  } else if (ratio >= RR_THRESHOLDS.acceptable) {
    return { label: "Acceptable", color: "text-yellow-400", bg: "bg-yellow-950/30", border: "border-yellow-800/50" };
  } else {
    return { label: "Poor", color: "text-red-400", bg: "bg-red-950/30", border: "border-red-800/50" };
  }
}

function getPipSize(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  return jpyPairs.includes(pair) ? 0.01 : 0.0001;
}

function getDecimalPlaces(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  return jpyPairs.includes(pair) ? 3 : 5;
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
  isPositive,
  isNegative,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  description?: string;
  isPositive?: boolean;
  isNegative?: boolean;
}) {
  const getColorClass = () => {
    if (isPositive) return "text-green-400 border-green-800/50 bg-green-950/20";
    if (isNegative) return "text-red-400 border-red-800/50 bg-red-950/20";
    if (highlight) return "text-cyan-400 border-cyan-800/50 bg-cyan-950/20";
    return "text-zinc-400 border-zinc-800 bg-zinc-900/50";
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getColorClass()}`}
    >
      <div className="flex flex-col">
        <span className="font-medium text-sm text-zinc-300">{label}</span>
        {description && (
          <span className="text-xs text-zinc-500 mt-0.5">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold ${
          isPositive ? "text-green-400" : 
          isNegative ? "text-red-400" : 
          highlight ? "text-cyan-400" : "text-zinc-200"
        }`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// Outcome Card Component
// ============================================================================

const OutcomeCard = memo(function OutcomeCard({
  title,
  profit,
  pips,
  currency,
  isWin,
}: {
  title: string;
  profit: string;
  pips: string;
  currency: string;
  isWin: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 border transition-all duration-200 hover:scale-[1.02] ${
        isWin ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50"
      }`}
    >
      <p className="text-sm text-zinc-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold font-mono ${isWin ? "text-green-400" : "text-red-400"}`}>
        {isWin ? "+" : ""}{profit} {currency}
      </p>
      <p className="text-xs text-zinc-500 mt-1">
        {isWin ? "+" : ""}{pips} pips
      </p>
    </div>
  );
});

// ============================================================================
// Result Section Component
// ============================================================================

const ResultSection = memo(function ResultSection({
  results,
  scenario,
  onCopy,
}: {
  results: ScenarioResults | null;
  scenario: ScenarioState;
  onCopy: () => void;
}) {
  if (!results) {
    return (
      <ResultDisplay title="Scenario Analysis">
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">
            Enter valid trade parameters to see scenario analysis
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Adjust sliders to explore different scenarios
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const rrValue = parseFloat(results.rr.riskRewardRatio);
  const rrStatus = getRRStatus(rrValue);
  const isBuy = scenario.direction === "buy";
  const actualRiskNum = parseFloat(results.actualRiskPercent);
  const targetRiskNum = parseFloat(scenario.riskPercent);
  const isOverRisk = actualRiskNum > targetRiskNum;

  return (
    <>
      {/* R:R Summary Card */}
      <div className={`bg-gradient-to-br ${
        rrValue >= 2
          ? "from-green-950/30 to-emerald-950/20 border-green-800/30"
          : rrValue >= 1.5
          ? "from-teal-950/30 to-cyan-950/20 border-teal-800/30"
          : "from-yellow-950/30 to-amber-950/20 border-yellow-800/30"
      } border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${rrStatus.color}`}>
            Scenario Analysis
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

        {/* R:R Display */}
        <div className={`${rrStatus.bg} ${rrStatus.border} border rounded-lg p-4 mb-3 text-center`}>
          <span className="text-zinc-400 text-sm block">Risk to Reward Ratio</span>
          <p className={`text-5xl font-mono font-bold mt-2 ${rrStatus.color}`}>
            {results.rr.ratioDisplay}
          </p>
          <p className="text-sm text-zinc-500 mt-2">{rrStatus.label} Risk/Reward</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Direction</span>
            <p className={`font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}>
              {isBuy ? "Buy (Long)" : "Sell (Short)"}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Lot Size</span>
            <p className="font-mono font-semibold text-zinc-200">{scenario.lotSize.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Stop Loss</span>
            <p className="font-mono font-semibold text-red-400">{scenario.stopLossPips} pips</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Take Profit</span>
            <p className="font-mono font-semibold text-green-400">{scenario.takeProfitPips} pips</p>
          </div>
        </div>
      </div>

      {/* Outcome Scenarios */}
      <div className="grid grid-cols-2 gap-4">
        <OutcomeCard
          title="If Take Profit Hit"
          profit={results.win.profitLoss}
          pips={results.win.pips}
          currency={scenario.accountCurrency}
          isWin={true}
        />
        <OutcomeCard
          title="If Stop Loss Hit"
          profit={results.loss.profitLoss}
          pips={results.loss.pips}
          currency={scenario.accountCurrency}
          isWin={false}
        />
      </div>

      {/* Risk Status */}
      <div className={`border rounded-lg p-4 ${
        isOverRisk ? "bg-red-950/20 border-red-800/30" : "bg-green-950/20 border-green-800/30"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isOverRisk ? "bg-red-400" : "bg-green-400"
          }`} />
          <span className={`text-sm font-medium ${isOverRisk ? "text-red-400" : "text-green-400"}`}>
            {isOverRisk ? "Over Target Risk" : "Within Target Risk"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-zinc-400">
            Actual Risk: <span className={`font-mono font-bold ${isOverRisk ? "text-red-400" : "text-green-400"}`}>
              {results.actualRiskPercent}%
            </span>
            <span className="mx-2">|</span>
            Target: <span className="font-mono text-zinc-300">{scenario.riskPercent}%</span>
          </p>
          <span className={`font-mono font-bold ${isOverRisk ? "text-red-400" : "text-green-400"}`}>
            {results.riskAmount} {scenario.accountCurrency}
          </span>
        </div>
      </div>

      {/* Price Levels */}
      <ResultDisplay title="Price Levels">
        <div className="space-y-2">
          <ResultRow
            label="Entry Price"
            value={scenario.entryPrice}
            description="Trade entry point"
          />
          <ResultRow
            label="Stop Loss Price"
            value={results.slPrice}
            description={`${scenario.stopLossPips} pips from entry`}
            isNegative
          />
          <ResultRow
            label="Take Profit Price"
            value={results.tpPrice}
            description={`${scenario.takeProfitPips} pips from entry`}
            isPositive
          />
        </div>
      </ResultDisplay>

      {/* Risk Analysis */}
      <ResultDisplay title="Risk Analysis">
        <div className="space-y-2">
          <ResultRow
            label="Position Size"
            value={scenario.lotSize.toFixed(2)}
            suffix="lots"
            description={`${(scenario.lotSize * 100000).toLocaleString()} units`}
          />
          <ResultRow
            label="Risk Amount"
            value={results.riskAmount}
            suffix={scenario.accountCurrency}
            highlight
            description="Maximum loss if SL hit"
          />
          <ResultRow
            label="Reward Amount"
            value={results.rewardAmount}
            suffix={scenario.accountCurrency}
            isPositive
            description="Maximum profit if TP hit"
          />
          <ResultRow
            label="Actual Risk"
            value={results.actualRiskPercent}
            suffix="% of account"
            isNegative={isOverRisk}
            isPositive={!isOverRisk}
            description={isOverRisk ? "Exceeds target" : "Within target"}
          />
        </div>
      </ResultDisplay>

      {/* Recommended Position */}
      <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-cyan-400">Recommended Position Size</span>
        </div>
        <p className="text-xs text-zinc-400">
          Based on your <strong className="text-zinc-300">{scenario.riskPercent}%</strong> risk target and{" "}
          <strong className="text-zinc-300">{scenario.stopLossPips} pip</strong> stop loss:
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-mono font-bold text-cyan-400">
            {results.position.lots}
          </span>
          <span className="text-sm text-zinc-500">lots</span>
          <span className="text-xs text-zinc-600">({results.position.units} units)</span>
        </div>
      </div>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">R:R Guidelines</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">2.5+</strong> - Excellent setup</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span><strong className="text-zinc-300">2.0</strong> - Very good setup</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span><strong className="text-zinc-300">1.5</strong> - Minimum recommended</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">1.0 or less</strong> - Avoid</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Scenario Tips</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Increase TP for better R:R</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Tighter SL = larger position</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Match lot size to risk target</span>
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
// Preset Button Component
// ============================================================================

const PresetButton = memo(function PresetButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        isActive
          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-800"
          : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-cyan-600 hover:text-cyan-400"
      }`}
    >
      {label}
    </button>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function ScenarioSimulator() {
  const [scenario, setScenario] = useState<ScenarioState>(DEFAULT_STATE);
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

  // Debounce scenario for performance
  const { calculationInput: debouncedScenario, triggerCalculate, hasPendingChanges } = useSmartCalculation(scenario, 100);

  // Calculate all results based on current scenario
  const results = useMemo<ScenarioResults | null>(() => {
    if (!debouncedScenario) return null;
    const entry = parseFloat(debouncedScenario.entryPrice);
    if (isNaN(entry) || entry <= 0) return null;

    const pipSize = getPipSize(debouncedScenario.currencyPair);
    const decimals = getDecimalPlaces(debouncedScenario.currencyPair);

    // Calculate SL and TP prices
    let slPrice: number;
    let tpPrice: number;

    if (debouncedScenario.direction === "buy") {
      slPrice = entry - debouncedScenario.stopLossPips * pipSize;
      tpPrice = entry + debouncedScenario.takeProfitPips * pipSize;
    } else {
      slPrice = entry + debouncedScenario.stopLossPips * pipSize;
      tpPrice = entry - debouncedScenario.takeProfitPips * pipSize;
    }

    // Risk/Reward calculation
    const rrResult = calculateRiskReward({
      entryPrice: debouncedScenario.entryPrice,
      stopLossPrice: slPrice.toString(),
      takeProfitPrice: tpPrice.toString(),
      direction: debouncedScenario.direction,
      currencyPair: debouncedScenario.currencyPair,
      lotSize: debouncedScenario.lotSize.toString(),
      accountCurrency: debouncedScenario.accountCurrency,
      exchangeRate: debouncedScenario.exchangeRate,
    });

    // P/L at TP (win scenario)
    const winResult = calculateProfitLoss({
      entryPrice: debouncedScenario.entryPrice,
      exitPrice: tpPrice.toString(),
      direction: debouncedScenario.direction,
      currencyPair: debouncedScenario.currencyPair,
      lotSize: debouncedScenario.lotSize.toString(),
      accountCurrency: debouncedScenario.accountCurrency,
      exchangeRate: debouncedScenario.exchangeRate,
    });

    // P/L at SL (loss scenario)
    const lossResult = calculateProfitLoss({
      entryPrice: debouncedScenario.entryPrice,
      exitPrice: slPrice.toString(),
      direction: debouncedScenario.direction,
      currencyPair: debouncedScenario.currencyPair,
      lotSize: debouncedScenario.lotSize.toString(),
      accountCurrency: debouncedScenario.accountCurrency,
      exchangeRate: debouncedScenario.exchangeRate,
    });

    // Recommended position size based on risk
    const positionResult = calculatePositionSize({
      accountBalance: debouncedScenario.accountBalance,
      riskPercent: debouncedScenario.riskPercent,
      stopLossPips: debouncedScenario.stopLossPips.toString(),
      currencyPair: debouncedScenario.currencyPair,
      accountCurrency: debouncedScenario.accountCurrency,
      exchangeRate: debouncedScenario.exchangeRate,
    });

    // Calculate actual risk percent with current lot size
    const riskAmount = Math.abs(parseFloat(lossResult.profitLoss));
    const rewardAmount = Math.abs(parseFloat(winResult.profitLoss));
    const balance = parseFloat(debouncedScenario.accountBalance);
    const actualRiskPercent = balance > 0 ? (riskAmount / balance) * 100 : 0;

    return {
      rr: rrResult,
      win: winResult,
      loss: lossResult,
      position: positionResult,
      slPrice: slPrice.toFixed(decimals),
      tpPrice: tpPrice.toFixed(decimals),
      actualRiskPercent: actualRiskPercent.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      rewardAmount: rewardAmount.toFixed(2),
    };
  }, [debouncedScenario]);

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

  // Input change handlers
  const handleInputChange = useCallback(
    (field: keyof ScenarioState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setScenario((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Slider change handlers
  const handleSliderChange = useCallback(
    (field: keyof ScenarioState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setScenario((prev) => ({ ...prev, [field]: parseFloat(e.target.value) }));
      },
    []
  );

  // Apply preset
  const handleApplyPreset = useCallback((preset: typeof SCENARIO_PRESETS[0]) => {
    setScenario((prev) => ({
      ...prev,
      stopLossPips: preset.sl,
      takeProfitPips: preset.tp,
      lotSize: preset.lot,
    }));
    setSuccessMessage(`Applied ${preset.label} preset`);
  }, []);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setScenario(DEFAULT_STATE);
  }, []);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (!results) return;

    const lines = [
      `Scenario Analysis - ${scenario.currencyPair}`,
      ``,
      `Trade Setup:`,
      `  Direction: ${scenario.direction === "buy" ? "Buy (Long)" : "Sell (Short)"}`,
      `  Entry: ${scenario.entryPrice}`,
      `  Stop Loss: ${results.slPrice} (${scenario.stopLossPips} pips)`,
      `  Take Profit: ${results.tpPrice} (${scenario.takeProfitPips} pips)`,
      `  Lot Size: ${scenario.lotSize}`,
      ``,
      `Risk/Reward: ${results.rr.ratioDisplay}`,
      ``,
      `Outcomes:`,
      `  If TP Hit: +${results.win.profitLoss} ${scenario.accountCurrency} (+${results.win.pips} pips)`,
      `  If SL Hit: ${results.loss.profitLoss} ${scenario.accountCurrency} (${results.loss.pips} pips)`,
      ``,
      `Risk Analysis:`,
      `  Risk Amount: ${results.riskAmount} ${scenario.accountCurrency}`,
      `  Actual Risk: ${results.actualRiskPercent}% of account`,
      `  Target Risk: ${scenario.riskPercent}%`,
      `  Recommended Size: ${results.position.lots} lots`,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Scenario copied to clipboard!");
    }).catch(() => {
      addError("Copy Failed", "Could not copy to clipboard");
    });
  }, [results, scenario, addError]);

  // Check active preset
  const activePreset = useMemo(() => {
    return SCENARIO_PRESETS.find(
      (p) =>
        p.sl === scenario.stopLossPips &&
        p.tp === scenario.takeProfitPips &&
        p.lot === scenario.lotSize
    )?.label || null;
  }, [scenario.stopLossPips, scenario.takeProfitPips, scenario.lotSize]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Scenario Simulator</h1>
            <p className="mt-2 text-zinc-400">
              Adjust parameters in real-time to see how they affect your trade outcomes.
              Explore different scenarios with interactive sliders.
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
                      value={scenario.currencyPair}
                      onChange={handleInputChange("currencyPair")}
                    />
                    <Select
                      label="Direction"
                      options={DIRECTION_OPTIONS}
                      value={scenario.direction}
                      onChange={handleInputChange("direction")}
                    />
                  </FormRow>
                  <FormRow>
                    <Input
                      label="Entry Price"
                      type="number"
                      value={scenario.entryPrice}
                      onChange={handleInputChange("entryPrice")}
                      step="0.00001"
                    />
                    <Input
                      label="Exchange Rate"
                      type="number"
                      value={scenario.exchangeRate}
                      onChange={handleInputChange("exchangeRate")}
                      step="0.00001"
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Account Settings">
                  <FormRow>
                    <Input
                      label="Account Balance"
                      type="number"
                      value={scenario.accountBalance}
                      onChange={handleInputChange("accountBalance")}
                      suffix={scenario.accountCurrency}
                    />
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={scenario.accountCurrency}
                      onChange={handleInputChange("accountCurrency")}
                    />
                  </FormRow>
                  <Input
                    label="Target Risk"
                    type="number"
                    value={scenario.riskPercent}
                    onChange={handleInputChange("riskPercent")}
                    suffix="%"
                    helper="Your target risk per trade"
                  />
                </FormSection>

                <FormSection title="Scenario Presets">
                  <div className="flex flex-wrap gap-2">
                    {SCENARIO_PRESETS.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        label={preset.label}
                        isActive={activePreset === preset.label}
                        onClick={() => handleApplyPreset(preset)}
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Adjust Scenario">
                  <div className="space-y-6">
                    <Slider
                      label="Stop Loss"
                      value={scenario.stopLossPips}
                      min={5}
                      max={200}
                      step={1}
                      suffix=" pips"
                      onChange={handleSliderChange("stopLossPips")}
                    />
                    <Slider
                      label="Take Profit"
                      value={scenario.takeProfitPips}
                      min={5}
                      max={500}
                      step={1}
                      suffix=" pips"
                      onChange={handleSliderChange("takeProfitPips")}
                    />
                    <Slider
                      label="Lot Size"
                      value={scenario.lotSize}
                      min={0.01}
                      max={5}
                      step={0.01}
                      suffix=" lots"
                      onChange={handleSliderChange("lotSize")}
                    />
                  </div>
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
                    <li>- Aim for <strong className="text-zinc-400">1.5:1 R:R minimum</strong></li>
                    <li>- Use sliders to <strong className="text-zinc-400">find optimal settings</strong></li>
                    <li>- Match lot size to <strong className="text-zinc-400">recommended position</strong></li>
                    <li>- Check <strong className="text-zinc-400">actual risk vs target</strong></li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection results={results} scenario={scenario} onCopy={handleCopy} />
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