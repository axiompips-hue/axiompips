// File: src/app/calculators/spread-cost/page.tsx
import { Metadata } from "next";
import { SpreadCostCalculator } from "./SpreadCostCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Spread Cost Calculator | True Trading Cost Analysis",
  description:
    "Calculate the exact cost of the bid-ask spread on every trade. Understand daily, weekly, and monthly spread expenses to optimize your trading strategy.",
  keywords: [
    "spread cost calculator",
    "forex spread",
    "bid ask spread",
    "trading cost calculator",
    "spread analysis",
    "broker spread",
    "forex costs",
    "pip spread calculator",
    "trading expenses",
    "spread impact",
  ],
  alternates: {
    canonical: "/calculators/spread-cost",
  },
  openGraph: {
    title: "Spread Cost Calculator | AxiomPips",
    description:
      "Calculate the true cost of the bid-ask spread on every trade. See daily, weekly, and annual spread expenses.",
    url: "https://axiompips.com/calculators/spread-cost",
  },
};

export default function SpreadCostPage() {
  return (
    <>
      <ToolStructuredData
        name="Spread Cost Calculator"
        description="Calculate the exact cost of the bid-ask spread on every forex trade. Understand daily, weekly, and monthly spread expenses to optimize your trading strategy."
        url="https://axiompips.com/calculators/spread-cost"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Spread Cost", url: "https://axiompips.com/calculators/spread-cost" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Spread Cost Calculator">
        <SpreadCostCalculator />
      </CalculatorWithPremium>
    </>
  );
}
