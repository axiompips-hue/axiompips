// File: src/app/calculators/pip-value/page.tsx
import { Metadata } from "next";
import { PipValueCalculator } from "./PipValueCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Pip Value Calculator | Forex Pip Calculator",
  description:
    "Calculate the monetary value of a single pip for any forex currency pair in your account currency. Essential tool for risk management and position sizing.",
  keywords: [
    "pip value calculator",
    "forex pip calculator",
    "pip calculator",
    "forex pip value",
    "pip worth",
    "calculate pip value",
    "currency pip value",
    "trading pip calculator",
  ],
  alternates: {
    canonical: "/calculators/pip-value",
  },
  openGraph: {
    title: "Pip Value Calculator | AxiomPips",
    description:
      "Calculate the monetary value of a single pip for any forex currency pair in your account currency.",
    url: "https://axiompips.com/calculators/pip-value",
  },
};

export default function PipValuePage() {
  return (
    <>
      <ToolStructuredData
        name="Pip Value Calculator"
        description="Calculate the monetary value of a single pip for any forex currency pair in your account currency. Essential tool for risk management and position sizing."
        url="https://axiompips.com/calculators/pip-value"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Pip Value Calculator", url: "https://axiompips.com/calculators/pip-value" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Pip Value Calculator">
        <PipValueCalculator />
      </CalculatorWithPremium>
    </>
  );
}
