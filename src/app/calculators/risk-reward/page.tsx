// File: src/app/calculators/risk-reward/page.tsx
import { Metadata } from "next";
import { RiskRewardCalculator } from "./RiskRewardCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Risk/Reward Calculator | R:R Ratio Calculator",
  description:
    "Calculate the risk-to-reward ratio for your trades based on entry, stop loss, and take profit levels. Analyze minimum win rate required for profitability.",
  keywords: [
    "risk reward calculator",
    "rr ratio calculator",
    "risk to reward",
    "trading risk reward",
    "forex risk reward",
    "trade risk calculator",
    "reward ratio calculator",
    "risk management",
  ],
  alternates: {
    canonical: "/calculators/risk-reward",
  },
  openGraph: {
    title: "Risk/Reward Calculator | AxiomPips",
    description:
      "Calculate the risk-to-reward ratio for your trades based on entry, stop loss, and take profit levels.",
    url: "https://axiompips.com/calculators/risk-reward",
  },
};

export default function RiskRewardPage() {
  return (
    <>
      <ToolStructuredData
        name="Risk/Reward Calculator"
        description="Calculate the risk-to-reward ratio for your trades based on entry, stop loss, and take profit levels. Analyze minimum win rate required for profitability."
        url="https://axiompips.com/calculators/risk-reward"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Risk/Reward", url: "https://axiompips.com/calculators/risk-reward" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Risk/Reward Calculator">
        <RiskRewardCalculator />
      </CalculatorWithPremium>
    </>
  );
}
