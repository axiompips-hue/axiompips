// File: src/components/ui/ShareableLink.tsx
"use client";

import { useState, useCallback } from "react";

interface ShareableLinkProps {
  params: Record<string, string>;
  className?: string;
}

export function ShareableLink({ params, className = "" }: ShareableLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    // Clear existing search params
    url.search = "";
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [params]);

  return (
    <button
      onClick={handleShare}
      title="Copy shareable link to clipboard"
      aria-label="Copy shareable link"
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
        copied
          ? "border-green-700 bg-green-900/40 text-green-300"
          : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}

/** Hook to read URL params on mount and apply them to form state */
export function useShareableParams<T extends Record<string, string>>(
  defaults: T,
  onApply: (params: Partial<T>) => void,
) {
  // This runs once on mount
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const overrides: Partial<T> = {};
    let hasOverrides = false;
    Object.keys(defaults).forEach((key) => {
      const val = url.searchParams.get(key);
      if (val) {
        (overrides as Record<string, string>)[key] = val;
        hasOverrides = true;
      }
    });
    if (hasOverrides) onApply(overrides);
  }
}
