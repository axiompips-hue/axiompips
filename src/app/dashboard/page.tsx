// File: src/app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import {
  WelcomeBanner,
  StatCard,
  QuickLinkCard,
  CalculatorLink,
  SessionClock,
} from "@/components/dashboard";
import { PremiumDashboardCard } from "@/components/premium/PremiumDashboardCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Trader";

  const createdAt = new Date(user.created_at);
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const isNewUser = createdAt > fiveMinutesAgo;

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Today";

  const quickLinks = [
    {
      href: "/calculators/position-size",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: "Position Size",
      description: "Calculate optimal lot sizes based on risk",
      gradient: "cyan" as const,
    },
    {
      href: "/journal",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Trade Journal",
      description: "Track and analyze your trades",
      gradient: "green" as const,
    },
    {
      href: "/calculators/risk-reward",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Risk/Reward",
      description: "Analyze trade risk and reward ratios",
      gradient: "purple" as const,
    },
    {
      href: "/calculators/pip-value",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Pip Value",
      description: "Calculate pip values for any pair",
      gradient: "yellow" as const,
    },
    {
      href: "/tools/compounding",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: "Compounding",
      description: "Project compound growth over time",
      gradient: "pink" as const,
    },
    {
      href: "/tools/correlation",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      title: "Correlation",
      description: "Analyze currency pair correlations",
      gradient: "orange" as const,
    },
  ];

  const calculators = [
    { name: "Position Size", href: "/calculators/position-size" },
    { name: "Pip Value", href: "/calculators/pip-value" },
    { name: "Margin", href: "/calculators/margin" },
    { name: "Risk/Reward", href: "/calculators/risk-reward" },
    { name: "Profit/Loss", href: "/calculators/profit-loss" },
    { name: "Break Even", href: "/calculators/break-even" },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10 py-8">
        {/* Welcome Banner */}
        <WelcomeBanner displayName={displayName} isNewUser={isNewUser} />

        {/* Premium Status Card  -  client island */}
        <div className="mb-8">
          <PremiumDashboardCard />
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Account Status"
            value="Active"
            gradient="cyan"
            delay={100}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Member Since"
            value={memberSince}
            gradient="green"
            delay={200}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Last Sign In"
            value={lastSignIn}
            gradient="purple"
            delay={300}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label="Email"
            value={user.email || "Verified"}
            gradient="yellow"
            delay={400}
          />
        </div>

        {/* Session Clock */}
        <div className="mb-8">
          <SessionClock />
        </div>

        {/* Quick Access Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 opacity-0 animate-fade-in-left animation-delay-300">
            <div className="w-1 h-6 bg-gradient-to-b from-accent-400 to-accent-600 rounded-full" />
            <h2 className="text-xl font-bold text-zinc-100">Quick Access</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <QuickLinkCard
                key={link.href}
                href={link.href}
                icon={link.icon}
                title={link.title}
                description={link.description}
                gradient={link.gradient}
                delay={400 + index * 100}
              />
            ))}
          </div>
        </div>

        {/* All Calculators Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 opacity-0 animate-fade-in-left animation-delay-500">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
            <h2 className="text-xl font-bold text-zinc-100">All Calculators</h2>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl bg-neutral-900/60 border border-zinc-800 p-6 opacity-0 animate-fade-in-up animation-delay-600"
            style={{ animationFillMode: "forwards" }}
          >
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {calculators.map((calc, index) => (
                <CalculatorLink
                  key={calc.href}
                  href={calc.href}
                  name={calc.name}
                  delay={700 + index * 50}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Getting Started Tips for New Users */}
        {isNewUser && (
          <div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-900/20 via-purple-900/20 to-accent-900/20 border border-accent-500/20 p-6 opacity-0 animate-fade-in-up animation-delay-800"
            style={{ animationFillMode: "forwards" }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-accent-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  Getting Started Tips
                </h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                    Start with the Position Size Calculator to manage your risk
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                    Use the Trade Journal to track all your trades
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                    Check the Correlation tool before opening multiple positions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="h-8" />
      </Container>
    </main>
  );
}
