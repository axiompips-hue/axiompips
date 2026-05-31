// File: src/lib/hooks/useMemoizedCalculation.ts
"use client";

import { useMemo, useRef } from "react";

/**
 * Hook for memoizing expensive calculations with deep comparison.
 */
export function useMemoizedCalculation<T, D>(
  calculate: () => T,
  dependencies: D,
  compare?: (prev: D, next: D) => boolean
): T {
  const previousDeps = useRef<D | undefined>(undefined);
  const previousResult = useRef<T | undefined>(undefined);

  return useMemo(() => {
    // Default comparison using JSON.stringify
    const isEqual = compare
      ? compare(previousDeps.current as D, dependencies)
      : JSON.stringify(previousDeps.current) === JSON.stringify(dependencies);

    if (previousResult.current !== undefined && isEqual) {
      return previousResult.current;
    }

    const result = calculate();
    previousDeps.current = dependencies;
    previousResult.current = result;

    return result;
  }, [dependencies, calculate, compare]);
}