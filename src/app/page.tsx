// File: src/app/page.tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Scale,
  Gem,
  ShieldCheck,
  Target,
  Gauge,
  TrendingUp,
  Layers,
  Orbit,
  PieChart,
  Network,
  FlaskConical,
  Sprout,
  RefreshCcw,
  Dices,
  Activity,
  Crosshair,
  BarChart2,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

// Custom SVG icon for Forex Heatmap (no lucide equivalent)
function HeatmapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2"    y="2"    width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.9"  />
      <rect x="9.25" y="2"    width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="16.5" y="2"    width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="2"    y="9.25" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.7"  />
      <rect x="16.5" y="9.25" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.9"  />
      <rect x="2"    y="16.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.3"  />
      <rect x="9.25" y="16.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="16.5" y="16.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.5"  />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-gradient">Precision</span>{" "}
              <span className="text-zinc-100">Forex Calculators</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-zinc-400 leading-relaxed">
              High-performance trading tools designed for speed and accuracy.
              Calculate position sizes, manage risk, and optimize your trades
              with institutional-grade precision.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/calculators">
                <Button size="large">Open Calculators</Button>
              </Link>
              <Link href="/tools">
                <Button variant="secondary" size="large">
                  Explore Tools
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Core Calculators Section */}
      <section className="py-16 border-t border-zinc-800">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">
              Core Calculators
            </h2>
            <p className="mt-3 text-zinc-400">
              Essential tools for every forex trader
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreCalculators.map((calc) => (
              <Link key={calc.href} href={calc.href}>
                <Card hover className="h-full group">
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                        relative flex-shrink-0 w-12 h-12 rounded-xl 
                        bg-gradient-to-br ${calc.gradient}
                        flex items-center justify-center
                        shadow-lg ${calc.shadow}
                        transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-3
                      `}
                    >
                      <div
                        className={`
                          absolute inset-0 rounded-xl opacity-0 
                          group-hover:opacity-50 transition-opacity duration-300
                          bg-gradient-to-br ${calc.gradient} blur-xl
                        `}
                      />
                      <calc.icon
                        className={`relative w-6 h-6 ${calc.iconColor}`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle>{calc.title}</CardTitle>
                      <CardDescription>{calc.description}</CardDescription>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Advanced Tools Section */}
      <section className="py-16 border-t border-zinc-800">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">
              Advanced Tools
            </h2>
            <p className="mt-3 text-zinc-400">
              Professional features for serious traders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advancedTools.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card hover className="h-full group">
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                        relative flex-shrink-0 w-12 h-12 rounded-xl
                        bg-gradient-to-br ${tool.gradient}
                        flex items-center justify-center
                        shadow-lg ${tool.shadow}
                        transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-3
                      `}
                    >
                      <div
                        className={`
                          absolute inset-0 rounded-xl opacity-0 
                          group-hover:opacity-50 transition-opacity duration-300
                          bg-gradient-to-br ${tool.gradient} blur-xl
                        `}
                      />
                      <tool.icon
                        className={`relative w-6 h-6 ${tool.iconColor}`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle>{tool.title}</CardTitle>
                        {tool.premium && (
                          <span
                            className="
                              inline-flex items-center px-2 py-0.5 
                              text-xs font-medium rounded-full
                              bg-gradient-to-r from-amber-500/20 to-orange-500/20
                              text-amber-400 border border-amber-500/30
                              shadow-sm shadow-amber-500/10
                            "
                          >
                            Premium
                          </span>
                        )}
                      </div>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-zinc-800">
        <Container size="small">
          <Card variant="elevated" className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent-600/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-zinc-100">
                Ready to trade smarter?
              </h2>
              <p className="mt-3 text-zinc-400">
                Start using AxiomPips calculators to improve your risk management
                and trading precision.
              </p>
              <div className="mt-6">
                <Link href="/calculators/position-size">
                  <Button>Calculate Position Size</Button>
                </Link>
              </div>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}

interface CalculatorItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon | React.FC<{ className?: string; strokeWidth?: number }>;
  gradient: string;
  shadow: string;
  iconColor: string;
}

interface ToolItem extends CalculatorItem {
  premium: boolean;
}

