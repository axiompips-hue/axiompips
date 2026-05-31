// File: src/components/premium/CalculatorWithPremium.tsx
"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { Crown, Lock, TrendingUp, AlertCircle } from "lucide-react";
import { getPremiumStatus, getUsageLimits, incrementCalculatorUse, type PremiumStatus, type UsageLimits } from "@/lib/premium/service";
import { CalculationModeProvider } from "@/lib/premium/CalculationContext";
import { SkeletonCalculator } from "@/components/ui/Skeleton";

interface CalculatorWithPremiumProps {
  children: ReactNode;
  calculatorName?: string;
}

export function CalculatorWithPremium({ children, calculatorName }: CalculatorWithPremiumProps) {
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([getPremiumStatus(), getUsageLimits()]);
      setStatus(s);
      setLimits(l);
    } catch {
      // Silently allow usage if fetching fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Intercept button/submit clicks inside the calculator to track usage
  const handleClickCapture = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      // Only care about buttons and submits
      const target = e.target as HTMLElement;
      const btn = target.closest("button, input[type='submit']") as HTMLButtonElement | null;
      if (!btn) return;

      // Skip non-primary buttons (reset, cancel, clear, etc.)
      const text = (btn.textContent || btn.value || "").toLowerCase();
      const isCalculateBtn =
        btn.type === "submit" ||
        /calculat|compute|analyz|run|generat|project|simulat/i.test(text);
      if (!isCalculateBtn) return;

      // Re-read latest limits each time (don't rely on stale state)
      const [latestStatus, latestLimits] = await Promise.all([
        getPremiumStatus(),
        getUsageLimits(),
      ]);

      const unlimited =
        latestStatus.isPremium ||
        latestStatus.isOnTrial ||
        latestLimits.maxCalculatorUses === -1;

      if (unlimited) {
        // No tracking needed for premium/trial users
        return;
      }

      if (latestLimits.calculatorUses >= latestLimits.maxCalculatorUses) {
        // Already at limit — block and show upgrade
        e.preventDefault();
        e.stopPropagation();
        setShowUpgrade(true);
        return;
      }

      // Increment usage
      await incrementCalculatorUse();

      // Refresh displayed limits
      const fresh = await getUsageLimits();
      setLimits(fresh);
    },
    []
  );

  const canUse =
    !limits ||
    status?.isPremium ||
    status?.isOnTrial ||
    limits.maxCalculatorUses === -1 ||
    limits.calculatorUses < limits.maxCalculatorUses;

  const isUnlimited = status?.isPremium || status?.isOnTrial || limits?.maxCalculatorUses === -1;

  const remaining =
    limits && !isUnlimited
      ? Math.max(0, limits.maxCalculatorUses - limits.calculatorUses)
      : null;

  const usagePct =
    limits && !isUnlimited
      ? Math.min(100, (limits.calculatorUses / limits.maxCalculatorUses) * 100)
      : 0;

  if (loading) {
    return (
      <CalculationModeProvider shouldAutoCalculate={false} isLoaded={false}>
        <div className="py-4">
          <SkeletonCalculator />
        </div>
      </CalculationModeProvider>
    );
  }

  return (
    <CalculationModeProvider shouldAutoCalculate={isUnlimited} isLoaded={true}>
    <>
      {/* Usage indicator — only shown to free users */}
      {!isUnlimited && limits && (
        <div className="mb-4">
          {canUse ? (
            <div className="flex items-center justify-between text-xs mb-1 px-1">
              <span className="text-zinc-400">
                Daily uses:{" "}
                <span
                  className={
                    remaining === 0
                      ? "text-red-400 font-semibold"
                      : remaining !== null && remaining <= 3
                      ? "text-amber-400 font-semibold"
                      : "text-zinc-300"
                  }
                >
                  {limits.calculatorUses} / {limits.maxCalculatorUses}
                </span>
              </span>
              <Link
                href="/premium"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                <Crown className="w-3 h-3" />
                Get Unlimited
              </Link>
            </div>
          ) : null}

          {!isUnlimited && (
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  usagePct >= 100
                    ? "bg-red-500"
                    : usagePct >= 70
                    ? "bg-amber-500"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Calculator — or locked overlay when limit reached */}
      <div className="relative" ref={wrapperRef} onClickCapture={handleClickCapture}>
        {children}

        {/* Locked overlay */}
        {!canUse && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-zinc-950/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Daily Limit Reached</h3>
                <p className="text-sm text-zinc-400">
                  You have used all{" "}
                  <span className="text-white font-medium">
                    {limits?.maxCalculatorUses} free calculations
                  </span>{" "}
                  for today. Resets at midnight.
                </p>
              </div>
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left text-sm space-y-2">
                <p className="font-semibold text-indigo-400 flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Upgrade to Premium
                </p>
                <ul className="text-zinc-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                    Unlimited daily calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                    Unlimited journal entries
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                    Export CSV, PDF, Excel
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                    Cloud sync across devices
                  </li>
                </ul>
              </div>
              <Link
                href="/premium"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-center transition-all"
              >
                View Premium Plans
              </Link>
              <p className="text-xs text-zinc-500">
                From $4.99/month &middot; 7-day free trial available
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade modal (shown when limit hit mid-calculation) */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowUpgrade(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Daily Limit Reached</h3>
                <p className="text-zinc-400 text-sm">
                  You have used all{" "}
                  <span className="text-white font-medium">
                    {limits?.maxCalculatorUses} free calculations
                  </span>{" "}
                  for today. Upgrade to premium for unlimited access.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/premium"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-center transition-all"
                >
                  Upgrade to Premium
                </Link>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="w-full py-3 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
                >
                  Maybe Later
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                7-day free trial &middot; From $4.99/month
              </p>
            </div>
          </div>
        </div>
      )}
    </>
    </CalculationModeProvider>
  );
}
