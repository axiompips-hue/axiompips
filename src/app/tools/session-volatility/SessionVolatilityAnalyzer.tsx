// File: src/app/tools/session-volatility/SessionVolatilityAnalyzer.tsx
"use client";

import { useState, useMemo, useCallback, memo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

// ============================================================================
// Types
// ============================================================================

interface CurrencyPair {
  symbol: string;
  name: string;
  baseVolatility: number;
  avgSpread: number;
}

interface LiquidityZone {
  id: string;
  name: string;
  shortName: string;
  startHour: number;
  endHour: number;
  intensity: 1 | 2 | 3 | 4;
  description: string;
}

interface HourlyData {
  hour: number;
  avgPips: number;
  minPips: number;
  maxPips: number;
}

interface AnalysisResult {
  zone: {
    current: LiquidityZone;
    next: LiquidityZone;
    minutesToNext: number;
  };
  volatility: {
    hourly: HourlyData[];
    current: HourlyData;
  };
  adr: {
    average: number;
    today: number;
    saturation: number;
    remaining: number;
  };
  rvq: {
    value: number;
    description: string;
  };
  ser: {
    spread: number;
    expectedMove: number;
    ratio: number;
  };
  continuity: {
    previousSession: string;
    previousDirection: string;
    previousPips: number;
    currentSession: string;
    trendProbability: number;
    reversalProbability: number;
    insight: string;
  };
}

// ============================================================================
// Data
// ============================================================================

const CURRENCY_PAIRS: CurrencyPair[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", baseVolatility: 28, avgSpread: 0.8 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", baseVolatility: 35, avgSpread: 1.2 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", baseVolatility: 30, avgSpread: 0.9 },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", baseVolatility: 26, avgSpread: 1.5 },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", baseVolatility: 32, avgSpread: 1.0 },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", baseVolatility: 28, avgSpread: 1.4 },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", baseVolatility: 30, avgSpread: 1.6 },
  { symbol: "EUR/GBP", name: "Euro / British Pound", baseVolatility: 24, avgSpread: 1.3 },
  { symbol: "EUR/JPY", name: "Euro / Japanese Yen", baseVolatility: 38, avgSpread: 1.5 },
  { symbol: "GBP/JPY", name: "British Pound / Japanese Yen", baseVolatility: 52, avgSpread: 2.2 },
  { symbol: "AUD/JPY", name: "Australian Dollar / Japanese Yen", baseVolatility: 40, avgSpread: 1.8 },
  { symbol: "EUR/AUD", name: "Euro / Australian Dollar", baseVolatility: 42, avgSpread: 2.0 },
  { symbol: "XAU/USD", name: "Gold / US Dollar", baseVolatility: 120, avgSpread: 3.0 },
];

const LIQUIDITY_ZONES: LiquidityZone[] = [
  { id: "asian", name: "Asian Session", shortName: "Asian", startHour: 0, endHour: 6, intensity: 1, description: "Low volume, range-bound trading" },
  { id: "pre-london", name: "Pre-London", shortName: "Pre-LDN", startHour: 6, endHour: 7, intensity: 2, description: "Frankfurt opens, volume building" },
  { id: "london", name: "London Session", shortName: "London", startHour: 7, endHour: 12, intensity: 3, description: "Peak European liquidity" },
  { id: "overlap", name: "London-NY Overlap", shortName: "Overlap", startHour: 12, endHour: 16, intensity: 4, description: "Maximum global liquidity" },
  { id: "fix", name: "London Fix", shortName: "Fix", startHour: 16, endHour: 17, intensity: 4, description: "4PM London fix, volatile" },
  { id: "ny-pm", name: "NY Afternoon", shortName: "NY PM", startHour: 17, endHour: 21, intensity: 2, description: "US-only, moderate volume" },
  { id: "twilight", name: "Market Twilight", shortName: "Twilight", startHour: 21, endHour: 24, intensity: 1, description: "Low volume transition" },
];

const VOLATILITY_BY_HOUR = [
  0.30, 0.25, 0.22, 0.20, 0.25, 0.40,
  0.60, 0.95, 1.15, 1.25, 1.18, 1.10,
  1.45, 1.55, 1.48, 1.32, 1.15, 0.88,
  0.70, 0.58, 0.48, 0.40, 0.35, 0.32,
];

