// File Location: src/app/verify-email/page.tsx
// Description: Email verification success page

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4">
      <Container className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-gradient">AxiomPips</span>
          </Link>
        </div>

        <Card>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100 mb-2">
              Email Verified Successfully
            </h1>
            <p className="text-zinc-400 mb-6">
              Your email has been verified. You can now sign in to your account.
            </p>
            <Link href="/login">
              <Button variant="primary" size="large">
                Sign In to Your Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}