// File: src/app/calculators/break-even/page.tsx
import { Metadata } from "next";
import { BreakEvenCalculator } from "./BreakEvenCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Break-Even Calculator | Trading Cost Analysis",
  description:
    "Calculate the exact price where your trade breaks even after accounting for spread and commissions. Essential tool for forex traders.",
  keywords: [
    "break even calculator",
    "forex break even",
    "trading costs",
    "spread calculator",
    "commission calculator",
    "forex trading",
    "break even price",
    "trading break even",
  ],
  alternates: {
    canonical: "/calculators/break-even",
  },
  openGraph: {
    title: "Break-Even Calculator | AxiomPips",
    description:
      "Calculate the exact price where your trade breaks even after accounting for spread and commissions.",
    url: "https://axiompips.com/calculators/break-even",
  },
};

export default function BreakEvenPage() {
  return (
    <>
      <ToolStructuredData
        name="Break-Even Calculator"
        description="Calculate the exact price where your trade breaks even after accounting for spread and commissions. Essential tool for forex traders."
        url="https://axiompips.com/calculators/break-even"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Break-Even", url: "https://axiompips.com/calculators/break-even" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Break-Even Calculator">
        <BreakEvenCalculator />
      </CalculatorWithPremium>
    </>
  );
}
