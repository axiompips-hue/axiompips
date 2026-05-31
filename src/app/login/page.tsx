// File Location: src/app/login/page.tsx
// Description: User login page with email/password and OAuth options

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/ui/Container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordInput, OAuthButtons, Divider, Alert } from "@/components/auth";

// ─── Inner component uses useSearchParams — must be inside Suspense ──────────
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email address before signing in. Check your inbox for the confirmation link.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.user) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle as="h1" className="text-2xl">
          Welcome back
        </CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>

      <CardContent>
        <OAuthButtons redirectTo={redirectTo} />

        <Divider text="or continue with email" />

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            disabled={isLoading}
          />

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Do not have an account?{" "}
          <Link
            href="/signup"
            className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Loading skeleton shown while Suspense resolves ──────────────────────────
function LoginSkeleton() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-3/4 mx-auto" />
          <div className="h-10 bg-zinc-800 rounded" />
          <div className="h-10 bg-zinc-800 rounded" />
          <div className="h-10 bg-zinc-800 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page export — wraps LoginForm in Suspense ────────────────────────────────
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4">
      <Container className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-gradient">AxiomPips</span>
          </Link>
        </div>

        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-zinc-600">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </Container>
    </main>
  );
}
