// File: src/lib/utils/performance.ts
// Canonical utility functions — import from here, not from the hook files.

/**
 * Debounce: delays invoking `func` until `wait` ms after the last call.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function debounced(this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle: invokes `func` at most once per `limit` ms.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize: caches results keyed by serialized arguments.
 * Uses a Map so cache grows at most once per unique input.
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * measureTime: logs execution time in development only.
 */
export function measureTime<T>(name: string, func: () => T): T {
  if (process.env.NODE_ENV !== "development") return func();
  const start = performance.now();
  const result = func();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export const isClient = (): boolean => typeof window !== "undefined";
export const isServer = (): boolean => typeof window === "undefined";

/**
 * requestIdleCallback with fallback for environments that don't support it.
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, options?.timeout ?? 1);
  }
}

/**
 * Shallow equality check — faster than JSON.stringify for flat objects/arrays.
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if ((a as any)[key] !== (b as any)[key]) return false;
  }
  return true;
}
