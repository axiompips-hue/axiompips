// File: src/lib/hooks/useMemoizedCalculation.ts
"use client";

import { useRef } from "react";
import { shallowEqual } from "@/lib/utils/performance";

/**
 * Memoizes an expensive calculation.
 *
 * CHANGE: replaced JSON.stringify comparison with shallowEqual — O(k) instead
 * of O(n) and no string allocations on every render.
 *
 * Pass a custom `compare` for deep/complex dependency shapes.
 */
export function useMemoizedCalculation<T, D>(
  calculate: () => T,
  dependencies: D,
  compare?: (prev: D, next: D) => boolean
): T {
  const previousDeps = useRef<D | undefined>(undefined);
  const previousResult = useRef<T | undefined>(undefined);

  const isEqual =
    previousDeps.current !== undefined &&
    (compare
      ? compare(previousDeps.current, dependencies)
      : shallowEqual(previousDeps.current, dependencies));

  if (isEqual && previousResult.current !== undefined) {
    return previousResult.current;
  }

  const result = calculate();
  previousDeps.current = dependencies;
  previousResult.current = result;
  return result;
}
