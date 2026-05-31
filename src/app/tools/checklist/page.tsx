// File: src/app/tools/checklist/page.tsx
import { Metadata } from "next";
import { ChecklistBuilder } from "./ChecklistBuilder";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const metadata: Metadata = {
  title: "Pre-Trade Checklist | Trading Discipline Builder",
  description:
    "Build a personalized pre-trade checklist to enforce discipline on every trade. Track compliance, prevent revenge trading, and improve your trading process.",
  keywords: [
    "pre trade checklist",
    "trading checklist",
    "forex trading discipline",
    "trading plan checklist",
    "trade entry checklist",
  ],
  alternates: {
    canonical: "/tools/checklist",
  },
  openGraph: {
    title: "Pre-Trade Checklist | AxiomPips",
    description:
      "Build a personalized pre-trade checklist to enforce discipline on every trade.",
    url: "https://axiompips.com/tools/checklist",
  },
};

export default function ChecklistPage() {
  return (
    <>
      <ToolStructuredData
        name="Pre-Trade Checklist"
        description="Build a personalized pre-trade checklist to enforce trading discipline. Track compliance and prevent emotional trading decisions."
        url="https://axiompips.com/tools/checklist"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Pre-Trade Checklist", url: "https://axiompips.com/tools/checklist" },
        ]}
      />
      <ChecklistBuilder />
    </>
  );
}
