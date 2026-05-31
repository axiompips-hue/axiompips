// File: src/app/tools/correlation/page.tsx
import { Metadata } from "next";
import { CorrelationAnalyzer } from "./CorrelationAnalyzer";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { AdvancedToolWithPremium } from "@/components/premium/AdvancedToolWithPremium";

export const metadata: Metadata = {
  title: "Correlation Analyzer | Currency Exposure Tool",
  description:
    "Analyze currency exposure and correlation between your forex positions. Avoid over-concentration in correlated pairs and manage portfolio risk effectively.",
  keywords: [
    "correlation analyzer",
    "currency exposure",
    "forex correlation",
    "pair correlation",
    "portfolio risk",
    "currency risk",
    "forex hedging",
    "position correlation",
  ],
  alternates: {
    canonical: "/tools/correlation",
  },
  openGraph: {
    title: "Correlation Analyzer | AxiomPips",
    description:
      "Analyze currency exposure and correlation between your forex positions. Avoid over-concentration in correlated pairs.",
    url: "https://axiompips.com/tools/correlation",
  },
};

export default function CorrelationPage() {
  return (
    <>
      <ToolStructuredData
        name="Correlation Analyzer"
        description="Analyze currency exposure and correlation between your forex positions. Avoid over-concentration in correlated pairs and manage portfolio risk effectively."
        url="https://axiompips.com/tools/correlation"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Correlation Analyzer", url: "https://axiompips.com/tools/correlation" },
        ]}
      />
      <AdvancedToolWithPremium toolName="Correlation Analyzer">
        <CorrelationAnalyzer />
      </AdvancedToolWithPremium>
    </>
  );
}
