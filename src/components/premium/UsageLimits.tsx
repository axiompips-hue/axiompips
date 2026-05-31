// File: src/components/premium/UsageLimits.tsx
// Component to display usage limits and remaining uses

'use client';

import { Card } from '@/components/ui/Card';
import { Calculator, BookOpen, Sparkles, Crown } from 'lucide-react';
import { useUsageLimits, usePremiumStatus } from '@/lib/premium/hooks';
import Link from 'next/link';

export function UsageLimits() {
  const { limits, loading: limitsLoading } = useUsageLimits();
  const { isPremium, isOnTrial, loading: statusLoading } = usePremiumStatus();

  if (limitsLoading || statusLoading || !limits) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-32" />
          <div className="h-8 bg-zinc-800 rounded" />
        </div>
      </Card>
    );
  }

  if (isPremium || isOnTrial) {
    return (
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">
                {isOnTrial ? 'Free Trial Active' : 'Premium Active'}
              </h3>
            </div>
            <p className="text-sm text-zinc-400">You have unlimited access to all features</p>
          </div>
          {!isPremium && (
            <Link
              href="/premium"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>
      </Card>
    );
  }

  const calculatorPercentage = limits.maxCalculatorUses > 0 
    ? (limits.calculatorUses / limits.maxCalculatorUses) * 100 
    : 0;
  const journalPercentage = limits.maxJournalEntries > 0 
    ? (limits.journalEntries / limits.maxJournalEntries) * 100 
    : 0;
  const toolsPercentage = limits.maxAdvancedToolUses > 0 
    ? (limits.advancedToolUses / limits.maxAdvancedToolUses) * 100 
    : 0;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Usage Limits</h3>
        <Link
          href="/premium"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          <Crown className="w-4 h-4" />
          Upgrade
        </Link>
      </div>

      <div className="space-y-5">
        {/* Calculator Uses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Calculator Uses</span>
            </div>
            <span className="text-sm font-medium">
              {limits.calculatorUses} / {limits.maxCalculatorUses}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                calculatorPercentage >= 90
                  ? 'bg-red-500'
                  : calculatorPercentage >= 70
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(calculatorPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Resets daily</p>
        </div>

        {/* Journal Entries */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Journal Entries</span>
            </div>
            <span className="text-sm font-medium">
              {limits.journalEntries} / {limits.maxJournalEntries}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                journalPercentage >= 90
                  ? 'bg-red-500'
                  : journalPercentage >= 70
                  ? 'bg-amber-500'
                  : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(journalPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Lifetime limit</p>
        </div>

        {/* Advanced Tools */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Advanced Tools</span>
            </div>
            <span className="text-sm font-medium">
              {limits.advancedToolUses} / {limits.maxAdvancedToolUses}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                toolsPercentage >= 90
                  ? 'bg-red-500'
                  : toolsPercentage >= 70
                  ? 'bg-amber-500'
                  : 'bg-pink-500'
              }`}
              style={{ width: `${Math.min(toolsPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Resets weekly</p>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(calculatorPercentage >= 70 || journalPercentage >= 70 || toolsPercentage >= 70) && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <p className="text-sm text-zinc-400 mb-3">
            Running low on usage? Upgrade to get unlimited access!
          </p>
          <Link
            href="/premium"
            className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2 rounded-lg transition-all text-center text-sm"
          >
            View Premium Plans
          </Link>
        </div>
      )}
    </Card>
  );
}
