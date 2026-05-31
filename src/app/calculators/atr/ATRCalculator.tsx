// File: src/app/calculators/atr/ATRCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay, ResultItem } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS } from "@/lib/constants/options";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  atrValue: string;
  atrMultiplierSL: string;
  atrMultiplierTP: string;
  entryPrice: string;
  direction: "buy" | "sell";
  currencyPair: string;
  accountCurrency: string;
  lotSize: string;
  accountBalance: string;
  riskPercent: string;
  candleCount: string;
  highs: string;
  lows: string;
  closes: string;
}

interface ATRResult {
  atr: number;
  atrPips: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  stopLossPips: number;
  takeProfitPips: number;
  riskAmount: number;
  rrRatio: number;
  suggestedLotSize: number;
  atrAsPercent: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STATE: FormState = {
  atrValue: "0.0085",
  atrMultiplierSL: "1.5",
  atrMultiplierTP: "2.0",
  entryPrice: "1.0900",
  direction: "buy",
  currencyPair: "EURUSD",
  accountCurrency: "USD",
  lotSize: "0.1",
  accountBalance: "10000",
  riskPercent: "1",
  candleCount: "14",
  highs: "",
  lows: "",
  closes: "",
};

const ERROR_DISPLAY_DURATION = 3000;

const DIRECTION_OPTIONS = [
  { value: "buy", label: "Buy (Long)" },
  { value: "sell", label: "Sell (Short)" },
];

const MULTIPLIER_OPTIONS = [
  { value: "0.5", label: "0.5x ATR" },
  { value: "1.0", label: "1.0x ATR" },
  { value: "1.5", label: "1.5x ATR" },
  { value: "2.0", label: "2.0x ATR" },
  { value: "2.5", label: "2.5x ATR" },
  { value: "3.0", label: "3.0x ATR" },
];

// ============================================================================
// ATR Calculation from OHLC
// ============================================================================

function calculateATRFromData(highs: number[], lows: number[], closes: number[]): number | null {
  if (highs.length < 2 || lows.length < 2 || closes.length < 2) return null;
  if (highs.length !== lows.length || lows.length !== closes.length) return null;

  const trValues: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const prevClose = closes[i - 1];
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - prevClose),
      Math.abs(lows[i] - prevClose)
    );
    trValues.push(tr);
  }

  const atr = trValues.reduce((a, b) => a + b, 0) / trValues.length;
  return atr;
}

function parseCommaSeparated(str: string): number[] | null {
  if (!str.trim()) return null;
  const parts = str.split(",").map((s) => parseFloat(s.trim()));
  if (parts.some(isNaN)) return null;
  return parts;
}

// ============================================================================
// Main Calculation
// ============================================================================

function calculateATRResult(form: FormState): ATRResult | null {
  const atr = parseFloat(form.atrValue);
  const slMult = parseFloat(form.atrMultiplierSL);
  const tpMult = parseFloat(form.atrMultiplierTP);
  const entry = parseFloat(form.entryPrice);
  const balance = parseFloat(form.accountBalance);
  const riskPct = parseFloat(form.riskPercent);
  const lot = parseFloat(form.lotSize);

  if (isNaN(atr) || atr <= 0) return null;
  if (isNaN(slMult) || slMult <= 0) return null;
  if (isNaN(tpMult) || tpMult <= 0) return null;
  if (isNaN(entry) || entry <= 0) return null;

  const isJPY = form.currencyPair.includes("JPY");
  const pipMultiplier = isJPY ? 100 : 10000;
  const atrPips = atr * pipMultiplier;

  const slDistance = atr * slMult;
  const tpDistance = atr * tpMult;

  const stopLossPrice =
    form.direction === "buy" ? entry - slDistance : entry + slDistance;
  const takeProfitPrice =
    form.direction === "buy" ? entry + tpDistance : entry - tpDistance;

  const stopLossPips = slDistance * pipMultiplier;
  const takeProfitPips = tpDistance * pipMultiplier;
  const rrRatio = tpMult / slMult;

  // Pip value for standard lot
  const pipValuePerStandardLot = isJPY ? 9.09 : 10;

  // Risk amount with given lot size
  const riskAmount = isNaN(lot) || lot <= 0 ? 0 : stopLossPips * pipValuePerStandardLot * lot;

  // Suggested lot size based on risk %
  let suggestedLotSize = 0;
  if (!isNaN(balance) && balance > 0 && !isNaN(riskPct) && riskPct > 0) {
    const riskMoney = balance * (riskPct / 100);
    suggestedLotSize = riskMoney / (stopLossPips * pipValuePerStandardLot);
  }

  const atrAsPercent = (atr / entry) * 100;

  return {
    atr,
    atrPips,
    stopLossPrice: parseFloat(stopLossPrice.toFixed(isJPY ? 3 : 5)),
    takeProfitPrice: parseFloat(takeProfitPrice.toFixed(isJPY ? 3 : 5)),
    stopLossPips: parseFloat(stopLossPips.toFixed(1)),
    takeProfitPips: parseFloat(takeProfitPips.toFixed(1)),
    riskAmount: parseFloat(riskAmount.toFixed(2)),
    rrRatio: parseFloat(rrRatio.toFixed(2)),
    suggestedLotSize: parseFloat(suggestedLotSize.toFixed(2)),
    atrAsPercent: parseFloat(atrAsPercent.toFixed(3)),
  };
}

