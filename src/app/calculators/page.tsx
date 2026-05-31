// File: src/app/calculators/page.tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  Scale,
  Gem,
  ShieldCheck,
  Target,
  Gauge,
  TrendingUp,
  Layers,
  Orbit,
  RefreshCcw,
  Crosshair,
  BarChart2,
  type LucideIcon,
} from "lucide-react";

export const metadata = {
  title: "Calculators",
  description:
    "Forex calculators for position sizing, pip value, margin, risk-reward, pivot points, ATR, and more.",
};

export default function CalculatorsPage() {
  return (
    <section className="py-12 md:py-16">
      <Container>
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
            Forex Calculators
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            Essential calculation tools for precise trading decisions.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calc) => (
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
                    {/* Glow effect */}
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
                    <CardTitle className="group-hover:text-accent-400 transition-colors">
                      {calc.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {calc.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-sm text-accent-400 font-medium group-hover:text-accent-300 transition-colors">
                        Open calculator &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

interface CalculatorItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
  shadow: string;
  iconColor: string;
}

const calculators: CalculatorItem[] = [
  {
    title: "Position Size",
    description:
      "Determine the optimal lot size based on your account balance, risk percentage, and stop loss distance.",
    href: "/calculators/position-size",
    icon: Scale,
    gradient: "from-emerald-500/20 to-teal-500/20",
    shadow: "shadow-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    title: "Pip Value",
    description:
      "Calculate the monetary value of a single pip for any currency pair in your account currency.",
    href: "/calculators/pip-value",
    icon: Gem,
    gradient: "from-violet-500/20 to-purple-500/20",
    shadow: "shadow-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    title: "Margin",
    description:
      "Find out how much margin is required to open a position based on your leverage and position size.",
    href: "/calculators/margin",
    icon: ShieldCheck,
    gradient: "from-blue-500/20 to-cyan-500/20",
    shadow: "shadow-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    title: "Risk / Reward",
    description:
      "Analyze the risk-to-reward ratio of any trade setup by entering entry, stop loss, and take profit.",
    href: "/calculators/risk-reward",
    icon: Target,
    gradient: "from-rose-500/20 to-pink-500/20",
    shadow: "shadow-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    title: "Break-Even",
    description:
      "Calculate the exact price level where your trade breaks even after spread and commissions.",
    href: "/calculators/break-even",
    icon: Gauge,
    gradient: "from-amber-500/20 to-orange-500/20",
    shadow: "shadow-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    title: "Profit / Loss",
    description:
      "Calculate the profit or loss of a trade based on entry price, exit price, and position size.",
    href: "/calculators/profit-loss",
    icon: TrendingUp,
    gradient: "from-green-500/20 to-emerald-500/20",
    shadow: "shadow-green-500/20",
    iconColor: "text-green-400",
  },
  {
    title: "DCA Calculator",
    description:
      "Plan dollar cost averaging strategies and calculate average entry prices across multiple positions.",
    href: "/calculators/dca",
    icon: Layers,
    gradient: "from-indigo-500/20 to-blue-500/20",
    shadow: "shadow-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  {
    title: "Fibonacci",
    description:
      "Calculate Fibonacci retracement and extension levels to identify key support and resistance zones.",
    href: "/calculators/fibonacci",
    icon: Orbit,
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    shadow: "shadow-fuchsia-500/20",
    iconColor: "text-fuchsia-400",
  },
  {
    title: "Swap Calculator",
    description:
      "Estimate overnight rollover fees and potential swap credits for holding positions across trading sessions.",
    href: "/calculators/swap",
    icon: RefreshCcw,
    gradient: "from-teal-500/20 to-cyan-500/20",
    shadow: "shadow-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    title: "Pivot Points",
    description:
      "Calculate Classic, Woodie, Camarilla, Fibonacci, and DeMark pivot levels from OHLC data. Pinpoint critical intraday support and resistance zones before the session begins.",
    href: "/calculators/pivot-points",
    icon: Crosshair,
    gradient: "from-orange-500/20 to-rose-500/20",
    shadow: "shadow-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    title: "ATR Calculator",
    description:
      "Set volatility-adaptive stop loss and take profit levels using Average True Range. Size positions based on real market conditions, not arbitrary fixed-pip guesswork.",
    href: "/calculators/atr",
    icon: BarChart2,
    gradient: "from-sky-500/20 to-indigo-500/20",
    shadow: "shadow-sky-500/20",
    iconColor: "text-sky-400",
  },
];
