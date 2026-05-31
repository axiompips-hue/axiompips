// File Location: src/components/dashboard/CalculatorLink.tsx
// Description: Animated calculator link button for dashboard

import Link from "next/link";

interface CalculatorLinkProps {
  href: string;
  name: string;
  delay?: number;
}

export function CalculatorLink({ href, name, delay = 0 }: CalculatorLinkProps) {
  return (
    <Link
      href={href}
      className="
        group relative overflow-hidden
        px-4 py-3 rounded-xl
        bg-zinc-800/50 border border-zinc-700/50
        text-center text-sm text-zinc-300
        opacity-0 animate-scale-in
        hover:bg-zinc-700/50 hover:border-zinc-600
        hover:text-zinc-100 hover:scale-105
        transition-all duration-200
      "
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Shine effect on hover */}
      <div
        className="
          absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
          translate-x-[-100%] group-hover:translate-x-[100%]
          transition-transform duration-500
        "
      />
      <span className="relative z-10">{name}</span>
    </Link>
  );
}