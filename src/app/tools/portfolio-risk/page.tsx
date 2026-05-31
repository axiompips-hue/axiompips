// File: src/app/tools/portfolio-risk/page.tsx
import { Metadata } from "next";
import { PortfolioRiskManager } from "./PortfolioRiskManager";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { AdvancedToolWithPremium } from "@/components/premium/AdvancedToolWithPremium";

export const metadata: Metadata = {
  title: "Portfolio Risk Manager | Multi-Trade Risk Analysis",
  description:
    "Analyze combined risk across multiple forex trades. Ensure your total exposure stays within your risk tolerance. Essential tool for portfolio management.",
  keywords: [
    "portfolio risk manager",
    "forex risk calculator",
    "multi-trade risk",
    "portfolio exposure",
    "risk management tool",
    "forex portfolio",
    "trade risk analysis",
    "position risk calculator",
  ],
  alternates: {
    canonical: "/tools/portfolio-risk",
  },
  openGraph: {
    title: "Portfolio Risk Manager | AxiomPips",
    description:
      "Analyze combined risk across multiple forex trades. Ensure your total exposure stays within your risk tolerance.",
    url: "https://axiompips.com/tools/portfolio-risk",
  },
};

export default function PortfolioRiskPage() {
  return (
    <>
      <ToolStructuredData
        name="Portfolio Risk Manager"
        description="Analyze combined risk across multiple forex trades. Ensure your total exposure stays within your risk tolerance. Essential tool for portfolio management."
        url="https://axiompips.com/tools/portfolio-risk"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Portfolio Risk Manager", url: "https://axiompips.com/tools/portfolio-risk" },
        ]}
      />
      <AdvancedToolWithPremium toolName="Portfolio Risk Manager">
        <PortfolioRiskManager />
      </AdvancedToolWithPremium>
    </>
  );
}
