// File: src/app/calculators/dca/page.tsx
import { Metadata } from "next";
import { DCACalculator } from "./DCACalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "DCA Calculator | Dollar Cost Averaging",
  description:
    "Calculate your average entry price, total position size, and profit/loss across multiple trading entries. Advanced DCA planning tool for forex traders.",
  keywords: [
    "dca calculator",
    "dollar cost averaging calculator",
    "average entry price calculator",
    "forex dca",
    "position averaging calculator",
    "martingale calculator",
    "average down calculator",
    "forex position calculator",
  ],
  alternates: {
    canonical: "/calculators/dca",
  },
  openGraph: {
    title: "DCA Calculator | AxiomPips",
    description:
      "Calculate your average entry price, total position size, and profit/loss across multiple trading entries.",
    url: "https://axiompips.com/calculators/dca",
  },
};

export default function DCAPage() {
  return (
    <>
      <ToolStructuredData
        name="DCA Calculator"
        description="Calculate your average entry price, total position size, and profit/loss across multiple trading entries. Advanced dollar cost averaging tool for forex traders."
        url="https://axiompips.com/calculators/dca"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "DCA Calculator", url: "https://axiompips.com/calculators/dca" },
        ]}
      />
      <CalculatorWithPremium calculatorName="DCA Calculator">
        <DCACalculator />
      </CalculatorWithPremium>
    </>
  );
}
