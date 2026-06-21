// src/app/layout.tsx
// CHANGE: Replaced runtime <link> Google Fonts with next/font (self-hosted, zero extra round-trip).
// Everything else is identical to the original.

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/a11y";
import { WebsiteStructuredData } from "@/components/seo";
import { ToastProvider } from "@/components/ui/Toast";
import { FeedbackButton } from "@/components/feedback";
import { GuideTour } from "@/components/guide";
import { DesktopBanner, DesktopTitleBar } from "@/components/desktop";

// ─── Fonts ────────────────────────────────────────────────────────────────────
// next/font downloads and self-hosts these at build time.
// No runtime DNS lookup, no render-blocking <link>, no CORS issue.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  // Only preload if monospace is above-the-fold — set false to avoid wasted bytes
  preload: false,
});

// ─── Metadata ────────────────────────────────────────────────────────────────
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://axiompips.com",
    siteName: "AxiomPips",
    title: "AxiomPips - Precision Forex Calculators",
    description:
      "High-performance forex calculators and trading tools crafted for precision and speed.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AxiomPips - Precision Forex Calculators" }],
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

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <WebsiteStructuredData
          name="AxiomPips"
          description="High-performance forex calculators and trading tools crafted for precision and speed."
          url="https://axiompips.com"
        />
      </head>
      <body className="min-h-screen bg-neutral-950 text-zinc-100 flex flex-col font-sans">
        <ToastProvider>
          <DesktopTitleBar />
          <SkipLink />
          <Header />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <FeedbackButton />
          <GuideTour />
          <DesktopBanner
            downloadUrl="https://github.com/axiompips-hue/axiompips/releases/download/v0.4.8/AxiomPips-Setup.exe"
            delay={3000}
          />
        </ToastProvider>
      </body>
    </html>
  );
}
