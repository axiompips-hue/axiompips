// File: src/components/layout/Footer.tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-neutral-950">
      <Container>
        <div className="py-8 md:py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block">
                <span className="text-xl font-bold text-gradient">
                  AxiomPips
                </span>
              </Link>
              <p className="mt-3 text-sm text-zinc-400 max-w-md">
                High-performance forex calculators and trading tools designed
                for precision and speed. Built by traders, for traders.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Built for Traders, by Traders
              </p>
            </div>

            {/* Calculators Links */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-3">
                Calculators
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/calculators/position-size"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Position Size
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calculators/pip-value"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Pip Value
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calculators/margin"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Margin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calculators/risk-reward"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Risk / Reward
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tools Links */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-3">
                Tools
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/tools/portfolio-risk"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Portfolio Risk
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/correlation"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Correlation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/compounding"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Compounding
                  </Link>
                </li>
                <li>
                  <Link
                    href="/journal"
                    className="text-sm text-zinc-400 hover:text-accent-400 transition-colors"
                  >
                    Trade Journal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500">
              &copy; {currentYear} AxiomPips. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/about"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                About
              </Link>
              <span className="text-zinc-700">|</span>
              <span className="text-sm text-zinc-500">
                Built with precision
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}