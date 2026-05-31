// File Location: src/components/layout/Header.tsx
// Description: Updated header with authentication buttons
// IMPORTANT: Replace your existing Header.tsx with this file

"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "./Nav";
import { MobileMenu } from "./MobileMenu";
import { Container } from "@/components/ui/Container";
import { ClientAuthButtons } from "@/components/auth/ClientAuthButtons";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex flex-col items-start hover:opacity-90 transition-opacity"
              onClick={closeMobileMenu}
            >
              <span className="text-xl font-bold text-gradient">AxiomPips</span>
              <span className="text-xs text-zinc-500 hidden sm:block">
                Precision Tools for Smarter Trading
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Nav />
            <ClientAuthButtons />
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </Container>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
}