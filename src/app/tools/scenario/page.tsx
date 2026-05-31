// File: src/app/tools/scenario/page.tsx
import { Metadata } from "next";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { AdvancedToolWithPremium } from "@/components/premium/AdvancedToolWithPremium";

export const metadata: Metadata = {
  title: "Scenario Simulator | Trade What-If Analysis",
  description:
    "What-if analysis for forex trades. Adjust stop loss, take profit, and lot size in real-time to see how outcomes change. Interactive scenario planning tool.",
  keywords: [
    "scenario simulator",
    "trade simulator",
    "what if analysis",
    "forex simulator",
    "trade scenario",
    "risk reward simulator",
    "position simulator",
    "trade planning tool",
  ],
  alternates: {
    canonical: "/tools/scenario",
  },
  openGraph: {
    title: "Scenario Simulator | AxiomPips",
    description:
      "What-if analysis for forex trades. Adjust stop loss, take profit, and lot size in real-time to see how outcomes change.",
    url: "https://axiompips.com/tools/scenario",
  },
};

export default function ScenarioPage() {
  return (
    <>
      <ToolStructuredData
        name="Scenario Simulator"
        description="What-if analysis for forex trades. Adjust stop loss, take profit, and lot size in real-time to see how outcomes change. Interactive scenario planning tool."
        url="https://axiompips.com/tools/scenario"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Scenario Simulator", url: "https://axiompips.com/tools/scenario" },
        ]}
      />
      <AdvancedToolWithPremium toolName="Scenario Simulator">
        <ScenarioSimulator />
      </AdvancedToolWithPremium>
    </>
  );
}
