"use client";

import { useEffect, useState, useRef, useCallback, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourStep {
  id: string;
  phase: string;
  title: string;
  body: string;
  targetSelector?: string;
  cardAnchor: "center" | "bottom-center" | "right" | "left";
  tag: string;
}

// ---------------------------------------------------------------------------
// Tour content
// ---------------------------------------------------------------------------

const STEPS: TourStep[] = [
  {
    id: "welcome",
    phase: "SYSTEM BOOT",
    title: "Welcome to AxiomPips",
    body: "You have entered the most precise forex trading toolkit available. In the next few moments we will walk you through every instrument at your command.",
    cardAnchor: "center",
    tag: "01 / 08",
  },
  {
    id: "nav",
    phase: "NAVIGATION CORE",
    title: "Your Command Bar",
    body: "The top navigation gives you instant access to every section. Calculators, Tools, Journal, Settings and Premium are all one click away.",
    targetSelector: "[data-guide='nav']",
    cardAnchor: "bottom-center",
    tag: "02 / 08",
  },
  {
    id: "calculators",
    phase: "CALCULATOR SUITE",
    title: "Precision Calculators",
    body: "11 specialised calculators: Position Size, Pip Value, Margin, Risk/Reward, Profit/Loss, Break-Even, ATR, Fibonacci, DCA, Spread Cost and Swap. Every number you need, instantly.",
    targetSelector: "[data-guide='nav-calculators']",
    cardAnchor: "bottom-center",
    tag: "03 / 08",
  },
  {
    id: "tools",
    phase: "ANALYTICAL TOOLS",
    title: "Advanced Analytical Tools",
    body: "Go beyond basic math. Run Monte Carlo simulations, analyse pair correlations, model portfolio risk, simulate trading scenarios and visualise session volatility in real time.",
    targetSelector: "[data-guide='nav-tools']",
    cardAnchor: "bottom-center",
    tag: "04 / 08",
  },
  {
    id: "journal",
    phase: "TRADE JOURNAL",
    title: "Your Trading Log",
    body: "Record every trade, tag strategies, upload screenshots and let the system surface performance statistics, win rates and equity curves automatically.",
    targetSelector: "[data-guide='nav-journal']",
    cardAnchor: "bottom-center",
    tag: "05 / 08",
  },
  {
    id: "dashboard",
    phase: "MISSION CONTROL",
    title: "Your Dashboard",
    body: "The dashboard is your personal trading hub. See live forex session clocks, quick links to your most-used tools and an at-a-glance account overview.",
    cardAnchor: "center",
    tag: "06 / 08",
  },
  {
    id: "premium",
    phase: "PREMIUM ACCESS",
    title: "Unlock Full Power",
    body: "Premium removes all usage limits, unlocks CSV exports for every calculator, grants priority access to new tools and removes ads — fuel for serious traders.",
    targetSelector: "[data-guide='nav-premium']",
    cardAnchor: "bottom-center",
    tag: "07 / 08",
  },
  {
    id: "complete",
    phase: "SYSTEM ONLINE",
    title: "You Are Ready",
    body: "Every instrument is loaded and calibrated. Your edge begins now. Trade with precision.",
    cardAnchor: "center",
    tag: "08 / 08",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPaddedRect(selector: string, pad = 10): SpotlightRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: r.left - pad,
    y: r.top - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScanLines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.015) 2px, rgba(6,182,212,0.015) 4px)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function HexGrid() {
  const size = 28;
  const cols = 14;
  const rows = 8;
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}
      width="100%"
      height="100%"
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const cx = c * size * 1.75 + (r % 2 === 0 ? 0 : size * 0.875);
          const cy = r * size * 1.52;
          const pts = [0, 1, 2, 3, 4, 5]
            .map((i) => {
              const a = (Math.PI / 3) * i - Math.PI / 6;
              return `${cx + size * 0.5 * Math.cos(a)},${cy + size * 0.5 * Math.sin(a)}`;
            })
            .join(" ");
          return (
            <polygon
              key={`${r}-${c}`}
              points={pts}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="0.6"
            />
          );
        })
      )}
    </svg>
  );
}

