// File: src/lib/hooks/useDebounce.ts
"use client";

import { useState, useEffect } from "react";

/**
 * Debounces a value — returns the value only after `delay` ms of no changes.
 * Delegates to a plain timeout so there's no double-implementation.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