const coreCalculators: CalculatorItem[] = [
  {
    title: "Position Size",
    description:
      "Calculate optimal lot size based on your risk tolerance and stop loss.",
    href: "/calculators/position-size",
    icon: Scale,
    gradient: "from-emerald-500/20 to-teal-500/20",
    shadow: "shadow-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    title: "Pip Value",
    description: "Find the monetary value of each pip for any currency pair.",
    href: "/calculators/pip-value",
    icon: Gem,
    gradient: "from-violet-500/20 to-purple-500/20",
    shadow: "shadow-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    title: "Margin",
    description:
      "Calculate required margin for your positions based on leverage.",
    href: "/calculators/margin",
    icon: ShieldCheck,
    gradient: "from-blue-500/20 to-cyan-500/20",
    shadow: "shadow-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    title: "Risk / Reward",
    description: "Analyze risk-to-reward ratios before entering trades.",
    href: "/calculators/risk-reward",
    icon: Target,
    gradient: "from-rose-500/20 to-pink-500/20",
    shadow: "shadow-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    title: "Break-Even",
    description: "Calculate the price needed to break even after fees.",
    href: "/calculators/break-even",
    icon: Gauge,
    gradient: "from-amber-500/20 to-orange-500/20",
    shadow: "shadow-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    title: "Profit / Loss",
    description: "Calculate potential profit or loss for completed trades.",
    href: "/calculators/profit-loss",
    icon: TrendingUp,
    gradient: "from-green-500/20 to-emerald-500/20",
    shadow: "shadow-green-500/20",
    iconColor: "text-green-400",
  },
  {
    title: "DCA Calculator",
    description:
      "Plan dollar cost averaging strategies and calculate average entry prices.",
    href: "/calculators/dca",
    icon: Layers,
    gradient: "from-indigo-500/20 to-blue-500/20",
    shadow: "shadow-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  {
    title: "Fibonacci",
    description:
      "Calculate Fibonacci retracement and extension levels for key support and resistance zones.",
    href: "/calculators/fibonacci",
    icon: Orbit,
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    shadow: "shadow-fuchsia-500/20",
    iconColor: "text-fuchsia-400",
  },
  {
    title: "Swap Calculator",
    description:
      "Estimate overnight rollover fees and potential swap credits for holding positions.",
    href: "/calculators/swap",
    icon: RefreshCcw,
    gradient: "from-teal-500/20 to-cyan-500/20",
    shadow: "shadow-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    title: "Pivot Points",
    description:
      "Calculate Classic, Woodie, Camarilla, Fibonacci, and DeMark pivot levels. Identify key intraday support and resistance zones before each session.",
    href: "/calculators/pivot-points",
    icon: Crosshair,
    gradient: "from-orange-500/20 to-rose-500/20",
    shadow: "shadow-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    title: "ATR Calculator",
    description:
      "Set volatility-adaptive stop loss and take profit levels using Average True Range. Size positions based on real market conditions.",
    href: "/calculators/atr",
    icon: BarChart2,
    gradient: "from-sky-500/20 to-indigo-500/20",
    shadow: "shadow-sky-500/20",
    iconColor: "text-sky-400",
  },
];

const advancedTools: ToolItem[] = [
  {
    title: "Portfolio Risk Manager",
    description:
      "Analyze combined risk across multiple open positions and planned trades.",
    href: "/tools/portfolio-risk",
    icon: PieChart,
    gradient: "from-cyan-500/20 to-teal-500/20",
    shadow: "shadow-cyan-500/20",
    iconColor: "text-cyan-400",
    premium: false,
  },
  {
    title: "Correlation Analyzer",
    description:
      "Detect currency exposure clustering and correlated positions.",
    href: "/tools/correlation",
    icon: Network,
    gradient: "from-purple-500/20 to-violet-500/20",
    shadow: "shadow-purple-500/20",
    iconColor: "text-purple-400",
    premium: false,
  },
  {
    title: "Scenario Simulator",
    description:
      "What-if analysis: adjust SL, TP, and lot size to see outcomes instantly.",
    href: "/tools/scenario",
    icon: FlaskConical,
    gradient: "from-sky-500/20 to-blue-500/20",
    shadow: "shadow-sky-500/20",
    iconColor: "text-sky-400",
    premium: false,
  },
  {
    title: "Compounding Projector",
    description: "Simulate account growth with compounding over time.",
    href: "/tools/compounding",
    icon: Sprout,
    gradient: "from-lime-500/20 to-green-500/20",
    shadow: "shadow-lime-500/20",
    iconColor: "text-lime-400",
    premium: false,
  },
  {
    title: "Monte Carlo Simulator",
    description:
      "Run thousands of trade simulations to analyze probability distributions and expected outcomes.",
    href: "/tools/monte-carlo",
    icon: Dices,
    gradient: "from-orange-500/20 to-rose-500/20",
    shadow: "shadow-orange-500/20",
    iconColor: "text-orange-400",
    premium: false,
  },
  {
    title: "Session & Volatility Analyzer",
    description:
      "Track global forex sessions in real-time and analyze historical volatility patterns to identify optimal trading windows.",
    href: "/tools/session-volatility",
    icon: Activity,
    gradient: "from-red-500/20 to-amber-500/20",
    shadow: "shadow-red-500/20",
    iconColor: "text-red-400",
    premium: false,
  },
  {
    title: "Pre-Trade Checklist",
    description:
      "Build a personalized checklist that enforces discipline on every entry. Eliminate impulsive decisions and make rule-based trading your default.",
    href: "/tools/checklist",
    icon: ClipboardCheck,
    gradient: "from-emerald-500/20 to-teal-500/20",
    shadow: "shadow-emerald-500/20",
    iconColor: "text-emerald-400",
    premium: false,
  },
  {
    title: "Forex Heatmap",
    description:
      "See the entire forex market at a glance. A live, color-coded grid shows which currencies are surging and which are sinking -- so you can trade with momentum, not against it.",
    href: "/tools/forex-heatmap",
    icon: HeatmapIcon,
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    shadow: "shadow-fuchsia-500/20",
    iconColor: "text-fuchsia-400",
    premium: false,
  },
];
