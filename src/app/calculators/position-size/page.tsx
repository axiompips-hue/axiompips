// File: src/app/calculators/position-size/page.tsx
import { Metadata } from "next";
import { PositionSizeCalculator } from "./PositionSizeCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Position Size Calculator | Forex Lot Size Calculator",
  description:
    "Calculate the optimal forex lot size based on your account balance, risk percentage, and stop loss distance. Free, fast, and accurate position sizing tool for traders.",
  keywords: [
    "position size calculator",
    "lot size calculator",
    "forex position sizing",
    "risk management calculator",
    "forex lot calculator",
    "trading position size",
    "forex risk calculator",
    "lot size formula",
  ],
  alternates: {
    canonical: "/calculators/position-size",
  },
  openGraph: {
    title: "Position Size Calculator | AxiomPips",
    description:
      "Calculate the optimal forex lot size based on your account balance, risk percentage, and stop loss distance.",
    url: "https://axiompips.com/calculators/position-size",
  },
};

export default function PositionSizePage() {
  return (
    <>
      <ToolStructuredData
        name="Position Size Calculator"
        description="Calculate the optimal forex lot size based on your account balance, risk percentage, and stop loss distance. Free, fast, and accurate position sizing tool."
        url="https://axiompips.com/calculators/position-size"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Position Size", url: "https://axiompips.com/calculators/position-size" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Position Size Calculator">
        <PositionSizeCalculator />
      </CalculatorWithPremium>
    </>
  );
}
