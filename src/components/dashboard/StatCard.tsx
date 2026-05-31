// File Location: src/components/dashboard/StatCard.tsx
// Description: Animated statistic card component for dashboard

import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  gradient: "cyan" | "green" | "purple" | "yellow" | "pink";
  delay?: number;
}

export function StatCard({ icon, label, value, gradient, delay = 0 }: StatCardProps) {
  const gradientClasses = {
    cyan: "from-accent-500/20 via-accent-600/10 to-transparent",
    green: "from-green-500/20 via-green-600/10 to-transparent",
    purple: "from-purple-500/20 via-purple-600/10 to-transparent",
    yellow: "from-yellow-500/20 via-yellow-600/10 to-transparent",
    pink: "from-pink-500/20 via-pink-600/10 to-transparent",
  };

  const iconColorClasses = {
    cyan: "text-accent-400",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    pink: "text-pink-400",
  };

  const valueColorClasses = {
    cyan: "text-accent-400",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    pink: "text-pink-400",
  };

  const glowClasses = {
    cyan: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    green: "group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]",
    purple: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    yellow: "group-hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]",
    pink: "group-hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]",
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl 
        bg-neutral-900/80 border border-zinc-800 
        p-6 opacity-0 animate-fade-in-up
        hover-lift card-shine
        transition-all duration-300
        ${glowClasses[gradient]}
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Background gradient */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br ${gradientClasses[gradient]}
          opacity-0 group-hover:opacity-100 transition-opacity duration-500
        `}
      />

      {/* Animated background orb */}
      <div
        className={`
          absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl
          bg-gradient-to-br ${gradientClasses[gradient]}
          opacity-30 group-hover:opacity-50 group-hover:scale-150
          transition-all duration-700
        `}
      />

      {/* Content */}
      <div className="relative z-10">
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center mb-4
            bg-zinc-800/80 group-hover:scale-110 transition-transform duration-300
            ${iconColorClasses[gradient]}
          `}
        >
          {icon}
        </div>
        <p className="text-sm text-zinc-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${valueColorClasses[gradient]}`}>
          {value}
        </p>
      </div>
    </div>
  );
}