// ============================================================================
// Utilities
// ============================================================================

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function formatTime(hours: number, minutes: number = 0): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getZoneForHour(hour: number): LiquidityZone {
  return LIQUIDITY_ZONES.find(z => hour >= z.startHour && hour < z.endHour) || LIQUIDITY_ZONES[0];
}

function getNextZone(currentId: string): LiquidityZone {
  const index = LIQUIDITY_ZONES.findIndex(z => z.id === currentId);
  return LIQUIDITY_ZONES[(index + 1) % LIQUIDITY_ZONES.length];
}

function isDSTActive(region: "US" | "UK" | "AU"): boolean {
  const now = new Date();
  const month = now.getMonth();
  const date = now.getDate();
  const day = now.getDay();
  const prevSunday = date - day;

  if (region === "US") {
    if (month < 2 || month > 10) return false;
    if (month > 2 && month < 10) return true;
    return month === 2 ? prevSunday >= 8 : prevSunday < 1;
  }
  if (region === "UK") {
    if (month < 2 || month > 9) return false;
    if (month > 2 && month < 9) return true;
    const lastDay = new Date(now.getFullYear(), month + 1, 0).getDate();
    return month === 2 ? prevSunday >= lastDay - 6 : prevSunday < lastDay - 6;
  }
  if (month > 3 && month < 9) return false;
  if (month > 9 || month < 3) return true;
  return month === 9 ? prevSunday >= 1 : prevSunday < 1;
}

function generateAnalysis(pair: CurrencyPair, hour: number, minute: number, daySeed: number): AnalysisResult {
  const currentZone = getZoneForHour(hour);
  const nextZone = getNextZone(currentZone.id);
  const minutesToNext = (currentZone.endHour - hour - 1) * 60 + (60 - minute);

  const hourlyData: HourlyData[] = VOLATILITY_BY_HOUR.map((mult, h) => {
    const variance = 0.85 + seededRandom(daySeed + h + pair.symbol.charCodeAt(0)) * 0.3;
    const avg = Math.round(pair.baseVolatility * mult * variance);
    return { hour: h, avgPips: avg, minPips: Math.round(avg * 0.4), maxPips: Math.round(avg * 1.8) };
  });

  const adrVariance = 0.85 + seededRandom(daySeed) * 0.3;
  const averageADR = Math.round(pair.baseVolatility * 3.2 * adrVariance);
  const hourProgress = (hour + minute / 60) / 24;
  const todayFactor = 0.8 + seededRandom(daySeed + 100) * 0.4;
  const todayRange = Math.round(averageADR * hourProgress * todayFactor);
  const saturation = Math.round((todayRange / averageADR) * 100);

  const rvqValue = Math.round((0.3 + seededRandom(daySeed + hour * 7) * 2.2) * 100) / 100;
  let rvqDescription: string;
  if (rvqValue < 0.5) rvqDescription = "Dead market - avoid breakouts";
  else if (rvqValue < 0.8) rvqDescription = "Below average - reduce size";
  else if (rvqValue < 1.3) rvqDescription = "Normal conditions";
  else if (rvqValue < 2.0) rvqDescription = "Elevated - use wider stops";
  else rvqDescription = "Extreme - maximum caution";

  const spreadMult = 0.75 + seededRandom(daySeed + hour) * 0.5;
  const currentSpread = Math.round(pair.avgSpread * spreadMult * 10) / 10;
  const expectedMove = hourlyData[hour].avgPips;
  const serRatio = expectedMove > 0 ? Math.round((expectedMove / currentSpread) * 10) / 10 : 0;

  const sessions = ["Asian", "London", "New York"];
  const directions = ["Bullish", "Bearish", "Flat"];
  const currSessionIdx = hour < 7 ? 0 : hour < 13 ? 1 : 2;
  const prevSessionIdx = (currSessionIdx + 2) % 3;
  const prevDirection = directions[Math.floor(seededRandom(daySeed) * 3)];
  const prevPips = Math.round(10 + seededRandom(daySeed + 10) * 60);

  let trendProb: number, reversalProb: number, insight: string;
  if (prevDirection === "Flat") {
    trendProb = 75; reversalProb = 25;
    insight = "Flat sessions often lead to breakouts";
  } else if (prevPips > 50) {
    trendProb = 40; reversalProb = 60;
    insight = "Large moves increase reversal probability";
  } else {
    trendProb = 55; reversalProb = 45;
    insight = "Watch for continuation patterns";
  }

  return {
    zone: { current: currentZone, next: nextZone, minutesToNext },
    volatility: { hourly: hourlyData, current: hourlyData[hour] },
    adr: { average: averageADR, today: todayRange, saturation, remaining: Math.max(0, averageADR - todayRange) },
    rvq: { value: rvqValue, description: rvqDescription },
    ser: { spread: currentSpread, expectedMove, ratio: serRatio },
    continuity: {
      previousSession: sessions[prevSessionIdx],
      previousDirection: prevDirection,
      previousPips: prevPips,
      currentSession: sessions[currSessionIdx],
      trendProbability: trendProb,
      reversalProbability: reversalProb,
      insight,
    },
  };
}

