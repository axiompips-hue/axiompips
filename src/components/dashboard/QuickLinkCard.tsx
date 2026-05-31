// File Location: src/components/dashboard/QuickLinkCard.tsx
// Description: Animated quick link card for dashboard navigation

import Link from "next/link";
import { ReactNode } from "react";

interface QuickLinkCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  gradient: "cyan" | "green" | "purple" | "yellow" | "pink" | "orange";
  delay?: number;
}

export function QuickLinkCard({
  href,
  icon,
  title,
  description,
  gradient,
  delay = 0,
}: QuickLinkCardProps) {
  const gradientBgClasses = {
    cyan: "from-accent-600 to-accent-400",
    green: "from-green-600 to-green-400",
    purple: "from-purple-600 to-purple-400",
    yellow: "from-yellow-600 to-yellow-400",
    pink: "from-pink-600 to-pink-400",
    orange: "from-orange-600 to-orange-400",
  };

  const hoverBorderClasses = {
    cyan: "hover:border-accent-500/50",
    green: "hover:border-green-500/50",
    purple: "hover:border-purple-500/50",
    yellow: "hover:border-yellow-500/50",
    pink: "hover:border-pink-500/50",
    orange: "hover:border-orange-500/50",
  };

  const glowClasses = {
    cyan: "group-hover:shadow-[0_0_40px_rgba(6,182,212,0.2)]",
    green: "group-hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]",
    purple: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]",
    yellow: "group-hover:shadow-[0_0_40px_rgba(234,179,8,0.2)]",
    pink: "group-hover:shadow-[0_0_40px_rgba(236,72,153,0.2)]",
    orange: "group-hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]",
  };

  return (
    <Link
      href={href}
      className={`
        group relative block overflow-hidden rounded-2xl
        bg-neutral-900/60 border border-zinc-800
        p-6 opacity-0 animate-fade-in-up
        transition-all duration-300
        ${hoverBorderClasses[gradient]}
        ${glowClasses[gradient]}
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Animated background gradient on hover */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br ${gradientBgClasses[gradient]}
          opacity-0 group-hover:opacity-5 transition-opacity duration-500
        `}
      />

      {/* Floating orb */}
      <div
        className={`
          absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl
          bg-gradient-to-br ${gradientBgClasses[gradient]}
          opacity-0 group-hover:opacity-30 
          transition-all duration-500 group-hover:scale-150
        `}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon container with gradient */}
        <div
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center mb-4
            bg-gradient-to-br ${gradientBgClasses[gradient]}
            group-hover:scale-110 group-hover:rotate-3
            transition-all duration-300 shadow-lg
          `}
        >
          <div className="text-white">{icon}</div>
        </div>

        <h3 className="text-lg font-semibold text-zinc-100 mb-1 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
          {description}
        </p>

        {/* Arrow indicator */}
        <div
          className={`
            absolute bottom-6 right-6 w-8 h-8 rounded-full
            flex items-center justify-center
            bg-zinc-800 group-hover:bg-zinc-700
            opacity-0 group-hover:opacity-100
            transform translate-x-2 group-hover:translate-x-0
            transition-all duration-300
          `}
        >
          <svg
            className="w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}