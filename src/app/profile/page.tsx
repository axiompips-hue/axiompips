// File: src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
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
import { PasswordInput, Alert } from "@/components/auth";
import { Crown, Clock, Zap, Cloud, FileDown, Infinity } from "lucide-react";
import { getPremiumStatus, type PremiumStatus } from "@/lib/premium/service";

function daysUntil(date: Date): number {
  const diff = date.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);

  const [fullName, setFullName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setFullName(user.user_metadata?.full_name || "");

      try {
        const status = await getPremiumStatus();
        setPremiumStatus(status);
      } catch {
        // Non-critical
      }

      setIsLoading(false);
    };

    getUser();
  }, [supabase.auth, router]);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (error) {
        setProfileError(error.message);
        return;
      }

      setProfileSuccess(true);
      router.refresh();
    } catch {
      setProfileError("An unexpected error occurred. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setPasswordError("Password must include uppercase, lowercase, and number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  const isPremium = premiumStatus?.isPremium ?? false;
  const isOnTrial = premiumStatus?.isOnTrial ?? false;
  const trialDays = premiumStatus?.trialEndsAt ? daysUntil(premiumStatus.trialEndsAt) : 0;
  const subExpiry = premiumStatus?.subscriptionEndsAt
    ? premiumStatus.subscriptionEndsAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-neutral-950">
      <Container className="py-8 max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100">Profile Settings</h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-900 text-xs font-bold rounded-full">
                <Crown className="w-3.5 h-3.5" />
                PREMIUM
              </span>
            )}
            {isOnTrial && !isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                <Clock className="w-3.5 h-3.5" />
                TRIAL
              </span>
            )}
          </div>
          <p className="text-zinc-400 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Subscription Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and features</CardDescription>
          </CardHeader>
          <CardContent>
            {isPremium ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-100">Premium Active</p>
                    {subExpiry && (
                      <p className="text-sm text-zinc-400">Renews on {subExpiry}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Infinity, label: "Unlimited Calculations" },
                    { icon: Infinity, label: "Unlimited Journal Entries" },
                    { icon: FileDown, label: "CSV / PDF / Excel Export" },
                    { icon: Cloud, label: "Cloud Sync Enabled" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
                    >
                      <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="text-sm text-zinc-300">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  To cancel your subscription, contact us at{" "}
                  <a
                    href="mailto:axiompips@gmail.com"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    axiompips@gmail.com
                  </a>
                </p>
              </div>
            ) : isOnTrial ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-100">Free Trial Active</p>
                    <p className="text-sm text-green-400">
                      {trialDays} {trialDays === 1 ? "day" : "days"} remaining
                    </p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400">
                  You have full access to all premium features during your trial. Upgrade before it
                  ends to keep your access.
                </p>
                <Link
                  href="/premium"
                  className="block w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-center transition-all"
                >
                  Upgrade to Premium
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-100">Free Plan</p>
                    <p className="text-sm text-zinc-400">
                      10 calculations/day &middot; 50 journal entries &middot; 2 tools/week
                    </p>
                  </div>
                </div>
                <Link
                  href="/premium"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium &mdash; From $4.99/month
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            {profileSuccess && (
              <Alert variant="success" className="mb-4">
                Profile updated successfully!
              </Alert>
            )}
            {profileError && (
              <Alert variant="error" className="mb-4">
                {profileError}
              </Alert>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                disabled={profileLoading}
              />

              <Input
                label="Email"
                type="email"
                value={user?.email || ""}
                disabled
                helper="Email cannot be changed"
              />

              <Button type="submit" variant="primary" isLoading={profileLoading}>
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <Alert variant="success" className="mb-4">
                Password updated successfully!
              </Alert>
            )}
            {passwordError && (
              <Alert variant="error" className="mb-4">
                {passwordError}
              </Alert>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={passwordLoading}
                helper="Minimum 8 characters with uppercase, lowercase, and number"
              />

              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={passwordLoading}
              />

              <Button type="submit" variant="primary" isLoading={passwordLoading}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Account ID</span>
                <span className="text-zinc-100 font-mono text-sm">
                  {user?.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Email Verified</span>
                <span className={user?.email_confirmed_at ? "text-green-400" : "text-yellow-400"}>
                  {user?.email_confirmed_at ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Member Since</span>
                <span className="text-zinc-100">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">Last Sign In</span>
                <span className="text-zinc-100">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
