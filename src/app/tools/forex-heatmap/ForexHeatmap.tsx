// File: src/app/tools/forex-heatmap/ForexHeatmap.tsx
"use client";

import { useEffect, useRef, useState, memo, useCallback, useMemo } from "react";
import { ResultDisplay } from "@/components/ui/ResultDisplay";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

// ============================================================================
// Types
// ============================================================================

type SidebarTab = "session" | "pairs" | "currencies";
type RegimeId = "risk-on" | "risk-off" | "usd-strength" | "jpy-bid";

interface CurrencyInfo {
  code: string;
  name: string;
  region: string;
  regionColor: string;
  dotColor: string;
}

interface ForexSession {
  id: string;
  name: string;
  shortName: string;
  startUTC: number; // hour in UTC (0–23)
  endUTC: number;   // hour in UTC (0–23), if < startUTC it wraps midnight
  color: string;
  bgColor: string;
  ring: string;
  currencies: string[];
  description: string;
}

interface MarketRegime {
  id: RegimeId;
  label: string;
  emoji: string;
  strongCurrencies: string[];
  weakCurrencies: string[];
  pairsToWatch: string[];
  description: string;
  borderColor: string;
  bgColor: string;
  labelColor: string;
  dotColor: string;
}

// ============================================================================
// Constants
// ============================================================================

const CURRENCIES: CurrencyInfo[] = [
  { code: "EUR", name: "Euro",               region: "Europe",  regionColor: "text-blue-400",  dotColor: "bg-blue-400"  },
  { code: "USD", name: "US Dollar",           region: "America", regionColor: "text-green-400", dotColor: "bg-green-400" },
  { code: "GBP", name: "British Pound",       region: "Europe",  regionColor: "text-blue-400",  dotColor: "bg-blue-400"  },
  { code: "JPY", name: "Japanese Yen",        region: "Asia",    regionColor: "text-rose-400",  dotColor: "bg-rose-400"  },
  { code: "AUD", name: "Australian Dollar",   region: "Pacific", regionColor: "text-amber-400", dotColor: "bg-amber-400" },
  { code: "CAD", name: "Canadian Dollar",     region: "America", regionColor: "text-green-400", dotColor: "bg-green-400" },
  { code: "CHF", name: "Swiss Franc",         region: "Europe",  regionColor: "text-blue-400",  dotColor: "bg-blue-400"  },
  { code: "NZD", name: "New Zealand Dollar",  region: "Pacific", regionColor: "text-amber-400", dotColor: "bg-amber-400" },
  { code: "CNY", name: "Chinese Yuan",        region: "Asia",    regionColor: "text-rose-400",  dotColor: "bg-rose-400"  },
];

// UTC hour-based sessions. If endUTC < startUTC, the session wraps past midnight.
const SESSIONS: ForexSession[] = [
  {
    id: "sydney",
    name: "Sydney",
    shortName: "SYD",
    startUTC: 21,
    endUTC: 6,
    color: "text-amber-400",
    bgColor: "bg-amber-400",
    ring: "ring-amber-500/40",
    currencies: ["AUD", "NZD"],
    description: "Low-medium volume. AUD & NZD pairs most active.",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    shortName: "TYO",
    startUTC: 0,
    endUTC: 9,
    color: "text-rose-400",
    bgColor: "bg-rose-400",
    ring: "ring-rose-500/40",
    currencies: ["JPY", "AUD", "NZD"],
    description: "Asian session. JPY pairs dominant. Range-bound conditions.",
  },
  {
    id: "london",
    name: "London",
    shortName: "LDN",
    startUTC: 7,
    endUTC: 16,
    color: "text-blue-400",
    bgColor: "bg-blue-400",
    ring: "ring-blue-500/40",
    currencies: ["EUR", "GBP", "CHF"],
    description: "Peak European liquidity. EUR, GBP & CHF pairs most active.",
  },
  {
    id: "newyork",
    name: "New York",
    shortName: "NYC",
    startUTC: 12,
    endUTC: 21,
    color: "text-green-400",
    bgColor: "bg-green-400",
    ring: "ring-green-500/40",
    currencies: ["USD", "CAD"],
    description: "High liquidity. USD & CAD pairs dominant. Major US releases.",
  },
];

// London/NY overlap: 12:00–16:00 UTC
const OVERLAP = { start: 12, end: 16, label: "London / NY Overlap", desc: "Peak global liquidity" };

