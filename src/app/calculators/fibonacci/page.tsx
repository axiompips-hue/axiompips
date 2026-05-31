// File: src/app/calculators/fibonacci/page.tsx
import { Metadata } from "next";
import { FibonacciCalculator } from "./FibonacciCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "Fibonacci Calculator | Retracement & Extension Levels",
  description:
    "Calculate Fibonacci retracement and extension levels for forex trading. Identify key support and resistance zones with precision. Free advanced Fibonacci tool.",
  keywords: [
    "fibonacci calculator",
    "fibonacci retracement",
    "fibonacci extension",
    "forex fibonacci",
    "fibonacci levels",
    "trading fibonacci",
    "fibonacci projection",
    "golden ratio trading",
  ],
  alternates: {
    canonical: "/calculators/fibonacci",
  },
  openGraph: {
    title: "Fibonacci Calculator | AxiomPips",
    description:
      "Calculate Fibonacci retracement and extension levels for forex trading. Identify key support and resistance zones.",
    url: "https://axiompips.com/calculators/fibonacci",
  },
};

export default function FibonacciPage() {
  return (
    <>
      <ToolStructuredData
        name="Fibonacci Calculator"
        description="Calculate Fibonacci retracement and extension levels for forex trading. Identify key support and resistance zones with precision."
        url="https://axiompips.com/calculators/fibonacci"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "Fibonacci", url: "https://axiompips.com/calculators/fibonacci" },
        ]}
      />
      <CalculatorWithPremium calculatorName="Fibonacci Calculator">
        <FibonacciCalculator />
      </CalculatorWithPremium>
    </>
  );
}
