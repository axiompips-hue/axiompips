// File: src/components/dashboard/SessionClock.tsx
"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface Session {
  name: string;
  city: string;
  openUTC: number;   // hour in UTC (0-23)
  closeUTC: number;  // hour in UTC (0-23)
  color: string;
  activeBg: string;
  activeBorder: string;
  activeDot: string;
  inactiveDot: string;
  pairs: string;
}

// ============================================================================
// Session Definitions (UTC hours)
// ============================================================================

const SESSIONS: Session[] = [
  {
    name: "Sydney",
    city: "Sydney",
    openUTC: 21,   // 9pm UTC (previous day) - displayed via 22:00 UTC to 7:00 UTC
    closeUTC: 6,   // 6am UTC next day
    color: "text-blue-400",
    activeBg: "bg-blue-950/40",
    activeBorder: "border-blue-700/60",
    activeDot: "bg-blue-400",
    inactiveDot: "bg-zinc-600",
    pairs: "AUD/USD, NZD/USD",
  },
  {
    name: "Tokyo",
    city: "Tokyo",
    openUTC: 0,    // midnight UTC
    closeUTC: 9,   // 9am UTC
    color: "text-red-400",
    activeBg: "bg-red-950/40",
    activeBorder: "border-red-700/60",
    activeDot: "bg-red-400",
    inactiveDot: "bg-zinc-600",
    pairs: "USD/JPY, EUR/JPY",
  },
  {
    name: "London",
    city: "London",
    openUTC: 8,    // 8am UTC
    closeUTC: 17,  // 5pm UTC
    color: "text-amber-400",
    activeBg: "bg-amber-950/40",
    activeBorder: "border-amber-700/60",
    activeDot: "bg-amber-400",
    inactiveDot: "bg-zinc-600",
    pairs: "EUR/USD, GBP/USD",
  },
  {
    name: "New York",
    city: "New York",
    openUTC: 13,   // 1pm UTC
    closeUTC: 22,  // 10pm UTC
    color: "text-green-400",
    activeBg: "bg-green-950/40",
    activeBorder: "border-green-700/60",
    activeDot: "bg-green-400",
    inactiveDot: "bg-zinc-600",
    pairs: "USD/CAD, USD/CHF",
  },
];

// ============================================================================
// Utility
// ============================================================================

function isSessionOpen(session: Session, utcHour: number): boolean {
  if (session.openUTC < session.closeUTC) {
    // Normal range (e.g. 8 to 17)
    return utcHour >= session.openUTC && utcHour < session.closeUTC;
  } else {
    // Wraps midnight (e.g. Sydney: 22 to 6)
    return utcHour >= session.openUTC || utcHour < session.closeUTC;
  }
}

function getTimeUntilOpen(session: Session, utcHour: number, utcMinute: number): string {
  const currentMins = utcHour * 60 + utcMinute;
  const openMins = session.openUTC * 60;
  let diff = openMins - currentMins;
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function getTimeUntilClose(session: Session, utcHour: number, utcMinute: number): string {
  const currentMins = utcHour * 60 + utcMinute;
  const closeMins = session.closeUTC * 60;
  let diff = closeMins - currentMins;
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

// ============================================================================
// Session Badge
// ============================================================================

const SessionBadge = memo(function SessionBadge({
  session,
  utcHour,
  utcMinute,
}: {
  session: Session;
  utcHour: number;
  utcMinute: number;
}) {
  const isOpen = isSessionOpen(session, utcHour);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
        isOpen ? `${session.activeBg} ${session.activeBorder}` : "bg-zinc-900/30 border-zinc-800/50"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative flex-shrink-0">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isOpen ? session.activeDot : session.inactiveDot}`}
          />
          {isOpen && (
            <div
              className={`absolute inset-0 rounded-full ${session.activeDot} animate-ping opacity-60`}
            />
          )}
        </div>
        <div>
          <p className={`text-sm font-semibold ${isOpen ? session.color : "text-zinc-500"}`}>
            {session.name}
          </p>
          <p className="text-xs text-zinc-600">{session.pairs}</p>
        </div>
      </div>
      <div className="text-right">
        {isOpen ? (
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${session.activeBg} ${session.color}`}>
              OPEN
            </span>
            <p className="text-xs text-zinc-500 mt-0.5">
              closes in {getTimeUntilClose(session, utcHour, utcMinute)}
            </p>
          </div>
        ) : (
          <div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
              CLOSED
            </span>
            <p className="text-xs text-zinc-600 mt-0.5">
              opens in {getTimeUntilOpen(session, utcHour, utcMinute)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function SessionClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    // SSR skeleton
    return (
      <div className="bg-neutral-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-zinc-700 rounded animate-pulse" />
          <div className="w-32 h-4 bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcTime = `${String(utcHour).padStart(2, "0")}:${String(utcMinute).padStart(2, "0")} UTC`;

  const openSessions = SESSIONS.filter((s) => isSessionOpen(s, utcHour));
  const isOverlap = openSessions.length >= 2;

  return (
    <div className="bg-neutral-900 border border-zinc-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-zinc-200">Market Sessions</h3>
        </div>
        <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
          {utcTime}
        </span>
      </div>

      {/* Overlap Badge */}
      {isOverlap && (
        <div className="mb-3 px-3 py-2 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs text-amber-400 font-medium">
            Session overlap: {openSessions.map((s) => s.name).join(" + ")} &#8212; Higher liquidity
          </p>
        </div>
      )}

      {openSessions.length === 0 && (
        <div className="mb-3 px-3 py-2 bg-zinc-800/50 border border-zinc-700/40 rounded-lg">
          <p className="text-xs text-zinc-500">All major sessions closed. Weekend or off-hours.</p>
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-2">
        {SESSIONS.map((session) => (
          <SessionBadge
            key={session.name}
            session={session}
            utcHour={utcHour}
            utcMinute={utcMinute}
          />
        ))}
      </div>

      <Link
        href="/tools/session-volatility"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 transition-colors"
      >
        Full session analysis
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
