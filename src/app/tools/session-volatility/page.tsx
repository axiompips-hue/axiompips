// File: src/app/tools/session-volatility/page.tsx
import { Metadata } from "next";
import { SessionVolatilityAnalyzer } from "./SessionVolatilityAnalyzer";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { AdvancedToolWithPremium } from "@/components/premium/AdvancedToolWithPremium";

export const metadata: Metadata = {
  title: "Session & Volatility Analyzer | Forex Trading Tool",
  description:
    "Analyze forex market sessions and volatility patterns. Find optimal trading windows with ADR saturation, spread efficiency, and session continuity analysis.",
  keywords: [
    "forex session times",
    "forex volatility",
    "trading sessions",
    "ADR calculator",
    "spread analyzer",
    "london session",
    "new york session",
    "asian session",
  ],
  alternates: {
    canonical: "/tools/session-volatility",
  },
  openGraph: {
    title: "Session & Volatility Analyzer | AxiomPips",
    description: "Analyze forex market sessions and volatility patterns to find optimal trading windows.",
    url: "https://axiompips.com/tools/session-volatility",
  },
};

export default function SessionVolatilityPage() {
  return (
    <>
      <ToolStructuredData
        name="Session & Volatility Analyzer"
        description="Analyze forex market sessions and volatility patterns. Find optimal trading windows with ADR saturation, spread efficiency, and session continuity analysis."
        url="https://axiompips.com/tools/session-volatility"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Session & Volatility Analyzer", url: "https://axiompips.com/tools/session-volatility" },
        ]}
      />
      <AdvancedToolWithPremium toolName="Session & Volatility Analyzer">
        <SessionVolatilityAnalyzer />
      </AdvancedToolWithPremium>
    </>
  );
}
