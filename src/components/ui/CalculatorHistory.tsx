// File: src/components/ui/CalculatorHistory.tsx
"use client";

import { memo, useState } from "react";
import { HistoryEntry } from "@/lib/hooks/useCalculatorHistory";

interface CalculatorHistoryProps {
  history: HistoryEntry[];
  onRestore: (params: Record<string, string>) => void;
  onClear: () => void;
}

export const CalculatorHistory = memo(function CalculatorHistory({
  history,
  onRestore,
  onClear,
}: CalculatorHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  function formatTime(ts: number) {
    const d = new Date(ts);
    const now = Date.now();
    const diffMs = now - ts;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
        aria-label="Toggle calculation history"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-zinc-300">Recent Calculations</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400">{history.length}</span>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          <div className="space-y-1.5">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-mono text-zinc-200 truncate">{entry.summary}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatTime(entry.timestamp)}</p>
                </div>
                <button
                  onClick={() => onRestore(entry.params)}
                  className="flex-shrink-0 text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-accent-800/60 text-zinc-300 hover:text-accent-300 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Restore calculation: ${entry.summary}`}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={onClear}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
          >
            Clear history
          </button>
        </div>
      )}
    </div>
  );
});
