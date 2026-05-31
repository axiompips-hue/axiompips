// File: src/app/about/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About | AxiomPips",
  description:
    "Learn about AxiomPips — precision forex calculators and advanced trading tools built with decimal arithmetic and obsessive attention to accuracy.",
  openGraph: {
    title: "About AxiomPips",
    description:
      "Professional-grade forex trading tools built for precision and speed.",
    url: "https://axiompips.com/about",
  },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const CALCULATORS = [
  { name: "Position Size", desc: "Optimal lot sizing from account balance, risk %, and stop distance" },
  { name: "Pip Value", desc: "Monetary pip value for any pair in your account currency" },
  { name: "Margin", desc: "Required margin based on leverage and position size" },
  { name: "Risk / Reward", desc: "R:R ratio from entry, stop loss, and take profit" },
  { name: "Break-Even", desc: "Exact break-even price after spread and commissions" },
  { name: "Profit / Loss", desc: "P&L from entry, exit, and lot size" },
  { name: "DCA Calculator", desc: "Average entry prices across multiple positions" },
  { name: "Fibonacci", desc: "Retracement and extension levels for support/resistance" },
  { name: "Swap Calculator", desc: "Overnight rollover costs for held positions" },
  { name: "Pivot Points", desc: "Classic, Woodie, Camarilla, Fibonacci, and DeMark pivots" },
  { name: "ATR Calculator", desc: "Volatility-adaptive stop and target levels" },
];

