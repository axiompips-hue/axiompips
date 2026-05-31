// File: src/app/not-found.tsx
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <section className="py-16 md:py-24">
      <Container size="small">
        <div className="text-center">
          <div className="mb-8">
            <span className="text-8xl font-bold text-gradient">404</span>
          </div>

          <h1 className="text-3xl font-bold text-zinc-100 mb-4">
            Page not found
          </h1>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
            Check the URL or navigate back to the home page.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
            <Link href="/calculators">
              <Button variant="secondary">View Calculators</Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <p className="text-sm text-zinc-500 mb-4">Popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/calculators/position-size"
                className="text-sm text-accent-400 hover:text-accent-300"
              >
                Position Size Calculator
              </Link>
              <Link
                href="/calculators/pip-value"
                className="text-sm text-accent-400 hover:text-accent-300"
              >
                Pip Value Calculator
              </Link>
              <Link
                href="/tools"
                className="text-sm text-accent-400 hover:text-accent-300"
              >
                Advanced Tools
              </Link>
              <Link
                href="/journal"
                className="text-sm text-accent-400 hover:text-accent-300"
              >
                Trade Journal
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}