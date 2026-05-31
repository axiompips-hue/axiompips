// File: src/app/calculators/atr/page.tsx
import { Metadata } from "next";
import { ATRCalculator } from "./ATRCalculator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { CalculatorWithPremium } from "@/components/premium/CalculatorWithPremium";

export const metadata: Metadata = {
  title: "ATR Calculator | Average True Range Stop Loss & Take Profit",
  description:
    "Calculate dynamic stop loss and take profit levels based on ATR (Average True Range). Set volatility-adjusted exits and position sizes for any forex pair.",
  keywords: [
    "ATR calculator",
    "average true range calculator",
    "ATR stop loss",
    "volatility based stop loss",
    "ATR take profit",
    "dynamic stop loss forex",
    "ATR position sizing",
    "forex ATR levels",
  ],
  alternates: {
    canonical: "/calculators/atr",
  },
  openGraph: {
    title: "ATR Calculator | AxiomPips",
    description:
      "Calculate dynamic stop loss and take profit levels based on ATR. Set volatility-adjusted exits for any forex pair.",
    url: "https://axiompips.com/calculators/atr",
  },
};

export default function ATRPage() {
  return (
    <>
      <ToolStructuredData
        name="ATR Calculator"
        description="Calculate dynamic stop loss and take profit levels based on Average True Range (ATR). Set volatility-adjusted exits and position sizes."
        url="https://axiompips.com/calculators/atr"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Calculators", url: "https://axiompips.com/calculators" },
          { name: "ATR Calculator", url: "https://axiompips.com/calculators/atr" },
        ]}
      />
      <CalculatorWithPremium calculatorName="ATR Calculator">
        <ATRCalculator />
      </CalculatorWithPremium>
    </>
  );
}
