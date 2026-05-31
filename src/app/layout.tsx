// File: src/app/layout.tsx
// CHANGE: Added <DesktopBanner /> — everything else is identical to the original.

import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/a11y";
import { WebsiteStructuredData } from "@/components/seo";
import { ToastProvider } from "@/components/ui/Toast";
import { FeedbackButton } from "@/components/feedback";
import { GuideTour } from "@/components/guide";
import { DesktopBanner } from "@/components/desktop";

export const metadata: Metadata = {
  title: {
    default: "AxiomPips - Precision Forex Calculators",
    template: "%s | AxiomPips",
  },
  description:
    "High-performance forex calculators and trading tools crafted for precision and speed. Position size, pip value, margin, risk management, and more.",
  keywords: [
    "forex calculator",
    "position size calculator",
    "pip value calculator",
    "forex tools",
    "trading calculator",
    "risk management",
    "lot size calculator",
    "pip calculator",
    "forex trading",
    "risk reward calculator",
  ],
  authors: [{ name: "AxiomPips" }],
  creator: "AxiomPips",
  publisher: "AxiomPips",
  metadataBase: new URL("https://axiompips.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://axiompips.com",
    siteName: "AxiomPips",
    title: "AxiomPips - Precision Forex Calculators",
    description:
      "High-performance forex calculators and trading tools crafted for precision and speed.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AxiomPips - Precision Forex Calculators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AxiomPips - Precision Forex Calculators",
    description:
      "High-performance forex calculators and trading tools crafted for precision and speed.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <WebsiteStructuredData
          name="AxiomPips"
          description="High-performance forex calculators and trading tools crafted for precision and speed."
          url="https://axiompips.com"
        />
      </head>
      <body className="min-h-screen bg-neutral-950 text-zinc-100 flex flex-col">
        <ToastProvider>
          <SkipLink />
          <Header />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <FeedbackButton />
          <GuideTour />
          {/* ── Desktop app download prompt (only shown in browser, not Electron) ── */}
          <DesktopBanner
            downloadUrl="https://github.com/your-username/axiompips/releases/latest"
            delay={3000}
          />
        </ToastProvider>
      </body>
    </html>
  );
}
