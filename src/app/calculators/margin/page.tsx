// File: src/app/calculators/margin/page.tsx
import { Metadata } from "next";
import { MarginCalculator } from "./MarginCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Margin Calculator | Forex Margin Requirements",
  description:
    "Calculate the required margin for forex positions based on lot size, leverage, and current exchange rates. Essential tool for position sizing and risk management.",
  keywords: [
    "margin calculator",
    "forex margin",
    "leverage calculator",
    "required margin",
    "position margin",
    "margin level",
    "free margin calculator",
    "forex leverage",
  ],
  alternates: {
    canonical: "/calculators/margin",
  },
  openGraph: {
    title: "Margin Calculator | AxiomPips",
    description:
      "Calculate the required margin for forex positions based on lot size, leverage, and current exchange rates.",
    url: "https://axiompips.com/calculators/margin",
  },
};

export default function MarginPage() {
  return (
    <>
      <ToolStructuredData
        name="Margin Calculator"
        description="Calculate the required margin for forex positions based on lot size, leverage, and current exchange rates. Essential tool for position sizing and risk management."
        url="https://axiompips.com/calculators/margin"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Margin Calculator", url: "https://axiompips.com/calculators/margin" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Margin Calculator">
        <MarginCalculator />
      </CalculatorWithPremium>
    </>
  );
}
