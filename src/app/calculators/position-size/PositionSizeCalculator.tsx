// File: src/app/calculators/position-size/PositionSizeCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS } from "@/lib/constants/options";
import {
  calculatePositionSize,
  validatePositionSizeInput,
  PositionSizeResult,
} from "@/lib/engine";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  accountBalance: string;
  riskPercent: string;
  stopLossPips: string;
  currencyPair: string;
  accountCurrency: string;
  exchangeRate: string;
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

interface RiskScenario {
  riskPercent: number;
  lots: string;
  riskAmount: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: FormState = {
  accountBalance: "10000",
  riskPercent: "1",
  stopLossPips: "50",
  currencyPair: "EURUSD",
  accountCurrency: "USD",
  exchangeRate: "1.0850",
};

const ERROR_DISPLAY_DURATION = 3000;

const RISK_LEVELS = [
  { percent: 0.5, label: "Conservative", color: "text-green-400", bg: "bg-green-950/20", border: "border-green-800/50" },
  { percent: 1, label: "Moderate", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-800/50" },
  { percent: 2, label: "Aggressive", color: "text-amber-400", bg: "bg-amber-950/20", border: "border-amber-800/50" },
  { percent: 3, label: "High Risk", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-800/50" },
];

// ============================================================================
// Utility Functions
// ============================================================================

function getRiskLevel(riskPercent: number): { label: string; color: string } {
  if (riskPercent <= 0.5) return { label: "Very Conservative", color: "text-green-400" };
  if (riskPercent <= 1) return { label: "Conservative", color: "text-emerald-400" };
  if (riskPercent <= 2) return { label: "Moderate", color: "text-yellow-400" };
  if (riskPercent <= 3) return { label: "Aggressive", color: "text-orange-400" };
  return { label: "Very High Risk", color: "text-red-400" };
}

function calculateRiskScenarios(
  form: FormState,
  baseResult: PositionSizeResult
): RiskScenario[] {
  const scenarios: RiskScenario[] = [];
  const balance = parseFloat(form.accountBalance);
  const stopLoss = parseFloat(form.stopLossPips);
  const pipValue = parseFloat(baseResult.pipValue);

  RISK_LEVELS.forEach(({ percent, label }) => {
    const riskAmount = balance * (percent / 100);
    const lots = riskAmount / (stopLoss * pipValue);
    scenarios.push({
      riskPercent: percent,
      lots: lots.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      label,
    });
  });

  return scenarios;
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
    ? "text-blue-400 border-blue-800/50 bg-blue-950/20"
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
        <span className={`font-mono font-bold ${highlight ? "text-blue-400" : "text-zinc-200"}`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// Risk Scenario Row Component
// ============================================================================

const RiskScenarioRow = memo(function RiskScenarioRow({
  scenario,
  accountCurrency,
  isSelected,
}: {
  scenario: RiskScenario;
  accountCurrency: string;
  isSelected: boolean;
}) {
  const level = RISK_LEVELS.find((l) => l.percent === scenario.riskPercent);
  const colorClass = level
    ? `${level.color} ${level.border} ${level.bg}`
    : "text-zinc-400 border-zinc-800 bg-zinc-900/50";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${colorClass}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-zinc-300">
            {scenario.riskPercent}% Risk
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
          <span className="text-xs text-zinc-500 block">Risk</span>
          <span className="font-mono text-sm text-zinc-300">
            {scenario.riskAmount} {accountCurrency}
          </span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Lots</span>
          <span className="font-mono font-bold text-zinc-200">{scenario.lots}</span>
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
  result: PositionSizeResult | null;
  form: FormState;
  onCopy: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="Position Size Analysis">
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
            Enter valid values to calculate position size
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Account balance, risk percentage, and stop loss are required
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const riskPercent = parseFloat(form.riskPercent);
  const riskLevel = getRiskLevel(riskPercent);
  const riskScenarios = calculateRiskScenarios(form, result);

  return (
    <>
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border border-blue-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-blue-400">Position Size Analysis</h3>
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

        {/* Highlight Box - Position Size */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-3">
          <div className="text-center">
            <span className="text-zinc-400 text-sm">Recommended Position Size</span>
            <p className="text-3xl font-mono font-bold text-blue-400 mt-1">
              {result.lots}
              <span className="text-lg ml-2 text-blue-300">lots</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {parseInt(result.units).toLocaleString()} units
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Risk Amount</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.riskAmount} {form.accountCurrency}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Stop Loss</span>
            <p className="font-mono font-semibold text-zinc-200">{form.stopLossPips} pips</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Pip Value</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.pipValue} {form.accountCurrency}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Risk Level</span>
            <p className={`font-semibold ${riskLevel.color}`}>{riskLevel.label}</p>
          </div>
        </div>
      </div>

      {/* Risk Level Indicator */}
      <div
        className={`border rounded-lg p-4 ${
          riskPercent <= 1
            ? "bg-green-950/20 border-green-800/30"
            : riskPercent <= 2
            ? "bg-yellow-950/20 border-yellow-800/30"
            : "bg-red-950/20 border-red-800/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              riskPercent <= 1 ? "bg-green-400" : riskPercent <= 2 ? "bg-yellow-400" : "bg-red-400"
            }`}
          />
          <span className={`text-sm font-medium ${riskLevel.color}`}>
            {riskLevel.label} - {form.riskPercent}% per trade
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  riskPercent <= 1
                    ? "bg-green-500"
                    : riskPercent <= 2
                    ? "bg-yellow-500"
                    : riskPercent <= 3
                    ? "bg-orange-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(riskPercent * 20, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-zinc-500">Max recommended: 2%</span>
        </div>
      </div>

      {/* Position Details */}
      <ResultDisplay title="Position Details">
        <div className="space-y-2">
          <ResultRow
            label="Standard Lots"
            value={result.lots}
            suffix="lots"
            highlight
            description="Primary position size"
          />
          <ResultRow
            label="Mini Lots"
            value={result.miniLots}
            suffix="mini lots"
            description="10,000 units each"
          />
          <ResultRow
            label="Micro Lots"
            value={result.microLots}
            suffix="micro lots"
            description="1,000 units each"
          />
          <ResultRow
            label="Total Units"
            value={parseInt(result.units).toLocaleString()}
            suffix="units"
            description="Total currency units"
          />
        </div>
      </ResultDisplay>

      {/* Risk Analysis */}
      <ResultDisplay title="Risk Analysis">
        <div className="space-y-2">
          <ResultRow
            label="Risk Amount"
            value={result.riskAmount}
            suffix={form.accountCurrency}
            highlight
            description="Maximum loss on this trade"
          />
          <ResultRow
            label="Account Balance"
            value={parseFloat(form.accountBalance).toLocaleString()}
            suffix={form.accountCurrency}
            description="Current account equity"
          />
          <ResultRow
            label="Risk Percentage"
            value={form.riskPercent}
            suffix="%"
            description="Percentage of account at risk"
          />
          <ResultRow
            label="Stop Loss Distance"
            value={form.stopLossPips}
            suffix="pips"
            description="Distance to stop loss"
          />
          <ResultRow
            label="Pip Value"
            value={result.pipValue}
            suffix={`${form.accountCurrency}/pip`}
            description="Value per pip at this lot size"
          />
        </div>
      </ResultDisplay>

      {/* Risk Scenarios */}
      <ResultDisplay title="Risk Scenarios">
        <div className="space-y-2">
          {riskScenarios.map((scenario) => (
            <RiskScenarioRow
              key={scenario.riskPercent}
              scenario={scenario}
              accountCurrency={form.accountCurrency}
              isSelected={scenario.riskPercent === riskPercent}
            />
          ))}
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Risk Management Rules</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">1% rule</strong> - Professional standard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span><strong className="text-zinc-300">2% max</strong> - Upper limit for most</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">3%+ risk</strong> - Not recommended</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Position Sizing Tips</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Adjust size based on volatility</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Consider correlation with other trades</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Reduce size in uncertain markets</span>
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

export function PositionSizeCalculator() {
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
  const result = useMemo<PositionSizeResult | null>(() => {
    if (!debouncedForm) return null;
    const balance = parseFloat(debouncedForm.accountBalance);
    const risk = parseFloat(debouncedForm.riskPercent);
    const sl = parseFloat(debouncedForm.stopLossPips);
    const rate = parseFloat(debouncedForm.exchangeRate);

    if (isNaN(balance) || balance <= 0) return null;
    if (isNaN(risk) || risk <= 0 || risk > 100) return null;
    if (isNaN(sl) || sl <= 0) return null;
    if (isNaN(rate) || rate <= 0) return null;

    const validation = validatePositionSizeInput({
      accountBalance: debouncedForm.accountBalance,
      riskPercent: debouncedForm.riskPercent,
      stopLossPips: debouncedForm.stopLossPips,
      currencyPair: debouncedForm.currencyPair,
      accountCurrency: debouncedForm.accountCurrency,
      exchangeRate: debouncedForm.exchangeRate,
    });

    if (!validation.isValid) return null;

    return calculatePositionSize({
      accountBalance: debouncedForm.accountBalance,
      riskPercent: debouncedForm.riskPercent,
      stopLossPips: debouncedForm.stopLossPips,
      currencyPair: debouncedForm.currencyPair,
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

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (!result) return;

    const lines = [
      `Position Size Analysis - ${form.currencyPair}`,
      ``,
      `Recommended Position: ${result.lots} lots (${parseInt(result.units).toLocaleString()} units)`,
      ``,
      `Account Settings:`,
      `  Balance: ${parseFloat(form.accountBalance).toLocaleString()} ${form.accountCurrency}`,
      `  Risk: ${form.riskPercent}% (${result.riskAmount} ${form.accountCurrency})`,
      `  Stop Loss: ${form.stopLossPips} pips`,
      ``,
      `Position Details:`,
      `  Standard Lots: ${result.lots}`,
      `  Mini Lots: ${result.miniLots}`,
      `  Micro Lots: ${result.microLots}`,
      `  Pip Value: ${result.pipValue} ${form.accountCurrency}/pip`,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Position size data copied to clipboard!");
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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Position Size Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Calculate the optimal lot size based on your account balance, risk tolerance, and
              stop loss distance for proper risk management.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Account Settings">
                  <FormRow>
                    <Input
                      label="Account Balance"
                      type="number"
                      value={form.accountBalance}
                      onChange={handleFieldChange("accountBalance")}
                      placeholder="10000"
                      min="0"
                      step="any"
                      suffix={form.accountCurrency}
                    />
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={form.accountCurrency}
                      onChange={handleFieldChange("accountCurrency")}
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Risk Parameters">
                  <FormRow>
                    <Input
                      label="Risk Percentage"
                      type="number"
                      value={form.riskPercent}
                      onChange={handleFieldChange("riskPercent")}
                      placeholder="1"
                      min="0.01"
                      max="100"
                      step="0.1"
                      suffix="%"
                      helper="Percentage of account to risk"
                    />
                    <Input
                      label="Stop Loss"
                      type="number"
                      value={form.stopLossPips}
                      onChange={handleFieldChange("stopLossPips")}
                      placeholder="50"
                      min="0.1"
                      step="0.1"
                      suffix="pips"
                      helper="Distance to stop loss"
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Trade Details">
                  <FormRow>
                    <Select
                      label="Currency Pair"
                      options={PAIR_OPTIONS}
                      value={form.currencyPair}
                      onChange={handleFieldChange("currencyPair")}
                    />
                    <Input
                      label="Exchange Rate"
                      type="number"
                      value={form.exchangeRate}
                      onChange={handleFieldChange("exchangeRate")}
                      placeholder="1.0850"
                      min="0"
                      step="0.00001"
                      helper="Current price of the pair"
                    />
                  </FormRow>
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
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Never risk more than <strong className="text-zinc-400">1-2%</strong> per trade</li>
                    <li>- Use <strong className="text-zinc-400">wider stops</strong> on volatile pairs</li>
                    <li>- <strong className="text-zinc-400">Reduce size</strong> when scaling into positions</li>
                    <li>- Consider <strong className="text-zinc-400">correlation</strong> with open trades</li>
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