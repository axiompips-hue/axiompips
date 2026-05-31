// File: src/app/calculators/profit-loss/ProfitLossCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS, DIRECTION_OPTIONS } from "@/lib/constants/options";
import { calculateProfitLoss, ProfitLossResult, TradeDirection } from "@/lib/engine";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  entryPrice: string;
  exitPrice: string;
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

interface TradeScenario {
  exitPrice: number;
  pips: number;
  profitLoss: number;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: FormState = {
  entryPrice: "1.0850",
  exitPrice: "1.0900",
  direction: "buy",
  currencyPair: "EURUSD",
  lotSize: "1",
  accountCurrency: "USD",
  exchangeRate: "1.0900",
};

const ERROR_DISPLAY_DURATION = 3000;

const SCENARIO_PIPS = [
  { pips: -50, label: "Stop Loss (-50 pips)" },
  { pips: -25, label: "Minor Loss (-25 pips)" },
  { pips: 25, label: "Small Win (+25 pips)" },
  { pips: 50, label: "Target 1 (+50 pips)" },
  { pips: 100, label: "Target 2 (+100 pips)" },
];

// ============================================================================
// Utility Functions
// ============================================================================

function getPipMultiplier(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  return jpyPairs.includes(pair) ? 100 : 10000;
}

function calculateScenarios(
  entryPrice: number,
  direction: TradeDirection,
  pipValue: number,
  currencyPair: string
): TradeScenario[] {
  const pipMultiplier = getPipMultiplier(currencyPair);
  const pipSize = 1 / pipMultiplier;

  return SCENARIO_PIPS.map(({ pips, label }) => {
    const priceChange = pips * pipSize;
    const exitPrice = direction === "buy" 
      ? entryPrice + priceChange 
      : entryPrice - priceChange;
    const profitLoss = pips * pipValue;

    return {
      exitPrice,
      pips,
      profitLoss,
      label,
    };
  });
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
  isProfit,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  description?: string;
  isProfit?: boolean;
}) {
  const getColorClass = () => {
    if (isProfit === true) return "text-green-400 border-green-800/50 bg-green-950/20";
    if (isProfit === false) return "text-red-400 border-red-800/50 bg-red-950/20";
    if (highlight) return "text-amber-400 border-amber-800/50 bg-amber-950/20";
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
          isProfit === true ? "text-green-400" : 
          isProfit === false ? "text-red-400" : 
          highlight ? "text-amber-400" : "text-zinc-200"
        }`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// Scenario Row Component
// ============================================================================

const ScenarioRow = memo(function ScenarioRow({
  scenario,
  accountCurrency,
  currencyPair,
}: {
  scenario: TradeScenario;
  accountCurrency: string;
  currencyPair: string;
}) {
  const isProfit = scenario.profitLoss >= 0;
  const pipMultiplier = getPipMultiplier(currencyPair);
  const decimalPlaces = pipMultiplier === 100 ? 3 : 5;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
        isProfit
          ? "text-green-400 border-green-800/50 bg-green-950/20"
          : "text-red-400 border-red-800/50 bg-red-950/20"
      }`}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-zinc-300">{scenario.label}</span>
        <span className="text-xs text-zinc-500 mt-0.5">
          Exit: {scenario.exitPrice.toFixed(decimalPlaces)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-xs ${isProfit ? "text-green-400" : "text-red-400"}`}>
          {isProfit ? "+" : ""}{scenario.pips} pips
        </span>
        <span className={`font-mono font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
          {isProfit ? "+" : ""}{scenario.profitLoss.toFixed(2)} {accountCurrency}
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
  onCopy,
}: {
  result: ProfitLossResult | null;
  form: FormState;
  onCopy: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="Profit/Loss Analysis">
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
          <p className="text-zinc-500 text-sm">
            Enter valid values to calculate profit or loss
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Entry price, exit price, and lot size are required
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const isBuy = form.direction === "buy";
  const pipValue = parseFloat(result.pipValue);
  const entryPrice = parseFloat(form.entryPrice);
  const scenarios = calculateScenarios(entryPrice, form.direction, pipValue, form.currencyPair);

  return (
    <>
      {/* Summary Card */}
      <div
        className={`bg-gradient-to-br ${
          result.isProfit
            ? "from-green-950/30 to-emerald-950/20 border-green-800/30"
            : "from-red-950/30 to-rose-950/20 border-red-800/30"
        } border rounded-xl p-4`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${result.isProfit ? "text-green-400" : "text-red-400"}`}>
            {result.isProfit ? "Profitable Trade" : "Losing Trade"}
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

        {/* Highlight Box - P/L */}
        <div
          className={`${
            result.isProfit
              ? "bg-green-900/30 border-green-700/50"
              : "bg-red-900/30 border-red-700/50"
          } border rounded-lg p-4 mb-3`}
        >
          <div className="text-center">
            <span className="text-zinc-400 text-sm">
              {result.isProfit ? "Profit" : "Loss"}
            </span>
            <p
              className={`text-3xl font-mono font-bold mt-1 ${
                result.isProfit ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.isProfit ? "+" : ""}{result.profitLoss}
              <span className="text-lg ml-2">{form.accountCurrency}</span>
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {result.isProfit ? "+" : ""}{result.pips} pips
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Direction</span>
            <p className={`font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}>
              {isBuy ? "Buy (Long)" : "Sell (Short)"}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Position Size</span>
            <p className="font-mono font-semibold text-zinc-200">{form.lotSize} lots</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Pip Value</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.pipValue} {form.accountCurrency}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Return</span>
            <p className={`font-mono font-semibold ${result.isProfit ? "text-green-400" : "text-red-400"}`}>
              {result.isProfit ? "+" : ""}{result.percentageReturn}%
            </p>
          </div>
        </div>
      </div>

      {/* Trade Direction Indicator */}
      <div
        className={`border rounded-lg p-4 ${
          isBuy ? "bg-green-950/20 border-green-800/30" : "bg-red-950/20 border-red-800/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isBuy ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
          <span className={`text-sm font-medium ${isBuy ? "text-green-400" : "text-red-400"}`}>
            {isBuy ? "Long Position" : "Short Position"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="text-zinc-400">
            Entry: <span className="font-mono text-zinc-300">{form.entryPrice}</span>
            <span className="mx-2">-&gt;</span>
            Exit: <span className="font-mono text-zinc-300">{form.exitPrice}</span>
          </div>
          <span className={`font-mono font-bold ${result.isProfit ? "text-green-400" : "text-red-400"}`}>
            {result.isProfit ? "+" : ""}{result.pips} pips
          </span>
        </div>
      </div>

      {/* Trade Summary */}
      <ResultDisplay title="Trade Summary">
        <div className="space-y-2">
          <ResultRow
            label="Currency Pair"
            value={form.currencyPair}
            description="Trading instrument"
          />
          <ResultRow
            label="Entry Price"
            value={form.entryPrice}
            description="Position opened at"
          />
          <ResultRow
            label="Exit Price"
            value={form.exitPrice}
            description="Position closed at"
          />
          <ResultRow
            label="Position Size"
            value={form.lotSize}
            suffix="lots"
            description={`${(parseFloat(form.lotSize) * 100000).toLocaleString()} units`}
          />
        </div>
      </ResultDisplay>

      {/* P/L Breakdown */}
      <ResultDisplay title="P/L Breakdown">
        <div className="space-y-2">
          <ResultRow
            label="Pips Gained/Lost"
            value={`${result.isProfit ? "+" : ""}${result.pips}`}
            suffix="pips"
            isProfit={result.isProfit}
            description="Price movement in pips"
          />
          <ResultRow
            label="Pip Value"
            value={result.pipValue}
            suffix={`${form.accountCurrency}/pip`}
            highlight
            description="Value per pip at this lot size"
          />
          <ResultRow
            label="Profit/Loss"
            value={`${result.isProfit ? "+" : ""}${result.profitLoss}`}
            suffix={form.accountCurrency}
            isProfit={result.isProfit}
            description="Total monetary result"
          />
          <ResultRow
            label="Percentage Return"
            value={`${result.isProfit ? "+" : ""}${result.percentageReturn}`}
            suffix="%"
            isProfit={result.isProfit}
            description="Based on position value"
          />
        </div>
      </ResultDisplay>

      {/* What-If Scenarios */}
      <ResultDisplay title="What-If Scenarios">
        <p className="text-xs text-zinc-500 mb-3">
          See potential outcomes at different exit prices based on your entry and position size
        </p>
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <ScenarioRow
              key={scenario.pips}
              scenario={scenario}
              accountCurrency={form.accountCurrency}
              currencyPair={form.currencyPair}
            />
          ))}
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">P/L Formula</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">Buy:</strong> (Exit - Entry) x Pip Value</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">Sell:</strong> (Entry - Exit) x Pip Value</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span><strong className="text-zinc-300">Pip Value:</strong> Lot x 10 (for USD pairs)</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Risk Management</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Always use stop losses</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Aim for 1:2+ risk/reward ratio</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Journal all trades for review</span>
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

export function ProfitLossCalculator() {
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
  const result = useMemo<ProfitLossResult | null>(() => {
    if (!debouncedForm) return null;
    const entry = parseFloat(debouncedForm.entryPrice);
    const exit = parseFloat(debouncedForm.exitPrice);
    const lot = parseFloat(debouncedForm.lotSize);
    const rate = parseFloat(debouncedForm.exchangeRate);

    if (isNaN(entry) || entry <= 0) return null;
    if (isNaN(exit) || exit <= 0) return null;
    if (isNaN(lot) || lot <= 0) return null;
    if (isNaN(rate) || rate <= 0) return null;

    return calculateProfitLoss({
      entryPrice: debouncedForm.entryPrice,
      exitPrice: debouncedForm.exitPrice,
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

  // Swap entry and exit prices
  const handleSwapPrices = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      entryPrice: prev.exitPrice,
      exitPrice: prev.entryPrice,
    }));
  }, []);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (!result) return;

    const lines = [
      `Profit/Loss Analysis - ${form.currencyPair}`,
      ``,
      `Result: ${result.isProfit ? "PROFIT" : "LOSS"}`,
      `P/L: ${result.isProfit ? "+" : ""}${result.profitLoss} ${form.accountCurrency}`,
      `Pips: ${result.isProfit ? "+" : ""}${result.pips}`,
      `Return: ${result.isProfit ? "+" : ""}${result.percentageReturn}%`,
      ``,
      `Trade Details:`,
      `  Direction: ${form.direction === "buy" ? "Buy (Long)" : "Sell (Short)"}`,
      `  Entry: ${form.entryPrice}`,
      `  Exit: ${form.exitPrice}`,
      `  Lot Size: ${form.lotSize} lots`,
      `  Pip Value: ${result.pipValue} ${form.accountCurrency}/pip`,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Trade data copied to clipboard!");
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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Profit/Loss Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Calculate the profit or loss for a completed or hypothetical forex trade based on
              entry price, exit price, and position size.
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
                  <FormRow>
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
                      label="Exit Price"
                      type="number"
                      value={form.exitPrice}
                      onChange={handleFieldChange("exitPrice")}
                      placeholder="1.0900"
                      min="0"
                      step="0.00001"
                    />
                  </FormRow>
                  <Button variant="secondary" size="small" onClick={handleSwapPrices}>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                      Swap Entry / Exit
                    </span>
                  </Button>
                </FormSection>

                <FormSection title="Position Details">
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
                    />
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={form.accountCurrency}
                      onChange={handleFieldChange("accountCurrency")}
                    />
                  </FormRow>
                  <Input
                    label="Exit Exchange Rate"
                    type="number"
                    value={form.exchangeRate}
                    onChange={handleFieldChange("exchangeRate")}
                    placeholder="1.0900"
                    min="0"
                    step="0.00001"
                    helper="Rate at time of exit (usually same as exit price)"
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
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Use this to <strong className="text-zinc-400">plan trades</strong> before entry</li>
                    <li>- Calculate <strong className="text-zinc-400">risk/reward</strong> for each trade</li>
                    <li>- <strong className="text-zinc-400">Journal your trades</strong> for improvement</li>
                    <li>- Check <strong className="text-zinc-400">What-If Scenarios</strong> for targets</li>
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