// File: src/app/tools/compounding/CompoundingProjector.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { LineChart } from "@/components/charts";
import {
  calculateCompounding,
  calculateExpectedValue,
  CompoundingResult,
} from "@/lib/engine";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  startingBalance: string;
  riskPercent: string;
  averageR: string;
  winRate: string;
  tradeCount: string;
  compounding: boolean;
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

interface TradeData {
  tradeNumber: number;
  balanceBefore: string;
  riskAmount: string;
  outcome: "win" | "loss";
  profitLoss: string;
  balanceAfter: string;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: FormState = {
  startingBalance: "10000",
  riskPercent: "1",
  averageR: "2",
  winRate: "50",
  tradeCount: "100",
  compounding: true,
};

const ERROR_DISPLAY_DURATION = 3000;

const PRESET_SCENARIOS = [
  { label: "Conservative", risk: "0.5", winRate: "55", avgR: "1.5" },
  { label: "Moderate", risk: "1", winRate: "50", avgR: "2" },
  { label: "Aggressive", risk: "2", winRate: "45", avgR: "2.5" },
];

// ============================================================================
// Utility Functions
// ============================================================================

function getEVStatus(ev: number): { label: string; color: string; bg: string; border: string } {
  if (ev >= 1) {
    return { label: "Excellent Edge", color: "text-green-400", bg: "bg-green-950/20", border: "border-green-800/50" };
  } else if (ev >= 0.5) {
    return { label: "Strong Edge", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-800/50" };
  } else if (ev > 0) {
    return { label: "Positive Edge", color: "text-teal-400", bg: "bg-teal-950/20", border: "border-teal-800/50" };
  } else if (ev === 0) {
    return { label: "Break-Even", color: "text-yellow-400", bg: "bg-yellow-950/20", border: "border-yellow-800/50" };
  } else {
    return { label: "Negative Edge", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-800/50" };
  }
}

function formatNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    if (highlight) return "text-purple-400 border-purple-800/50 bg-purple-950/20";
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
          highlight ? "text-purple-400" : "text-zinc-200"
        }`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// Trade Table Row Component
// ============================================================================

const TradeTableRow = memo(function TradeTableRow({
  trade,
}: {
  trade: TradeData;
}) {
  const isWin = trade.outcome === "win";

  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
      <td className="py-2 px-2 text-zinc-400">{trade.tradeNumber}</td>
      <td className="py-2 px-2 text-right font-mono text-zinc-300">
        {formatNumber(trade.balanceBefore)}
      </td>
      <td className="py-2 px-2 text-right font-mono text-zinc-400">
        {trade.riskAmount}
      </td>
      <td className="py-2 px-2 text-center">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${
            isWin ? "bg-green-950/50 text-green-400" : "bg-red-950/50 text-red-400"
          }`}
        >
          {trade.outcome.toUpperCase()}
        </span>
      </td>
      <td className={`py-2 px-2 text-right font-mono ${isWin ? "text-green-400" : "text-red-400"}`}>
        {isWin ? "+" : ""}{trade.profitLoss}
      </td>
      <td className="py-2 px-2 text-right font-mono text-zinc-100">
        {formatNumber(trade.balanceAfter)}
      </td>
    </tr>
  );
});

// ============================================================================
// Result Section Component
// ============================================================================

