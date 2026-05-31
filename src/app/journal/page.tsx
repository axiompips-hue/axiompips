// File: src/app/journal/page.tsx
import { Metadata } from "next";
import { TradeJournal } from "./TradeJournal";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const metadata: Metadata = {
  title: "Trade Journal | Track & Analyze Your Trading Performance",
  description:
    "Professional trade journal with AI-powered insights. Log trades, track performance metrics, and identify patterns in your trading behavior.",
  keywords: [
    "trade journal",
    "trading journal",
    "forex journal",
    "trade tracker",
    "trading performance",
    "trading analytics",
    "trade analysis",
    "trading statistics",
  ],
  alternates: {
    canonical: "/journal",
  },
  openGraph: {
    title: "Trade Journal | AxiomPips",
    description:
      "Professional trade journal with AI-powered insights. Log trades, track performance, and improve your trading.",
    url: "https://axiompips.com/journal",
  },
};

export default function JournalPage() {
  return (
    <>
      <ToolStructuredData
        name="Trade Journal"
        description="Professional trade journal with AI-powered insights. Log trades, track performance metrics, and identify patterns in your trading behavior."
        url="https://axiompips.com/journal"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Trade Journal", url: "https://axiompips.com/journal" },
        ]}
      />
      <TradeJournal />
    </>
  );
}
