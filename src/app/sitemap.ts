// File: src/app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://axiompips.com";

  // Core pages
  const corePages = [
    "",
    "/calculators",
    "/tools",
    "/journal",
    "/about",
  ];

  // Calculator pages
  const calculatorPages = [
    "/calculators/position-size",
    "/calculators/pip-value",
    "/calculators/margin",
    "/calculators/risk-reward",
    "/calculators/break-even",
    "/calculators/profit-loss",
  ];

  // Tool pages
  const toolPages = [
    "/tools/portfolio-risk",
    "/tools/correlation",
    "/tools/scenario",
    "/tools/compounding",
  ];

  const allPages = [...corePages, ...calculatorPages, ...toolPages];

  return allPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: page === "" ? "daily" : "weekly",
    priority: page === "" ? 1 : page.includes("/calculators/") ? 0.9 : 0.8,
  }));
}