const MARKET_REGIMES: MarketRegime[] = [
  {
    id: "risk-on",
    label: "Risk-On",
    emoji: "📈",
    strongCurrencies: ["AUD", "NZD", "GBP", "CAD"],
    weakCurrencies: ["USD", "JPY", "CHF"],
    pairsToWatch: ["AUD/USD", "NZD/USD", "GBP/JPY", "AUD/JPY"],
    description: "Investors seek yield. High-beta currencies rise; safe havens fall.",
    borderColor: "border-emerald-800/50",
    bgColor: "bg-emerald-950/25",
    labelColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
  {
    id: "risk-off",
    label: "Risk-Off",
    emoji: "🛡",
    strongCurrencies: ["JPY", "CHF", "USD"],
    weakCurrencies: ["AUD", "NZD", "GBP"],
    pairsToWatch: ["USD/JPY ↓", "EUR/JPY ↓", "GBP/JPY ↓", "AUD/USD ↓"],
    description: "Fear drives flows to safe havens. JPY, CHF, USD get bid.",
    borderColor: "border-rose-800/50",
    bgColor: "bg-rose-950/25",
    labelColor: "text-rose-400",
    dotColor: "bg-rose-400",
  },
  {
    id: "usd-strength",
    label: "USD Dominance",
    emoji: "💵",
    strongCurrencies: ["USD"],
    weakCurrencies: ["EUR", "GBP", "AUD", "NZD"],
    pairsToWatch: ["EUR/USD ↓", "GBP/USD ↓", "AUD/USD ↓", "NZD/USD ↓"],
    description: "Broad dollar strength. Triggered by hawkish Fed, strong US data.",
    borderColor: "border-green-800/50",
    bgColor: "bg-green-950/25",
    labelColor: "text-green-400",
    dotColor: "bg-green-400",
  },
  {
    id: "jpy-bid",
    label: "Yen Bid",
    emoji: "🇯🇵",
    strongCurrencies: ["JPY"],
    weakCurrencies: ["GBP", "AUD", "NZD", "EUR"],
    pairsToWatch: ["GBP/JPY ↓", "EUR/JPY ↓", "AUD/JPY ↓", "USD/JPY ↓"],
    description: "Yen strength across the board. Classic risk-off or BoJ intervention.",
    borderColor: "border-violet-800/50",
    bgColor: "bg-violet-950/25",
    labelColor: "text-violet-400",
    dotColor: "bg-violet-400",
  },
];

// Canonical pair ordering (determines which currency leads the pair name)
const PAIR_ORDER = ["EUR", "GBP", "AUD", "NZD", "USD", "CAD", "CHF", "JPY", "CNY"];

// ============================================================================
// Utility Functions
// ============================================================================

function isSessionOpen(session: ForexSession, utcHour: number): boolean {
  const { startUTC, endUTC } = session;
  if (endUTC > startUTC) {
    return utcHour >= startUTC && utcHour < endUTC;
  }
  // Wraps midnight
  return utcHour >= startUTC || utcHour < endUTC;
}

function minutesToNextOpen(session: ForexSession, utcHour: number, utcMin: number): number {
  const currentMins = utcHour * 60 + utcMin;
  const openMins = session.startUTC * 60;
  if (openMins > currentMins) {
    return openMins - currentMins;
  }
  return 24 * 60 - currentMins + openMins;
}

function getPairSuggestion(strong: string, weak: string) {
  if (strong === weak) return null;
  const si = PAIR_ORDER.indexOf(strong);
  const wi = PAIR_ORDER.indexOf(weak);
  if (si < wi) {
    // strong is quoted first → BUY strong/weak
    return { pair: `${strong}/${weak}`, direction: "BUY" as const, base: strong, quote: weak };
  }
  // weak is quoted first → SELL weak/strong
  return { pair: `${weak}/${strong}`, direction: "SELL" as const, base: weak, quote: strong };
}

function getRelatedPairs(strong: string, weak: string): string[] {
  const related: string[] = [];
  // Other pairs involving the strong currency as base (or weak as quote)
  CURRENCIES.filter((c) => c.code !== strong && c.code !== weak).forEach((c) => {
    const s1 = getPairSuggestion(strong, c.code);
    if (s1) related.push(`${s1.direction === "BUY" ? "▲" : "▼"} ${s1.pair}`);
  });
  return related.slice(0, 4);
}

function formatCountdown(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// ============================================================================
// TradingView Widget
// ============================================================================

const HeatmapWidget = memo(function HeatmapWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: 580,
      currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "CNY"],
      isTransparent: true,
      colorTheme: "dark",
      locale: "en",
      backgroundColor: "rgba(0,0,0,0)",
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ minHeight: 600 }}
    />
  );
});

