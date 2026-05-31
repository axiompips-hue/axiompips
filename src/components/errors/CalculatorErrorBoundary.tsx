// File: src/components/errors/CalculatorErrorBoundary.tsx
"use client";

import { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CalculatorErrorBoundaryProps {
  children: ReactNode;
  calculatorName?: string;
}

/**
 * Specialized error boundary for calculator components.
 */
export function CalculatorErrorBoundary({
  children,
  calculatorName = "Calculator",
}: CalculatorErrorBoundaryProps) {
  const fallback = (
    <Card className="text-center py-12">
      <div className="max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800/50 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <CardTitle>{calculatorName} Error</CardTitle>
        <CardDescription className="mt-2">
          There was a problem loading this calculator. Please refresh the page
          to try again.
        </CardDescription>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </Card>
  );

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}