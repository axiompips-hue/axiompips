// File: src/lib/hooks/useCalculatorDefaults.ts
"use client";

import { useLocalStorage } from "./useLocalStorage";
import {
  CALCULATOR_DEFAULTS_KEY,
  DEFAULT_CALCULATOR_SETTINGS,
  type CalculatorDefaults,
} from "@/app/settings/SettingsPanel";

/**
 * Returns the user's saved calculator defaults from localStorage.
 * Falls back to DEFAULT_CALCULATOR_SETTINGS if none saved.
 *
 * Usage in any calculator:
 *
 *   const defaults = useCalculatorDefaults();
 *
 *   const DEFAULT_STATE: FormState = {
 *     accountBalance: defaults.accountBalance,
 *     accountCurrency: defaults.accountCurrency,
 *     riskPercent: defaults.riskPercent,
 *     ...
 *   };
 */
export function useCalculatorDefaults(): CalculatorDefaults {
  const [settings] = useLocalStorage<CalculatorDefaults>(
    CALCULATOR_DEFAULTS_KEY,
    DEFAULT_CALCULATOR_SETTINGS
  );
  return settings;
}