const TOOLS = [
  { name: "Portfolio Risk Manager", desc: "Combined risk across all open positions simultaneously" },
  { name: "Correlation Analyzer", desc: "Currency exposure overlap to avoid double-risk" },
  { name: "Scenario Simulator", desc: "What-if modelling before pulling the trigger" },
  { name: "Compounding Projector", desc: "Account growth visualization with consistent returns" },
  { name: "Monte Carlo Simulator", desc: "Thousands of randomized simulations from your strategy stats" },
  { name: "Session & Volatility Analyzer", desc: "Live session tracking and historical volatility patterns" },
  { name: "Pre-Trade Checklist", desc: "Enforce discipline on every entry with a custom ruleset" },
  { name: "Forex Heatmap", desc: "Live color-coded strength grid across all major pairs" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent-600/5 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <Container>
          <div className="text-center max-w-3xl mx-auto relative">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-accent-950/60 border border-accent-800/30 mb-8 backdrop-blur-sm">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-400" />
              </div>
              <span className="text-sm text-accent-300 font-medium tracking-wide">
                Built for Traders, by Traders
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-100 leading-[1.1] tracking-tight">
              Every Tool You Need.
              <span className="block mt-3 bg-gradient-to-r from-accent-400 via-accent-300 to-accent-500 bg-clip-text text-transparent">
                Nothing You Don&apos;t.
              </span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              AxiomPips is a suite of precision forex calculators and advanced
              analytical tools — built with decimal arithmetic and obsessive
              attention to accuracy, so the numbers you rely on are always right.
            </p>

            {/* Honest stats */}
            <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8">
              {[
                { value: "11", label: "Calculators" },
                { value: "8", label: "Advanced Tools" },
                { value: "0", label: "Floating-Point Errors" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="text-center p-4 md:p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/40 backdrop-blur-sm"
                >
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-xs md:text-sm text-zinc-500 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Why Decimal Precision Matters ── */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 mb-5">
                <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm text-zinc-400 font-medium">Why Precision Matters</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 leading-tight tracking-tight">
                The Rounding Error That
                <span className="text-accent-400"> Costs You Money</span>
              </h2>

              <p className="mt-6 text-zinc-400 leading-relaxed text-lg">
                Most calculators use JavaScript&apos;s native floating-point
                arithmetic. It&apos;s fast — and silently wrong. Operations like{" "}
                <code className="text-accent-300 bg-zinc-800/60 px-1.5 py-0.5 rounded text-sm font-mono">
                  0.1 + 0.2
                </code>{" "}
                return{" "}
                <code className="text-red-400 bg-zinc-800/60 px-1.5 py-0.5 rounded text-sm font-mono">
                  0.30000000000000004
                </code>{" "}
                in standard JS. Small errors compound trade by trade.
              </p>

              <p className="mt-4 text-zinc-500 leading-relaxed">
                AxiomPips uses{" "}
                <span className="text-zinc-300 font-medium">Decimal.js</span>{" "}
                throughout — an arbitrary-precision decimal arithmetic library
                that eliminates these errors entirely. Your position sizes, pip
                values, and margin calculations are always mathematically exact.
              </p>

              {/* Technical proof block */}
              <div className="mt-10 p-5 rounded-xl bg-zinc-900/80 border border-zinc-800/50 font-mono text-sm">
                <p className="text-zinc-600 mb-2">{"// Standard JS (floating-point)"}</p>
                <p className="text-zinc-400">
                  0.1 + 0.2{" "}
                  <span className="text-red-400">
                    {"// → 0.30000000000000004 ✗"}
                  </span>
                </p>
                <p className="text-zinc-600 mt-4 mb-2">{"// AxiomPips (Decimal.js)"}</p>
                <p className="text-zinc-400">
                  new Decimal(0.1).plus(0.2){" "}
                  <span className="text-green-400">{"// → 0.3 ✓"}</span>
                </p>
              </div>
            </div>

            {/* Right - differentiators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  color: "green",
                  title: "Decimal Arithmetic",
                  desc: "Powered by Decimal.js — every calculation is mathematically exact, no rounding drift.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                    />
                  ),
                },
                {
                  color: "blue",
                  title: "Instant Results",
                  desc: "Calculations run entirely in your browser — no round-trips, no latency, no API rate limits.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  ),
                },
                {
                  color: "amber",
                  title: "Journal with Analytics",
                  desc: "Log trades and track actual performance — win rate, average R, drawdown, equity curve.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  ),
                },
                {
                  color: "purple",
                  title: "No Clutter",
                  desc: "No ads, no pop-ups, no affiliate noise. Just the tool, the input, and the result.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  ),
                },
              ].map((item, i) => {
                const colorMap: Record<string, string> = {
                  green: "bg-green-950/50 border-green-800/30 text-green-400",
                  blue: "bg-blue-950/50 border-blue-800/30 text-blue-400",
                  amber: "bg-amber-950/50 border-amber-800/30 text-amber-400",
                  purple: "bg-purple-950/50 border-purple-800/30 text-purple-400",
                };
                return (
                  <Card
                    key={i}
                    className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-300 group"
                  >
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${colorMap[item.color]}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <h3 className="font-semibold text-zinc-100 mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* ── The Full Toolkit ── */}
      <section className="py-16 md:py-24 bg-zinc-950/50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-900/5 rounded-full blur-3xl pointer-events-none" />

        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 mb-5">
              <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
              <span className="text-sm text-zinc-400 font-medium">The Full Toolkit</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-tight">
              Everything in One Place
            </h2>
            <p className="mt-4 text-zinc-400 text-lg">
              11 calculators, 8 advanced tools, and a trade journal — no hunting
              across different sites.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Calculators column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-accent-950/60 border border-accent-800/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm2.505-6h.005v.008h-.005v-.008zm0 2.25h.005v.008h-.005v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200">Calculators</h3>
                <span className="ml-auto text-xs font-medium text-zinc-600 bg-zinc-800/50 border border-zinc-700/50 px-2 py-0.5 rounded-full">
                  11 tools
                </span>
              </div>

              <div className="space-y-2">
                {CALCULATORS.map((calc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-500/60 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        {calc.name}
                      </span>
                      <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{calc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/calculators"
                className="mt-6 inline-flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 font-medium transition-colors"
              >
                <span>Open calculators</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Tools column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200">Advanced Tools</h3>
                <span className="ml-auto text-xs font-medium text-zinc-600 bg-zinc-800/50 border border-zinc-700/50 px-2 py-0.5 rounded-full">
                  8 tools
                </span>
              </div>

              <div className="space-y-2">
                {TOOLS.map((tool, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500/60 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        {tool.name}
                      </span>
                      <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/tools"
                className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 font-medium transition-colors"
              >
                <span>Open tools</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              {/* Journal callout */}
              <div className="mt-8 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-zinc-200">Trade Journal</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Log trades, track performance metrics (win rate, average R,
                  equity curve, drawdown), and review your history over time. Free
                  with account, full analytics with Pro.
                </p>
                <Link
                  href="/journal"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 font-medium transition-colors"
                >
                  Open journal →
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── How it&apos;s built ── */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Tech stack */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "Next.js 15",
                  label: "React Framework",
                  color: "text-zinc-300",
                  detail: "App Router, server components, streaming",
                  svg: (
                    <path fill="currentColor"
                      d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 01-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 00-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 00-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 01-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 01-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 01.174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 004.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 002.466-2.163 11.944 11.944 0 002.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 00-2.499-.523A33.119 33.119 0 0011.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 01.237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 01.233-.296c.096-.05.13-.054.5-.054z"
                    />
                  ),
                },
                {
                  name: "TypeScript",
                  label: "Type Safety",
                  color: "text-blue-400",
                  detail: "End-to-end type safety across the stack",
                  svg: (
                    <path fill="currentColor"
                      d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 011.306.34v2.458a3.95 3.95 0 00-.643-.361 5.093 5.093 0 00-.717-.26 5.453 5.453 0 00-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 00-.623.242c-.17.104-.3.229-.393.374a.888.888 0 00-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 01-1.012 1.085 4.38 4.38 0 01-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 01-1.84-.164 5.544 5.544 0 01-1.512-.493v-2.63a5.033 5.033 0 003.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 00-.074-1.089 2.12 2.12 0 00-.537-.5 5.597 5.597 0 00-.807-.444 27.72 27.72 0 00-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 011.47-.629 7.536 7.536 0 011.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"
                    />
                  ),
                },
                {
                  name: "Decimal.js",
                  label: "Arbitrary Precision Math",
                  color: "text-amber-400",
                  detail: "No floating-point drift in financial calculations",
                  svg: (
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  ),
                },
                {
                  name: "Supabase",
                  label: "Auth & Data",
                  color: "text-green-400",
                  detail: "Secure auth and cloud sync for journal data",
                  svg: (
                    <path fill="currentColor"
                      d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C.01 13.02.476 14.49 1.641 14.49h9.13l.182 8.476c.015.986 1.26 1.41 1.874.637l9.262-11.653c.754-.97.288-2.44-.877-2.44h-9.13L11.9 1.036z"
                    />
                  ),
                },
              ].map((tech, i) => (
                <Card
                  key={i}
                  className="p-5 text-center hover:border-zinc-600 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="relative">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-3 group-hover:border-zinc-600 transition-all duration-300 group-hover:scale-105">
                      <svg className={`w-6 h-6 ${tech.color}`} viewBox="0 0 24 24">
                        {tech.svg}
                      </svg>
                    </div>
                    <h3 className="font-semibold text-zinc-200 mb-0.5 text-sm">{tech.name}</h3>
                    <p className="text-xs text-zinc-500 mb-2">{tech.label}</p>
                    <p className="text-xs text-zinc-600 leading-relaxed">{tech.detail}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 mb-5">
                <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                  />
                </svg>
                <span className="text-sm text-zinc-400 font-medium">Under the Hood</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 leading-tight tracking-tight">
                Built on a Stack That
                <span className="text-accent-400"> Earns Its Place</span>
              </h2>

              <p className="mt-6 text-zinc-400 leading-relaxed text-lg">
                Every technology choice has a reason. Next.js 15 for instant
                page loads. TypeScript so bugs surface at compile time, not in
                your calculator. Decimal.js because financial math demands it.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "Calculations run client-side",
                    desc: "No server round-trip means zero latency between input and result. The math runs on your device.",
                  },
                  {
                    title: "Your data stays yours",
                    desc: "We don't sell data, serve ads, or use your trade history for anything beyond showing it back to you.",
                  },
                  {
                    title: "Open to feedback",
                    desc: "Every page has a feedback button. If something's wrong or missing, we want to know.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-accent-950/60 border border-accent-800/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">{item.title}</p>
                      <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Pricing ── */}
      <section className="py-16 md:py-24 bg-zinc-950/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 mb-5">
              <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
              <span className="text-sm text-zinc-400 font-medium">Pricing</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-tight">
              Free to Use. Upgrade When It Makes Sense.
            </h2>
            <p className="mt-4 text-zinc-400 text-lg">
              All calculators and tools are free. Pro unlocks journal analytics,
              export, and an ad-free experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <Card className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800/50 relative overflow-hidden hover:border-zinc-700/60 transition-all duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-zinc-700/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 mb-5">
                  <span className="text-sm text-zinc-400 font-medium">Free — no account required</span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-6">Core Tools</h3>
                <ul className="space-y-3.5">
                  {[
                    "All 11 calculators",
                    "All 8 advanced tools",
                    "Forex heatmap (live data)",
                    "Session & volatility analyzer",
                    "Monte Carlo simulator",
                    "Basic trade journal (account required)",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-zinc-400">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/calculators"
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl border border-zinc-700 transition-colors"
                >
                  <span>Start Using Tools</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </Card>

            {/* Pro */}
            <Card className="p-8 bg-gradient-to-br from-accent-950/30 via-zinc-900 to-zinc-900/50 border-accent-800/30 relative overflow-hidden hover:border-accent-700/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-950/60 border border-accent-800/30 mb-5">
                  <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                  <span className="text-sm text-accent-300 font-medium">Pro</span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-6">Everything, Unlocked</h3>
                <ul className="space-y-3.5">
                  {[
                    "Everything in Free",
                    "Advanced journal analytics (equity curve, drawdown, R-multiples)",
                    "CSV export for all calculator results",
                    "AI-powered trade journal insights",
                    "Ad-free across the entire platform",
                    "Early access to new tools",
                    "Priority email support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-accent-950/60 border border-accent-800/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/premium"
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent-600 hover:bg-accent-500 text-white font-medium rounded-xl transition-colors"
                >
                  <span>View Pricing</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* ── The Story ── */}
      <section className="py-16 md:py-24">
        <Container size="small">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/50 border-zinc-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-700/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-900/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-800/40 border border-zinc-700/50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
                    Why AxiomPips Exists
                  </h2>
                  <p className="text-sm text-zinc-500 mt-0.5">The honest version</p>
                </div>
              </div>

              <div className="space-y-5 text-zinc-400 leading-relaxed">
                <p className="text-lg">
                  Most forex calculators are an afterthought — tacked onto broker
                  sites to keep you on-platform, or monetized through affiliate
                  links that make you wonder if the numbers are even right.
                </p>
                <p>
                  AxiomPips started from a different premise: build the tools we
                  actually want to use. That means decimal precision, not
                  floating-point shortcuts. It means a clean interface that gets
                  out of the way. It means a trade journal that tracks real
                  performance metrics, not vanity stats.
                </p>
                <p>
                  Every calculator uses the same underlying math engine, tested
                  with unit tests for edge cases. Every design decision is made
                  by asking: does this help a trader make a better decision, or
                  does it just fill space?
                </p>
              </div>

              <div className="mt-10 pt-10 border-t border-zinc-800/50">
                <h3 className="text-lg font-semibold text-zinc-100 mb-6">What We Optimise For</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    {
                      colorClasses: "bg-green-950/50 border-green-800/30 text-green-400",
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      ),
                      title: "Accuracy",
                      desc: "If the number is wrong, nothing else matters",
                    },
                    {
                      colorClasses: "bg-blue-950/50 border-blue-800/30 text-blue-400",
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                        />
                      ),
                      title: "Speed",
                      desc: "Results before you finish typing",
                    },
                    {
                      colorClasses: "bg-purple-950/50 border-purple-800/30 text-purple-400",
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25"
                        />
                      ),
                      title: "Simplicity",
                      desc: "One tool, one job, no distractions",
                    },
                  ].map((value, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 p-4 rounded-xl bg-zinc-800/20 border border-zinc-800/40"
                    >
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${value.colorClasses}`}>
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {value.icon}
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-200 text-sm">{value.title}</h4>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{value.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </section>

      {/* ── Contact ── */}
      <section className="py-16 md:py-24 bg-zinc-950/50">
        <Container size="small">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3 tracking-tight">
              Get in Touch
            </h2>
            <p className="text-zinc-400 mb-10 max-w-md mx-auto">
              Spotted a bug, have a feature request, or just want to say hello —
              we read every email.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:axiompips@gmail.com"
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl border border-zinc-700 transition-all duration-200 hover:border-zinc-600"
              >
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <span>axiompips@gmail.com</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-24">
        <Container>
          <Card className="p-8 md:p-16 text-center bg-gradient-to-br from-accent-950/40 via-zinc-900 to-zinc-900 border-accent-800/30 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent" />

            <div className="relative max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-950/60 border border-accent-800/30 flex items-center justify-center mb-8">
                <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                  />
                </svg>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">
                Ready to Trade with Precision?
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto">
                Open any calculator now — no account, no sign-up, no wait. Just
                accurate numbers when you need them.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/calculators"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-accent-600 hover:bg-accent-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-accent-900/20 hover:shadow-accent-900/40"
                >
                  <span>Explore Calculators</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl border border-zinc-700 transition-all duration-200 hover:border-zinc-600"
                >
                  <span>Explore Tools</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </Card>
        </Container>
      </section>

      {/* Footer note */}
      <section className="pb-20">
        <Container size="small">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
              <span>AxiomPips — built with care and precision for the trading community.</span>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