// ============================================================================
// Components
// ============================================================================

const StatusBadge = memo(function StatusBadge({ 
  type, 
  children 
}: { 
  type: "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-green-500/15 text-green-400 border-green-500/25",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    danger: "bg-red-500/15 text-red-400 border-red-500/25",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${styles[type]}`}>
      {children}
    </span>
  );
});

const StatCard = memo(function StatCard({
  label,
  value,
  unit,
  description,
  status,
}: {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  status?: "success" | "warning" | "danger" | "neutral";
}) {
  const valueColors = {
    success: "text-green-400",
    warning: "text-amber-400",
    danger: "text-red-400",
    neutral: "text-zinc-100",
  };

  return (
    <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold font-mono ${valueColors[status || "neutral"]}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
      {description && <p className="text-xs text-zinc-500 mt-1">{description}</p>}
    </div>
  );
});

const ProgressBar = memo(function ProgressBar({
  value,
  max,
  showMarker,
  markerPosition,
  color,
}: {
  value: number;
  max: number;
  showMarker?: boolean;
  markerPosition?: number;
  color: "green" | "amber" | "red" | "purple";
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div
        className={`absolute inset-y-0 left-0 ${colors[color]} rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
      {showMarker && markerPosition !== undefined && (
        <div
          className="absolute inset-y-0 w-0.5 bg-white/60"
          style={{ left: `${(markerPosition / max) * 100}%` }}
        />
      )}
    </div>
  );
});

