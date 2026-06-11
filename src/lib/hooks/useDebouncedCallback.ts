// File: src/lib/hooks/useDebouncedCallback.ts
"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Returns a stable debounced wrapper around `callback`.
 * - The returned function reference never changes (safe as event handler / dep).
 * - `callback` and `delay` changes are picked up without recreating the wrapper.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const delayRef = useRef(delay);

  // Keep refs current without triggering a new debounced function
  useEffect(() => { callbackRef.current = callback; }, [callback]);
  useEffect(() => { delayRef.current = delay; }, [delay]);

  // Clean up on unmount
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Stable identity — deps array is empty on purpose
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delayRef.current);
  }, []);
}