function Particles() {
  const count = 28;
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
      width="100%"
      height="100%"
    >
      {Array.from({ length: count }).map((_, i) => {
        const cx = `${5 + (i * 93) % 90}%`;
        const cy = `${8 + (i * 71) % 84}%`;
        const dur = `${3 + (i % 5)}s`;
        const delay = `${(i * 0.37) % 3}s`;
        const r = 1 + (i % 3);
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#06b6d4" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0.7;0"
              dur={dur}
              begin={delay}
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values={`${r};${r + 1};${r}`}
              dur={dur}
              begin={delay}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
    </svg>
  );
}

function CornerBracket({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const size = 20;
  const stroke = "#06b6d4";
  const sw = 2;
  const paths: Record<string, string> = {
    tl: `M${size},0 L0,0 L0,${size}`,
    tr: `M0,0 L${size},0 L${size},${size}`,
    bl: `M${size},${size} L0,${size} L0,0`,
    br: `M0,${size} L${size},${size} L${size},0`,
  };
  const positions: Record<string, CSSProperties> = {
    tl: { top: -1, left: -1 },
    tr: { top: -1, right: -1 },
    bl: { bottom: -1, left: -1 },
    br: { bottom: -1, right: -1 },
  };
  return (
    <svg
      aria-hidden="true"
      width={size + sw}
      height={size + sw}
      style={{ position: "absolute", ...positions[corner] }}
    >
      <path d={paths[corner]} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="square" />
    </svg>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          background: "rgba(6,182,212,0.15)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg,#0891b2,#06b6d4,#22d3ee)",
            borderRadius: 2,
            boxShadow: "0 0 8px #06b6d4",
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: "#06b6d4", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
        {pct}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spotlight overlay
// ---------------------------------------------------------------------------

function SpotlightOverlay({
  rect,
  onClick,
}: {
  rect: SpotlightRect | null;
  onClick: () => void;
}) {
  if (!rect) {
    return (
      <div
        onClick={onClick}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(13,14,17,0.88)",
          zIndex: 9990,
        }}
      />
    );
  }

  const { x, y, width, height } = rect;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  return (
    <svg
      onClick={onClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9990,
        cursor: "default",
      }}
    >
      <defs>
        <mask id="ap-spotlight-mask">
          <rect width={vw} height={vh} fill="white" />
          <rect x={x} y={y} width={width} height={height} rx="8" fill="black" />
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(13,14,17,0.88)"
        mask="url(#ap-spotlight-mask)"
      />
      {/* Cyan glow border */}
      <rect
        x={x - 1}
        y={y - 1}
        width={width + 2}
        height={height + 2}
        rx="9"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <rect
        x={x - 4}
        y={y - 4}
        width={width + 8}
        height={height + 8}
        rx="12"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Step card
// ---------------------------------------------------------------------------

function StepCard({
  step,
  stepIndex,
  total,
  spotlight,
  onNext,
  onSkip,
  isLast,
  visible,
}: {
  step: TourStep;
  stepIndex: number;
  total: number;
  spotlight: SpotlightRect | null;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  visible: boolean;
}) {
  const isFirst = stepIndex === 0;
  const isComplete = step.id === "complete";

  // Card positioning
  let cardStyle: CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    width: 420,
    maxWidth: "calc(100vw - 32px)",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
    transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
  };

  if (step.cardAnchor === "center" || !spotlight) {
    cardStyle = {
      ...cardStyle,
      top: "50%",
      left: "50%",
      transform: visible
        ? "translate(-50%,-50%) scale(1)"
        : "translate(-50%,-48%) scale(0.97)",
    };
  } else if (step.cardAnchor === "bottom-center") {
    const topPos = spotlight ? spotlight.y + spotlight.height + 20 : 120;
    cardStyle = {
      ...cardStyle,
      top: Math.min(topPos, window.innerHeight - 300),
      left: "50%",
      transform: visible
        ? "translateX(-50%) translateY(0) scale(1)"
        : "translateX(-50%) translateY(8px) scale(0.97)",
    };
  }

  const isWelcome = step.id === "welcome";
  const isDone = step.id === "complete";

  return (
    <div style={cardStyle}>
      <div
        style={{
          position: "relative",
          background: "linear-gradient(135deg,#17181c 0%,#1f2128 60%,#17181c 100%)",
          border: "1px solid rgba(6,182,212,0.25)",
          borderRadius: 16,
          padding: isWelcome || isDone ? "36px 32px" : "24px 28px",
          boxShadow:
            "0 0 0 1px rgba(6,182,212,0.08), 0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(6,182,212,0.06)",
          overflow: "hidden",
        }}
      >
        <CornerBracket corner="tl" />
        <CornerBracket corner="tr" />
        <CornerBracket corner="bl" />
        <CornerBracket corner="br" />
        <ScanLines />

        {/* Glow blob */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            background: "radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Phase / tag row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.2em",
                color: "#06b6d4",
                textTransform: "uppercase",
                background: "rgba(6,182,212,0.08)",
                border: "1px solid rgba(6,182,212,0.2)",
                borderRadius: 4,
                padding: "3px 8px",
              }}
            >
              {step.phase}
            </span>
            <span
              style={{
                fontSize: 9,
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.12em",
                color: "rgba(161,161,170,0.6)",
              }}
            >
              {step.tag}
            </span>
          </div>

          {/* Title */}
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: isWelcome || isDone ? 28 : 20,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "-0.03em",
              color: "#f4f4f5",
              lineHeight: 1.2,
            }}
          >
            {isWelcome && (
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: "0.25em",
                  color: "#06b6d4",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                AxiomPips
              </span>
            )}
            {step.title}
          </h2>

          {/* Body */}
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 14,
              color: "#a1a1aa",
              lineHeight: 1.65,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {step.body}
          </p>

          {/* Progress */}
          {!isWelcome && !isDone && (
            <div style={{ marginBottom: 20 }}>
              <ProgressBar current={stepIndex} total={total} />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={onNext}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 20px",
                background: "linear-gradient(135deg,#0891b2,#06b6d4)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(6,182,212,0.3), 0 4px 12px rgba(0,0,0,0.4)",
                transition: "opacity 0.15s, box-shadow 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 30px rgba(6,182,212,0.5), 0 4px 16px rgba(0,0,0,0.4)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 20px rgba(6,182,212,0.3), 0 4px 12px rgba(0,0,0,0.4)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              {isDone ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Start Trading
                </>
              ) : isWelcome ? (
                <>
                  Begin Tour
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              ) : (
                <>
                  Next
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {!isDone && (
              <button
                onClick={onSkip}
                style={{
                  padding: "11px 16px",
                  background: "transparent",
                  color: "#71717a",
                  border: "1px solid rgba(39,39,42,0.8)",
                  borderRadius: 10,
                  fontSize: 12,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(63,63,70,0.8)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#71717a";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(39,39,42,0.8)";
                }}
              >
                Skip Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen (step 0 special full-screen)
// ---------------------------------------------------------------------------

function WelcomeScreen({
  onStart,
  onSkip,
  visible,
}: {
  onStart: () => void;
  onSkip: () => void;
  visible: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={{ position: "relative", width: 520, maxWidth: "calc(100vw - 32px)" }}>
        {/* Outer glow ring */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -40,
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(6,182,212,0.07) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "ap-pulse 3s ease-in-out infinite",
          }}
        />

        <div
          style={{
            position: "relative",
            background: "linear-gradient(160deg,#1f2128 0%,#17181c 50%,#0d0e11 100%)",
            border: "1px solid rgba(6,182,212,0.3)",
            borderRadius: 20,
            padding: "48px 44px",
            boxShadow:
              "0 0 0 1px rgba(6,182,212,0.06), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(6,182,212,0.08)",
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          <CornerBracket corner="tl" />
          <CornerBracket corner="tr" />
          <CornerBracket corner="bl" />
          <CornerBracket corner="br" />
          <ScanLines />
          <Particles />
          <HexGrid />

          <div style={{ position: "relative", zIndex: 2 }}>
            {/* Logo mark */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg,rgba(8,145,178,0.2),rgba(6,182,212,0.1))",
                  border: "1px solid rgba(6,182,212,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 30px rgba(6,182,212,0.15)",
                  animation: "ap-float 4s ease-in-out infinite",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.35em",
                color: "#06b6d4",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              AxiomPips
            </div>

            <h1
              style={{
                margin: "0 0 8px",
                fontSize: 32,
                fontWeight: 800,
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.04em",
                color: "#f4f4f5",
                lineHeight: 1.15,
              }}
            >
              Welcome, Trader
            </h1>

            <p
              style={{
                margin: "0 0 8px",
                fontSize: 13,
                fontFamily: "JetBrains Mono, monospace",
                color: "#06b6d4",
                letterSpacing: "0.08em",
              }}
            >
              PRECISION FOREX TOOLKIT
            </p>

            <p
              style={{
                margin: "0 0 36px",
                fontSize: 15,
                color: "#a1a1aa",
                lineHeight: 1.7,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Your account is live. Let us take 60 seconds to show you
              every tool, calculator and feature available to you.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={onStart}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 28px",
                  background: "linear-gradient(135deg,#0891b2,#06b6d4)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  boxShadow: "0 0 24px rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.5)",
                  letterSpacing: "-0.01em",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 36px rgba(6,182,212,0.55), 0 8px 24px rgba(0,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 24px rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.5)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start the Tour
              </button>

              <button
                onClick={onSkip}
                style={{
                  padding: "13px 24px",
                  background: "transparent",
                  color: "#71717a",
                  border: "1px solid rgba(39,39,42,0.9)",
                  borderRadius: 12,
                  fontSize: 13,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(63,63,70,0.9)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#71717a";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(39,39,42,0.9)";
                }}
              >
                Skip Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Complete screen
// ---------------------------------------------------------------------------

function CompleteScreen({ onDone, visible }: { onDone: () => void; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={{ position: "relative", width: 480, maxWidth: "calc(100vw - 32px)" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -60,
            background:
              "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(6,182,212,0.1) 0%, transparent 70%)",
            animation: "ap-pulse 2.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "linear-gradient(160deg,#1f2128 0%,#17181c 50%,#0d0e11 100%)",
            border: "1px solid rgba(6,182,212,0.35)",
            borderRadius: 20,
            padding: "48px 44px",
            textAlign: "center",
            boxShadow:
              "0 0 0 1px rgba(6,182,212,0.08), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(6,182,212,0.1)",
            overflow: "hidden",
          }}
        >
          <CornerBracket corner="tl" />
          <CornerBracket corner="tr" />
          <CornerBracket corner="bl" />
          <CornerBracket corner="br" />
          <ScanLines />
          <Particles />

          <div style={{ position: "relative", zIndex: 2 }}>
            {/* Check icon */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,rgba(8,145,178,0.3),rgba(6,182,212,0.15))",
                  border: "1.5px solid rgba(6,182,212,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 30px rgba(6,182,212,0.2)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.3em",
                color: "#06b6d4",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              SYSTEM ONLINE
            </div>

            <h2
              style={{
                margin: "0 0 12px",
                fontSize: 30,
                fontWeight: 800,
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.04em",
                color: "#f4f4f5",
              }}
            >
              You Are Ready
            </h2>

            <p
              style={{
                margin: "0 0 32px",
                fontSize: 15,
                color: "#a1a1aa",
                lineHeight: 1.65,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Every instrument is loaded and calibrated. Your edge begins now.
              <br />
              Trade with precision.
            </p>

            <button
              onClick={onDone}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 32px",
                background: "linear-gradient(135deg,#0891b2,#06b6d4)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                boxShadow: "0 0 24px rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.5)",
                transition: "transform 0.15s, box-shadow 0.15s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 36px rgba(6,182,212,0.55), 0 8px 24px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 24px rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.5)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              </svg>
              Enter Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyframe injection
// ---------------------------------------------------------------------------

const KEYFRAMES = `
  @keyframes ap-pulse {
    0%,100% { transform: scale(1); opacity:1; }
    50% { transform: scale(1.06); opacity:0.7; }
  }
  @keyframes ap-float {
    0%,100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes ap-fade-in {
    from { opacity:0; transform: translateY(10px); }
    to   { opacity:1; transform: translateY(0); }
  }
`;

function InjectKeyframes() {
  useEffect(() => {
    if (document.getElementById("ap-guide-keyframes")) return;
    const style = document.createElement("style");
    style.id = "ap-guide-keyframes";
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => {
      document.getElementById("ap-guide-keyframes")?.remove();
    };
  }, []);
  return null;
}

// ---------------------------------------------------------------------------
// Main GuideTour component
// ---------------------------------------------------------------------------

const TOUR_KEY = "axiompips_tour_v1";
// Steps without welcome and complete (shown separately)
const INNER_STEPS = STEPS.filter(
  (s) => s.id !== "welcome" && s.id !== "complete"
);

export function GuideTour() {
  const [phase, setPhase] = useState<
    "idle" | "welcome" | "touring" | "complete" | "done"
  >("idle");
  const [stepIndex, setStepIndex] = useState(0); // index into INNER_STEPS
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const resizeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check auth + localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (completed) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Small delay so page paints first
        setTimeout(() => setPhase("welcome"), 800);
      }
    });
  }, []);

  // Update spotlight position when step changes
  const updateSpotlight = useCallback(() => {
    if (phase !== "touring") {
      setSpotlight(null);
      return;
    }
    const step = INNER_STEPS[stepIndex];
    if (!step.targetSelector) {
      setSpotlight(null);
      return;
    }
    const rect = getPaddedRect(step.targetSelector, 10);
    setSpotlight(rect);
  }, [phase, stepIndex]);

  useEffect(() => {
    if (phase === "touring") {
      setCardVisible(false);
      const t = setTimeout(() => {
        updateSpotlight();
        setCardVisible(true);
      }, 180);
      return () => clearTimeout(t);
    }
  }, [phase, stepIndex, updateSpotlight]);

  // Recompute on resize
  useEffect(() => {
    const handler = () => {
      if (resizeRef.current) clearTimeout(resizeRef.current);
      resizeRef.current = setTimeout(updateSpotlight, 150);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [updateSpotlight]);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setPhase("done");
  }, []);

  const handleSkip = useCallback(() => {
    setPhase("complete");
    setTimeout(() => {
      setCardVisible(true);
    }, 200);
  }, []);

  const handleWelcomeStart = useCallback(() => {
    setPhase("touring");
    setStepIndex(0);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex >= INNER_STEPS.length - 1) {
      // Show complete screen
      setPhase("complete");
      setSpotlight(null);
      setTimeout(() => setCardVisible(true), 200);
      return;
    }
    setStepIndex((i) => i + 1);
  }, [stepIndex]);

  if (phase === "idle" || phase === "done") return null;

  const currentStep = INNER_STEPS[stepIndex];
  const isWelcomePhase = phase === "welcome";
  const isCompletePhase = phase === "complete";
  const isTouringPhase = phase === "touring";

  return (
    <>
      <InjectKeyframes />

      {/* Overlay / spotlight */}
      {!isWelcomePhase && !isCompletePhase && (
        <SpotlightOverlay rect={isTouringPhase ? spotlight : null} onClick={() => {}} />
      )}
      {(isWelcomePhase || isCompletePhase) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13,14,17,0.92)",
            zIndex: 9990,
          }}
        />
      )}

      {/* Welcome screen */}
      {isWelcomePhase && (
        <WelcomeScreen
          onStart={handleWelcomeStart}
          onSkip={handleSkip}
          visible
        />
      )}

      {/* Complete screen */}
      {isCompletePhase && (
        <CompleteScreen onDone={completeTour} visible={cardVisible} />
      )}

      {/* Tour step card */}
      {isTouringPhase && currentStep && (
        <StepCard
          step={currentStep}
          stepIndex={stepIndex}
          total={INNER_STEPS.length}
          spotlight={spotlight}
          onNext={handleNext}
          onSkip={handleSkip}
          isLast={stepIndex === INNER_STEPS.length - 1}
          visible={cardVisible}
        />
      )}
    </>
  );
}
