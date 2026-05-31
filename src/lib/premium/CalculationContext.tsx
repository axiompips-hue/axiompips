// File: src/lib/premium/CalculationContext.tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";

interface CalculationModeContextValue {
  /** True if the user is premium/trial — calculations happen automatically */
  shouldAutoCalculate: boolean;
  /** False while the premium status is still being fetched */
  isLoaded: boolean;
}

const CalculationModeContext = createContext<CalculationModeContextValue>({
  shouldAutoCalculate: false, // safe default: manual mode until premium status is confirmed
  isLoaded: false,
});

export function CalculationModeProvider({
  children,
  shouldAutoCalculate,
  isLoaded,
}: {
  children: ReactNode;
  shouldAutoCalculate: boolean;
  isLoaded: boolean;
}) {
  return (
    <CalculationModeContext.Provider value={{ shouldAutoCalculate, isLoaded }}>
      {children}
    </CalculationModeContext.Provider>
  );
}

export function useCalculationMode() {
  return useContext(CalculationModeContext);
}
