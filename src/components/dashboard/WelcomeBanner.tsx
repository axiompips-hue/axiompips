// File Location: src/components/dashboard/WelcomeBanner.tsx
// Description: Animated welcome banner with conditional message

interface WelcomeBannerProps {
  displayName: string;
  isNewUser: boolean;
}

export function WelcomeBanner({ displayName, isNewUser }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-zinc-800 p-8 mb-8 opacity-0 animate-fade-in-down">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-float" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="absolute top-10 right-32 w-2 h-2 bg-accent-400 rounded-full animate-float opacity-60" />
        <div className="absolute top-20 right-48 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float animation-delay-300 opacity-60" />
        <div className="absolute bottom-16 right-24 w-1 h-1 bg-green-400 rounded-full animate-float animation-delay-500 opacity-60" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            {/* Greeting icon + heading */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl animate-wave text-accent-400">
                {isNewUser ? (
                  // Celebration icon
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 7l3-4 3 4M12 3v8M5 10l2 2M19 10l-2 2M4 20l4-4M20 20l-4-4"
                    />
                  </svg>
                ) : (
                  // Wave/hand icon
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 11V5a2 2 0 114 0v6m0-4a2 2 0 114 0v6m0-3a2 2 0 114 0v5a6 6 0 01-6 6H9a4 4 0 01-4-4v-6a2 2 0 114 0z"
                    />
                  </svg>
                )}
              </span>

              <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
                {isNewUser ? "Welcome" : "Welcome back"},
                <span className="animate-text-shimmer ml-2">
                  {displayName}!
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-zinc-400 text-lg mt-2">
              {isNewUser
                ? "Your trading journey starts here. Explore our tools and start making calculated trades."
                : "Ready to make some calculated trades today?"}
            </p>

            {/* New user tips */}
            {isNewUser && (
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Start Guide
                </span>

                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Account Active
                </span>
              </div>
            )}
          </div>

          {/* Decorative icon */}
          <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500/20 to-purple-500/20 border border-zinc-700/50">
            <svg
              className="w-10 h-10 text-accent-400 animate-float"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
