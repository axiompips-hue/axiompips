// File: src/app/calculators/pivot-points/page.tsx
import { Metadata } from "next";
import { PivotPointsCalculator } from "./PivotPointsCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Pivot Points Calculator | Forex Support & Resistance Levels",
  description:
    "Calculate Classic, Woodie, Camarilla, Fibonacci, and DeMark pivot points from OHLC data. Identify key support and resistance levels for intraday forex trading.",
  keywords: [
    "pivot points calculator",
    "forex pivot points",
    "support resistance levels",
    "camarilla pivot points",
    "fibonacci pivot points",
    "woodie pivot points",
    "demark pivot points",
    "intraday trading levels",
  ],
  alternates: {
    canonical: "/calculators/pivot-points",
  },
  openGraph: {
    title: "Pivot Points Calculator | AxiomPips",
    description:
      "Calculate Classic, Woodie, Camarilla, Fibonacci, and DeMark pivot points from OHLC data.",
    url: "https://axiompips.com/calculators/pivot-points",
  },
};

export default function PivotPointsPage() {
  return (
    <>
      <ToolStructuredData
        name="Pivot Points Calculator"
        description="Calculate Classic, Woodie, Camarilla, Fibonacci, and DeMark pivot points. Identify key support and resistance levels for intraday forex trading."
        url="https://axiompips.com/calculators/pivot-points"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Pivot Points", url: "https://axiompips.com/calculators/pivot-points" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Pivot Points Calculator">
        <PivotPointsCalculator />
      </CalculatorWithPremium>
    </>
  );
}
