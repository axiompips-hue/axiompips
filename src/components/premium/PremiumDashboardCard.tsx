// File: src/components/premium/PremiumDashboardCard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Zap, Clock } from "lucide-react";
import { getPremiumStatus, getUsageLimits, type PremiumStatus, type UsageLimits } from "@/lib/premium/service";

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function PremiumDashboardCard() {
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPremiumStatus(), getUsageLimits()])
      .then(([s, l]) => {
        setStatus(s);
        setLimits(l);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse h-24 bg-zinc-900/50 border border-zinc-800 rounded-2xl" />
    );
  }

  if (!status) return null;

  // Active premium subscriber
  if (status.isPremium && status.subscriptionEndsAt) {
    return (
      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
          <Crown className="w-6 h-6 text-zinc-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-100">Premium Active</p>
          <p className="text-sm text-zinc-400">
            Renews {status.subscriptionEndsAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-900 text-xs font-bold rounded-full">
          PRO
        </span>
      </div>
    );
  }

  // Free trial active
  if (status.isOnTrial && status.trialEndsAt) {
    const days = daysUntil(status.trialEndsAt);
    return (
      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Clock className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-100">Free Trial Active</p>
          <p className="text-sm text-zinc-400">
            {days} {days === 1 ? "day" : "days"} remaining &mdash; all premium features unlocked
          </p>
        </div>
        <Link
          href="/premium"
          className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // Free tier - show usage summary + upgrade CTA
  const calcRemaining = limits
    ? Math.max(0, limits.maxCalculatorUses - limits.calculatorUses)
    : 0;
  const toolsRemaining = limits
    ? Math.max(0, limits.maxAdvancedToolUses - limits.advancedToolUses)
    : 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
        <Zap className="w-6 h-6 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100">Free Plan</p>
        <p className="text-sm text-zinc-400">
          {calcRemaining} calculations left today &middot; {toolsRemaining} advanced tool uses left this week
        </p>
      </div>
      <Link
        href="/premium"
        className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
      >
        <Crown className="w-4 h-4" />
        Upgrade
      </Link>
    </div>
  );
}
