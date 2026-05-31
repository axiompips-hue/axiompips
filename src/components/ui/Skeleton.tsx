// File: src/components/ui/Skeleton.tsx
import { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

/**
 * Base skeleton component for loading states.
 */
export function Skeleton({
  className = "",
  width,
  height,
  rounded = "md",
}: SkeletonProps) {
  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div
      className={`
        animate-pulse bg-zinc-800
        ${roundedClasses[rounded]}
        ${className}
      `}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Skeleton for text content.
 */
export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 && lines > 1 ? "75%" : "100%"}
          rounded="sm"
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for card content.
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`
        bg-neutral-900 border border-zinc-800 rounded-xl p-6
        ${className}
      `}
    >
      <Skeleton height={24} width="60%" className="mb-4" />
      <SkeletonText lines={3} />
      <div className="mt-6 flex gap-3">
        <Skeleton height={40} width={100} rounded="lg" />
        <Skeleton height={40} width={100} rounded="lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for calculator forms.
 */
export function SkeletonCalculator() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Form skeleton */}
      <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-6">
        <Skeleton height={20} width="40%" className="mb-6" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton height={14} width="50%" className="mb-2" />
              <Skeleton height={42} rounded="lg" />
            </div>
            <div>
              <Skeleton height={14} width="50%" className="mb-2" />
              <Skeleton height={42} rounded="lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton height={14} width="60%" className="mb-2" />
              <Skeleton height={42} rounded="lg" />
            </div>
            <div>
              <Skeleton height={14} width="40%" className="mb-2" />
              <Skeleton height={42} rounded="lg" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton height={34} width={90} rounded="lg" />
            <Skeleton height={34} width={72} rounded="lg" />
          </div>
        </div>
      </div>

      {/* Results skeleton */}
      <div className="space-y-6">
        <div className="bg-accent-950/30 border border-accent-800/50 rounded-lg p-4">
          <Skeleton height={16} width="40%" className="mb-2 mx-auto" />
          <Skeleton height={32} width="50%" className="mx-auto" />
        </div>
        <div className="bg-neutral-900 border border-zinc-800 rounded-xl p-6">
          <Skeleton height={16} width="30%" className="mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-2">
                <Skeleton height={16} width="40%" />
                <Skeleton height={16} width="25%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for page headers.
 */
export function SkeletonHeader() {
  return (
    <div className="mb-8">
      <Skeleton height={12} width={120} className="mb-4" />
      <Skeleton height={36} width="50%" className="mb-2" />
      <Skeleton height={20} width="70%" />
    </div>
  );
}

/**
 * Full page loading skeleton.
 */
export function SkeletonPage() {
  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-7xl">
        <SkeletonHeader />
        <SkeletonCalculator />
      </div>
    </div>
  );
}