// File Location: src/app/reset-password/page.tsx
// Description: Set new password page after clicking reset link in email

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/Button";
import { PasswordInput, Alert } from "@/components/auth";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      setIsChecking(false);
    };

    checkSession();
  }, [supabase.auth]);

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError("Password must include at least one uppercase letter, one lowercase letter, and one number.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4">
        <Container className="max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-zinc-400">Verifying your request...</p>
          </div>
        </Container>
      </main>
    );
  }

  if (!isValidSession) {
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
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                Invalid or Expired Link
              </h2>
              <p className="text-zinc-400 mb-6">
                This password reset link is invalid or has expired.
                <br />
                Please request a new one.
              </p>
              <Link href="/forgot-password">
                <Button variant="primary">Request New Link</Button>
              </Link>
            </CardContent>
          </Card>
        </Container>
      </main>
    );
  }

  if (success) {
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                Password Updated
              </h2>
              <p className="text-zinc-400">
                Your password has been successfully updated.
                <br />
                Redirecting you to dashboard...
              </p>
            </CardContent>
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4">
      <Container className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-gradient">AxiomPips</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle as="h1" className="text-2xl">
              Set new password
            </CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
                disabled={isLoading}
                helper="Minimum 8 characters with uppercase, lowercase, and number"
              />

              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                isLoading={isLoading}
              >
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}