// File: src/app/tools/monte-carlo/MonteCarloSimulator.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { useDebounce } from "@/lib/hooks";

// ============================================================================
// Types
// ============================================================================

interface FormState {
  startingBalance: string;
  riskPercent: string;
  simulationCount: string;
  tradesPerSimulation: string;
  useCompounding: boolean;
  excludeOutliers: boolean;
  outlierPercentile: string;
  spreadSlippage: string;
  enableSpreadChaos: boolean;
  chaosFrequency: string;
  chaosMagnitude: string;
  correlationCoefficient: string;
  swapCostPerTrade: string;
  averageTradeDuration: string;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: string;
  circuitBreakerAction: string;
  simulationMode: "resample" | "randomized" | "both";
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  timestamp: number;
}

interface TradeData {
  rMultiple: number;
  isOutlier?: boolean;
}

interface SimulationRun {
  id: number;
  equityCurve: number[];
  finalBalance: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxConsecutiveLosses: number;
  stagnationPeriod: number;
  peakBalance: number;
  ruined: boolean;
}

interface SimulationResult {
  runs: SimulationRun[];
  statistics: {
    medianReturn: number;
    meanReturn: number;
    worstCaseReturn: number;
    bestCaseReturn: number;
    percentile5Return: number;
    percentile25Return: number;
    percentile75Return: number;
    percentile95Return: number;
    avgMaxDrawdown: number;
    worstMaxDrawdown: number;
    riskOfRuin: number;
    avgConsecutiveLosses: number;
    maxConsecutiveLosses: number;
    avgStagnation: number;
    maxStagnation: number;
    profitableProbability: number;
    drawdownProbabilities: {
      threshold: number;
      probability: number;
    }[];
  };
  confidenceBands: {
    upper95: number[];
    upper75: number[];
    median: number[];
    lower75: number[];
    lower95: number[];
  };
  tradeStats: {
    totalTrades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    expectancy: number;
    profitFactor: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: FormState = {
  startingBalance: "10000",
  riskPercent: "1",
  simulationCount: "1000",
  tradesPerSimulation: "100",
  useCompounding: true,
  excludeOutliers: false,
  outlierPercentile: "95",
  spreadSlippage: "0",
  enableSpreadChaos: false,
  chaosFrequency: "10",
  chaosMagnitude: "0.5",
  correlationCoefficient: "0",
  swapCostPerTrade: "0",
  averageTradeDuration: "1",
  circuitBreakerEnabled: false,
  circuitBreakerThreshold: "15",
  circuitBreakerAction: "50",
  simulationMode: "resample",
};

const ERROR_DISPLAY_DURATION = 3000;

const DEFAULT_TRADES = "-1.0, +2.3, -1.0, +1.5, -1.0, +0.8, -1.0, +3.2, -1.0, +1.2, -1.0, -1.0, +2.0, +1.8, -1.0, +0.5, -1.0, +4.5, -1.0, +1.0";

const PRESET_SCENARIOS = [
  { label: "Conservative", risk: "0.5", trades: "200", sims: "1000" },
  { label: "Standard", risk: "1", trades: "100", sims: "1000" },
  { label: "Aggressive", risk: "2", trades: "100", sims: "500" },
  { label: "Stress Test", risk: "1", trades: "500", sims: "2000" },
];

const DRAWDOWN_THRESHOLDS = [10, 20, 30, 40, 50, 75, 90];

// ============================================================================
// Utility Functions
// ============================================================================

function parseTradeData(input: string): TradeData[] {
  const trades: TradeData[] = [];
  const parts = input.split(/[,\n\r\t]+/).map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    const num = parseFloat(part.replace(/[+]/g, ""));
    if (!isNaN(num)) {
      trades.push({ rMultiple: num });
    }
  }
  
  return trades;
}

function filterOutliers(trades: TradeData[], percentile: number): TradeData[] {
  if (trades.length === 0) return trades;
  
  const wins = trades.filter(t => t.rMultiple > 0).map(t => t.rMultiple);
  if (wins.length === 0) return trades;
  
  wins.sort((a, b) => a - b);
  const cutoffIndex = Math.floor(wins.length * (percentile / 100));
  const cutoffValue = wins[cutoffIndex] || wins[wins.length - 1];
  
  return trades.map(t => ({
    ...t,
    isOutlier: t.rMultiple > cutoffValue,
    rMultiple: t.rMultiple > cutoffValue ? 0 : t.rMultiple,
  }));
}

function calculateTradeStats(trades: TradeData[]): {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  profitFactor: number;
} {
  const wins = trades.filter(t => t.rMultiple > 0);
  const losses = trades.filter(t => t.rMultiple < 0);
  
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.rMultiple, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0) / losses.length) : 1;
  
  const totalWins = wins.reduce((s, t) => s + t.rMultiple, 0);
  const totalLosses = Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0));
  
  const expectancy = trades.length > 0 
    ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss 
    : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  
  return { winRate, avgWin, avgLoss, expectancy, profitFactor };
}