// ============================================================================
// Error Toast
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
          <div className="flex-1">
            <p className="text-sm font-medium text-red-200">{error.field}</p>
            <p className="text-sm text-red-300/80 mt-0.5">{error.message}</p>
          </div>
          <button onClick={() => onDismiss(error.id)} className="text-red-400 hover:text-red-300">
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

export function ATRCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<{ id: string; field: string; message: string; timestamp: number }[]>([]);
  const [activeTab, setActiveTab] = useState<"manual" | "calculate">("manual");
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

  const calculatedATR = useMemo(() => {
    const h = parseCommaSeparated(debouncedForm.highs);
    const l = parseCommaSeparated(debouncedForm.lows);
    const c = parseCommaSeparated(debouncedForm.closes);
    if (!h || !l || !c) return null;
    return calculateATRFromData(h, l, c);
  }, [debouncedForm.highs, debouncedForm.lows, debouncedForm.closes]);

  // When ATR is calculated from data, sync to atrValue
  useEffect(() => {
    if (calculatedATR !== null && activeTab === "calculate") {
      const digits = form.currencyPair.includes("JPY") ? 3 : 5;
      setForm((prev) => ({ ...prev, atrValue: calculatedATR.toFixed(digits) }));
    }
  }, [calculatedATR, activeTab, form.currencyPair]);

  const result = useMemo(() => calculateATRResult(debouncedForm), [debouncedForm]);

  const dismissError = useCallback((id: string) => {
    if (!debouncedForm) return null;
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const handleReset = useCallback(() => setForm(DEFAULT_STATE), []);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const lines = [
      `ATR Analysis - ${form.currencyPair} | Entry: ${form.entryPrice} ${form.direction.toUpperCase()}`,
      ``,
      `ATR: ${result.atr} (${result.atrPips.toFixed(1)} pips)`,
      `Stop Loss: ${result.stopLossPrice} (${result.stopLossPips} pips, ${form.atrMultiplierSL}x ATR)`,
      `Take Profit: ${result.takeProfitPrice} (${result.takeProfitPips} pips, ${form.atrMultiplierTP}x ATR)`,
      `R:R Ratio: ${result.rrRatio}:1`,
      `Suggested Lot Size: ${result.suggestedLotSize} (${form.riskPercent}% risk)`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result, form]);

  const volatilityLabel = result
    ? result.atrPips < 30
      ? { label: "Low Volatility", color: "text-green-400" }
      : result.atrPips < 80
      ? { label: "Normal Volatility", color: "text-amber-400" }
      : { label: "High Volatility", color: "text-red-400" }
    : null;

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">ATR Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Use Average True Range to set dynamic stop loss and take profit levels. Enter your ATR manually or calculate it from OHLC data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <Card className="p-6 space-y-6">
                {/* ATR Input Tabs */}
                <div>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab("manual")}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "manual" ? "bg-accent-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"}`}
                    >
                      Manual ATR
                    </button>
                    <button
                      onClick={() => setActiveTab("calculate")}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "calculate" ? "bg-accent-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"}`}
                    >
                      Calculate from OHLC
                    </button>
                  </div>

                  {activeTab === "manual" ? (
                    <FormRow>
                      <Input
                        label="ATR Value"
                        type="number"
                        value={form.atrValue}
                        onChange={handleFieldChange("atrValue")}
                        placeholder="0.0085"
                        step="0.00001"
                        min="0"
                        helper="From your chart (e.g. 14-period ATR)"
                      />
                      <Input
                        label="ATR Period"
                        type="number"
                        value={form.candleCount}
                        onChange={handleFieldChange("candleCount")}
                        placeholder="14"
                        min="1"
                        helper="Informational only"
                      />
                    </FormRow>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500">Enter comma-separated values from your chart (most recent candles)</p>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">High Values</label>
                        <textarea
                          value={form.highs}
                          onChange={handleFieldChange("highs")}
                          rows={2}
                          className="w-full px-3 py-2 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors text-sm font-mono"
                          placeholder="1.0950, 1.0940, 1.0960, 1.0970..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Low Values</label>
                        <textarea
                          value={form.lows}
                          onChange={handleFieldChange("lows")}
                          rows={2}
                          className="w-full px-3 py-2 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors text-sm font-mono"
                          placeholder="1.0820, 1.0830, 1.0850, 1.0860..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Close Values</label>
                        <textarea
                          value={form.closes}
                          onChange={handleFieldChange("closes")}
                          rows={2}
                          className="w-full px-3 py-2 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors text-sm font-mono"
                          placeholder="1.0900, 1.0910, 1.0920, 1.0930..."
                        />
                      </div>
                      {calculatedATR !== null && (
                        <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3">
                          <p className="text-sm text-green-400">
                            Calculated ATR: <strong className="font-mono">{calculatedATR.toFixed(5)}</strong>
                            <span className="text-zinc-500 ml-2">(applied to form below)</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                      onChange={handleFieldChange("direction") as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    />
                  </FormRow>
                  <Input
                    label="Entry Price"
                    type="number"
                    value={form.entryPrice}
                    onChange={handleFieldChange("entryPrice")}
                    placeholder="1.0900"
                    step="0.00001"
                    min="0"
                  />
                </FormSection>

                <FormSection title="ATR Multipliers">
                  <FormRow>
                    <Select
                      label="Stop Loss Multiplier"
                      options={MULTIPLIER_OPTIONS}
                      value={form.atrMultiplierSL}
                      onChange={handleFieldChange("atrMultiplierSL")}
                    />
                    <Select
                      label="Take Profit Multiplier"
                      options={MULTIPLIER_OPTIONS}
                      value={form.atrMultiplierTP}
                      onChange={handleFieldChange("atrMultiplierTP")}
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Position Sizing">
                  <FormRow>
                    <Input
                      label="Account Balance"
                      type="number"
                      value={form.accountBalance}
                      onChange={handleFieldChange("accountBalance")}
                      placeholder="10000"
                      min="0"
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
                      label="Risk Percentage"
                      type="number"
                      value={form.riskPercent}
                      onChange={handleFieldChange("riskPercent")}
                      placeholder="1"
                      step="0.1"
                      min="0"
                      suffix="%"
                    />
                    <Input
                      label="Lot Size (optional)"
                      type="number"
                      value={form.lotSize}
                      onChange={handleFieldChange("lotSize")}
                      placeholder="0.1"
                      step="0.01"
                      min="0"
                      helper="For risk amount calculation"
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
                  <Button variant="secondary" size="small" onClick={handleReset}>Reset</Button>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    ATR Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>&#45; Use <strong className="text-zinc-400">14-period ATR</strong> on your trading timeframe</li>
                    <li>&#45; <strong className="text-zinc-400">1.5x ATR</strong> for stop loss is a common standard</li>
                    <li>&#45; ATR-based stops <strong className="text-zinc-400">adapt to volatility</strong> automatically</li>
                    <li>&#45; Widen multipliers during <strong className="text-zinc-400">news events</strong></li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              {!result ? (
                <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">ATR Analysis</h3>
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="text-zinc-500 text-sm">Enter ATR and trade details to calculate levels</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-gradient-to-br from-blue-950/30 to-cyan-950/20 border border-blue-800/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-blue-400">ATR Trade Levels</h3>
                      <Button variant="secondary" size="small" onClick={handleCopy}>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {copied ? "Copied!" : "Copy"}
                        </span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-zinc-400 mb-1">Take Profit</p>
                        <p className="text-xl font-mono font-bold text-green-400">{result.takeProfitPrice}</p>
                        <p className="text-xs text-zinc-500">{result.takeProfitPips} pips ({form.atrMultiplierTP}x ATR)</p>
                      </div>
                      <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-zinc-400 mb-1">Stop Loss</p>
                        <p className="text-xl font-mono font-bold text-red-400">{result.stopLossPrice}</p>
                        <p className="text-xs text-zinc-500">{result.stopLossPips} pips ({form.atrMultiplierSL}x ATR)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="bg-zinc-900/50 rounded-lg p-2.5">
                        <span className="text-zinc-500 text-xs">ATR</span>
                        <p className="font-mono font-semibold text-zinc-200">{result.atr}</p>
                      </div>
                      <div className="bg-zinc-900/50 rounded-lg p-2.5">
                        <span className="text-zinc-500 text-xs">ATR Pips</span>
                        <p className="font-mono font-semibold text-zinc-200">{result.atrPips.toFixed(1)}</p>
                      </div>
                      <div className="bg-zinc-900/50 rounded-lg p-2.5">
                        <span className="text-zinc-500 text-xs">R:R Ratio</span>
                        <p className={`font-mono font-semibold ${result.rrRatio >= 2 ? "text-green-400" : result.rrRatio >= 1 ? "text-amber-400" : "text-red-400"}`}>
                          {result.rrRatio}:1
                        </p>
                      </div>
                      <div className="bg-zinc-900/50 rounded-lg p-2.5">
                        <span className="text-zinc-500 text-xs">Volatility</span>
                        <p className={`font-semibold text-sm ${volatilityLabel?.color}`}>{volatilityLabel?.label}</p>
                      </div>
                    </div>
                  </div>

                  <ResultDisplay title="Trade Levels">
                    <ResultItem label="Entry Price" value={form.entryPrice} />
                    <ResultItem label="Stop Loss Price" value={result.stopLossPrice} highlight />
                    <ResultItem label="Take Profit Price" value={result.takeProfitPrice} highlight />
                    <ResultItem label="Stop Loss Distance" value={result.stopLossPips} suffix="pips" />
                    <ResultItem label="Take Profit Distance" value={result.takeProfitPips} suffix="pips" />
                    <ResultItem label="Risk/Reward Ratio" value={`${result.rrRatio}:1`} />
                  </ResultDisplay>

                  <ResultDisplay title="ATR Analysis">
                    <ResultItem label="ATR Value" value={result.atr} />
                    <ResultItem label="ATR in Pips" value={result.atrPips.toFixed(1)} suffix="pips" highlight />
                    <ResultItem label="ATR as % of Price" value={result.atrAsPercent} suffix="%" />
                    <ResultItem label="SL Multiplier" value={`${form.atrMultiplierSL}x`} />
                    <ResultItem label="TP Multiplier" value={`${form.atrMultiplierTP}x`} />
                  </ResultDisplay>

                  <ResultDisplay title="Position Sizing">
                    <ResultItem label="Suggested Lot Size" value={result.suggestedLotSize} suffix="lots" highlight />
                    <ResultItem label="Risk Percentage" value={form.riskPercent} suffix="%" />
                    <ResultItem label="Risk Amount (at lot size)" value={`${result.riskAmount} ${form.accountCurrency}`} />
                    <ResultItem label="Account Balance" value={`${parseFloat(form.accountBalance).toLocaleString()} ${form.accountCurrency}`} />
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
