// File: src/components/layout/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { getPremiumStatus } from "@/lib/premium/service";

export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Calculators", href: "/calculators" },
  { label: "Tools", href: "/tools" },
  { label: "Journal", href: "/journal" },
  { label: "Settings", href: "/settings" },
  { label: "About", href: "/about" },
];

// ─── Module-level cache ───────────────────────────────────────────────────────
// getPremiumStatus is called once per session and cached here.
// Every Nav mount reads from the same promise — no duplicate network requests
// on navigation, no stale closure issues.
let premiumStatusPromise: ReturnType<typeof getPremiumStatus> | null = null;

function getCachedPremiumStatus() {
  if (!premiumStatusPromise) {
    premiumStatusPromise = getPremiumStatus().catch(() => ({
      isPremium: false,
      isOnTrial: false,
    }));
  }
  return premiumStatusPromise;
}

// Call once at module init so the promise is already in-flight when the
// component first renders (warm start).
if (typeof window !== "undefined") {
  getCachedPremiumStatus();
}
// ─────────────────────────────────────────────────────────────────────────────

export function Nav() {
  const pathname = usePathname();
  const [isPremium, setIsPremium] = useState(false);
  const [isOnTrial, setIsOnTrial] = useState(false);

  useEffect(() => {
    getCachedPremiumStatus().then((s) => {
      setIsPremium(s.isPremium);
      setIsOnTrial(s.isOnTrial);
    });
    // No deps: runs once, reads from cache
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const premiumHref = "/premium";
  const isPremiumActive = pathname === premiumHref;
  const isUserPremiumOrTrial = isPremium || isOnTrial;

  const guideIds: Record<string, string> = {
    "/calculators": "nav-calculators",
    "/tools": "nav-tools",
    "/journal": "nav-journal",
    "/settings": "nav-settings",
    "/about": "nav-about",
  };

  return (
    <nav className="flex items-center gap-1" data-guide="nav">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const guideId = guideIds[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            data-guide={guideId}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150
              ${
                isActive
                  ? "text-accent-400 bg-accent-950/50"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              }
            `}
          >
            {item.label}
          </Link>
        );
      })}

      {isUserPremiumOrTrial ? (
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <Crown className="w-3.5 h-3.5" />
          {isPremium ? "Premium" : "Trial"}
        </Link>
      ) : (
        <Link
          href={premiumHref}
          data-guide="nav-premium"
          className={`
            inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150
            ${
              isPremiumActive
                ? "text-indigo-300 bg-indigo-500/20"
                : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-500/60"
            }
          `}
        >
          <Crown className="w-3.5 h-3.5" />
          Premium
        </Link>
      )}
    </nav>
  );
}
