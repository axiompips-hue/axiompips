// File: src/lib/hooks/useSmartCalculation.ts
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDebounce } from "@/lib/hooks";
import { useCalculationMode } from "@/lib/premium/CalculationContext";

/**
 * Smart calculation hook.
 *
 * - Premium / trial users: mirrors `useDebounce` — results update automatically.
 * - Free users: returns `null` until `triggerCalculate` is called, then returns
 *   the snapshot of the form at the time of the call.
 */
export function useSmartCalculation<T>(value: T, delay: number) {
  const { shouldAutoCalculate, isLoaded } = useCalculationMode();

  // Always call hooks unconditionally
  const debouncedValue = useDebounce(value, delay);
  const [committedValue, setCommittedValue] = useState<T | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const didMountRef = useRef(false);

  // Track when the debounced value changes while in manual mode
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    // Only mark pending when we are in manual (free) mode and already loaded
    if (!shouldAutoCalculate && isLoaded) {
      setHasPendingChanges(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  const triggerCalculate = useCallback(() => {
    setCommittedValue(value);
    setHasPendingChanges(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return {
    /** The form snapshot that should be used for calculation */
    calculationInput: shouldAutoCalculate ? debouncedValue : committedValue,
    /** null for premium users (not needed); call this on button click for free users */
    triggerCalculate: shouldAutoCalculate ? null : triggerCalculate,
    /** True when the form has unsaved changes in manual mode */
    hasPendingChanges: !shouldAutoCalculate && hasPendingChanges,
    shouldAutoCalculate,
    isLoaded,
  };
}
