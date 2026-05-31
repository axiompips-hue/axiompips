// File: src/components/premium/PremiumBadge.tsx
// Premium badge component

import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  variant?: 'small' | 'large';
  className?: string;
}

export function PremiumBadge({ variant = 'small', className = '' }: PremiumBadgeProps) {
  if (variant === 'small') {
    return (
      <span
        className={`inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-900 text-xs font-bold px-2 py-0.5 rounded-full ${className}`}
      >
        <Crown className="w-3 h-3" />
        PRO
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full ${className}`}
    >
      <Crown className="w-4 h-4" />
      <span className="font-semibold">Premium Member</span>
    </div>
  );
}
