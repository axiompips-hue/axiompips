// File: src/app/tools/compounding/page.tsx
import { Metadata } from "next";
import { CompoundingProjector } from "./CompoundingProjector";
import { ToolStructuredData, BreadcrumbStructuredData } from "@/components/seo";
import { AdvancedToolWithPremium } from "@/components/premium/AdvancedToolWithPremium";

export const metadata: Metadata = {
  title: "Compounding Projector | Trading Growth Simulator",
  description:
    "Project your account growth with compounding. Visualize how consistent trading can grow your account over time. Calculate expected value and analyze equity curves.",
  keywords: [
    "compounding calculator",
    "trading growth calculator",
    "forex compounding",
    "account growth projector",
    "trading simulator",
    "expected value calculator",
    "equity curve simulator",
    "compound interest trading",
  ],
  alternates: {
    canonical: "/tools/compounding",
  },
  openGraph: {
    title: "Compounding Projector | AxiomPips",
    description:
      "Project your account growth with compounding. Visualize how consistent trading can grow your account over time.",
    url: "https://axiompips.com/tools/compounding",
  },
};

export default function CompoundingPage() {
  return (
    <>
      <ToolStructuredData
        name="Compounding Projector"
        description="Project your account growth with compounding. Visualize how consistent trading can grow your account over time. Calculate expected value and analyze equity curves."
        url="https://axiompips.com/tools/compounding"
        category="FinanceApplication"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://axiompips.com" },
          { name: "Tools", url: "https://axiompips.com/tools" },
          { name: "Compounding Projector", url: "https://axiompips.com/tools/compounding" },
        ]}
      />
      <AdvancedToolWithPremium toolName="Compounding Projector">
        <CompoundingProjector />
      </AdvancedToolWithPremium>
    </>
  );
}
