// File: src/app/calculators/pivot-points/PivotPointsCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  high: string;
  low: string;
  close: string;
  open: string;
  method: "classic" | "woodie" | "camarilla" | "fibonacci" | "demark";
  digits: string;
}

interface PivotLevel {
  label: string;
  value: number;
  type: "resistance" | "pivot" | "support";
  description: string;
}

interface PivotResult {
  pivot: number;
  levels: PivotLevel[];
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: FormState = {
  high: "1.0950",
  low: "1.0820",
  close: "1.0900",
  open: "1.0840",
  method: "classic",
  digits: "4",
};

const ERROR_DISPLAY_DURATION = 3000;

const METHOD_OPTIONS = [
  { value: "classic", label: "Classic (Standard)" },
  { value: "woodie", label: "Woodie" },
  { value: "camarilla", label: "Camarilla" },
  { value: "fibonacci", label: "Fibonacci" },
  { value: "demark", label: "DeMark" },
];

const DIGITS_OPTIONS = [
  { value: "2", label: "2 decimals (JPY pairs)" },
  { value: "4", label: "4 decimals (Major pairs)" },
  { value: "5", label: "5 decimals (Most pairs)" },
];

// ============================================================================
// Calculation Engine
// ============================================================================

function calculatePivots(form: FormState): PivotResult | null {
  const high = parseFloat(form.high);
  const low = parseFloat(form.low);
  const close = parseFloat(form.close);
  const open = parseFloat(form.open);

  if (isNaN(high) || isNaN(low) || isNaN(close) || isNaN(open)) return null;
  if (high <= 0 || low <= 0 || close <= 0 || open <= 0) return null;
  if (high < low) return null;
  if (close < low || close > high) return null;

  const digits = parseInt(form.digits);
  const round = (v: number) => parseFloat(v.toFixed(digits));

  const levels: PivotLevel[] = [];
  let pivot: number;

  switch (form.method) {
    case "classic": {
      pivot = round((high + low + close) / 3);
      const r1 = round(2 * pivot - low);
      const r2 = round(pivot + (high - low));
      const r3 = round(r1 + (high - low));
      const s1 = round(2 * pivot - high);
      const s2 = round(pivot - (high - low));
      const s3 = round(s1 - (high - low));
      levels.push(
        { label: "R3", value: r3, type: "resistance", description: "Third resistance" },
        { label: "R2", value: r2, type: "resistance", description: "Second resistance" },
        { label: "R1", value: r1, type: "resistance", description: "First resistance" },
        { label: "PP", value: pivot, type: "pivot", description: "Pivot point" },
        { label: "S1", value: s1, type: "support", description: "First support" },
        { label: "S2", value: s2, type: "support", description: "Second support" },
        { label: "S3", value: s3, type: "support", description: "Third support" }
      );
      break;
    }
    case "woodie": {
      pivot = round((high + low + 2 * close) / 4);
      const r1 = round(2 * pivot - low);
      const r2 = round(pivot + (high - low));
      const s1 = round(2 * pivot - high);
      const s2 = round(pivot - (high - low));
      levels.push(
        { label: "R2", value: r2, type: "resistance", description: "Second resistance" },
        { label: "R1", value: r1, type: "resistance", description: "First resistance" },
        { label: "PP", value: pivot, type: "pivot", description: "Woodie pivot" },
        { label: "S1", value: s1, type: "support", description: "First support" },
        { label: "S2", value: s2, type: "support", description: "Second support" }
      );
      break;
    }
    case "camarilla": {
      pivot = round((high + low + close) / 3);
      const range = high - low;
      const r4 = round(close + range * 1.5);
      const r3 = round(close + range * 1.25);
      const r2 = round(close + range * 1.1666);
      const r1 = round(close + range * 1.0833);
      const s1 = round(close - range * 1.0833);
      const s2 = round(close - range * 1.1666);
      const s3 = round(close - range * 1.25);
      const s4 = round(close - range * 1.5);
      levels.push(
        { label: "R4", value: r4, type: "resistance", description: "Fourth resistance (breakout)" },
        { label: "R3", value: r3, type: "resistance", description: "Third resistance (reversal)" },
        { label: "R2", value: r2, type: "resistance", description: "Second resistance" },
        { label: "R1", value: r1, type: "resistance", description: "First resistance" },
        { label: "PP", value: pivot, type: "pivot", description: "Camarilla pivot" },
        { label: "S1", value: s1, type: "support", description: "First support" },
        { label: "S2", value: s2, type: "support", description: "Second support" },
        { label: "S3", value: s3, type: "support", description: "Third support (reversal)" },
        { label: "S4", value: s4, type: "support", description: "Fourth support (breakout)" }
      );
      break;
    }
    case "fibonacci": {
      pivot = round((high + low + close) / 3);
      const range = high - low;
      const r1 = round(pivot + 0.382 * range);
      const r2 = round(pivot + 0.618 * range);
      const r3 = round(pivot + 1.0 * range);
      const s1 = round(pivot - 0.382 * range);
      const s2 = round(pivot - 0.618 * range);
      const s3 = round(pivot - 1.0 * range);
      levels.push(
        { label: "R3 (100%)", value: r3, type: "resistance", description: "100% Fibonacci extension" },
        { label: "R2 (61.8%)", value: r2, type: "resistance", description: "61.8% Fibonacci resistance" },
        { label: "R1 (38.2%)", value: r1, type: "resistance", description: "38.2% Fibonacci resistance" },
        { label: "PP", value: pivot, type: "pivot", description: "Fibonacci pivot" },
        { label: "S1 (38.2%)", value: s1, type: "support", description: "38.2% Fibonacci support" },
        { label: "S2 (61.8%)", value: s2, type: "support", description: "61.8% Fibonacci support" },
        { label: "S3 (100%)", value: s3, type: "support", description: "100% Fibonacci extension" }
      );
      break;
    }
    case "demark": {
      let x: number;
      if (close < open) {
        x = high + 2 * low + close;
      } else if (close > open) {
        x = 2 * high + low + close;
      } else {
        x = high + low + 2 * close;
      }
      pivot = round(x / 4);
      const r1 = round(x / 2 - low);
      const s1 = round(x / 2 - high);
      levels.push(
        { label: "R1", value: r1, type: "resistance", description: "DeMark resistance" },
        { label: "PP", value: pivot, type: "pivot", description: "DeMark pivot" },
        { label: "S1", value: s1, type: "support", description: "DeMark support" }
      );
      break;
    }
    default:
      return null;
  }

  return { pivot, levels };
}

// ============================================================================
// Error Toast Component
// ============================================================================

const ErrorToast = memo(function ErrorToast({
  errors,
  onDismiss,
}: {
  errors: { id: string; field: string; message: string }[];
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
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-200">{error.field}</p>
            <p className="text-sm text-red-300/80 mt-0.5">{error.message}</p>
          </div>
          <button onClick={() => onDismiss(error.id)} className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors">
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
// Level Row Component
// ============================================================================

const LevelRow = memo(function LevelRow({
  level,
  currentPrice,
  isHighlighted,
}: {
  level: PivotLevel;
  currentPrice: number;
  isHighlighted: boolean;
}) {
  const diff = level.value - currentPrice;
  const pips = Math.abs(diff * 10000).toFixed(1);
  const direction = diff > 0 ? "above" : diff < 0 ? "below" : "at";

  const typeColors = {
    resistance: "text-red-400 bg-red-950/20 border-red-800/40",
    pivot: "text-amber-400 bg-amber-950/20 border-amber-800/40",
    support: "text-green-400 bg-green-950/20 border-green-800/40",
  };

  const labelColors = {
    resistance: "bg-red-500/20 text-red-300",
    pivot: "bg-amber-500/20 text-amber-300",
    support: "bg-green-500/20 text-green-300",
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${typeColors[level.type]} ${isHighlighted ? "ring-2 ring-amber-500/50 scale-[1.01]" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${labelColors[level.type]}`}>
          {level.label}
        </span>
        <div>
          <span className="text-sm text-zinc-300">{level.description}</span>
          <p className="text-xs text-zinc-500 mt-0.5">
            {direction === "at" ? "Current price zone" : `${pips} pips ${direction} current price`}
          </p>
        </div>
      </div>
      <span className={`font-mono font-bold text-base ${typeColors[level.type].split(" ")[0]}`}>
        {level.value}
      </span>
    </div>
  );
});

// ============================================================================
// Form Section Components
// ============================================================================

const FormSection = memo(function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
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

export function PivotPointsCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<{ id: string; field: string; message: string; timestamp: number }[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (errors.length === 0) return;
    const timers = errors.map((e) => {
      const remaining = Math.max(0, ERROR_DISPLAY_DURATION - (Date.now() - e.timestamp));
      return setTimeout(() => setErrors((prev) => prev.filter((x) => x.id !== e.id)), remaining);
    });
    return () => timers.forEach(clearTimeout);
  }, [errors]);

  const { calculationInput: debouncedForm, triggerCalculate, hasPendingChanges } = useSmartCalculation(form, 150);

  const result = useMemo(() => calculatePivots(debouncedForm), [debouncedForm]);

  const dismissError = useCallback((id: string) => {
    if (!debouncedForm) return null;
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const handleReset = useCallback(() => setForm(DEFAULT_STATE), []);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const lines = [
      `Pivot Points (${form.method.toUpperCase()}) - H:${form.high} L:${form.low} C:${form.close}`,
      "",
      ...result.levels.map((l) => `${l.label.padEnd(12)} ${l.value}`),
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result, form]);

  const currentPrice = parseFloat(form.close) || 0;

  return (
    <>
      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <section className="py-8 md:py-12">
        <Container>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Pivot Points Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Calculate Classic, Woodie, Camarilla, Fibonacci, and DeMark pivot levels from yesterday&#39;s OHLC data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="OHLC Data (Previous Candle)">
                  <FormRow>
                    <Input
                      label="High"
                      type="number"
                      value={form.high}
                      onChange={handleFieldChange("high")}
                      placeholder="1.0950"
                      step="0.00001"
                      min="0"
                    />
                    <Input
                      label="Low"
                      type="number"
                      value={form.low}
                      onChange={handleFieldChange("low")}
                      placeholder="1.0820"
                      step="0.00001"
                      min="0"
                    />
                  </FormRow>
                  <FormRow>
                    <Input
                      label="Close"
                      type="number"
                      value={form.close}
                      onChange={handleFieldChange("close")}
                      placeholder="1.0900"
                      step="0.00001"
                      min="0"
                      helper="Previous candle close price"
                    />
                    <Input
                      label="Open"
                      type="number"
                      value={form.open}
                      onChange={handleFieldChange("open")}
                      placeholder="1.0840"
                      step="0.00001"
                      min="0"
                      helper="Required for DeMark only"
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Settings">
                  <FormRow>
                    <Select
                      label="Calculation Method"
                      options={METHOD_OPTIONS}
                      value={form.method}
                      onChange={handleFieldChange("method")}
                    />
                    <Select
                      label="Decimal Places"
                      options={DIGITS_OPTIONS}
                      value={form.digits}
                      onChange={handleFieldChange("digits")}
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

                {/* Method Descriptions */}
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Method Guide
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li><strong className="text-zinc-400">Classic</strong> &#45; Most widely used, 3 R/S levels</li>
                    <li><strong className="text-zinc-400">Woodie</strong> &#45; Gives more weight to the close price</li>
                    <li><strong className="text-zinc-400">Camarilla</strong> &#45; Short-term intraday levels, R4/S4 breakouts</li>
                    <li><strong className="text-zinc-400">Fibonacci</strong> &#45; Based on 38.2%, 61.8%, 100% ratios</li>
                    <li><strong className="text-zinc-400">DeMark</strong> &#45; Dynamic based on open vs close relationship</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              {!result ? (
                <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Pivot Levels</h3>
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-zinc-500 text-sm">Enter valid OHLC values to calculate pivot points</p>
                    <p className="text-zinc-600 text-xs mt-1">High must be greater than Low, Close within range</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-gradient-to-br from-amber-950/30 to-orange-950/20 border border-amber-800/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-amber-400">
                        {METHOD_OPTIONS.find((m) => m.value === form.method)?.label} Pivot Points
                      </h3>
                      <Button variant="secondary" size="small" onClick={handleCopy}>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {copied ? "Copied!" : "Copy"}
                        </span>
                      </Button>
                    </div>
                    <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-4 mb-3">
                      <div className="text-center">
                        <span className="text-zinc-400 text-sm">Central Pivot Point</span>
                        <p className="text-3xl font-mono font-bold text-amber-400 mt-1">{result.pivot}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Range: {form.high} &#8212; {form.low} | Close: {form.close}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-red-950/30 rounded-lg p-2.5 text-center">
                        <span className="text-red-400 text-xs font-medium">RESISTANCE</span>
                        <p className="text-zinc-400 text-xs mt-0.5">{result.levels.filter((l) => l.type === "resistance").length} levels</p>
                      </div>
                      <div className="bg-amber-950/30 rounded-lg p-2.5 text-center">
                        <span className="text-amber-400 text-xs font-medium">PIVOT</span>
                        <p className="text-zinc-400 text-xs mt-0.5">Central level</p>
                      </div>
                      <div className="bg-green-950/30 rounded-lg p-2.5 text-center">
                        <span className="text-green-400 text-xs font-medium">SUPPORT</span>
                        <p className="text-zinc-400 text-xs mt-0.5">{result.levels.filter((l) => l.type === "support").length} levels</p>
                      </div>
                    </div>
                  </div>

                  {/* All Levels */}
                  <ResultDisplay title="All Pivot Levels">
                    <div className="space-y-2">
                      {result.levels.map((level) => (
                        <LevelRow
                          key={level.label}
                          level={level}
                          currentPrice={currentPrice}
                          isHighlighted={level.type === "pivot"}
                        />
                      ))}
                    </div>
                  </ResultDisplay>

                  {/* How to Use */}
                  <ResultDisplay title="How to Use These Levels">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <h4 className="text-zinc-400 font-medium">Trading Rules</h4>
                        <ul className="space-y-1 text-zinc-500">
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                            <span>Price above PP &#8594; <strong className="text-zinc-300">bullish bias</strong>, target R1</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                            <span>Price below PP &#8594; <strong className="text-zinc-300">bearish bias</strong>, target S1</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                            <span>Levels act as both <strong className="text-zinc-300">support and resistance</strong></span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-zinc-400 font-medium">Best Practices</h4>
                        <ul className="space-y-1 text-zinc-500">
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            <span>Use daily candles for intraday trading</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            <span>Combine with session open times</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            <span>Confirm with price action signals</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </ResultDisplay>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      <ErrorToast errors={errors} onDismiss={dismissError} />
    </>
  );
}
