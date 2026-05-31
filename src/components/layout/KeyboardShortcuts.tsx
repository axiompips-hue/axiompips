// File: src/components/layout/KeyboardShortcuts.tsx
// Global keyboard shortcuts for AxiomPips
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: navigate to calculators (search equivalent)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        router.push("/calculators");
        return;
      }

      // Ctrl+Enter or Cmd+Enter: submit the focused form or click the primary button
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        // Find the primary submit button in the current form
        const primaryBtn = document.querySelector<HTMLButtonElement>(
          'button[type="submit"], button.btn-primary, form button:not([type="button"])'
        );
        if (primaryBtn && !primaryBtn.disabled) {
          primaryBtn.click();
        }
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return null; // This component renders nothing
}
