// File: src/app/calculators/swap/page.tsx
import { Metadata } from "next";
import { SwapCalculator } from "./SwapCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Swap Calculator | Overnight Rollover Fees & Credits",
  description:
    "Calculate forex swap fees and overnight rollover costs for holding positions. Estimate daily, weekly, and monthly swap charges with our free trading calculator.",
  keywords: [
    "swap calculator",
    "forex swap",
    "overnight rollover",
    "rollover fees",
    "carry trade",
    "swap rates",
    "forex overnight cost",
    "trading swap calculator",
    "forex interest",
    "position holding cost",
  ],
  alternates: {
    canonical: "/calculators/swap",
  },
  openGraph: {
    title: "Swap Calculator | AxiomPips",
    description:
      "Calculate forex swap fees and overnight rollover costs for holding positions. Estimate daily, weekly, and monthly swap charges.",
    url: "https://axiompips.com/calculators/swap",
  },
};

export default function SwapPage() {
  return (
    <>
      <ToolStructuredData
        name="Swap Calculator"
        description="Calculate forex swap fees and overnight rollover costs for holding positions. Estimate daily, weekly, and monthly swap charges with precision."
        url="https://axiompips.com/calculators/swap"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Swap", url: "https://axiompips.com/calculators/swap" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Swap Calculator">
        <SwapCalculator />
      </CalculatorWithPremium>
    </>
  );
}
