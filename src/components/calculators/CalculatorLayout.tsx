// File: src/components/calculators/CalculatorLayout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

interface CalculatorLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  formSection: ReactNode;
}

export function CalculatorLayout({
  title,
  description,
  children,
  formSection,
}: CalculatorLayoutProps) {
  return (
    <section className="py-8 md:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/calculators"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Calculators
              </Link>
            </li>
            <li className="text-zinc-600">/</li>
            <li className="text-zinc-300">{title}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">{title}</h1>
          <p className="mt-2 text-zinc-400">{description}</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Form Card */}
          <Card className="h-fit">{formSection}</Card>

          {/* Results Card */}
          <div className="space-y-6">{children}</div>
        </div>
      </Container>
    </section>
  );
}
