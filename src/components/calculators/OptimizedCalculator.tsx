// File: src/components/calculators/OptimizedCalculator.tsx
"use client";

import { memo, useMemo, useCallback, useState } from "react";
import { useDebounce } from "@/lib/hooks";

interface CalculatorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
}

/**
 * Memoized input component to prevent unnecessary re-renders.
 */
export const CalculatorInput = memo(function CalculatorInput({
  label,
  value,
  onChange,
  type = "number",
  suffix,
}: CalculatorInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          className="w-full px-3 py-2.5 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-zinc-500 text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
});

interface CalculatorResultProps {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}

/**
 * Memoized result display component.
 */
export const CalculatorResult = memo(function CalculatorResult({
  label,
  value,
  suffix,
  highlight = false,
}: CalculatorResultProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-zinc-800 last:border-b-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={`font-mono font-medium ${
          highlight ? "text-accent-400" : "text-zinc-100"
        }`}
      >
        {value}
        {suffix && <span className="text-zinc-500 ml-1">{suffix}</span>}
      </span>
    </div>
  );
});

/**
 * Example of an optimized calculator using debouncing and memoization.
 */
export function OptimizedCalculatorExample() {
  const [inputs, setInputs] = useState({
    value1: "100",
    value2: "50",
  });

  // Debounce inputs for expensive calculations
  const debouncedInputs = useDebounce(inputs, 150);

  // Memoized calculation that only runs when debounced inputs change
  const result = useMemo(() => {
    const v1 = parseFloat(debouncedInputs.value1) || 0;
    const v2 = parseFloat(debouncedInputs.value2) || 0;

    // Simulate expensive calculation
    return {
      sum: v1 + v2,
      product: v1 * v2,
      ratio: v2 !== 0 ? v1 / v2 : 0,
    };
  }, [debouncedInputs]);

  // Stable callbacks for inputs
  const handleValue1Change = useCallback((value: string) => {
    setInputs((prev) => ({ ...prev, value1: value }));
  }, []);

  const handleValue2Change = useCallback((value: string) => {
    setInputs((prev) => ({ ...prev, value2: value }));
  }, []);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <CalculatorInput
          label="Value 1"
          value={inputs.value1}
          onChange={handleValue1Change}
        />
        <CalculatorInput
          label="Value 2"
          value={inputs.value2}
          onChange={handleValue2Change}
        />
      </div>
      <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-6">
        <CalculatorResult label="Sum" value={result.sum.toFixed(2)} highlight />
        <CalculatorResult label="Product" value={result.product.toFixed(2)} />
        <CalculatorResult label="Ratio" value={result.ratio.toFixed(4)} />
      </div>
    </div>
  );
}