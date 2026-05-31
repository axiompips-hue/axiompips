// File: src/components/seo/StructuredData.tsx

interface WebsiteStructuredDataProps {
  name: string;
  description: string;
  url: string;
}

/**
 * Generates JSON-LD structured data for website.
 */
export function WebsiteStructuredData({
  name,
  description,
  url,
}: WebsiteStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url,
    publisher: {
      "@type": "Organization",
      name: "AxiomPips",
      url: "https://axiompips.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface ToolStructuredDataProps {
  name: string;
  description: string;
  url: string;
  category: string;
}

/**
 * Generates JSON-LD structured data for calculator tools.
 */
export function ToolStructuredData({
  name,
  description,
  url,
  category,
}: ToolStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: category,
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "AxiomPips",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

/**
 * Generates JSON-LD structured data for breadcrumbs.
 */
export function BreadcrumbStructuredData({
  items,
}: BreadcrumbStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}