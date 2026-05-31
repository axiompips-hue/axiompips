// File: src/app/tools/page.tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  PieChart,
  Network,
  FlaskConical,
  Sprout,
  Dices,
  Activity,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export const metadata = {
  title: "Tools",
  description:
    "Advanced forex trading tools for portfolio management, correlation analysis, pre-trade checklists, and more.",
};

// Custom SVG icon for the Forex Heatmap (no lucide equivalent)
function HeatmapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="9.25" y="2" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="16.5" y="2" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="2" y="9.25" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="16.5" y="9.25" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="2" y="16.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="9.25" y="16.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="16.5" y="16.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export default function ToolsPage() {
  return (
    <section className="py-12 md:py-16">
      <Container>
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
            Advanced Tools
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            Professional-grade tools for comprehensive trade analysis.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
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
                    {/* Glow effect */}
                    <div
                      className={`
                        absolute inset-0 rounded-xl opacity-0
                        group-hover:opacity-50 transition-opacity duration-300
                        bg-gradient-to-br ${tool.gradient} blur-xl
                      `}
                    />
                    {tool.customIcon ? (
                      <tool.customIcon
                        className={`relative w-6 h-6 ${tool.iconColor}`}
                      />
                    ) : (
                      <tool.icon
                        className={`relative w-6 h-6 ${tool.iconColor}`}
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="group-hover:text-accent-400 transition-colors">
                        {tool.title}
                      </CardTitle>
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
                    <CardDescription className="mt-2">
                      {tool.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-sm text-accent-400 font-medium group-hover:text-accent-300 transition-colors">
                        Open tool &rarr;
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

interface ToolItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon | React.FC<{ className?: string }>;
  customIcon?: React.FC<{ className?: string }>;
  gradient: string;
  shadow: string;
  iconColor: string;
  premium: boolean;
}

const tools: ToolItem[] = [
  {
    title: "Portfolio Risk Manager",
    description:
      "Analyze combined risk across multiple open positions. See how your trades interact and ensure you never exceed your total risk threshold.",
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
      "Identify correlated currency exposure in your portfolio. Avoid over-exposure to a single currency by understanding pair correlations.",
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
      "Run what-if scenarios by adjusting stop loss, take profit, and lot size. See how changes affect your risk and reward instantly.",
    href: "/tools/scenario",
    icon: FlaskConical,
    gradient: "from-sky-500/20 to-blue-500/20",
    shadow: "shadow-sky-500/20",
    iconColor: "text-sky-400",
    premium: false,
  },
  {
    title: "Compounding Projector",
    description:
      "Project your account growth over time with compounding. Visualize how consistent risk-adjusted returns compound.",
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
      "Run thousands of randomized trade simulations based on your strategy statistics. Analyze probability distributions, drawdown risks, and expected outcomes.",
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
      "Track global forex sessions in real-time and analyze historical volatility patterns to identify optimal trading windows for maximum market activity.",
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
      "Build a personalized pre-trade checklist that enforces discipline on every single entry. Eliminate impulsive decisions, track compliance over time, and make rule-based trading your default.",
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
      "See the entire forex market at a glance. A live, color-coded grid shows which currencies are surging and which are sinking across all major pairs -- so you can trade with momentum, not against it.",
    href: "/tools/forex-heatmap",
    icon: HeatmapIcon,
    customIcon: HeatmapIcon,
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    shadow: "shadow-fuchsia-500/20",
    iconColor: "text-fuchsia-400",
    premium: false,
  },
];
