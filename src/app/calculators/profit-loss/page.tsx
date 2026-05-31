// File: src/app/calculators/profit-loss/page.tsx
import { Metadata } from "next";
import { ProfitLossCalculator } from "./ProfitLossCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Profit/Loss Calculator | Forex P/L Calculator",
  description:
    "Calculate the profit or loss for your forex trades based on entry price, exit price, and position size. Analyze completed or hypothetical trades instantly.",
  keywords: [
    "profit loss calculator",
    "forex profit calculator",
    "trading profit calculator",
    "forex pl calculator",
    "trade profit calculator",
    "pip profit calculator",
    "forex trade calculator",
    "position profit calculator",
  ],
  alternates: {
    canonical: "/calculators/profit-loss",
  },
  openGraph: {
    title: "Profit/Loss Calculator | AxiomPips",
    description:
      "Calculate the profit or loss for your forex trades based on entry price, exit price, and position size.",
    url: "https://axiompips.com/calculators/profit-loss",
  },
};

export default function ProfitLossPage() {
  return (
    <>
      <ToolStructuredData
        name="Profit/Loss Calculator"
        description="Calculate the profit or loss for your forex trades based on entry price, exit price, and position size. Analyze completed or hypothetical trades instantly."
        url="https://axiompips.com/calculators/profit-loss"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Profit/Loss", url: "https://axiompips.com/calculators/profit-loss" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Profit/Loss Calculator">
        <ProfitLossCalculator />
      </CalculatorWithPremium>
    </>
  );
}
