// File: src/components/premium/UpgradePrompt.tsx
// Modal to prompt users to upgrade to premium

'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Crown, Zap, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'calculator' | 'journal' | 'tools' | 'export';
  currentUsage?: number;
  maxUsage?: number;
}

const featureMessages = {
  calculator: {
    title: 'Calculator Limit Reached',
    description: 'You&apos;ve used all your free calculator calculations for today.',
    icon: TrendingUp,
  },
  journal: {
    title: 'Journal Entry Limit Reached',
    description: 'You&apos;ve reached the maximum number of journal entries (50) for free users.',
    icon: TrendingUp,
  },
  tools: {
    title: 'Advanced Tools Limit Reached',
    description: 'You&apos;ve used all your advanced tool uses for this week.',
    icon: Zap,
  },
  export: {
    title: 'Export Feature Locked',
    description: 'Data export is available only for premium members.',
    icon: Crown,
  },
};

export function UpgradePrompt({ isOpen, onClose, feature, currentUsage, maxUsage }: UpgradePromptProps) {
  const featureInfo = featureMessages[feature];
  const Icon = featureInfo.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-indigo-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3">{featureInfo.title}</h2>

        {/* Description */}
        <p className="text-zinc-400 mb-6">{featureInfo.description}</p>

        {/* Usage indicator (if applicable) */}
        {currentUsage !== undefined && maxUsage !== undefined && (
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-400">Usage Today</span>
              <span className="text-sm font-semibold">
                {currentUsage} / {maxUsage}
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((currentUsage / maxUsage) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Premium benefits */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Upgrade to Premium
          </h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              Unlimited calculator uses
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              Unlimited journal entries
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              Unlimited advanced tools access
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              Export to CSV, PDF, Excel
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              Cloud sync across devices
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-indigo-500/20">
            <p className="text-xs text-zinc-400">
              <strong className="text-white">7-day free trial</strong> · Only $4.99/month or $49.99/year
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Maybe Later
          </Button>
          <Link href="/premium" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500">
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
