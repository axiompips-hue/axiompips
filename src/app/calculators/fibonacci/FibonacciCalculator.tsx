// File: src/app/calculators/fibonacci/FibonacciCalculator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS } from "@/lib/constants/options";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  highPrice: string;
  lowPrice: string;
  pointC: string;
  currencyPair: string;
  trend: "uptrend" | "downtrend";
  mode: "retracement" | "extension" | "projection";
  customLevels: string;
}

interface FibLevel {
  ratio: number;
  label: string;
  price: number;
  type: "retracement" | "extension";
  isCustom?: boolean;
  isGoldenPocket?: boolean;
  description?: string;
}

interface FibResult {
  levels: FibLevel[];
  range: number;
  rangePips: number;
  highPrice: number;
  lowPrice: number;
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

const DEFAULT_STATE: FormState = {
  highPrice: "1.1000",
  lowPrice: "1.0800",
  pointC: "",
  currencyPair: "EURUSD",
  trend: "uptrend",
  mode: "retracement",
  customLevels: "",
};

const TREND_OPTIONS = [
  { value: "uptrend", label: "Uptrend (Low to High)" },
  { value: "downtrend", label: "Downtrend (High to Low)" },
];

const MODE_OPTIONS = [
  { value: "retracement", label: "Retracement" },
  { value: "extension", label: "Extension" },
  { value: "projection", label: "Projection (3-Point)" },
];

const RETRACEMENT_LEVELS = [
  { ratio: 0, label: "0%", description: "Swing high/low - trend start" },
  { ratio: 0.236, label: "23.6%", description: "Shallow retracement" },
  { ratio: 0.382, label: "38.2%", description: "Moderate retracement" },
  { ratio: 0.5, label: "50%", description: "Half retracement" },
  { ratio: 0.618, label: "61.8%", description: "Golden ratio - strong support/resistance" },
  { ratio: 0.65, label: "65%", description: "Golden pocket end" },
  { ratio: 0.786, label: "78.6%", description: "Deep retracement" },
  { ratio: 1, label: "100%", description: "Full retracement - trend end" },
];

const EXTENSION_LEVELS = [
  { ratio: 1.272, label: "127.2%", description: "First extension target" },
  { ratio: 1.414, label: "141.4%", description: "Square root of 2" },
  { ratio: 1.618, label: "161.8%", description: "Golden extension - primary target" },
  { ratio: 2, label: "200%", description: "Double extension" },
  { ratio: 2.272, label: "227.2%", description: "Extended target" },
  { ratio: 2.618, label: "261.8%", description: "Major extension target" },
  { ratio: 3.618, label: "361.8%", description: "Extreme extension" },
  { ratio: 4.236, label: "423.6%", description: "Maximum extension" },
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

function getDecimalPlaces(pair: string): number {
  const jpyPairs = ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY"];
  const metalPairs = ["XAUUSD"];
  
  if (jpyPairs.includes(pair)) return 3;
  if (metalPairs.includes(pair)) return 2;
  if (pair === "XAGUSD") return 4;
  return 5;
}

function parseCustomLevels(input: string): number[] {
  if (!input.trim()) return [];
  
  return input
    .split(",")
    .map((s) => parseFloat(s.trim().replace("%", "")) / 100)
    .filter((n) => !isNaN(n) && n >= 0 && n <= 10);
}

function calculateFibonacciLevels(
  high: number,
  low: number,
  pointC: number | null,
  trend: "uptrend" | "downtrend",
  mode: "retracement" | "extension" | "projection",
  customLevelsInput: string,
  currencyPair: string
): FibResult | null {
  if (high <= low) return null;
  
  const range = high - low;
  const pipMultiplier = getPipMultiplier(currencyPair);
  const rangePips = range * pipMultiplier;
  const levels: FibLevel[] = [];
  const customRatios = parseCustomLevels(customLevelsInput);

  if (mode === "retracement") {
    // Retracement levels
    RETRACEMENT_LEVELS.forEach(({ ratio, label, description }) => {
      let price: number;
      
      if (trend === "uptrend") {
        // In uptrend, retracement goes from high down
        price = high - range * ratio;
      } else {
        // In downtrend, retracement goes from low up
        price = low + range * ratio;
      }
      
      const isGoldenPocket = ratio >= 0.618 && ratio <= 0.65;
      
      levels.push({
        ratio,
        label,
        price,
        type: "retracement",
        isGoldenPocket,
        description,
      });
    });

    // Add custom retracement levels
    customRatios.forEach((ratio) => {
      let price: number;
      
      if (trend === "uptrend") {
        price = high - range * ratio;
      } else {
        price = low + range * ratio;
      }
      
      levels.push({
        ratio,
        label: `${(ratio * 100).toFixed(1)}%`,
        price,
        type: "retracement",
        isCustom: true,
      });
    });
  } else if (mode === "extension") {
    // Include 0% and 100% as reference
    levels.push({
      ratio: 0,
      label: "0%",
      price: trend === "uptrend" ? low : high,
      type: "retracement",
      description: "Starting point",
    });
    
    levels.push({
      ratio: 1,
      label: "100%",
      price: trend === "uptrend" ? high : low,
      type: "retracement",
      description: "End of initial move",
    });

    // Extension levels
    EXTENSION_LEVELS.forEach(({ ratio, label, description }) => {
      let price: number;
      
      if (trend === "uptrend") {
        price = low + range * ratio;
      } else {
        price = high - range * ratio;
      }
      
      levels.push({
        ratio,
        label,
        price,
        type: "extension",
        description,
      });
    });

    // Add custom extension levels
    customRatios.forEach((ratio) => {
      let price: number;
      
      if (trend === "uptrend") {
        price = low + range * ratio;
      } else {
        price = high - range * ratio;
      }
      
      levels.push({
        ratio,
        label: `${(ratio * 100).toFixed(1)}%`,
        price,
        type: "extension",
        isCustom: true,
      });
    });
  } else if (mode === "projection" && pointC !== null) {
    // Projection uses Point A (low), Point B (high), Point C
    const projectionLevels = [
      { ratio: 0.618, label: "61.8%" },
      { ratio: 1, label: "100%" },
      { ratio: 1.272, label: "127.2%" },
      { ratio: 1.618, label: "161.8%" },
      { ratio: 2, label: "200%" },
      { ratio: 2.618, label: "261.8%" },
    ];

    // Add Point C as reference
    levels.push({
      ratio: 0,
      label: "Point C",
      price: pointC,
      type: "retracement",
      description: "Projection start point",
    });

    projectionLevels.forEach(({ ratio, label }) => {
      let price: number;
      
      if (trend === "uptrend") {
        price = pointC + range * ratio;
      } else {
        price = pointC - range * ratio;
      }
      
      levels.push({
        ratio,
        label,
        price,
        type: "extension",
        description: `${label} projection from Point C`,
      });
    });

    // Add custom projection levels
    customRatios.forEach((ratio) => {
      let price: number;
      
      if (trend === "uptrend") {
        price = pointC + range * ratio;
      } else {
        price = pointC - range * ratio;
      }
      
      levels.push({
        ratio,
        label: `${(ratio * 100).toFixed(1)}%`,
        price,
        type: "extension",
        isCustom: true,
      });
    });
  }

  // Sort levels by price
  levels.sort((a, b) => b.price - a.price);

  return {
    levels,
    range,
    rangePips,
    highPrice: high,
    lowPrice: low,
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
// Fibonacci Level Row
// ============================================================================

const FibLevelRow = memo(function FibLevelRow({
  level,
  nextLevel,
  currencyPair,
  decimalPlaces,
}: {
  level: FibLevel;
  nextLevel?: FibLevel;
  currencyPair: string;
  decimalPlaces: number;
}) {
  const pipMultiplier = getPipMultiplier(currencyPair);
  const pipDistance = nextLevel
    ? Math.abs((level.price - nextLevel.price) * pipMultiplier)
    : null;

  const getLevelColor = () => {
    if (level.isCustom) return "text-pink-400 border-pink-800/50 bg-pink-950/20";
    if (level.isGoldenPocket) return "text-yellow-400 border-yellow-800/50 bg-yellow-950/30";
    if (level.type === "extension") return "text-blue-400 border-blue-800/50 bg-blue-950/20";
    if (level.ratio === 0.618) return "text-amber-400 border-amber-800/50 bg-amber-950/20";
    if (level.ratio === 0.5) return "text-purple-400 border-purple-800/50 bg-purple-950/20";
    if (level.ratio === 0 || level.ratio === 1) return "text-zinc-300 border-zinc-700 bg-zinc-800/50";
    return "text-zinc-400 border-zinc-800 bg-zinc-900/50";
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getLevelColor()}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {level.label}
            {level.isCustom && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                Custom
              </span>
            )}
            {level.isGoldenPocket && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                Golden Pocket
              </span>
            )}
          </span>
          {level.description && (
            <span className="text-xs text-zinc-500 mt-0.5">{level.description}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {pipDistance !== null && (
          <span className="text-xs text-zinc-500">
            {pipDistance.toFixed(1)} pips
          </span>
        )}
        <span className="font-mono font-bold">{level.price.toFixed(decimalPlaces)}</span>
      </div>
    </div>
  );
});

// ============================================================================
// Result Section
// ============================================================================

const ResultSection = memo(function ResultSection({
  result,
  currencyPair,
  mode,
  onCopyAll,
}: {
  result: FibResult | null;
  currencyPair: string;
  mode: string;
  onCopyAll: () => void;
}) {
  const decimalPlaces = getDecimalPlaces(currencyPair);

  if (!result) {
    return (
      <ResultDisplay title="Fibonacci Levels">
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
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">
            Enter valid high and low prices to calculate Fibonacci levels
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            High price must be greater than low price
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const modeTitle =
    mode === "retracement"
      ? "Retracement Levels"
      : mode === "extension"
      ? "Extension Levels"
      : "Projection Levels";

  return (
    <>
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-orange-950/30 to-amber-950/20 border border-orange-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-orange-400">Fibonacci {modeTitle}</h3>
          <Button variant="secondary" size="small" onClick={onCopyAll}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy All
            </span>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">High Price</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.highPrice.toFixed(decimalPlaces)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Low Price</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.lowPrice.toFixed(decimalPlaces)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Price Range</span>
            <p className="font-mono font-semibold text-zinc-200">
              {result.range.toFixed(decimalPlaces)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Range (Pips)</span>
            <p className="font-mono font-semibold text-orange-400">
              {result.rangePips.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Golden Pocket Highlight */}
      {mode === "retracement" && (
        <div className="bg-yellow-950/20 border border-yellow-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-sm font-medium text-yellow-400">Golden Pocket Zone</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            The 61.8% - 65% zone is considered the most significant retracement area. Price often
            reverses strongly from this zone.
          </p>
        </div>
      )}

      {/* Levels List */}
      <ResultDisplay title={`All ${modeTitle}`}>
        <div className="space-y-2">
          {result.levels.map((level, index) => (
            <FibLevelRow
              key={`${level.ratio}-${level.label}`}
              level={level}
              nextLevel={result.levels[index + 1]}
              currencyPair={currencyPair}
              decimalPlaces={decimalPlaces}
            />
          ))}
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Key Retracement Levels</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span><strong className="text-zinc-300">61.8%</strong> - Golden Ratio</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span><strong className="text-zinc-300">50%</strong> - Half Retracement</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                <span><strong className="text-zinc-300">38.2%</strong> - Shallow Pullback</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Key Extension Levels</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span><strong className="text-zinc-300">161.8%</strong> - Primary Target</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span><strong className="text-zinc-300">261.8%</strong> - Extended Target</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span><strong className="text-zinc-300">127.2%</strong> - First Target</span>
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

export function FibonacciCalculator() {
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
  const result = useMemo<FibResult | null>(() => {
    if (!debouncedForm) return null;
    const high = parseFloat(debouncedForm.highPrice);
    const low = parseFloat(debouncedForm.lowPrice);
    const pointC = debouncedForm.pointC ? parseFloat(debouncedForm.pointC) : null;

    if (isNaN(high) || isNaN(low)) return null;
    if (high <= low) return null;
    if (debouncedForm.mode === "projection" && (pointC === null || isNaN(pointC))) return null;

    return calculateFibonacciLevels(
      high,
      low,
      pointC,
      debouncedForm.trend,
      debouncedForm.mode,
      debouncedForm.customLevels,
      debouncedForm.currencyPair
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
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Swap high and low
  const handleSwapPrices = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      highPrice: prev.lowPrice,
      lowPrice: prev.highPrice,
    }));
  }, []);

  // Copy all levels to clipboard
  const handleCopyAll = useCallback(() => {
    if (!result) return;

    const decimalPlaces = getDecimalPlaces(form.currencyPair);
    const text = result.levels
      .map((level) => `${level.label}: ${level.price.toFixed(decimalPlaces)}`)
      .join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setSuccessMessage("All levels copied to clipboard!");
    }).catch(() => {
      addError("Copy Failed", "Could not copy to clipboard");
    });
  }, [result, form.currencyPair, addError]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Fibonacci Calculator</h1>
            <p className="mt-2 text-zinc-400">
              Calculate Fibonacci retracement, extension, and projection levels to identify key
              support and resistance zones for your trades.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Calculation Mode">
                  <Select
                    label="Fibonacci Type"
                    options={MODE_OPTIONS}
                    value={form.mode}
                    onChange={handleFieldChange("mode")}
                  />
                  <Select
                    label="Trend Direction"
                    options={TREND_OPTIONS}
                    value={form.trend}
                    onChange={handleFieldChange("trend")}
                  />
                </FormSection>

                <FormSection title="Price Points">
                  <Select
                    label="Currency Pair"
                    options={PAIR_OPTIONS}
                    value={form.currencyPair}
                    onChange={handleFieldChange("currencyPair")}
                  />
                  <FormRow>
                    <Input
                      label="High Price (Point B)"
                      type="number"
                      value={form.highPrice}
                      onChange={handleFieldChange("highPrice")}
                      placeholder="1.1000"
                      min="0"
                      step="0.00001"
                    />
                    <Input
                      label="Low Price (Point A)"
                      type="number"
                      value={form.lowPrice}
                      onChange={handleFieldChange("lowPrice")}
                      placeholder="1.0800"
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
                      Swap High / Low
                    </span>
                  </Button>

                  {form.mode === "projection" && (
                    <Input
                      label="Point C (Retracement End)"
                      type="number"
                      value={form.pointC}
                      onChange={handleFieldChange("pointC")}
                      placeholder="1.0900"
                      min="0"
                      step="0.00001"
                      helper="The point where retracement ended and new move begins"
                    />
                  )}
                </FormSection>

                <FormSection title="Custom Levels (Pro)">
                  <Input
                    label="Add Custom Ratios"
                    type="text"
                    value={form.customLevels}
                    onChange={handleFieldChange("customLevels")}
                    placeholder="70.5, 88.6, 112"
                    helper="Comma-separated percentages (e.g., 70.5, 88.6)"
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
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Use <strong className="text-zinc-400">Retracement</strong> to find entry points during pullbacks</li>
                    <li>- Use <strong className="text-zinc-400">Extension</strong> to identify take-profit targets</li>
                    <li>- Use <strong className="text-zinc-400">Projection</strong> for ABC pattern targets</li>
                    <li>- The <strong className="text-zinc-400">61.8% level</strong> is the most significant (Golden Ratio)</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection
                result={result}
                currencyPair={form.currencyPair}
                mode={form.mode}
                onCopyAll={handleCopyAll}
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