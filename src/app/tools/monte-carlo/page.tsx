// File: src/app/tools/monte-carlo/page.tsx
import { Metadata } from "next";
import { MonteCarloSimulator } from "./MonteCarloSimulator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { AdvancedToolWithPremium } from "@/components/premium/AdvancedToolWithPremium";

export const metadata: Metadata = {
  title: "Monte Carlo Simulator | Trading Risk Analysis",
  description:
    "Run thousands of trade simulations to analyze probability distributions, drawdown risks, and expected outcomes. Advanced Monte Carlo analysis for forex traders.",
  keywords: [
    "monte carlo simulation",
    "trading simulator",
    "risk of ruin calculator",
    "forex simulation",
    "drawdown analysis",
    "trading probability",
    "equity curve simulation",
    "position sizing analysis",
    "trading risk analysis",
    "sequence risk testing",
  ],
  alternates: {
    canonical: "/tools/monte-carlo",
  },
  openGraph: {
    title: "Monte Carlo Simulator | AxiomPips",
    description:
      "Run thousands of trade simulations to analyze probability distributions and expected outcomes for your trading strategy.",
    url: "https://axiompips.com/tools/monte-carlo",
  },
};

export default function MonteCarloPage() {
  return (
    <>
      <ToolStructuredData
        name="Monte Carlo Simulator"
        description="Run thousands of trade simulations to analyze probability distributions, drawdown risks, and expected outcomes. Advanced Monte Carlo analysis for forex traders."
        url="https://axiompips.com/tools/monte-carlo"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Monte Carlo Simulator", url: "https://axiompips.com/tools/monte-carlo" },
        ]}
      />
      <AdvancedToolWithPremium toolName="Monte Carlo Simulator">
        <MonteCarloSimulator />
      </AdvancedToolWithPremium>
    </>
  );
}
