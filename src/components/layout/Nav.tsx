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

export function Nav() {
  const pathname = usePathname();
  const [isPremium, setIsPremium] = useState(false);
  const [isOnTrial, setIsOnTrial] = useState(false);

  useEffect(() => {
    getPremiumStatus()
      .then((s) => {
        setIsPremium(s.isPremium);
        setIsOnTrial(s.isOnTrial);
      })
      .catch(() => {
        // Silently ignore — non-critical
      });
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

      {/* Premium nav item */}
      {isUserPremiumOrTrial ? (
        // Already premium/trial — show a subtle badge linking to profile
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <Crown className="w-3.5 h-3.5" />
          {isPremium ? "Premium" : "Trial"}
        </Link>
      ) : (
        // Free user — highlight the upgrade link
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
