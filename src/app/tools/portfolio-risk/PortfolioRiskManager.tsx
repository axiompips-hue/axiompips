// File: src/app/tools/portfolio-risk/PortfolioRiskManager.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PAIR_OPTIONS, CURRENCY_OPTIONS, DIRECTION_OPTIONS } from "@/lib/constants/options";
import {
  calculatePortfolioRisk,
  PortfolioTrade,
  PortfolioRiskResult,
  TradeDirection,
} from "@/lib/engine";
import { useSmartCalculation } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface TradeFormState {
  currencyPair: string;
  direction: TradeDirection;
  lotSize: string;
  stopLossPips: string;
  exchangeRate: string;
}

interface AccountSettings {
  accountBalance: string;
  accountCurrency: string;
  riskThreshold: string;
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_TRADE: TradeFormState = {
  currencyPair: "EURUSD",
  direction: "buy",
  lotSize: "0.1",
  stopLossPips: "30",
  exchangeRate: "1.0850",
};

const DEFAULT_ACCOUNT: AccountSettings = {
  accountBalance: "10000",
  accountCurrency: "USD",
  riskThreshold: "5",
};

const ERROR_DISPLAY_DURATION = 3000;

const SAMPLE_PORTFOLIOS = [
  {
    label: "Conservative",
    trades: [
      { currencyPair: "EURUSD", direction: "buy" as TradeDirection, lotSize: "0.05", stopLossPips: "25", exchangeRate: "1.0850" },
      { currencyPair: "GBPUSD", direction: "buy" as TradeDirection, lotSize: "0.05", stopLossPips: "30", exchangeRate: "1.2650" },
    ],
  },
  {
    label: "Moderate",
    trades: [
      { currencyPair: "EURUSD", direction: "buy" as TradeDirection, lotSize: "0.1", stopLossPips: "30", exchangeRate: "1.0850" },
      { currencyPair: "USDJPY", direction: "sell" as TradeDirection, lotSize: "0.1", stopLossPips: "35", exchangeRate: "149.50" },
      { currencyPair: "AUDUSD", direction: "buy" as TradeDirection, lotSize: "0.05", stopLossPips: "25", exchangeRate: "0.6550" },
    ],
  },
  {
    label: "Aggressive",
    trades: [
      { currencyPair: "GBPJPY", direction: "buy" as TradeDirection, lotSize: "0.2", stopLossPips: "50", exchangeRate: "189.20" },
      { currencyPair: "EURJPY", direction: "buy" as TradeDirection, lotSize: "0.15", stopLossPips: "40", exchangeRate: "162.30" },
    ],
  },
];

const RISK_THRESHOLD_OPTIONS = [
  { value: "1", label: "1% - Ultra Conservative" },
  { value: "2", label: "2% - Conservative" },
  { value: "3", label: "3% - Moderate" },
  { value: "5", label: "5% - Standard" },
  { value: "10", label: "10% - Aggressive" },
];

// ============================================================================
// Utility Functions
// ============================================================================

function getRiskStatusColor(riskPercent: number, threshold: number): {
  bg: string;
  border: string;
  text: string;
  label: string;
} {
  const ratio = riskPercent / threshold;
  
  if (ratio >= 1) {
    return { bg: "bg-red-950/30", border: "border-red-800/50", text: "text-red-400", label: "Over Limit" };
  } else if (ratio >= 0.8) {
    return { bg: "bg-orange-950/30", border: "border-orange-800/50", text: "text-orange-400", label: "Near Limit" };
  } else if (ratio >= 0.5) {
    return { bg: "bg-yellow-950/30", border: "border-yellow-800/50", text: "text-yellow-400", label: "Moderate" };
  } else {
    return { bg: "bg-green-950/30", border: "border-green-800/50", text: "text-green-400", label: "Safe" };
  }
}

function formatCurrency(value: string | number, decimals: number = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ============================================================================
// Error Toast Component
// ============================================================================

const ErrorToast = memo(function ErrorToast({
  errors,
  onDismiss,
}: {
  errors: ValidationError[];
  onDismiss: (id: string) => void;
}) {
  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {errors.map((error) => (
        <div
          key={error.id}
          className="bg-red-950/90 border border-red-800 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-start gap-3"
          style={{ animation: "slideIn 0.3s ease-out forwards" }}
        >
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-200">{error.field}</p>
            <p className="text-sm text-red-300/80 mt-0.5">{error.message}</p>
          </div>
          <button
            onClick={() => onDismiss(error.id)}
            className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// Success Toast Component
// ============================================================================

const SuccessToast = memo(function SuccessToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="bg-green-950/90 border border-green-800 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3"
        style={{ animation: "slideIn 0.3s ease-out forwards" }}
      >
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm text-green-200">{message}</p>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-green-400 hover:text-green-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// Result Row Component
// ============================================================================

const ResultRow = memo(function ResultRow({
  label,
  value,
  suffix,
  highlight,
  description,
  isPositive,
  isNegative,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  description?: string;
  isPositive?: boolean;
  isNegative?: boolean;
}) {
  const getColorClass = () => {
    if (isPositive) return "text-green-400 border-green-800/50 bg-green-950/20";
    if (isNegative) return "text-red-400 border-red-800/50 bg-red-950/20";
    if (highlight) return "text-rose-400 border-rose-800/50 bg-rose-950/20";
    return "text-zinc-400 border-zinc-800 bg-zinc-900/50";
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getColorClass()}`}
    >
      <div className="flex flex-col">
        <span className="font-medium text-sm text-zinc-300">{label}</span>
        {description && (
          <span className="text-xs text-zinc-500 mt-0.5">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold ${
          isPositive ? "text-green-400" : 
          isNegative ? "text-red-400" : 
          highlight ? "text-rose-400" : "text-zinc-200"
        }`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// Trade Card Component
// ============================================================================

const TradeCard = memo(function TradeCard({
  trade,
  accountCurrency,
  onRemove,
}: {
  trade: {
    id: string;
    currencyPair: string;
    direction: TradeDirection;
    lotSize: string;
    stopLossPips: string;
    riskAmount: string;
    riskPercent: string;
  };
  accountCurrency: string;
  onRemove: (id: string) => void;
}) {
  const isBuy = trade.direction === "buy";

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${
        isBuy ? "bg-green-950/20 border-green-800/50" : "bg-red-950/20 border-red-800/50"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
            isBuy
              ? "bg-green-950/50 text-green-400 border border-green-800/50"
              : "bg-red-950/50 text-red-400 border border-red-800/50"
          }`}
        >
          {isBuy ? "B" : "S"}
        </div>
        <div>
          <p className="font-medium text-zinc-100">{trade.currencyPair}</p>
          <p className="text-xs text-zinc-500">
            {trade.lotSize} lots | SL: {trade.stopLossPips} pips
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-mono text-rose-400">{trade.riskAmount} {accountCurrency}</p>
          <p className="text-xs text-zinc-500">{trade.riskPercent}% of account</p>
        </div>
        <button
          onClick={() => onRemove(trade.id)}
          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
          aria-label="Remove trade"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// Risk Gauge Component
// ============================================================================

const RiskGauge = memo(function RiskGauge({
  currentRisk,
  threshold,
}: {
  currentRisk: number;
  threshold: number;
}) {
  const percentage = Math.min((currentRisk / threshold) * 100, 100);
  const status = getRiskStatusColor(currentRisk, threshold);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>0%</span>
        <span>Threshold: {threshold}%</span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 100 ? "bg-red-500" :
            percentage >= 80 ? "bg-orange-500" :
            percentage >= 50 ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
        {/* Threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
          style={{ left: "100%" }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${status.text}`}>{status.label}</span>
        <span className="text-xs text-zinc-500">
          {currentRisk.toFixed(2)}% / {threshold}%
        </span>
      </div>
    </div>
  );
});

// ============================================================================
// Result Section Component
// ============================================================================

const ResultSection = memo(function ResultSection({
  result,
  trades,
  accountCurrency,
  onRemoveTrade,
  onCopy,
}: {
  result: PortfolioRiskResult | null;
  trades: (PortfolioTrade & TradeFormState)[];
  accountCurrency: string;
  onRemoveTrade: (id: string) => void;
  onCopy: () => void;
}) {
  if (!result) {
    return (
      <ResultDisplay title="Portfolio Risk Analysis">
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">No trades added yet</p>
          <p className="text-zinc-600 text-xs mt-1">
            Add trades to see portfolio risk analysis
          </p>
        </div>
      </ResultDisplay>
    );
  }

  const riskPercent = parseFloat(result.totalRiskPercent);
  const threshold = parseFloat(result.thresholdPercent);
  const status = getRiskStatusColor(riskPercent, threshold);

  return (
    <>
      {/* Summary Card */}
      <div className={`bg-gradient-to-br ${
        result.isOverThreshold
          ? "from-red-950/30 to-rose-950/20 border-red-800/30"
          : "from-emerald-950/30 to-green-950/20 border-emerald-800/30"
      } border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${result.isOverThreshold ? "text-red-400" : "text-emerald-400"}`}>
            Portfolio Risk Summary
          </h3>
          <Button variant="secondary" size="small" onClick={onCopy}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </span>
          </Button>
        </div>

        {/* Main Risk Display */}
        <div className={`${status.bg} ${status.border} border rounded-lg p-4 mb-3`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-zinc-400 text-sm block">Total Portfolio Risk</span>
              <p className={`text-3xl font-mono font-bold mt-1 ${status.text}`}>
                {result.totalRiskPercent}%
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                {formatCurrency(result.totalRiskAmount)} {result.accountCurrency}
              </p>
            </div>
            <div className="text-right">
              {result.isOverThreshold ? (
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Over {result.thresholdPercent}% threshold
                  </span>
                </div>
              ) : (
                <div className="text-emerald-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">Within risk limits</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {result.remainingRiskPercent}% remaining capacity
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Gauge */}
        <RiskGauge currentRisk={riskPercent} threshold={threshold} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Account</span>
            <p className="font-mono font-semibold text-zinc-200">
              ${formatCurrency(result.accountBalance)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Trades</span>
            <p className="font-mono font-semibold text-zinc-200">{trades.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Risk Amount</span>
            <p className="font-mono font-semibold text-rose-400">
              ${formatCurrency(result.totalRiskAmount)}
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2.5">
            <span className="text-zinc-500 text-xs">Remaining</span>
            <p className="font-mono font-semibold text-emerald-400">
              ${formatCurrency(result.remainingRiskAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Active Trades */}
      <ResultDisplay title={`Active Trades (${trades.length})`}>
        {result.trades.length > 0 ? (
          <div className="space-y-3">
            {result.trades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                accountCurrency={accountCurrency}
                onRemove={onRemoveTrade}
              />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm py-4 text-center">
            No trades added yet
          </p>
        )}
      </ResultDisplay>

      {/* Risk Breakdown */}
      <ResultDisplay title="Risk Breakdown">
        <div className="space-y-2">
          <ResultRow
            label="Account Balance"
            value={formatCurrency(result.accountBalance)}
            suffix={result.accountCurrency}
            description="Starting account equity"
          />
          <ResultRow
            label="Total Risk Amount"
            value={formatCurrency(result.totalRiskAmount)}
            suffix={result.accountCurrency}
            highlight
            description="Combined risk of all positions"
          />
          <ResultRow
            label="Total Risk Percentage"
            value={result.totalRiskPercent}
            suffix="%"
            isNegative={result.isOverThreshold}
            isPositive={!result.isOverThreshold}
            description="Percentage of account at risk"
          />
          <ResultRow
            label="Risk Threshold"
            value={result.thresholdPercent}
            suffix="%"
            description="Maximum acceptable risk level"
          />
          <ResultRow
            label="Remaining Capacity"
            value={formatCurrency(result.remainingRiskAmount)}
            suffix={result.accountCurrency}
            isPositive={parseFloat(result.remainingRiskAmount) > 0}
            isNegative={parseFloat(result.remainingRiskAmount) <= 0}
            description="Available risk capacity"
          />
        </div>
      </ResultDisplay>

      {/* Quick Reference */}
      <ResultDisplay title="Quick Reference">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Risk Guidelines</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-zinc-300">1-2%</strong> - Professional standard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span><strong className="text-zinc-300">3-5%</strong> - Moderate risk</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span><strong className="text-zinc-300">5%+</strong> - High risk exposure</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Risk Management</h4>
            <ul className="space-y-1 text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Never risk more than you can afford to lose</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Consider correlation between trades</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Reduce size in volatile markets</span>
              </li>
            </ul>
          </div>
        </div>
      </ResultDisplay>
    </>
  );
});

// ============================================================================
// Form Section Components
// ============================================================================

const FormSection = memo(function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
});

const FormRow = memo(function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
});

// ============================================================================
// Preset Button Component
// ============================================================================

const PresetButton = memo(function PresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-rose-600 hover:text-rose-400"
    >
      {label}
    </button>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function PortfolioRiskManager() {
  const [account, setAccount] = useState<AccountSettings>(DEFAULT_ACCOUNT);
  const [trades, setTrades] = useState<(PortfolioTrade & TradeFormState)[]>([]);
  const [newTrade, setNewTrade] = useState<TradeFormState>(DEFAULT_TRADE);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss errors after 3 seconds
  useEffect(() => {
    if (errors.length === 0) return;

    const timers = errors.map((error) => {
      const elapsed = Date.now() - error.timestamp;
      const remaining = Math.max(0, ERROR_DISPLAY_DURATION - elapsed);

      return setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== error.id));
      }, remaining);
    });

    return () => timers.forEach(clearTimeout);
  }, [errors]);

  // Auto-dismiss success message
  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // Smart calculation mode (auto for premium, manual for free)
  const { calculationInput: debouncedAccount, triggerCalculate, hasPendingChanges } = useSmartCalculation(account, 150);

  // Calculate portfolio risk
  const result = useMemo<PortfolioRiskResult | null>(() => {
    if (!debouncedAccount) return null;
    if (trades.length === 0) return null;

    const balance = parseFloat(debouncedAccount.accountBalance);
    if (isNaN(balance) || balance <= 0) return null;

    return calculatePortfolioRisk({
      trades: trades.map((t) => ({
        id: t.id,
        currencyPair: t.currencyPair,
        direction: t.direction,
        lotSize: t.lotSize,
        stopLossPips: t.stopLossPips,
        exchangeRate: t.exchangeRate,
      })),
      accountBalance: debouncedAccount.accountBalance,
      accountCurrency: debouncedAccount.accountCurrency,
      riskThresholdPercent: debouncedAccount.riskThreshold,
    });
  }, [trades, debouncedAccount]);

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Add error helper
  const addError = useCallback((field: string, message: string) => {
    const newError: ValidationError = {
      id: generateId(),
      field,
      message,
      timestamp: Date.now(),
    };
    setErrors((prev) => [...prev.filter((e) => e.field !== field), newError]);
  }, []);

  // Account field handlers
  const handleAccountChange = useCallback(
    (field: keyof AccountSettings) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setAccount((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Trade field handlers
  const handleTradeChange = useCallback(
    (field: keyof TradeFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewTrade((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  // Add trade
  const handleAddTrade = useCallback(() => {
    const lotSize = parseFloat(newTrade.lotSize);
    const stopLoss = parseFloat(newTrade.stopLossPips);
    const rate = parseFloat(newTrade.exchangeRate);

    if (isNaN(lotSize) || lotSize <= 0) {
      addError("Lot Size", "Please enter a valid lot size");
      return;
    }

    if (isNaN(stopLoss) || stopLoss <= 0) {
      addError("Stop Loss", "Please enter a valid stop loss");
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      addError("Exchange Rate", "Please enter a valid exchange rate");
      return;
    }

    if (trades.length >= 20) {
      addError("Limit Reached", "Maximum 20 trades allowed");
      return;
    }

    const trade: PortfolioTrade & TradeFormState = {
      ...newTrade,
      id: generateId(),
    };
    setTrades((prev) => [...prev, trade]);
    setNewTrade(DEFAULT_TRADE);
    setSuccessMessage(`Added ${newTrade.direction.toUpperCase()} ${newTrade.currencyPair}`);
  }, [newTrade, trades.length, addError]);

  // Remove trade
  const handleRemoveTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Clear all trades
  const handleClearAll = useCallback(() => {
    setTrades([]);
    setNewTrade(DEFAULT_TRADE);
  }, []);

  // Reset everything
  const handleReset = useCallback(() => {
    setAccount(DEFAULT_ACCOUNT);
    setTrades([]);
    setNewTrade(DEFAULT_TRADE);
  }, []);

  // Apply preset portfolio
  const handleApplyPreset = useCallback((preset: typeof SAMPLE_PORTFOLIOS[0]) => {
    const newTrades = preset.trades.map((t) => ({
      ...t,
      id: generateId(),
    }));
    setTrades(newTrades);
    setSuccessMessage(`Loaded ${preset.label} portfolio`);
  }, []);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (!result) return;

    const lines = [
      `Portfolio Risk Analysis`,
      ``,
      `Account: ${formatCurrency(result.accountBalance)} ${result.accountCurrency}`,
      `Risk Threshold: ${result.thresholdPercent}%`,
      ``,
      `Trades (${trades.length}):`,
      ...result.trades.map((t) => 
        `  ${t.direction.toUpperCase()} ${t.currencyPair} ${t.lotSize} lots - Risk: ${t.riskAmount} ${result.accountCurrency} (${t.riskPercent}%)`
      ),
      ``,
      `Summary:`,
      `  Total Risk: ${result.totalRiskAmount} ${result.accountCurrency} (${result.totalRiskPercent}%)`,
      `  Remaining Capacity: ${result.remainingRiskAmount} ${result.accountCurrency}`,
      `  Status: ${result.isOverThreshold ? "OVER THRESHOLD" : "Within limits"}`,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Portfolio analysis copied to clipboard!");
    }).catch(() => {
      addError("Copy Failed", "Could not copy to clipboard");
    });
  }, [result, trades, addError]);

  return (
    <>
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <section className="py-8 md:py-12">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Portfolio Risk Manager</h1>
            <p className="mt-2 text-zinc-400">
              Add your planned trades and see how they affect your total account risk.
              Ensure your combined exposure stays within your risk tolerance.
            </p>
          </div>

          {/* Main Layout - Sticky Form, Scrollable Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Account Settings">
                  <Input
                    label="Account Balance"
                    type="number"
                    value={account.accountBalance}
                    onChange={handleAccountChange("accountBalance")}
                    suffix={account.accountCurrency}
                    min="0"
                    placeholder="10000"
                  />
                  <FormRow>
                    <Select
                      label="Account Currency"
                      options={CURRENCY_OPTIONS}
                      value={account.accountCurrency}
                      onChange={handleAccountChange("accountCurrency")}
                    />
                    <Select
                      label="Risk Threshold"
                      options={RISK_THRESHOLD_OPTIONS}
                      value={account.riskThreshold}
                      onChange={handleAccountChange("riskThreshold")}
                    />
                  </FormRow>
                </FormSection>

                <FormSection title="Add Trade">
                  <FormRow>
                    <Select
                      label="Currency Pair"
                      options={PAIR_OPTIONS}
                      value={newTrade.currencyPair}
                      onChange={handleTradeChange("currencyPair")}
                    />
                    <Select
                      label="Direction"
                      options={DIRECTION_OPTIONS}
                      value={newTrade.direction}
                      onChange={handleTradeChange("direction")}
                    />
                  </FormRow>
                  <FormRow>
                    <Input
                      label="Lot Size"
                      type="number"
                      value={newTrade.lotSize}
                      onChange={handleTradeChange("lotSize")}
                      min="0.01"
                      step="0.01"
                      suffix="lots"
                    />
                    <Input
                      label="Stop Loss"
                      type="number"
                      value={newTrade.stopLossPips}
                      onChange={handleTradeChange("stopLossPips")}
                      suffix="pips"
                      min="1"
                    />
                  </FormRow>
                  <Input
                    label="Exchange Rate"
                    type="number"
                    value={newTrade.exchangeRate}
                    onChange={handleTradeChange("exchangeRate")}
                    step="0.00001"
                    helper="Current price of the pair"
                  />
                  <Button fullWidth onClick={handleAddTrade}>
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Trade
                    </span>
                  </Button>
                </FormSection>

                <FormSection title="Sample Portfolios">
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_PORTFOLIOS.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        label={preset.label}
                        onClick={() => handleApplyPreset(preset)}
                      />
                    ))}
                  </div>
                </FormSection>

                <div className="flex gap-3 pt-2">
                  {triggerCalculate && (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={triggerCalculate}
                      className={hasPendingChanges ? "ring-2 ring-accent-400/50" : ""}
                    >
                      Calculate
                    </Button>
                  )}
                  <Button variant="secondary" size="small" onClick={handleClearAll}>
                    Clear Trades
                  </Button>
                  <Button variant="secondary" size="small" onClick={handleReset}>
                    Reset All
                  </Button>
                </div>

                {/* Pro Tips */}
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Keep total risk under <strong className="text-zinc-400">5%</strong> for safety</li>
                    <li>- <strong className="text-zinc-400">Correlated pairs</strong> compound your risk</li>
                    <li>- Use <strong className="text-zinc-400">smaller lots</strong> when adding multiple trades</li>
                    <li>- Consider <strong className="text-zinc-400">market volatility</strong> when sizing</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section - Scrollable */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection
                result={result}
                trades={trades}
                accountCurrency={account.accountCurrency}
                onRemoveTrade={handleRemoveTrade}
                onCopy={handleCopy}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Error Toasts */}
      <ErrorToast errors={errors} onDismiss={dismissError} />

      {/* Success Toast */}
      <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
    </>
  );
}