const ResultSection = memo(function ResultSection({
  result,
  expectedValue,
  form,
  showTable,
  onToggleTable,
  onCopy,
}: {
  result: CompoundingResult | null;
  expectedValue: string | null;
  form: FormState;
  showTable: boolean;
  onToggleTable: () => void;
  onCopy: () => void;
}) {
  const chartData = useMemo(() => {
    if (!result) return [];
    return result.chartData.labels.map((label, i) => ({
      x: label,
      y: result.chartData.balances[i],
    }));
  }, [result]);

  if (!result) {
    return (
      <ResultDisplay title="Projection Results">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">
            Enter valid parameters to see the projection
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Configure your trading parameters on the left
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const isProfit = parseFloat(result.summary.totalReturnPercent) >= 0;
  const evValue = expectedValue ? parseFloat(expectedValue) : 0;
  const evStatus = getEVStatus(evValue);

  return (
    <>
      {/* Summary Card */}
      <div className={`bg-gradient-to-br ${
        isProfit
          ? "from-green-950/30 to-emerald-950/20 border-green-800/30"
          : "from-red-950/30 to-rose-950/20 border-red-800/30"
      } border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${isProfit ? "text-green-400" : "text-red-400"}`}>
            Projection Summary
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

        {/* Balance Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-zinc-900/50 rounded-lg p-4 text-center">
            <span className="text-zinc-500 text-xs block">Starting Balance</span>
            <p className="text-xl font-mono font-bold text-zinc-200 mt-1">
              ${formatNumber(result.summary.startingBalance)}
            </p>
          </div>
          <div className={`rounded-lg p-4 text-center ${isProfit ? "bg-green-900/30" : "bg-red-900/30"}`}>
            <span className="text-zinc-400 text-xs block">Ending Balance</span>
            <p className={`text-xl font-mono font-bold mt-1 ${isProfit ? "text-green-400" : "text-red-400"}`}>
              ${formatNumber(result.summary.endingBalance)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {isProfit ? "+" : ""}{result.summary.totalReturnPercent}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Total Trades</span>
            <p className="font-mono font-semibold text-zinc-200">{result.summary.totalTrades}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Win Rate</span>
            <p className="font-mono font-semibold text-zinc-200">{result.summary.winRate}%</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Peak Balance</span>
            <p className="font-mono font-semibold text-green-400">
              ${formatNumber(result.summary.peakBalance)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Max Drawdown</span>
            <p className="font-mono font-semibold text-red-400">
              {result.summary.maxDrawdownPercent}%
            </p>
          </div>
        </div>
      </div>

      {/* Expected Value Card */}
      {expectedValue && (
        <div className={`border rounded-lg p-4 ${evStatus.bg} ${evStatus.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${evStatus.color.replace("text-", "bg-")} animate-pulse`} />
            <span className={`text-sm font-medium ${evStatus.color}`}>
              Expected Value: {evStatus.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              Per trade expectancy based on your parameters
            </p>
            <span className={`text-2xl font-mono font-bold ${evStatus.color}`}>
              {evValue > 0 ? "+" : ""}{expectedValue}%
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {evValue > 0
              ? "Positive expectancy - this strategy should be profitable long-term with consistent execution."
              : evValue < 0
              ? "Negative expectancy - this strategy will lose money long-term. Consider improving win rate or R-multiple."
              : "Break-even expectancy - no edge. Consider adjusting parameters."}
          </p>
        </div>
      )}

      {/* Equity Curve Chart */}
      <ResultDisplay title="Equity Curve">
        <p className="text-xs text-zinc-500 mb-4">
          Projected account balance over {result.summary.totalTrades} trades
          {form.compounding ? " with compounding" : " without compounding"}
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <LineChart
            data={chartData}
            width={700}
            height={300}
            lineColor={isProfit ? "#22c55e" : "#ef4444"}
            fillColor={isProfit ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            yAxisLabel="Balance (USD)"
            xAxisLabel="Trade Number"
            showDots={chartData.length <= 50}
          />
        </div>
      </ResultDisplay>

      {/* Statistics */}
      <ResultDisplay title="Projection Statistics">
        <div className="space-y-2">
          <ResultRow
            label="Total Trades"
            value={result.summary.totalTrades}
            description="Number of trades simulated"
          />
          <ResultRow
            label="Wins / Losses"
            value={`${result.summary.wins} / ${result.summary.losses}`}
            description="Trade outcomes breakdown"
          />
          <ResultRow
            label="Win Rate"
            value={result.summary.winRate}
            suffix="%"
            description="Percentage of winning trades"
          />
          <ResultRow
            label="Total Profit"
            value={`${isProfit ? "+" : ""}${formatNumber(result.summary.totalProfit)}`}
            suffix="USD"
            isPositive={isProfit}
            isNegative={!isProfit}
            description="Net profit/loss"
          />
          <ResultRow
            label="Total Return"
            value={`${isProfit ? "+" : ""}${result.summary.totalReturnPercent}`}
            suffix="%"
            isPositive={isProfit}
            isNegative={!isProfit}
            description="Percentage return on starting balance"
          />
          <ResultRow
            label="Peak Balance"
            value={formatNumber(result.summary.peakBalance)}
            suffix="USD"
            highlight
            description="Highest account balance reached"
          />
          <ResultRow
            label="Max Drawdown"
            value={result.summary.maxDrawdown}
            suffix={`USD (${result.summary.maxDrawdownPercent}%)`}
            isNegative
            description="Largest peak-to-trough decline"
          />
        </div>
      </ResultDisplay>

      {/* Trade Table */}
      <ResultDisplay title="Trade-by-Trade Breakdown">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-zinc-500">
            Detailed breakdown of each trade in the simulation
          </p>
          <Button variant="secondary" size="small" onClick={onToggleTable}>
            {showTable ? "Hide Table" : "Show Table"}
          </Button>
        </div>

        {showTable && (
          <>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">#</th>
                    <th className="text-right py-2 px-2 text-zinc-500 font-medium">Balance Before</th>
                    <th className="text-right py-2 px-2 text-zinc-500 font-medium">Risk</th>
                    <th className="text-center py-2 px-2 text-zinc-500 font-medium">Outcome</th>
                    <th className="text-right py-2 px-2 text-zinc-500 font-medium">P/L</th>
                    <th className="text-right py-2 px-2 text-zinc-500 font-medium">Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.slice(0, 50).map((trade) => (
                    <TradeTableRow key={trade.tradeNumber} trade={trade} />
                  ))}
                </tbody>
              </table>
            </div>
            {result.trades.length > 50 && (
              <p className="text-xs text-zinc-500 text-center mt-4">
                Showing first 50 trades of {result.trades.length}
              </p>
            )}
          </>
        )}
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Expected Value Formula</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span><strong className="text-zinc-300">EV</strong> = (WinRate x AvgR x Risk) - (LossRate x Risk)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">Positive EV</strong> = Long-term profitability</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">Negative EV</strong> = Long-term losses</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Compounding Effect</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span><strong className="text-zinc-300">With compounding:</strong> Risk % of current balance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span><strong className="text-zinc-300">Without:</strong> Risk % of starting balance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Compounding accelerates growth (and losses)</span>
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
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-amber-400">Important Disclaimer</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          This is a simplified projection based on your input parameters. Real trading results will vary
          significantly due to market conditions, slippage, emotions, and many other factors. 
          Past performance does not guarantee future results.
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
          ? "bg-purple-500/20 text-purple-400 border border-purple-800"
          : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
      }`}
    >
      {label}
    </button>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function CompoundingProjector() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

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
  const { calculationInput: debouncedForm, triggerCalculate, hasPendingChanges } = useSmartCalculation(form, 200);

  // Calculate results
  const result = useMemo<CompoundingResult | null>(() => {
    if (!debouncedForm) return null;
    const balance = parseFloat(debouncedForm.startingBalance);
    const risk = parseFloat(debouncedForm.riskPercent);
    const avgR = parseFloat(debouncedForm.averageR);
    const winRate = parseFloat(debouncedForm.winRate);
    const trades = parseInt(debouncedForm.tradeCount);

    if (
      isNaN(balance) || balance <= 0 ||
      isNaN(risk) || risk <= 0 || risk > 100 ||
      isNaN(avgR) || avgR <= 0 ||
      isNaN(winRate) || winRate < 0 || winRate > 100 ||
      isNaN(trades) || trades <= 0 || trades > 1000
    ) {
      return null;
    }

    return calculateCompounding({
      startingBalance: debouncedForm.startingBalance,
      riskPercent: debouncedForm.riskPercent,
      averageR: debouncedForm.averageR,
      winRate: debouncedForm.winRate,
      tradeCount: trades,
      compounding: debouncedForm.compounding,
    });
  }, [debouncedForm]);

  // Calculate expected value
  const expectedValue = useMemo(() => {
    const avgR = parseFloat(debouncedForm.averageR);
    const winRate = parseFloat(debouncedForm.winRate);
    const risk = parseFloat(debouncedForm.riskPercent);

    if (isNaN(avgR) || isNaN(winRate) || isNaN(risk)) return null;

    return calculateExpectedValue(winRate, avgR, risk);
  }, [debouncedForm.averageR, debouncedForm.winRate, debouncedForm.riskPercent]);

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Form field handlers
  const handleFieldChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = field === "compounding" ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  // Apply preset
  const handleApplyPreset = useCallback((preset: typeof PRESET_SCENARIOS[0]) => {
    setForm((prev) => ({
      ...prev,
      riskPercent: preset.risk,
      winRate: preset.winRate,
      averageR: preset.avgR,
    }));
  }, []);

  // Toggle table
  const handleToggleTable = useCallback(() => {
    setShowTable((prev) => !prev);
  }, []);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (!result) return;

    const isProfit = parseFloat(result.summary.totalReturnPercent) >= 0;

    const lines = [
      `Compounding Projection`,
      ``,
      `Settings:`,
      `  Starting Balance: $${formatNumber(form.startingBalance)}`,
      `  Risk per Trade: ${form.riskPercent}%`,
      `  Average R-Multiple: ${form.averageR}R`,
      `  Win Rate: ${form.winRate}%`,
      `  Total Trades: ${form.tradeCount}`,
      `  Compounding: ${form.compounding ? "Enabled" : "Disabled"}`,
      ``,
      `Results:`,
      `  Ending Balance: $${formatNumber(result.summary.endingBalance)}`,
      `  Total Return: ${isProfit ? "+" : ""}${result.summary.totalReturnPercent}%`,
      `  Total Profit: ${isProfit ? "+" : ""}$${formatNumber(result.summary.totalProfit)}`,
      `  Peak Balance: $${formatNumber(result.summary.peakBalance)}`,
      `  Max Drawdown: ${result.summary.maxDrawdown} (${result.summary.maxDrawdownPercent}%)`,
      ``,
      `Expected Value: ${expectedValue ? (parseFloat(expectedValue) > 0 ? "+" : "") + expectedValue + "% per trade" : "N/A"}`,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Projection data copied to clipboard!");
    }).catch(() => {
      setErrors((prev) => [...prev, {
        id: generateId(),
        field: "Copy Failed",
        message: "Could not copy to clipboard",
        timestamp: Date.now(),
      }]);
    });
  }, [result, form, expectedValue]);

  // Reset form
  const handleReset = useCallback(() => {
    setForm(DEFAULT_STATE);
    setShowTable(false);
  }, []);

  // Check active preset
  const activePreset = useMemo(() => {
    return PRESET_SCENARIOS.find(
      (p) =>
        p.risk === form.riskPercent &&
        p.winRate === form.winRate &&
        p.avgR === form.averageR
    )?.label || null;
  }, [form.riskPercent, form.winRate, form.averageR]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Compounding Projector</h1>
            <p className="mt-2 text-zinc-400">
              Simulate how your account can grow over time with consistent trading and compounding.
              Visualize equity curves and analyze expected value.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Account Settings">
                  <Input
                    label="Starting Balance"
                    type="number"
                    value={form.startingBalance}
                    onChange={handleFieldChange("startingBalance")}
                    suffix="USD"
                    min="0"
                    placeholder="10000"
                  />
                </FormSection>

                <FormSection title="Strategy Parameters">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs text-zinc-500">Quick Presets:</span>
                    {PRESET_SCENARIOS.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        label={preset.label}
                        isActive={activePreset === preset.label}
                        onClick={() => handleApplyPreset(preset)}
                      />
                    ))}
                  </div>
                  <FormRow>
                    <Input
                      label="Risk Per Trade"
                      type="number"
                      value={form.riskPercent}
                      onChange={handleFieldChange("riskPercent")}
                      suffix="%"
                      min="0.1"
                      max="10"
                      step="0.1"
                      helper="Percentage of account risked"
                    />
                    <Input
                      label="Win Rate"
                      type="number"
                      value={form.winRate}
                      onChange={handleFieldChange("winRate")}
                      suffix="%"
                      min="0"
                      max="100"
                      step="1"
                      helper="Historical win percentage"
                    />
                  </FormRow>
                  <FormRow>
                    <Input
                      label="Average R-Multiple"
                      type="number"
                      value={form.averageR}
                      onChange={handleFieldChange("averageR")}
                      suffix="R"
                      min="0.5"
                      max="10"
                      step="0.1"
                      helper="Avg win in R (2R = 2x risk)"
                    />
                    <Input
                      label="Number of Trades"
                      type="number"
                      value={form.tradeCount}
                      onChange={handleFieldChange("tradeCount")}
                      suffix="trades"
                      min="1"
                      max="1000"
                      step="1"
                      helper="Trades to simulate"
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Compounding">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="compounding"
                      checked={form.compounding}
                      onChange={handleFieldChange("compounding")}
                      className="w-4 h-4 rounded border-zinc-600 bg-neutral-900 text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="compounding" className="text-sm text-zinc-300">
                      Enable compounding (reinvest profits)
                    </label>
                  </div>
                  <p className="text-xs text-zinc-500">
                    When enabled, risk is calculated as a percentage of current balance. 
                    When disabled, risk is always based on starting balance.
                  </p>
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
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Focus on <strong className="text-zinc-400">positive expected value</strong> first</li>
                    <li>- Higher <strong className="text-zinc-400">R-multiple</strong> allows lower win rates</li>
                    <li>- <strong className="text-zinc-400">Compounding</strong> amplifies both gains and losses</li>
                    <li>- Start with <strong className="text-zinc-400">conservative risk</strong> (0.5-1%)</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection
                result={result}
                expectedValue={expectedValue}
                form={form}
                showTable={showTable}
                onToggleTable={handleToggleTable}
                onCopy={handleCopy}
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