const HourlyVolatilityChart = memo(function HourlyVolatilityChart({
  data,
  currentHour,
}: {
  data: HourlyData[];
  currentHour: number;
}) {
  const maxValue = Math.max(...data.map(d => d.avgPips));

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-0.5 h-32" role="img" aria-label="Hourly volatility chart">
        {data.map((item) => {
          const height = (item.avgPips / maxValue) * 100;
          const isCurrent = item.hour === currentHour;

          return (
            <div
              key={item.hour}
              className="flex-1 flex flex-col items-center group"
              role="listitem"
              aria-label={`${formatTime(item.hour)}: ${item.avgPips} pips average`}
            >
              <div className="w-full relative">
                <div
                  className={`w-full rounded-sm transition-colors ${
                    isCurrent ? "bg-purple-500" : "bg-zinc-600 group-hover:bg-zinc-500"
                  }`}
                  style={{ height: `${Math.max(height, 4)}px` }}
                />
                
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                    <p className="font-medium text-zinc-200">{formatTime(item.hour)} UTC</p>
                    <p className="text-zinc-400">{item.avgPips} pips avg</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-[10px] text-zinc-500 px-1">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </div>
  );
});

const SessionTimeline = memo(function SessionTimeline({ currentHour }: { currentHour: number }) {
  const intensityColors = {
    1: "bg-blue-500/20 border-blue-500/30",
    2: "bg-amber-500/20 border-amber-500/30",
    3: "bg-green-500/20 border-green-500/30",
    4: "bg-purple-500/20 border-purple-500/30",
  };

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg overflow-hidden border border-zinc-700/50" role="list" aria-label="Trading sessions">
        {LIQUIDITY_ZONES.map((zone) => {
          const width = ((zone.endHour - zone.startHour) / 24) * 100;
          const isActive = currentHour >= zone.startHour && currentHour < zone.endHour;

          return (
            <div
              key={zone.id}
              className={`relative py-2 px-1 border-r border-zinc-700/30 last:border-r-0 transition-all ${
                intensityColors[zone.intensity]
              } ${isActive ? "ring-2 ring-inset ring-white/30" : ""}`}
              style={{ width: `${width}%` }}
              role="listitem"
              aria-current={isActive ? "time" : undefined}
            >
              <p className="text-[10px] font-medium text-zinc-300 truncate text-center">
                {zone.shortName}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500/50" /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500/50" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500/50" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500/50" /> Peak
        </span>
      </div>
    </div>
  );
});

const DSTStatus = memo(function DSTStatus() {
  const regions = [
    { label: "US", active: isDSTActive("US") },
    { label: "UK", active: isDSTActive("UK") },
    { label: "AU", active: isDSTActive("AU") },
  ];

  return (
    <div className="flex gap-2" role="list" aria-label="Daylight saving time status">
      {regions.map(({ label, active }) => (
        <span
          key={label}
          className={`text-xs px-2 py-1 rounded ${
            active ? "bg-green-500/15 text-green-400" : "bg-zinc-700/50 text-zinc-400"
          }`}
          role="listitem"
        >
          {label}: {active ? "DST" : "Standard"}
        </span>
      ))}
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function SessionVolatilityAnalyzer() {
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize time only on client to prevent hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  // Live clock
  useEffect(() => {
    if (isLive && currentTime) {
      intervalRef.current = setInterval(() => setCurrentTime(new Date()), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive, currentTime]);

  // Derived values
  const pair = useMemo(
    () => CURRENCY_PAIRS.find(p => p.symbol === selectedPair) || CURRENCY_PAIRS[0],
    [selectedPair]
  );

  // Calculate time values only when currentTime is available
  const timeData = useMemo(() => {
    if (!currentTime) return null;
    return {
      hour: currentTime.getUTCHours(),
      minute: currentTime.getUTCMinutes(),
      second: currentTime.getUTCSeconds(),
      daySeed: Math.floor(currentTime.getTime() / 86400000),
      dateString: currentTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      isoString: currentTime.toISOString(),
    };
  }, [currentTime]);

  const analysis = useMemo(() => {
    if (!timeData) return null;
    return generateAnalysis(pair, timeData.hour, timeData.minute, timeData.daySeed);
  }, [pair, timeData]);

  // Status helpers
  const getADRStatus = useCallback((saturation: number) => {
    if (saturation >= 100) return "danger";
    if (saturation >= 70) return "warning";
    return "success";
  }, []);

  const getRVQStatus = useCallback((value: number) => {
    if (value < 0.5 || value >= 2.0) return "danger";
    if (value < 0.8 || value >= 1.3) return "warning";
    return "success";
  }, []);

  const getSERStatus = useCallback((ratio: number) => {
    if (ratio >= 15) return "success";
    if (ratio >= 8) return "warning";
    return "danger";
  }, []);

  const getOverallAssessment = useCallback(() => {
    if (!analysis) return { status: "info" as const, message: "Loading..." };
    
    const adrStatus = getADRStatus(analysis.adr.saturation);
    const rvqStatus = getRVQStatus(analysis.rvq.value);
    const serStatus = getSERStatus(analysis.ser.ratio);

    if (adrStatus === "danger" || serStatus === "danger") {
      return { status: "danger" as const, message: "Poor trading conditions" };
    }
    if (rvqStatus === "danger" || adrStatus === "warning" || serStatus === "warning") {
      return { status: "warning" as const, message: "Exercise caution" };
    }
    return { status: "success" as const, message: "Favorable conditions" };
  }, [analysis, getADRStatus, getRVQStatus, getSERStatus]);

  const overall = getOverallAssessment();

  // Handlers
  const handlePairChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPair(e.target.value);
  }, []);

  // Loading state
  if (!currentTime || !timeData || !analysis) {
    return (
      <section className="py-8 md:py-12">
        <Container>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Loading analyzer...</p>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12">
      <Container>
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">
            Session and Volatility Analyzer
          </h1>
          <p className="mt-2 text-zinc-400 max-w-2xl">
            Analyze market sessions and volatility patterns to find optimal trading windows.
            All times are in UTC.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <Card className="p-5 space-y-5">
              {/* Pair Selection */}
              <div>
                <label htmlFor="pair-select" className="block text-sm font-medium text-zinc-300 mb-2">
                  Currency Pair
                </label>
                <select
                  id="pair-select"
                  value={selectedPair}
                  onChange={handlePairChange}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CURRENCY_PAIRS.map(p => (
                    <option key={p.symbol} value={p.symbol}>
                      {p.symbol}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clock */}
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Current Time (UTC)</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isLive ? "bg-green-500/20 text-green-400" : "bg-zinc-600 text-zinc-400"}`}>
                    {isLive ? "Live" : "Paused"}
                  </span>
                </div>
                <time className="block text-3xl font-mono font-semibold text-zinc-100" dateTime={timeData.isoString}>
                  {formatTime(timeData.hour, timeData.minute)}:{timeData.second.toString().padStart(2, "0")}
                </time>
                <p className="text-sm text-zinc-500 mt-1">
                  {timeData.dateString}
                </p>
              </div>

              {/* DST */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Daylight Saving</p>
                <DSTStatus />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  variant={isLive ? "secondary" : "primary"}
                  size="small"
                  onClick={() => setIsLive(!isLive)}
                  aria-pressed={isLive}
                >
                  {isLive ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setCurrentTime(new Date())}
                >
                  Refresh
                </Button>
              </div>

              {/* Overall Status */}
              <div className={`p-3 rounded-lg border ${
                overall.status === "success" ? "bg-green-500/10 border-green-500/30" :
                overall.status === "warning" ? "bg-amber-500/10 border-amber-500/30" :
                overall.status === "danger" ? "bg-red-500/10 border-red-500/30" :
                "bg-zinc-500/10 border-zinc-500/30"
              }`}>
                <p className="text-sm font-medium text-zinc-200">Overall: {overall.message}</p>
              </div>

              {/* Pro Tips */}
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Pro Tips
                </h4>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>- Trade during <strong className="text-zinc-400">Golden Overlap</strong> for best liquidity</li>
                  <li>- Avoid entries when <strong className="text-zinc-400">ADR exceeds 100%</strong></li>
                  <li>- <strong className="text-zinc-400">RVQ below 0.7</strong> means avoid breakout trades</li>
                  <li>- Check <strong className="text-zinc-400">SER ratio</strong> before every entry</li>
                  <li>- <strong className="text-zinc-400">London Fix</strong> (16:00 UTC) can be erratic</li>
                </ul>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Expected Move"
                value={analysis.volatility.current.avgPips}
                unit="pips"
                description="This hour"
                status={analysis.volatility.current.avgPips > 25 ? "success" : analysis.volatility.current.avgPips > 12 ? "neutral" : "warning"}
              />
              <StatCard
                label="Spread Ratio"
                value={analysis.ser.ratio}
                unit=":1"
                description="Move/Spread"
                status={getSERStatus(analysis.ser.ratio) as "success" | "warning" | "danger"}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-2 space-y-5">
            {/* Active Session */}
            <ResultDisplay title="Current Session">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-100">
                      {analysis.zone.current.name}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      {analysis.zone.current.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge type={analysis.zone.current.intensity >= 3 ? "success" : analysis.zone.current.intensity === 2 ? "warning" : "info"}>
                      {analysis.zone.current.intensity === 4 ? "Peak" : analysis.zone.current.intensity === 3 ? "High" : analysis.zone.current.intensity === 2 ? "Medium" : "Low"} Volume
                    </StatusBadge>
                    <p className="text-xs text-zinc-500 mt-2">
                      Next: {analysis.zone.next.shortName} in {formatDuration(analysis.zone.minutesToNext)}
                    </p>
                  </div>
                </div>

                <SessionTimeline currentHour={timeData.hour} />
              </div>
            </ResultDisplay>

            {/* Hourly Volatility */}
            <ResultDisplay title="Hourly Volatility Pattern">
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Historical average pip movement for {pair.symbol} throughout the day.
                  Current hour is highlighted.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Expected" value={analysis.volatility.current.avgPips} unit="pips" />
                  <StatCard label="Minimum" value={analysis.volatility.current.minPips} unit="pips" />
                  <StatCard label="Maximum" value={analysis.volatility.current.maxPips} unit="pips" />
                </div>

                <HourlyVolatilityChart data={analysis.volatility.hourly} currentHour={timeData.hour} />

                <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-lg">
                  <p className="text-sm text-zinc-300">
                    <strong className="text-purple-400">Tip:</strong>{" "}
                    {analysis.volatility.current.avgPips < 15
                      ? "Low volatility expected. Use tighter targets."
                      : analysis.volatility.current.avgPips > 35
                      ? "High volatility expected. Consider wider stops."
                      : "Normal volatility. Standard execution recommended."}
                  </p>
                </div>
              </div>
            </ResultDisplay>

            {/* ADR Analysis */}
            <ResultDisplay title="Daily Range Saturation">
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  How much of the average daily range has been used today.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Average Daily Range" value={analysis.adr.average} unit="pips" />
                  <StatCard label="Today So Far" value={analysis.adr.today} unit="pips" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">ADR Usage</span>
                    <span className={`font-medium ${
                      analysis.adr.saturation >= 100 ? "text-red-400" :
                      analysis.adr.saturation >= 70 ? "text-amber-400" : "text-green-400"
                    }`}>
                      {analysis.adr.saturation}%
                    </span>
                  </div>
                  <ProgressBar
                    value={analysis.adr.saturation}
                    max={150}
                    showMarker
                    markerPosition={100}
                    color={analysis.adr.saturation >= 100 ? "red" : analysis.adr.saturation >= 70 ? "amber" : "green"}
                  />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>0%</span>
                    <span>100% ADR</span>
                    <span>150%</span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${
                  analysis.adr.saturation >= 100 ? "bg-red-500/10 border-red-500/25" :
                  analysis.adr.saturation >= 70 ? "bg-amber-500/10 border-amber-500/25" :
                  "bg-zinc-800/50 border-zinc-700/50"
                }`}>
                  <p className="text-sm text-zinc-300">
                    {analysis.adr.saturation >= 100
                      ? "Daily range exceeded. Reversal or consolidation likely."
                      : `${analysis.adr.remaining} pips of typical daily movement remaining.`}
                  </p>
                </div>
              </div>
            </ResultDisplay>

            {/* RVQ */}
            <ResultDisplay title="Real-Time Volatility">
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Current volatility compared to the 30-day average for this time.
                </p>

                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Volatility Quotient</p>
                    <p className={`text-3xl font-mono font-bold mt-1 ${
                      analysis.rvq.value < 0.5 || analysis.rvq.value >= 2.0 ? "text-red-400" :
                      analysis.rvq.value < 0.8 || analysis.rvq.value >= 1.3 ? "text-amber-400" : "text-green-400"
                    }`}>
                      {analysis.rvq.value}x
                    </p>
                  </div>
                  <StatusBadge type={getRVQStatus(analysis.rvq.value) as "success" | "warning" | "danger"}>
                    {analysis.rvq.value < 0.5 ? "Dead" :
                     analysis.rvq.value < 0.8 ? "Low" :
                     analysis.rvq.value < 1.3 ? "Normal" :
                     analysis.rvq.value < 2.0 ? "Elevated" : "Extreme"}
                  </StatusBadge>
                </div>

                <div className="space-y-1">
                  <ProgressBar value={analysis.rvq.value} max={3} color="purple" />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Dead</span>
                    <span>Normal</span>
                    <span>Extreme</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 p-3 bg-zinc-800/50 rounded-lg">
                  {analysis.rvq.description}
                </p>
              </div>
            </ResultDisplay>

            {/* SER */}
            <ResultDisplay title="Spread Efficiency">
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Is the expected price movement worth the spread cost?
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Current Spread" value={analysis.ser.spread} unit="pips" />
                  <StatCard label="Expected Move" value={analysis.ser.expectedMove} unit="pips" />
                  <StatCard
                    label="Ratio"
                    value={analysis.ser.ratio}
                    unit=":1"
                    status={getSERStatus(analysis.ser.ratio) as "success" | "warning" | "danger"}
                  />
                </div>

                <div className={`p-3 rounded-lg border flex items-center justify-between ${
                  analysis.ser.ratio >= 15 ? "bg-green-500/10 border-green-500/25" :
                  analysis.ser.ratio >= 8 ? "bg-amber-500/10 border-amber-500/25" :
                  "bg-red-500/10 border-red-500/25"
                }`}>
                  <span className="text-sm text-zinc-300">
                    {analysis.ser.ratio >= 15 ? "Excellent trading conditions" :
                     analysis.ser.ratio >= 8 ? "Acceptable for wider targets" :
                     "Spread cost too high relative to expected move"}
                  </span>
                  <StatusBadge type={getSERStatus(analysis.ser.ratio) as "success" | "warning" | "danger"}>
                    {analysis.ser.ratio >= 15 ? "Excellent" : analysis.ser.ratio >= 8 ? "Fair" : "Poor"}
                  </StatusBadge>
                </div>
              </div>
            </ResultDisplay>

            {/* Session Continuity */}
            <ResultDisplay title="Session Continuity">
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Probability analysis based on the previous session behavior.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Previous Session</p>
                    <p className="font-medium text-zinc-200">{analysis.continuity.previousSession}</p>
                    <p className={`text-sm mt-1 ${
                      analysis.continuity.previousDirection === "Bullish" ? "text-green-400" :
                      analysis.continuity.previousDirection === "Bearish" ? "text-red-400" : "text-zinc-400"
                    }`}>
                      {analysis.continuity.previousDirection} ({analysis.continuity.previousPips} pips)
                    </p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/25 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Current Session</p>
                    <p className="font-medium text-zinc-200">{analysis.continuity.currentSession}</p>
                    <p className="text-sm text-purple-400 mt-1">In Progress</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-lg text-center">
                    <p className="text-xs text-zinc-500">Trend Continuation</p>
                    <p className="text-2xl font-mono font-bold text-green-400">{analysis.continuity.trendProbability}%</p>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-center">
                    <p className="text-xs text-zinc-500">Reversal</p>
                    <p className="text-2xl font-mono font-bold text-red-400">{analysis.continuity.reversalProbability}%</p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 p-3 bg-zinc-800/50 rounded-lg">
                  {analysis.continuity.insight}
                </p>
              </div>
            </ResultDisplay>

            {/* Quick Reference */}
            <ResultDisplay title="Quick Reference">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <h4 className="text-zinc-300 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Session Times (UTC)
                  </h4>
                  <ul className="space-y-1.5 text-zinc-500">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span><strong className="text-zinc-300">Asian:</strong> 00:00 - 06:00</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span><strong className="text-zinc-300">London:</strong> 07:00 - 16:00</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span><strong className="text-zinc-300">Overlap:</strong> 12:00 - 16:00</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span><strong className="text-zinc-300">New York:</strong> 12:00 - 21:00</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-zinc-300 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Key Metrics Guide
                  </h4>
                  <ul className="space-y-1.5 text-zinc-500">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span><strong className="text-zinc-300">ADR &lt;70%:</strong> Room to trend</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span><strong className="text-zinc-300">RVQ 0.8-1.3:</strong> Normal volatility</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span><strong className="text-zinc-300">SER &gt;15:1:</strong> Excellent efficiency</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span><strong className="text-zinc-300">SER &lt;8:1:</strong> Avoid trading</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ResultDisplay>

            {/* Disclaimer */}
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-400">Important Disclaimer</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    This tool uses simulated historical patterns for demonstration purposes. 
                    Real trading requires live market data from a broker or data provider. 
                    Past volatility patterns do not guarantee future results. 
                    Always use proper risk management and never risk more than you can afford to lose.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Container>
    </section>
  );
}