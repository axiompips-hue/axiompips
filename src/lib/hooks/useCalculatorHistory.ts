// File: src/lib/hooks/useCalculatorHistory.ts
"use client";

import { useLocalStorage } from "./useLocalStorage";

export interface HistoryEntry {
  id: string;
  calculatorName: string;
  timestamp: number;
  summary: string;        // e.g. "1.23 lots | EURUSD | 1% risk"
  params: Record<string, string>;
}

const MAX_HISTORY = 5;

export function useCalculatorHistory(calculatorName: string) {
  const key = `qp_history_${calculatorName}`;
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>(key, []);

  function addEntry(summary: string, params: Record<string, string>) {
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      calculatorName,
      timestamp: Date.now(),
      summary,
      params,
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY);
      return updated;
    });
  }

  function clearHistory() {
    setHistory([]);
  }

  return { history, addEntry, clearHistory };
}
