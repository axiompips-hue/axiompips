// File: src/components/ui/ResultDisplay.tsx
import { ReactNode } from "react";

interface ResultItemProps {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  size?: "default" | "large";
}

export function ResultItem({
  label,
  value,
  suffix,
  highlight = false,
  size = "default",
}: ResultItemProps) {
  return (
    <div
      className={`
        flex justify-between items-center py-3 
        border-b border-zinc-800 last:border-b-0
      `}
    >
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={`
          font-mono font-medium
          ${size === "large" ? "text-lg" : "text-base"}
          ${highlight ? "text-accent-400" : "text-zinc-100"}
        `}
      >
        {value}
        {suffix && <span className="text-zinc-500 ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

interface ResultDisplayProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ResultDisplay({
  title,
  children,
  className = "",
}: ResultDisplayProps) {
  return (
    <div
      className={`
        bg-neutral-900 border border-zinc-800 rounded-xl p-6
        ${className}
      `}
    >
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

interface ResultHighlightProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export function ResultHighlight({ label, value, suffix }: ResultHighlightProps) {
  return (
    <div className="bg-accent-950/30 border border-accent-800/50 rounded-lg p-4 text-center">
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono text-accent-400">
        {value}
        {suffix && <span className="text-lg text-accent-500 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}