// File Location: src/components/auth/ClientAuthButtons.tsx
// Description: Auth buttons for client components - shows login/signup or user menu

"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserMenu } from "./UserMenu";

export function ClientAuthButtons() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
        <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  if (user) {
    return <UserMenu user={user} />;
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 focus:ring-accent-500"
      >
        Sign Up
      </Link>
    </div>
  );
}