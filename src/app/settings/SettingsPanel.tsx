// File: src/app/settings/SettingsPanel.tsx
"use client";

import { useState, useCallback, memo } from "react";
import { Container } from "@/components/ui/Container";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CURRENCY_OPTIONS, LEVERAGE_OPTIONS, PAIR_OPTIONS } from "@/lib/constants/options";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

// ============================================================================
// Types
// ============================================================================

export interface CalculatorDefaults {
  accountBalance: string;
  accountCurrency: string;
  riskPercent: string;
  leverage: string;
  defaultPair: string;
  lotSize: string;
  stopLossPips: string;
}

// ============================================================================
// Constants
// ============================================================================

export const CALCULATOR_DEFAULTS_KEY = "qp_calculator_defaults";

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorDefaults = {
  accountBalance: "10000",
  accountCurrency: "USD",
  riskPercent: "1",
  leverage: "100",
  defaultPair: "EURUSD",
  lotSize: "0.1",
  stopLossPips: "50",
};

// ============================================================================
// Success Toast
// ============================================================================

const SuccessToast = memo(function SuccessToast({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-950/90 border border-green-800 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-green-200">Settings saved successfully!</p>
        <button onClick={onDismiss} className="text-green-400 hover:text-green-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// Setting Row
// ============================================================================

const SettingRow = memo(function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-zinc-800 last:border-b-0">
      <div className="sm:w-64 flex-shrink-0">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-1 max-w-xs">{children}</div>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function SettingsPanel() {
  const [savedSettings, setSavedSettings] = useLocalStorage<CalculatorDefaults>(
    CALCULATOR_DEFAULTS_KEY,
    DEFAULT_CALCULATOR_SETTINGS
  );

  const [form, setForm] = useState<CalculatorDefaults>(savedSettings);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleFieldChange = useCallback(
    (field: keyof CalculatorDefaults) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setIsDirty(true);
      },
    []
  );

  const handleSave = useCallback(() => {
    setSavedSettings(form);
    setIsDirty(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }, [form, setSavedSettings]);

  const handleReset = useCallback(() => {
    if (window.confirm("Reset all settings to defaults?")) {
      setForm(DEFAULT_CALCULATOR_SETTINGS);
      setSavedSettings(DEFAULT_CALCULATOR_SETTINGS);
      setIsDirty(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [setSavedSettings]);

  return (
    <>
      <section className="py-8 md:py-12">
        <Container>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Settings</h1>
            <p className="mt-2 text-zinc-400">
              Configure your default values so calculators pre-fill automatically on every visit.
            </p>
          </div>

          <div className="max-w-3xl space-y-6">
            {/* Account Defaults */}
            <Card className="p-6">
              <div className="mb-5">
                <CardTitle>Account Defaults</CardTitle>
                <CardDescription className="mt-1">
                  These values will pre-fill the Account Settings section in all calculators.
                </CardDescription>
              </div>

              <SettingRow label="Account Balance" description="Your default trading account balance">
                <Input
                  label=""
                  type="number"
                  value={form.accountBalance}
                  onChange={handleFieldChange("accountBalance")}
                  placeholder="10000"
                  min="0"
                  suffix={form.accountCurrency}
                />
              </SettingRow>

              <SettingRow label="Account Currency" description="The base currency of your account">
                <Select
                  label=""
                  options={CURRENCY_OPTIONS}
                  value={form.accountCurrency}
                  onChange={handleFieldChange("accountCurrency")}
                />
              </SettingRow>

              <SettingRow label="Default Leverage" description="Your broker's default leverage ratio">
                <Select
                  label=""
                  options={LEVERAGE_OPTIONS}
                  value={form.leverage}
                  onChange={handleFieldChange("leverage")}
                />
              </SettingRow>
            </Card>

            {/* Risk Defaults */}
            <Card className="p-6">
              <div className="mb-5">
                <CardTitle>Risk Defaults</CardTitle>
                <CardDescription className="mt-1">
                  Pre-fill risk management parameters across position size, risk/reward, and margin calculators.
                </CardDescription>
              </div>

              <SettingRow label="Risk Percentage" description="Default % of account to risk per trade">
                <Input
                  label=""
                  type="number"
                  value={form.riskPercent}
                  onChange={handleFieldChange("riskPercent")}
                  placeholder="1"
                  min="0.01"
                  max="100"
                  step="0.1"
                  suffix="%"
                />
              </SettingRow>

              <SettingRow label="Default Stop Loss" description="Default stop loss distance in pips">
                <Input
                  label=""
                  type="number"
                  value={form.stopLossPips}
                  onChange={handleFieldChange("stopLossPips")}
                  placeholder="50"
                  min="0.1"
                  step="0.1"
                  suffix="pips"
                />
              </SettingRow>

              <SettingRow label="Default Lot Size" description="Default lot size for P/L and margin calculations">
                <Input
                  label=""
                  type="number"
                  value={form.lotSize}
                  onChange={handleFieldChange("lotSize")}
                  placeholder="0.1"
                  min="0.01"
                  step="0.01"
                  suffix="lots"
                />
              </SettingRow>
            </Card>

            {/* Trade Defaults */}
            <Card className="p-6">
              <div className="mb-5">
                <CardTitle>Trade Defaults</CardTitle>
                <CardDescription className="mt-1">
                  Default currency pair used across all calculators.
                </CardDescription>
              </div>

              <SettingRow label="Default Currency Pair" description="Pre-selected pair in all calculators">
                <Select
                  label=""
                  options={PAIR_OPTIONS}
                  value={form.defaultPair}
                  onChange={handleFieldChange("defaultPair")}
                />
              </SettingRow>
            </Card>

            {/* Save Area */}
            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={!isDirty}>
                {isDirty ? "Save Settings" : "Settings Saved"}
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Reset to Defaults
              </Button>
              {isDirty && (
                <p className="text-xs text-amber-400">You have unsaved changes</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                How Settings Work
              </h3>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>
                  <strong className="text-zinc-300">Auto-fill:</strong> When you open any calculator, it will automatically load your saved defaults instead of generic placeholder values.
                </p>
                <p>
                  <strong className="text-zinc-300">Local storage:</strong> Settings are stored in your browser. They persist between sessions but are specific to this device and browser.
                </p>
                <p>
                  <strong className="text-zinc-300">Override anytime:</strong> You can still change values in individual calculators without affecting your saved defaults.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <SuccessToast visible={showSuccess} onDismiss={() => setShowSuccess(false)} />
    </>
  );
}