function runMonteCarloSimulation(
  trades: TradeData[],
  config: {
    startingBalance: number;
    riskPercent: number;
    simulationCount: number;
    tradesPerSimulation: number;
    useCompounding: boolean;
    mode: "resample" | "randomized";
    spreadSlippage: number;
    enableSpreadChaos: boolean;
    chaosFrequency: number;
    chaosMagnitude: number;
    swapCostPerTrade: number;
    circuitBreakerEnabled: boolean;
    circuitBreakerThreshold: number;
    circuitBreakerAction: number;
  }
): SimulationResult {
  const runs: SimulationRun[] = [];
  const allEquityCurves: number[][] = [];
  
  // Calculate trade statistics
  const tradeStats = calculateTradeStats(trades);
  const mean = trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length;
  const variance = trades.reduce((s, t) => s + Math.pow(t.rMultiple - mean, 2), 0) / trades.length;
  const stdDev = Math.sqrt(variance);
  
  for (let sim = 0; sim < config.simulationCount; sim++) {
    let balance = config.startingBalance;
    let peakBalance = balance;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;
    let stagnationStart = 0;
    let maxStagnation = 0;
    let currentRiskPercent = config.riskPercent;
    let circuitBreakerActive = false;
    
    const equityCurve: number[] = [balance];
    
    for (let i = 0; i < config.tradesPerSimulation; i++) {
      let rMultiple: number;
      
      if (config.mode === "resample") {
        // Resample from actual trades
        const randomIndex = Math.floor(Math.random() * trades.length);
        rMultiple = trades[randomIndex].rMultiple;
      } else {
        // Generate based on normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        rMultiple = mean + z * stdDev;
      }
      
      // Apply spread/slippage
      if (config.spreadSlippage > 0) {
        rMultiple -= config.spreadSlippage / 100; // Convert to R
      }
      
      // Apply chaos factor
      if (config.enableSpreadChaos && Math.random() * 100 < config.chaosFrequency) {
        rMultiple -= config.chaosMagnitude;
      }
      
      // Apply swap costs
      if (config.swapCostPerTrade > 0) {
        rMultiple -= config.swapCostPerTrade / 100;
      }
      
      // Calculate position size
      const riskAmount = balance * (currentRiskPercent / 100);
      const profitLoss = riskAmount * rMultiple;
      
      // Update balance
      if (config.useCompounding) {
        balance += profitLoss;
      } else {
        balance = config.startingBalance + (balance - config.startingBalance) + profitLoss;
      }
      
      // Track consecutive losses
      if (rMultiple < 0) {
        consecutiveLosses++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
      } else {
        consecutiveLosses = 0;
      }
      
      // Track peak and drawdown
      if (balance > peakBalance) {
        peakBalance = balance;
        stagnationStart = i;
      } else {
        const currentDrawdown = peakBalance - balance;
        const currentDrawdownPercent = (currentDrawdown / peakBalance) * 100;
        
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
          maxDrawdownPercent = currentDrawdownPercent;
        }
        
        maxStagnation = Math.max(maxStagnation, i - stagnationStart);
        
        // Circuit breaker
        if (config.circuitBreakerEnabled && !circuitBreakerActive) {
          if (currentDrawdownPercent >= config.circuitBreakerThreshold) {
            currentRiskPercent = config.riskPercent * (1 - config.circuitBreakerAction / 100);
            circuitBreakerActive = true;
          }
        }
        
        // Reset circuit breaker if recovered
        if (circuitBreakerActive && balance >= peakBalance * 0.98) {
          currentRiskPercent = config.riskPercent;
          circuitBreakerActive = false;
        }
      }
      
      equityCurve.push(Math.max(0, balance));
      
      // Check for ruin
      if (balance <= config.startingBalance * 0.1) {
        // Fill remaining with zeros
        while (equityCurve.length <= config.tradesPerSimulation) {
          equityCurve.push(0);
        }
        break;
      }
    }
    
    const finalBalance = equityCurve[equityCurve.length - 1];
    const ruined = finalBalance <= config.startingBalance * 0.1;
    
    runs.push({
      id: sim,
      equityCurve,
      finalBalance,
      maxDrawdown,
      maxDrawdownPercent,
      maxConsecutiveLosses,
      stagnationPeriod: maxStagnation,
      peakBalance,
      ruined,
    });
    
    allEquityCurves.push(equityCurve);
  }
  
  // Calculate statistics
  const returns = runs.map(r => ((r.finalBalance - config.startingBalance) / config.startingBalance) * 100);
  returns.sort((a, b) => a - b);
  
  const medianIndex = Math.floor(returns.length / 2);
  const p5Index = Math.floor(returns.length * 0.05);
  const p25Index = Math.floor(returns.length * 0.25);
  const p75Index = Math.floor(returns.length * 0.75);
  const p95Index = Math.floor(returns.length * 0.95);
  
  const drawdownProbabilities = DRAWDOWN_THRESHOLDS.map(threshold => ({
    threshold,
    probability: (runs.filter(r => r.maxDrawdownPercent >= threshold).length / runs.length) * 100,
  }));
  
  // Calculate confidence bands
  const maxLength = Math.max(...allEquityCurves.map(c => c.length));
  const confidenceBands = {
    upper95: [] as number[],
    upper75: [] as number[],
    median: [] as number[],
    lower75: [] as number[],
    lower95: [] as number[],
  };
  
  for (let i = 0; i < maxLength; i++) {
    const valuesAtPoint = allEquityCurves
      .map(c => c[i] ?? c[c.length - 1])
      .sort((a, b) => a - b);
    
    const len = valuesAtPoint.length;
    confidenceBands.lower95.push(valuesAtPoint[Math.floor(len * 0.025)] || 0);
    confidenceBands.lower75.push(valuesAtPoint[Math.floor(len * 0.125)] || 0);
    confidenceBands.median.push(valuesAtPoint[Math.floor(len * 0.5)] || 0);
    confidenceBands.upper75.push(valuesAtPoint[Math.floor(len * 0.875)] || 0);
    confidenceBands.upper95.push(valuesAtPoint[Math.floor(len * 0.975)] || 0);
  }
  
  return {
    runs,
    statistics: {
      medianReturn: returns[medianIndex],
      meanReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
      worstCaseReturn: returns[0],
      bestCaseReturn: returns[returns.length - 1],
      percentile5Return: returns[p5Index],
      percentile25Return: returns[p25Index],
      percentile75Return: returns[p75Index],
      percentile95Return: returns[p95Index],
      avgMaxDrawdown: runs.reduce((s, r) => s + r.maxDrawdownPercent, 0) / runs.length,
      worstMaxDrawdown: Math.max(...runs.map(r => r.maxDrawdownPercent)),
      riskOfRuin: (runs.filter(r => r.ruined).length / runs.length) * 100,
      avgConsecutiveLosses: runs.reduce((s, r) => s + r.maxConsecutiveLosses, 0) / runs.length,
      maxConsecutiveLosses: Math.max(...runs.map(r => r.maxConsecutiveLosses)),
      avgStagnation: runs.reduce((s, r) => s + r.stagnationPeriod, 0) / runs.length,
      maxStagnation: Math.max(...runs.map(r => r.stagnationPeriod)),
      profitableProbability: (runs.filter(r => r.finalBalance > config.startingBalance).length / runs.length) * 100,
      drawdownProbabilities,
    },
    confidenceBands,
    tradeStats: {
      totalTrades: trades.length,
      ...tradeStats,
    },
  };
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatNumber(value, decimals)}%`;
}

function getRiskColor(value: number): string {
  if (value <= 1) return "text-green-400";
  if (value <= 5) return "text-yellow-400";
  if (value <= 20) return "text-orange-400";
  return "text-red-400";
}

function getReturnColor(value: number): string {
  if (value >= 50) return "text-green-400";
  if (value >= 0) return "text-emerald-400";
  if (value >= -20) return "text-yellow-400";
  return "text-red-400";
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
  colorClass,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  description?: string;
  isPositive?: boolean;
  isNegative?: boolean;
  colorClass?: string;
}) {
  const getColorClass = () => {
    if (colorClass) return colorClass;
    if (isPositive) return "text-green-400 border-green-800/50 bg-green-950/20";
    if (isNegative) return "text-red-400 border-red-800/50 bg-red-950/20";
    if (highlight) return "text-orange-400 border-orange-800/50 bg-orange-950/20";
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
          colorClass ? colorClass.split(" ")[0] :
          isPositive ? "text-green-400" : 
          isNegative ? "text-red-400" : 
          highlight ? "text-orange-400" : "text-zinc-200"
        }`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
});

