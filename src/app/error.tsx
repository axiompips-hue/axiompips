// File: src/app/error.tsx
"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <section className="py-16 md:py-24">
      <Container size="small">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-950/50 border border-red-800/50 flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-zinc-100 mb-4">
            Something went wrong
          </h1>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            We encountered an unexpected error. Our team has been notified and
            is working to fix the issue.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="mb-8 p-4 bg-neutral-900 border border-zinc-800 rounded-lg text-left max-w-lg mx-auto">
              <p className="text-xs text-zinc-500 mb-1">Error message:</p>
              <p className="text-sm text-red-400 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-zinc-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}