// ============================================================================
// Session Clock Component
// ============================================================================

const SessionClock = memo(function SessionClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcSec  = now.getUTCSeconds();

  const utcString = [
    String(utcHour).padStart(2, "0"),
    String(utcMin).padStart(2, "0"),
    String(utcSec).padStart(2, "0"),
  ].join(":");

  const openSessions = SESSIONS.filter((s) => isSessionOpen(s, utcHour));
  const isOverlap = utcHour >= OVERLAP.start && utcHour < OVERLAP.end;

  return (
    <div className="space-y-3">
      {/* UTC Clock */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">UTC Time</span>
        <span className="font-mono font-bold text-zinc-100 tabular-nums text-base tracking-wider">
          {utcString}
        </span>
      </div>

      {/* Overlap banner */}
      {isOverlap && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-950/40 border border-indigo-700/50 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-300">{OVERLAP.label}</p>
            <p className="text-[10px] text-indigo-400/70">{OVERLAP.desc}</p>
          </div>
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-2">
        {SESSIONS.map((session) => {
          const open = isSessionOpen(session, utcHour);
          const minsToOpen = open ? 0 : minutesToNextOpen(session, utcHour, utcMin);

          return (
            <div
              key={session.id}
              className={`rounded-lg border px-3 py-2.5 transition-all duration-300 ${
                open
                  ? `bg-zinc-800/50 border-zinc-700 ring-1 ${session.ring}`
                  : "bg-zinc-900/30 border-zinc-800/50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${session.bgColor} ${
                      open ? "animate-pulse" : "opacity-30"
                    }`}
                  />
                  <span className={`text-sm font-semibold ${open ? session.color : "text-zinc-500"}`}>
                    {session.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    open
                      ? "bg-zinc-700/80 text-zinc-200"
                      : "bg-zinc-900/80 text-zinc-600"
                  }`}
                >
                  {open ? "OPEN" : `in ${formatCountdown(minsToOpen)}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-4">
                {session.currencies.map((c) => (
                  <span
                    key={c}
                    className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded ${
                      open ? "bg-zinc-700/60 text-zinc-300" : "bg-zinc-800/40 text-zinc-600"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active session summary */}
      {openSessions.length > 0 && (
        <p className="text-[10px] text-zinc-600 text-center">
          {openSessions.map((s) => s.name).join(" & ")} session
          {openSessions.length > 1 ? "s" : ""} active
        </p>
      )}

      <p className="text-[10px] text-zinc-700 text-center">
        Hours shown in UTC. May shift ±1h during DST.
      </p>
    </div>
  );
});

// ============================================================================
// Pair Builder Component
// ============================================================================

const PairBuilder = memo(function PairBuilder() {
  const currencyCodes = CURRENCIES.map((c) => c.code);
  const [strong, setStrong] = useState("EUR");
  const [weak, setWeak]     = useState("USD");

  const handleSwap = useCallback(() => {
    setStrong(weak);
    setWeak(strong);
  }, [strong, weak]);

  const suggestion = useMemo(() => getPairSuggestion(strong, weak), [strong, weak]);
  const related = useMemo(() => {
    if (!suggestion) return [];
    return getRelatedPairs(strong, weak);
  }, [strong, weak]);

  const isSame = strong === weak;

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 leading-relaxed">
        Read the heatmap — pick the strongest and weakest currencies, then get the exact pair and direction to trade.
      </p>

      {/* Currency selectors */}
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Strongest (greenest row)
          </label>
          <select
            value={strong}
            onChange={(e) => setStrong(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-semibold text-emerald-400 focus:outline-none focus:border-emerald-600 transition-colors"
          >
            {currencyCodes.map((c) => (
              <option key={c} value={c}>{c} — {CURRENCIES.find((x) => x.code === c)?.name}</option>
            ))}
          </select>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all duration-150"
            title="Swap currencies"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Weakest (reddest row)
          </label>
          <select
            value={weak}
            onChange={(e) => setWeak(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-semibold text-rose-400 focus:outline-none focus:border-rose-600 transition-colors"
          >
            {currencyCodes.map((c) => (
              <option key={c} value={c}>{c} — {CURRENCIES.find((x) => x.code === c)?.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result */}
      {isSame ? (
        <div className="px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center">
          <p className="text-xs text-zinc-500">Select different currencies to get a suggestion.</p>
        </div>
      ) : suggestion ? (
        <div
          className={`rounded-xl border p-4 ${
            suggestion.direction === "BUY"
              ? "bg-emerald-950/30 border-emerald-800/50"
              : "bg-rose-950/30 border-rose-800/50"
          }`}
        >
          {/* Primary suggestion */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Suggested Trade</p>
              <p className="text-xl font-bold text-zinc-100 font-mono">{suggestion.pair}</p>
            </div>
            <span
              className={`text-lg font-black px-3 py-1.5 rounded-lg ${
                suggestion.direction === "BUY"
                  ? "bg-emerald-800/60 text-emerald-300"
                  : "bg-rose-800/60 text-rose-300"
              }`}
            >
              {suggestion.direction}
            </span>
          </div>

          <p className="text-xs text-zinc-400 mb-3">
            <span className="text-emerald-400 font-semibold">{strong}</span> strong ·{" "}
            <span className="text-rose-400 font-semibold">{weak}</span> weak
          </p>

          {/* Related pairs */}
          {related.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-1.5">
                Also watch ({strong} involved)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {related.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-mono font-semibold px-2 py-1 bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 rounded"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Reminder */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-950/20 border border-amber-800/30 rounded-lg">
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Always confirm with price action and a key level before entering.
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// Currency Badge
// ============================================================================

const CurrencyBadge = memo(function CurrencyBadge({ currency }: { currency: CurrencyInfo }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currency.dotColor}`} />
        <span className="text-sm font-bold text-zinc-100 font-mono">{currency.code}</span>
      </div>
      <div className="text-right">
        <span className="text-xs text-zinc-400 block leading-tight">{currency.name}</span>
        <span className={`text-xs ${currency.regionColor}`}>{currency.region}</span>
      </div>
    </div>
  );
});

// ============================================================================
// Market Regime Card
// ============================================================================

const RegimeCard = memo(function RegimeCard({
  regime,
  isSelected,
  onSelect,
}: {
  regime: MarketRegime;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01] ${
        isSelected
          ? `${regime.bgColor} ${regime.borderColor} ring-1 ring-inset ring-white/5`
          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{regime.emoji}</span>
        <span className={`text-sm font-bold ${isSelected ? regime.labelColor : "text-zinc-300"}`}>
          {regime.label}
        </span>
        {isSelected && (
          <span className="ml-auto w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-zinc-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {isSelected && (
        <div className="space-y-2.5 mt-3 pt-3 border-t border-zinc-700/50">
          <p className="text-xs text-zinc-400 leading-relaxed">{regime.description}</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase font-medium mb-1">Strong</p>
              <div className="flex flex-wrap gap-1">
                {regime.strongCurrencies.map((c) => (
                  <span key={c} className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase font-medium mb-1">Weak</p>
              <div className="flex flex-wrap gap-1">
                {regime.weakCurrencies.map((c) => (
                  <span key={c} className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-900/50 text-rose-400 border border-rose-800/50 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-zinc-600 uppercase font-medium mb-1">Pairs to Watch</p>
            <div className="flex flex-wrap gap-1.5">
              {regime.pairsToWatch.map((p) => (
                <span key={p} className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-zinc-800/60 text-zinc-300 border border-zinc-700/40 rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </button>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function ForexHeatmap() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("session");
  const [selectedRegime, setSelectedRegime] = useState<RegimeId | null>(null);

  const handleRegimeSelect = useCallback((id: RegimeId) => {
    setSelectedRegime((prev) => (prev === id ? null : id));
  }, []);

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: "session",    label: "Sessions" },
    { id: "pairs",      label: "Pair Builder" },
    { id: "currencies", label: "Currencies" },
  ];

  return (
    <section className="py-8 md:py-12">
      <Container>
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Forex Heatmap</h1>
          <p className="mt-2 text-zinc-400 max-w-2xl">
            Live currency strength map across all major pairs. Identify which currencies are
            dominating and which are under pressure — then use the tools below to find your trade.
          </p>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Sidebar ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <Card className="p-5 space-y-4">

              {/* Live indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                    Live Market Data
                  </span>
                </div>
                <span className="text-xs text-zinc-600">TradingView</span>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-zinc-900/60 rounded-lg border border-zinc-800">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarTab(tab.id)}
                    className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all duration-150 ${
                      sidebarTab === tab.id
                        ? "bg-zinc-700 text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: Session Clock */}
              {sidebarTab === "session" && <SessionClock />}

              {/* Tab: Pair Builder */}
              {sidebarTab === "pairs" && <PairBuilder />}

              {/* Tab: Currencies */}
              {sidebarTab === "currencies" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Tracked Currencies
                  </h3>
                  <div className="space-y-1.5">
                    {CURRENCIES.map((c) => (
                      <CurrencyBadge key={c.code} currency={c} />
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    9 major currencies · 4 global regions · real-time data
                  </p>
                </div>
              )}
            </Card>

            {/* Pro tip (always visible) */}
            <div className="bg-fuchsia-950/20 border border-fuchsia-800/30 rounded-lg p-3.5">
              <h4 className="text-xs font-semibold text-fuchsia-400 mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Pro Tips
              </h4>
              <ul className="text-[11px] text-zinc-500 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                  <span>Pair the <strong className="text-zinc-400">greenest</strong> row vs the <strong className="text-zinc-400">reddest</strong> for highest-conviction setups</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                  <span>Best entries come during <strong className="text-zinc-400">London/NY overlap</strong> (12–16 UTC) — use the Session tab</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                  <span><strong className="text-zinc-400">JPY and CHF</strong> often move together as safe havens — check the Yen Bid regime below</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="lg:col-span-2 space-y-6">

            {/* Widget */}
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700/50 bg-zinc-800/40">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                  <span className="text-xs font-semibold text-zinc-300">Live Forex Heatmap</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>9 currencies</span>
                  <span className="h-3 w-px bg-zinc-700" />
                  <span>Real-time</span>
                  <span className="h-3 w-px bg-zinc-700" />
                  <span>Powered by TradingView</span>
                </div>
              </div>
              <div className="p-4">
                <HeatmapWidget />
              </div>
            </Card>

            {/* Market Regime Scanner */}
            <Card className="p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-zinc-200">Market Regime Scanner</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Match the heatmap pattern to a regime, then see which currencies and pairs are in play.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MARKET_REGIMES.map((regime) => (
                  <RegimeCard
                    key={regime.id}
                    regime={regime}
                    isSelected={selectedRegime === regime.id}
                    onSelect={() => handleRegimeSelect(regime.id)}
                  />
                ))}
              </div>
            </Card>

            {/* How to Read */}
            <ResultDisplay title="How to Read the Heatmap">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div className="space-y-3">
                  <h4 className="text-zinc-300 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0" />
                    Reading the Colors
                  </h4>
                  <ul className="space-y-2 text-zinc-500 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <span><strong className="text-zinc-300">Deep green</strong> — strong buying momentum. Buy pairs where this is the base.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0" />
                      <span><strong className="text-zinc-300">Deep red</strong> — strong selling pressure. Sell pairs where this is the base.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 mt-1 shrink-0" />
                      <span><strong className="text-zinc-300">Gray / white</strong> — no directional bias. Avoid as the driving leg of a trade.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400 mt-1 shrink-0" />
                      <span>Hover any cell on the heatmap to see the exact percentage change for that pair.</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-zinc-300 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0" />
                    4-Step Trade Selection
                  </h4>
                  <ul className="space-y-2 text-zinc-500 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-300">1</span>
                      <span>Find the <strong className="text-zinc-300">strongest</strong> (greenest) currency row</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-300">2</span>
                      <span>Find the <strong className="text-zinc-300">weakest</strong> (reddest) currency row</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-300">3</span>
                      <span>Use the <strong className="text-zinc-300">Pair Builder</strong> tab to get the exact pair and direction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-300">4</span>
                      <span>Confirm with <strong className="text-zinc-300">price action</strong> or a key level before entering</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ResultDisplay>

            {/* Disclaimer */}
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-400">Important Disclaimer</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    The heatmap displays live data from TradingView and reflects real-time relative
                    currency performance. Currency strength is a momentum indicator, not a guarantee
                    of future price direction. Always combine heatmap readings with price action
                    analysis, key levels, and proper risk management. Never risk more than you can
                    afford to lose.
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
