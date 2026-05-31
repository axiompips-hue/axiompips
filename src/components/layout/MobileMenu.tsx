// File Location: src/components/layout/MobileMenu.tsx
// Description: Updated mobile menu with authentication options
// IMPORTANT: Replace your existing MobileMenu.tsx with this file

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./Nav";
import { useAuth } from "@/lib/hooks/useAuth";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  if (!isOpen) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="md:hidden border-t border-zinc-800 bg-neutral-950">
      <nav className="px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150
                ${
                  isActive
                    ? "text-accent-400 bg-accent-950/50"
                    : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50"
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800">
        {loading ? (
          <div className="flex justify-center py-2">
            <div className="h-5 w-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : user ? (
          <div className="space-y-2">
            <div className="px-4 py-2">
              <p className="text-sm text-zinc-400">Signed in as</p>
              <p className="text-sm text-zinc-100 truncate">{user.email}</p>
            </div>
            <Link
              href="/dashboard"
              onClick={onClose}
              className="block px-4 py-3 text-base font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={onClose}
              className="block px-4 py-3 text-base font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Profile Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 text-base font-medium text-red-400 hover:text-red-300 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={onClose}
              className="block px-4 py-3 text-base font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className="block px-4 py-3 text-base font-medium text-center bg-accent-600 text-white hover:bg-accent-500 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      <div className="px-4 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          Precision Tools for Smarter Trading
        </p>
      </div>
    </div>
  );
}