// ============================================================================
// Spaghetti Chart Component
// ============================================================================

const SpaghettiChart = memo(function SpaghettiChart({
  runs,
  confidenceBands,
  startingBalance,
  width = 700,
  height = 350,
  showIndividualRuns = true,
  maxRunsToShow = 100,
}: {
  runs: SimulationRun[];
  confidenceBands: SimulationResult["confidenceBands"];
  startingBalance: number;
  width?: number;
  height?: number;
  showIndividualRuns?: boolean;
  maxRunsToShow?: number;
}) {
  const padding = { top: 20, right: 60, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const dataLength = confidenceBands.median.length;
  
  // Calculate y-axis range
  const allValues = [
    ...confidenceBands.upper95,
    ...confidenceBands.lower95,
    startingBalance,
  ];
  const minY = Math.min(...allValues) * 0.95;
  const maxY = Math.max(...allValues) * 1.05;
  
  const xScale = (i: number) => padding.left + (i / (dataLength - 1)) * chartWidth;
  const yScale = (v: number) => padding.top + chartHeight - ((v - minY) / (maxY - minY)) * chartHeight;
  
  const createPath = (data: number[]) => {
    return data.map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(v)}`).join(" ");
  };
  
  // Select subset of runs to display
  const displayRuns = runs.slice(0, maxRunsToShow);
  
  // Y-axis ticks
  const yTicks = [];
  const yStep = (maxY - minY) / 5;
  for (let i = 0; i <= 5; i++) {
    yTicks.push(minY + i * yStep);
  }
  
  // X-axis ticks
  const xTicks = [];
  const xStep = Math.ceil(dataLength / 5);
  for (let i = 0; i < dataLength; i += xStep) {
    xTicks.push(i);
  }
  xTicks.push(dataLength - 1);
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke="#27272a"
            strokeDasharray="4,4"
          />
          <text
            x={padding.left - 10}
            y={yScale(tick)}
            textAnchor="end"
            alignmentBaseline="middle"
            className="text-xs fill-zinc-500"
          >
            ${formatNumber(tick, 0)}
          </text>
        </g>
      ))}
      
      {/* X-axis labels */}
      {xTicks.map((tick, i) => (
        <text
          key={i}
          x={xScale(tick)}
          y={height - 10}
          textAnchor="middle"
          className="text-xs fill-zinc-500"
        >
          {tick}
        </text>
      ))}
      
      {/* Confidence bands */}
      <path
        d={`${createPath(confidenceBands.upper95)} L ${xScale(dataLength - 1)} ${yScale(confidenceBands.lower95[dataLength - 1])} ${confidenceBands.lower95.map((v, i) => `L ${xScale(dataLength - 1 - i)} ${yScale(confidenceBands.lower95[dataLength - 1 - i])}`).join(" ")} Z`}
        fill="rgba(234, 179, 8, 0.05)"
        stroke="none"
      />
      <path
        d={`${createPath(confidenceBands.upper75)} L ${xScale(dataLength - 1)} ${yScale(confidenceBands.lower75[dataLength - 1])} ${confidenceBands.lower75.map((v, i) => `L ${xScale(dataLength - 1 - i)} ${yScale(confidenceBands.lower75[dataLength - 1 - i])}`).join(" ")} Z`}
        fill="rgba(34, 197, 94, 0.08)"
        stroke="none"
      />
      
      {/* Individual runs (spaghetti) */}
      {showIndividualRuns && displayRuns.map((run, i) => (
        <path
          key={run.id}
          d={createPath(run.equityCurve)}
          fill="none"
          stroke={run.ruined ? "rgba(239, 68, 68, 0.15)" : "rgba(139, 92, 246, 0.08)"}
          strokeWidth={1}
        />
      ))}
      
      {/* Confidence band lines */}
      <path
        d={createPath(confidenceBands.upper95)}
        fill="none"
        stroke="#eab308"
        strokeWidth={1.5}
        strokeDasharray="4,4"
        opacity={0.6}
      />
      <path
        d={createPath(confidenceBands.lower95)}
        fill="none"
        stroke="#ef4444"
        strokeWidth={2}
        opacity={0.8}
      />
      <path
        d={createPath(confidenceBands.median)}
        fill="none"
        stroke="#22c55e"
        strokeWidth={2.5}
      />
      
      {/* Starting balance line */}
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={yScale(startingBalance)}
        y2={yScale(startingBalance)}
        stroke="#71717a"
        strokeWidth={1}
        strokeDasharray="8,4"
      />
      
      {/* Legend */}
      <g transform={`translate(${width - padding.right - 120}, ${padding.top})`}>
        <rect x={0} y={0} width={130} height={80} fill="rgba(24, 24, 27, 0.9)" rx={4} />
        <line x1={10} x2={30} y1={15} y2={15} stroke="#22c55e" strokeWidth={2.5} />
        <text x={35} y={18} className="text-xs fill-zinc-300">Median</text>
        
        <line x1={10} x2={30} y1={32} y2={32} stroke="#eab308" strokeWidth={1.5} strokeDasharray="4,4" />
        <text x={35} y={35} className="text-xs fill-zinc-300">95th %ile</text>
        
        <line x1={10} x2={30} y1={49} y2={49} stroke="#ef4444" strokeWidth={2} />
        <text x={35} y={52} className="text-xs fill-zinc-300">5th %ile (Worst)</text>
        
        <line x1={10} x2={30} y1={66} y2={66} stroke="#71717a" strokeWidth={1} strokeDasharray="8,4" />
        <text x={35} y={69} className="text-xs fill-zinc-300">Starting</text>
      </g>
      
      {/* Axis labels */}
      <text
        x={padding.left - 50}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90, ${padding.left - 50}, ${height / 2})`}
        className="text-xs fill-zinc-400"
      >
        Account Balance (USD)
      </text>
      <text
        x={width / 2}
        y={height - 2}
        textAnchor="middle"
        className="text-xs fill-zinc-400"
      >
        Trade Number
      </text>
    </svg>
  );
});

