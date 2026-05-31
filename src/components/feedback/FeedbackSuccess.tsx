// File: src/components/feedback/FeedbackSuccess.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface FeedbackSuccessProps {
  onClose: () => void;
}

export function FeedbackSuccess({ onClose }: FeedbackSuccessProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center py-8">
      {/* Animated checkmark */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
        <div className="relative w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-400 animate-scale-up"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Confetti particles */}
        {showConfetti && (
          <div className="absolute inset-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: "50%",
                  top: "50%",
                  backgroundColor: [
                    "#06b6d4",
                    "#22c55e",
                    "#eab308",
                    "#ec4899",
                    "#8b5cf6",
                  ][i % 5],
                  animationDelay: `${i * 0.1}s`,
                  transform: `rotate(${i * 30}deg) translateY(-40px)`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <h3 className="text-xl font-semibold text-zinc-100 mb-2">
        Thank you for your feedback!
      </h3>
      <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
        We truly appreciate you taking the time to share your thoughts. Your feedback helps us improve AxiomPips for everyone.
      </p>

      <div className="flex flex-col gap-3">
        <Button onClick={onClose} fullWidth>
          Continue
        </Button>
        <p className="text-xs text-zinc-500">
          We may reach out if we need more information
        </p>
      </div>
    </div>
  );
}