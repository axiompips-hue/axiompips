// File: src/app/tools/forex-heatmap/page.tsx
import { Metadata } from "next";
import { ForexHeatmap } from "./ForexHeatmap";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { AdvancedToolWithPremium } from "@/components/premium/AdvancedToolWithPremium";

export const metadata: Metadata = {
  title: "Forex Heatmap | Live Currency Strength Map",
  description:
    "Visualize real-time currency strength and weakness across all major forex pairs. Instantly spot the strongest and weakest currencies to find high-probability trade setups.",
  keywords: [
    "forex heatmap",
    "currency strength meter",
    "live forex heatmap",
    "currency weakness tracker",
    "forex market overview",
    "currency pair strength",
    "real-time forex analysis",
    "forex trading tool",
  ],
  alternates: {
    canonical: "/tools/forex-heatmap",
  },
  openGraph: {
    title: "Forex Heatmap | AxiomPips",
    description:
      "Visualize real-time currency strength and weakness across all major forex pairs. Instantly spot the strongest and weakest currencies.",
    url: "https://axiompips.com/tools/forex-heatmap",
  },
};

export default function ForexHeatmapPage() {
  return (
    <>
      <ToolStructuredData
        name="Forex Heatmap"
        description="Visualize real-time currency strength and weakness across all major forex pairs. Instantly spot the strongest and weakest currencies to find high-probability trade setups."
        url="https://axiompips.com/tools/forex-heatmap"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Forex Heatmap", url: "https://axiompips.com/tools/forex-heatmap" },
        ]}
      />
      <AdvancedToolWithPremium toolName="Forex Heatmap">
        <ForexHeatmap />
      </AdvancedToolWithPremium>
    </>
  );
}