// ============================================================================
// Drawdown Heatmap Component
// ============================================================================

const DrawdownHeatmap = memo(function DrawdownHeatmap({
  probabilities,
}: {
  probabilities: { threshold: number; probability: number }[];
}) {
  const getColor = (prob: number): string => {
    if (prob <= 5) return "bg-green-500/30 border-green-600/50";
    if (prob <= 20) return "bg-lime-500/30 border-lime-600/50";
    if (prob <= 40) return "bg-yellow-500/30 border-yellow-600/50";
    if (prob <= 60) return "bg-orange-500/30 border-orange-600/50";
    if (prob <= 80) return "bg-red-500/30 border-red-600/50";
    return "bg-red-700/40 border-red-700/60";
  };
  
  const getTextColor = (prob: number): string => {
    if (prob <= 5) return "text-green-400";
    if (prob <= 20) return "text-lime-400";
    if (prob <= 40) return "text-yellow-400";
    if (prob <= 60) return "text-orange-400";
    return "text-red-400";
  };
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {probabilities.map(({ threshold, probability }) => (
        <div
          key={threshold}
          className={`p-3 rounded-lg border text-center transition-all hover:scale-105 ${getColor(probability)}`}
        >
          <div className="text-xs text-zinc-400 mb-1">
            {">"}
            {threshold}% DD
          </div>
          <div className={`text-lg font-mono font-bold ${getTextColor(probability)}`}>
            {formatNumber(probability, 1)}%
          </div>
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// Risk Slider Component
// ============================================================================

const RiskSlider = memo(function RiskSlider({
  value,
  onChange,
  riskOfRuinByRisk,
}: {
  value: number;
  onChange: (value: number) => void;
  riskOfRuinByRisk: { risk: number; ruin: number }[];
}) {
  const currentRuin = riskOfRuinByRisk.find(r => r.risk === value)?.ruin ?? 0;
  
  const getSliderColor = () => {
    if (currentRuin <= 1) return "accent-green-500";
    if (currentRuin <= 5) return "accent-yellow-500";
    if (currentRuin <= 20) return "accent-orange-500";
    return "accent-red-500";
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">Risk Per Trade</label>
        <span className="text-lg font-mono font-bold text-orange-400">{value}%</span>
      </div>
      
      <input
        type="range"
        min={0.25}
        max={5}
        step={0.25}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-700 ${getSliderColor()}`}
      />
      
      <div className="flex justify-between text-xs text-zinc-500">
        <span>0.25%</span>
        <span>2.5%</span>
        <span>5%</span>
      </div>
      
      <div className={`p-3 rounded-lg border text-center ${
        currentRuin <= 1 ? "bg-green-950/30 border-green-800/50" :
        currentRuin <= 5 ? "bg-yellow-950/30 border-yellow-800/50" :
        currentRuin <= 20 ? "bg-orange-950/30 border-orange-800/50" :
        "bg-red-950/30 border-red-800/50"
      }`}>
        <span className="text-xs text-zinc-400 block">Risk of Ruin at {value}% Risk</span>
        <span className={`text-2xl font-mono font-bold ${getRiskColor(currentRuin)}`}>
          {formatNumber(currentRuin, 2)}%
        </span>
      </div>
    </div>
  );
});

// ============================================================================
// Trade Stats Panel Component
// ============================================================================

const TradeStatsPanel = memo(function TradeStatsPanel({
  stats,
}: {
  stats: SimulationResult["tradeStats"];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <span className="text-zinc-500 text-xs block">Total Trades</span>
        <p className="font-mono font-semibold text-zinc-200 text-lg">{stats.totalTrades}</p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <span className="text-zinc-500 text-xs block">Win Rate</span>
        <p className="font-mono font-semibold text-zinc-200 text-lg">{formatNumber(stats.winRate, 1)}%</p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <span className="text-zinc-500 text-xs block">Avg Win</span>
        <p className="font-mono font-semibold text-green-400 text-lg">+{formatNumber(stats.avgWin, 2)}R</p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <span className="text-zinc-500 text-xs block">Avg Loss</span>
        <p className="font-mono font-semibold text-red-400 text-lg">-{formatNumber(stats.avgLoss, 2)}R</p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <span className="text-zinc-500 text-xs block">Expectancy</span>
        <p className={`font-mono font-semibold text-lg ${stats.expectancy >= 0 ? "text-green-400" : "text-red-400"}`}>
          {stats.expectancy >= 0 ? "+" : ""}{formatNumber(stats.expectancy, 3)}R
        </p>
      </div>
      <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
        <span className="text-zinc-500 text-xs block">Profit Factor</span>
        <p className={`font-mono font-semibold text-lg ${stats.profitFactor >= 1 ? "text-green-400" : "text-red-400"}`}>
          {stats.profitFactor === Infinity ? "Inf" : formatNumber(stats.profitFactor, 2)}
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// Result Section Component
// ============================================================================

const ResultSection = memo(function ResultSection({
  result,
  form,
  trades,
  isRunning,
  sliderRisk,
  onSliderRiskChange,
  onCopy,
  onRunSimulation,
}: {
  result: SimulationResult | null;
  form: FormState;
  trades: TradeData[];
  isRunning: boolean;
  sliderRisk: number;
  onSliderRiskChange: (value: number) => void;
  onCopy: () => void;
  onRunSimulation: () => void;
}) {
  // Calculate risk of ruin for different risk levels
  const riskOfRuinByRisk = useMemo(() => {
    if (!result || trades.length === 0) return [];
    
    const risks = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
    return risks.map(risk => {
      // Simplified estimation based on Kelly Criterion approximation
      const stats = result.tradeStats;
      const p = stats.winRate / 100;
      const b = stats.avgWin;
      const a = stats.avgLoss;
      
      // Risk of ruin approximation
      const edge = p * b - (1 - p) * a;
      if (edge <= 0) return { risk, ruin: 100 };
      
      // Simplified formula - in production would run actual simulation
      const ruinEstimate = Math.max(0, Math.min(100, 
        100 * Math.pow(Math.max(0, (1 - edge) / (1 + edge)), (100 / risk))
      ));
      
      return { risk, ruin: ruinEstimate };
    });
  }, [result, trades]);

  if (!result) {
    return (
      <ResultDisplay title="Simulation Results">
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
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">
            Enter your trade data and click Run Simulation
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Paste your R-multiples or use the sample data
          </p>
          <Button 
            onClick={onRunSimulation} 
            disabled={isRunning || trades.length === 0}
            className="mt-4"
          >
            {isRunning ? "Running..." : "Run Simulation"}
          </Button>
        </div>
      </ResultDisplay>
    );
  }

  const stats = result.statistics;
  const isProfitable = stats.medianReturn > 0;

  return (
    <>
      {/* Summary Card */}
      <div className={`bg-gradient-to-br ${
        isProfitable
          ? "from-green-950/30 to-emerald-950/20 border-green-800/30"
          : "from-red-950/30 to-rose-950/20 border-red-800/30"
      } border rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isProfitable ? "text-green-400" : "text-red-400"}`}>
            Simulation Complete
          </h3>
          <div className="flex gap-2">
            <Button variant="secondary" size="small" onClick={onRunSimulation} disabled={isRunning}>
              {isRunning ? "Running..." : "Re-run"}
            </Button>
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
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className={`rounded-lg p-3 text-center ${isProfitable ? "bg-green-900/30" : "bg-red-900/30"}`}>
            <span className="text-zinc-400 text-xs block">Median Return</span>
            <p className={`text-xl font-mono font-bold ${getReturnColor(stats.medianReturn)}`}>
              {formatPercent(stats.medianReturn)}
            </p>
          </div>
          <div className="bg-red-900/20 rounded-lg p-3 text-center">
            <span className="text-zinc-400 text-xs block">Worst Case (5%)</span>
            <p className={`text-xl font-mono font-bold ${getReturnColor(stats.percentile5Return)}`}>
              {formatPercent(stats.percentile5Return)}
            </p>
          </div>
          <div className={`rounded-lg p-3 text-center ${stats.riskOfRuin <= 1 ? "bg-green-900/30" : stats.riskOfRuin <= 10 ? "bg-yellow-900/30" : "bg-red-900/30"}`}>
            <span className="text-zinc-400 text-xs block">Risk of Ruin</span>
            <p className={`text-xl font-mono font-bold ${getRiskColor(stats.riskOfRuin)}`}>
              {formatNumber(stats.riskOfRuin, 2)}%
            </p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
            <span className="text-zinc-400 text-xs block">Max Consec. Losses</span>
            <p className="text-xl font-mono font-bold text-orange-400">
              {Math.round(stats.maxConsecutiveLosses)}
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-zinc-500 text-xs">Simulations</span>
            <p className="font-mono text-zinc-200">{result.runs.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-zinc-500 text-xs">Profitable</span>
            <p className="font-mono text-zinc-200">{formatNumber(stats.profitableProbability, 1)}%</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-zinc-500 text-xs">Best Case</span>
            <p className="font-mono text-green-400">{formatPercent(stats.percentile95Return)}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-zinc-500 text-xs">Avg Drawdown</span>
            <p className="font-mono text-yellow-400">{formatNumber(stats.avgMaxDrawdown, 1)}%</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-zinc-500 text-xs">Worst DD</span>
            <p className="font-mono text-red-400">{formatNumber(stats.worstMaxDrawdown, 1)}%</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-zinc-500 text-xs">Max Stagnation</span>
            <p className="font-mono text-zinc-200">{Math.round(stats.maxStagnation)} trades</p>
          </div>
        </div>
      </div>

      {/* Trade Statistics */}
      <ResultDisplay title="Input Trade Statistics">
        <p className="text-xs text-zinc-500 mb-4">
          Statistical analysis of your {result.tradeStats.totalTrades} input trades
        </p>
        <TradeStatsPanel stats={result.tradeStats} />
      </ResultDisplay>

      {/* Spaghetti Chart */}
      <ResultDisplay title="Equity Curve Distribution">
        <p className="text-xs text-zinc-500 mb-4">
          {result.runs.length} simulated equity curves with confidence bands
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <SpaghettiChart
            runs={result.runs}
            confidenceBands={result.confidenceBands}
            startingBalance={parseFloat(form.startingBalance)}
            width={700}
            height={350}
          />
        </div>
      </ResultDisplay>

      {/* Drawdown Probability Heatmap */}
      <ResultDisplay title="Drawdown Probability Matrix">
        <p className="text-xs text-zinc-500 mb-4">
          Probability of experiencing various drawdown levels
        </p>
        <DrawdownHeatmap probabilities={stats.drawdownProbabilities} />
      </ResultDisplay>

      {/* Risk Optimizer */}
      <ResultDisplay title="Risk Optimizer">
        <p className="text-xs text-zinc-500 mb-4">
          Adjust risk to see impact on probability of ruin
        </p>
        <RiskSlider
          value={sliderRisk}
          onChange={onSliderRiskChange}
          riskOfRuinByRisk={riskOfRuinByRisk}
        />
      </ResultDisplay>

      {/* Detailed Statistics */}
      <ResultDisplay title="Detailed Statistics">
        <div className="space-y-2">
          <ResultRow
            label="Median Return"
            value={formatPercent(stats.medianReturn)}
            description="50th percentile outcome"
            isPositive={stats.medianReturn > 0}
            isNegative={stats.medianReturn < 0}
          />
          <ResultRow
            label="Mean Return"
            value={formatPercent(stats.meanReturn)}
            description="Average across all simulations"
            isPositive={stats.meanReturn > 0}
            isNegative={stats.meanReturn < 0}
          />
          <ResultRow
            label="25th Percentile"
            value={formatPercent(stats.percentile25Return)}
            description="Lower quartile outcome"
            isPositive={stats.percentile25Return > 0}
            isNegative={stats.percentile25Return < 0}
          />
          <ResultRow
            label="75th Percentile"
            value={formatPercent(stats.percentile75Return)}
            description="Upper quartile outcome"
            isPositive={stats.percentile75Return > 0}
            isNegative={stats.percentile75Return < 0}
          />
          <ResultRow
            label="Worst Case (5th %ile)"
            value={formatPercent(stats.percentile5Return)}
            description="95% confidence lower bound"
            isNegative
          />
          <ResultRow
            label="Best Case (95th %ile)"
            value={formatPercent(stats.percentile95Return)}
            description="95% confidence upper bound"
            isPositive
          />
          <ResultRow
            label="Risk of Ruin"
            value={`${formatNumber(stats.riskOfRuin, 3)}%`}
            description="Probability of 90%+ account loss"
            highlight
            colorClass={`${getRiskColor(stats.riskOfRuin)} border-orange-800/50 bg-orange-950/20`}
          />
          <ResultRow
            label="Probability of Profit"
            value={`${formatNumber(stats.profitableProbability, 1)}%`}
            description="Chance of ending above starting balance"
            isPositive={stats.profitableProbability > 50}
            isNegative={stats.profitableProbability < 50}
          />
          <ResultRow
            label="Max Consecutive Losses"
            value={Math.round(stats.maxConsecutiveLosses)}
            suffix="trades"
            description="Worst losing streak observed"
            highlight
          />
          <ResultRow
            label="Avg Stagnation Period"
            value={Math.round(stats.avgStagnation)}
            suffix="trades"
            description="Average time underwater"
          />
        </div>
      </ResultDisplay>

      {/* Formula Reference */}
      <ResultDisplay title="Understanding the Results">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Key Metrics</h4>
            <ul className="space-y-1.5 text-zinc-500">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <span><strong className="text-zinc-300">Median Return:</strong> The most likely outcome (50% chance of doing better/worse)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <span><strong className="text-zinc-300">5th Percentile:</strong> Worst realistic outcome - plan for this</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                <span><strong className="text-zinc-300">Risk of Ruin:</strong> Chance of losing 90%+ of account</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-medium">Psychological Prep</h4>
            <ul className="space-y-1.5 text-zinc-500">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                <span><strong className="text-zinc-300">Max Losing Streak:</strong> Prepare mentally for {Math.round(stats.maxConsecutiveLosses)} losses in a row</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span><strong className="text-zinc-300">Stagnation:</strong> Strategy may go sideways for ~{Math.round(stats.avgStagnation)} trades</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span><strong className="text-zinc-300">Drawdowns:</strong> Expect {formatNumber(stats.avgMaxDrawdown, 0)}% drawdowns regularly</span>
              </li>
            </ul>
          </div>
        </div>
      </ResultDisplay>

      {/* Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-amber-400">Important Disclaimer</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Monte Carlo simulations provide probabilistic outcomes based on historical data. 
          Future results will differ due to changing market conditions, psychology, and execution. 
          Past performance does not guarantee future results. Use as one tool among many for risk assessment.
        </p>
      </div>
    </>
  );
});

// ============================================================================
// Form Section Components
// ============================================================================

const FormSection = memo(function FormSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="space-y-4">
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
        disabled={!collapsible}
      >
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>
        {collapsible && (
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {(!collapsible || isOpen) && children}
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
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        isActive
          ? "bg-orange-500/20 text-orange-400 border border-orange-800"
          : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
      }`}
    >
      {label}
    </button>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function MonteCarloSimulator() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [tradeInput, setTradeInput] = useState<string>(DEFAULT_TRADES);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [sliderRisk, setSliderRisk] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse trades from input
  const trades = useMemo(() => {
    let parsed = parseTradeData(tradeInput);
    if (form.excludeOutliers && parsed.length > 0) {
      parsed = filterOutliers(parsed, parseFloat(form.outlierPercentile));
    }
    return parsed;
  }, [tradeInput, form.excludeOutliers, form.outlierPercentile]);

  // Auto-dismiss errors
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

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Form field handlers
  const handleFieldChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === "checkbox" 
          ? (target as HTMLInputElement).checked 
          : target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  // Handle trade input change
  const handleTradeInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTradeInput(e.target.value);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTradeInput(content);
      setSuccessMessage(`Loaded ${file.name}`);
    };
    reader.onerror = () => {
      setErrors(prev => [...prev, {
        id: generateId(),
        field: "File Upload",
        message: "Failed to read file",
        timestamp: Date.now(),
      }]);
    };
    reader.readAsText(file);
  }, []);

  // Apply preset
  const handleApplyPreset = useCallback((preset: typeof PRESET_SCENARIOS[0]) => {
    setForm((prev) => ({
      ...prev,
      riskPercent: preset.risk,
      tradesPerSimulation: preset.trades,
      simulationCount: preset.sims,
    }));
  }, []);

  // Run simulation
  const handleRunSimulation = useCallback(() => {
    if (trades.length === 0) {
      setErrors(prev => [...prev, {
        id: generateId(),
        field: "Trade Data",
        message: "Please enter at least one trade",
        timestamp: Date.now(),
      }]);
      return;
    }

    setIsRunning(true);

    // Run in next tick to allow UI update
    setTimeout(() => {
      try {
        const simResult = runMonteCarloSimulation(trades, {
          startingBalance: parseFloat(form.startingBalance),
          riskPercent: parseFloat(form.riskPercent),
          simulationCount: parseInt(form.simulationCount),
          tradesPerSimulation: parseInt(form.tradesPerSimulation),
          useCompounding: form.useCompounding,
          mode: form.simulationMode === "both" ? "resample" : form.simulationMode,
          spreadSlippage: parseFloat(form.spreadSlippage),
          enableSpreadChaos: form.enableSpreadChaos,
          chaosFrequency: parseFloat(form.chaosFrequency),
          chaosMagnitude: parseFloat(form.chaosMagnitude),
          swapCostPerTrade: parseFloat(form.swapCostPerTrade),
          circuitBreakerEnabled: form.circuitBreakerEnabled,
          circuitBreakerThreshold: parseFloat(form.circuitBreakerThreshold),
          circuitBreakerAction: parseFloat(form.circuitBreakerAction),
        });

        setResult(simResult);
        setSliderRisk(parseFloat(form.riskPercent));
        setSuccessMessage(`Completed ${form.simulationCount} simulations`);
      } catch (error) {
        setErrors(prev => [...prev, {
          id: generateId(),
          field: "Simulation Error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        }]);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, [trades, form]);

  // Copy results
  const handleCopy = useCallback(() => {
    if (!result) return;

    const stats = result.statistics;
    const lines = [
      "Monte Carlo Simulation Results",
      "",
      "Settings:",
      `  Starting Balance: $${formatNumber(parseFloat(form.startingBalance))}`,
      `  Risk Per Trade: ${form.riskPercent}%`,
      `  Simulations: ${form.simulationCount}`,
      `  Trades Per Sim: ${form.tradesPerSimulation}`,
      `  Compounding: ${form.useCompounding ? "Enabled" : "Disabled"}`,
      "",
      "Trade Statistics:",
      `  Total Input Trades: ${result.tradeStats.totalTrades}`,
      `  Win Rate: ${formatNumber(result.tradeStats.winRate, 1)}%`,
      `  Expectancy: ${formatNumber(result.tradeStats.expectancy, 3)}R`,
      "",
      "Simulation Results:",
      `  Median Return: ${formatPercent(stats.medianReturn)}`,
      `  5th Percentile (Worst): ${formatPercent(stats.percentile5Return)}`,
      `  95th Percentile (Best): ${formatPercent(stats.percentile95Return)}`,
      `  Risk of Ruin: ${formatNumber(stats.riskOfRuin, 3)}%`,
      `  Probability of Profit: ${formatNumber(stats.profitableProbability, 1)}%`,
      `  Avg Max Drawdown: ${formatNumber(stats.avgMaxDrawdown, 1)}%`,
      `  Max Consecutive Losses: ${Math.round(stats.maxConsecutiveLosses)}`,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setSuccessMessage("Results copied to clipboard!");
    }).catch(() => {
      setErrors(prev => [...prev, {
        id: generateId(),
        field: "Copy Failed",
        message: "Could not copy to clipboard",
        timestamp: Date.now(),
      }]);
    });
  }, [result, form]);

  // Reset
  const handleReset = useCallback(() => {
    setForm(DEFAULT_STATE);
    setTradeInput(DEFAULT_TRADES);
    setResult(null);
    setSliderRisk(1);
  }, []);

  // Check active preset
  const activePreset = useMemo(() => {
    return PRESET_SCENARIOS.find(
      (p) =>
        p.risk === form.riskPercent &&
        p.trades === form.tradesPerSimulation &&
        p.sims === form.simulationCount
    )?.label || null;
  }, [form.riskPercent, form.tradesPerSimulation, form.simulationCount]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Monte Carlo Simulator</h1>
            <p className="mt-2 text-zinc-400">
              Run thousands of randomized trade simulations to analyze probability distributions,
              drawdown risks, and expected outcomes based on your actual trading history.
            </p>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Sticky on Desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-6 space-y-6">
                <FormSection title="Trade Data (R-Multiples)">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-300">
                        Paste R-multiples (comma or newline separated)
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          Upload CSV
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <textarea
                      value={tradeInput}
                      onChange={handleTradeInputChange}
                      rows={4}
                      placeholder="-1.0, +2.3, -1.0, +1.5, -1.0, +3.2..."
                      className="w-full bg-neutral-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono resize-none"
                    />
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{trades.length} trades parsed</span>
                      {trades.length > 0 && (
                        <span>
                          Win rate: {formatNumber((trades.filter(t => t.rMultiple > 0).length / trades.length) * 100, 1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Account Settings">
                  <FormRow>
                    <Input
                      label="Starting Balance"
                      type="number"
                      value={form.startingBalance}
                      onChange={handleFieldChange("startingBalance")}
                      suffix="USD"
                      min="0"
                      placeholder="10000"
                    />
                    <Input
                      label="Risk Per Trade"
                      type="number"
                      value={form.riskPercent}
                      onChange={handleFieldChange("riskPercent")}
                      suffix="%"
                      min="0.1"
                      max="10"
                      step="0.1"
                    />
                  </FormRow>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="useCompounding"
                      checked={form.useCompounding}
                      onChange={handleFieldChange("useCompounding")}
                      className="w-4 h-4 rounded border-zinc-600 bg-neutral-900 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="useCompounding" className="text-sm text-zinc-300">
                      Enable compounding (dynamic position sizing)
                    </label>
                  </div>
                </FormSection>

                <FormSection title="Simulation Settings">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs text-zinc-500">Quick Presets:</span>
                    {PRESET_SCENARIOS.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        label={preset.label}
                        isActive={activePreset === preset.label}
                        onClick={() => handleApplyPreset(preset)}
                      />
                    ))}
                  </div>
                  <FormRow>
                    <Input
                      label="Number of Simulations"
                      type="number"
                      value={form.simulationCount}
                      onChange={handleFieldChange("simulationCount")}
                      min="100"
                      max="10000"
                      step="100"
                      helper="More = better accuracy"
                    />
                    <Input
                      label="Trades Per Simulation"
                      type="number"
                      value={form.tradesPerSimulation}
                      onChange={handleFieldChange("tradesPerSimulation")}
                      min="10"
                      max="1000"
                      step="10"
                      helper="Projection period"
                    />
                  </FormRow>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Simulation Mode</label>
                    <select
                      value={form.simulationMode}
                      onChange={handleFieldChange("simulationMode")}
                      className="w-full bg-neutral-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                    >
                      <option value="resample">Resample (Shuffle actual trades)</option>
                      <option value="randomized">Randomized (Normal distribution)</option>
                    </select>
                    <p className="text-xs text-zinc-500">
                      Resample tests sequence risk; Randomized generates synthetic trades
                    </p>
                  </div>
                </FormSection>

                <FormSection title="Advanced Options" collapsible defaultOpen={false}>
                  {/* Outlier Filtering */}
                  <div className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="excludeOutliers"
                        checked={form.excludeOutliers}
                        onChange={handleFieldChange("excludeOutliers")}
                        className="w-4 h-4 rounded border-zinc-600 bg-neutral-900 text-orange-500 focus:ring-orange-500"
                      />
                      <label htmlFor="excludeOutliers" className="text-sm text-zinc-300">
                        Exclude outlier wins (stress test)
                      </label>
                    </div>
                    {form.excludeOutliers && (
                      <Input
                        label="Exclude Top"
                        type="number"
                        value={form.outlierPercentile}
                        onChange={handleFieldChange("outlierPercentile")}
                        suffix="% of wins"
                        min="1"
                        max="50"
                        helper="Test without your best trades"
                      />
                    )}
                  </div>

                  {/* Spread/Slippage */}
                  <div className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <Input
                      label="Fixed Spread/Slippage Cost"
                      type="number"
                      value={form.spreadSlippage}
                      onChange={handleFieldChange("spreadSlippage")}
                      suffix="% of risk"
                      min="0"
                      max="50"
                      step="0.1"
                      helper="Deducted from each trade"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="enableSpreadChaos"
                        checked={form.enableSpreadChaos}
                        onChange={handleFieldChange("enableSpreadChaos")}
                        className="w-4 h-4 rounded border-zinc-600 bg-neutral-900 text-orange-500 focus:ring-orange-500"
                      />
                      <label htmlFor="enableSpreadChaos" className="text-sm text-zinc-300">
                        Enable chaos factor (random spread spikes)
                      </label>
                    </div>
                    {form.enableSpreadChaos && (
                      <FormRow>
                        <Input
                          label="Chaos Frequency"
                          type="number"
                          value={form.chaosFrequency}
                          onChange={handleFieldChange("chaosFrequency")}
                          suffix="% of trades"
                          min="1"
                          max="50"
                        />
                        <Input
                          label="Chaos Magnitude"
                          type="number"
                          value={form.chaosMagnitude}
                          onChange={handleFieldChange("chaosMagnitude")}
                          suffix="R"
                          min="0.1"
                          max="2"
                          step="0.1"
                        />
                      </FormRow>
                    )}
                  </div>

                  {/* Swap Costs */}
                  <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <Input
                      label="Swap Cost Per Trade"
                      type="number"
                      value={form.swapCostPerTrade}
                      onChange={handleFieldChange("swapCostPerTrade")}
                      suffix="% of risk"
                      min="0"
                      max="10"
                      step="0.1"
                      helper="Rollover/swap drag for swing trades"
                    />
                  </div>

                  {/* Circuit Breaker */}
                  <div className="space-y-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="circuitBreakerEnabled"
                        checked={form.circuitBreakerEnabled}
                        onChange={handleFieldChange("circuitBreakerEnabled")}
                        className="w-4 h-4 rounded border-zinc-600 bg-neutral-900 text-orange-500 focus:ring-orange-500"
                      />
                      <label htmlFor="circuitBreakerEnabled" className="text-sm text-zinc-300">
                        Enable circuit breaker rule
                      </label>
                    </div>
                    {form.circuitBreakerEnabled && (
                      <FormRow>
                        <Input
                          label="Drawdown Threshold"
                          type="number"
                          value={form.circuitBreakerThreshold}
                          onChange={handleFieldChange("circuitBreakerThreshold")}
                          suffix="%"
                          min="5"
                          max="50"
                          helper="Trigger point"
                        />
                        <Input
                          label="Risk Reduction"
                          type="number"
                          value={form.circuitBreakerAction}
                          onChange={handleFieldChange("circuitBreakerAction")}
                          suffix="%"
                          min="10"
                          max="100"
                          helper="Cut risk by this %"
                        />
                      </FormRow>
                    )}
                  </div>
                </FormSection>

                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleRunSimulation} 
                    disabled={isRunning || trades.length === 0}
                  >
                    {isRunning ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Running...
                      </span>
                    ) : (
                      "Run Simulation"
                    )}
                  </Button>
                  <Button variant="secondary" size="small" onClick={handleReset}>
                    Reset
                  </Button>
                </div>

                {/* Tips */}
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>- Use <strong className="text-zinc-400">real trade data</strong> for accurate results</li>
                    <li>- <strong className="text-zinc-400">Exclude outliers</strong> to stress test your edge</li>
                    <li>- Check <strong className="text-zinc-400">5th percentile</strong> - plan for the worst</li>
                    <li>- Keep <strong className="text-zinc-400">Risk of Ruin</strong> below 1% for safety</li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              <ResultSection
                result={result}
                form={form}
                trades={trades}
                isRunning={isRunning}
                sliderRisk={sliderRisk}
                onSliderRiskChange={setSliderRisk}
                onCopy={handleCopy}
                onRunSimulation={handleRunSimulation}
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