// File: src/components/feedback/FeedbackForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StarRating, getRatingLabel } from "./StarRating";
import { EmojiRating } from "./EmojiRating";
import { FeedbackTypeSelector, FeedbackType } from "./FeedbackTypeSelector";

export interface FeedbackData {
  type: FeedbackType;
  rating: number;
  emoji: string;
  email: string;
  subject: string;
  message: string;
  page: string;
  timestamp: string;
}

interface FeedbackFormProps {
  onSubmit: (data: FeedbackData) => Promise<void>;
  onClose: () => void;
}

type Step = "type" | "rating" | "details";

export function FeedbackForm({ onSubmit, onClose }: FeedbackFormProps) {
  const [step, setStep] = useState<Step>("type");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    type: null as FeedbackType | null,
    rating: 0,
    emoji: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async () => {
    if (!formData.type || !formData.message.trim()) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        type: formData.type,
        rating: formData.rating,
        emoji: formData.emoji,
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        page: typeof window !== "undefined" ? window.location.pathname : "",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeSelect = (type: FeedbackType) => {
    setStep("rating");
  };

  const displayRating = hoverRating !== null ? hoverRating : formData.rating;
  const ratingLabel = getRatingLabel(displayRating);

  const canProceedFromRating = formData.rating > 0 || formData.emoji !== "";
  const canSubmit = formData.message.trim().length >= 10;

  const renderStep = () => {
    switch (step) {
      case "type":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-zinc-100">
                What type of feedback do you have?
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Select the category that best describes your feedback
              </p>
            </div>

            <FeedbackTypeSelector
              value={formData.type}
              onChange={(type) => setFormData((prev) => ({ ...prev, type }))}
              onSelect={handleTypeSelect}
            />

            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-zinc-100">
                How would you rate your experience?
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Your rating helps us understand how we are doing
              </p>
            </div>

            <div className="space-y-8">
              {/* Star Rating */}
              <div className="text-center">
                <p className="text-sm text-zinc-500 mb-3">Overall Rating</p>
                <div className="flex justify-center">
                  <StarRating
                    value={formData.rating}
                    onChange={(rating) => setFormData((prev) => ({ ...prev, rating }))}
                    onHoverChange={setHoverRating}
                    size="large"
                  />
                </div>
                <div className="h-6 mt-2">
                  {ratingLabel && (
                    <p className="text-sm text-accent-400 animate-fade-in">
                      {ratingLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-neutral-900 px-2 text-zinc-500">or</span>
                </div>
              </div>

              {/* Emoji Rating */}
              <div className="text-center pb-4">
                <p className="text-sm text-zinc-500 mb-4">How do you feel?</p>
                <EmojiRating
                  value={formData.emoji}
                  onChange={(emoji) => setFormData((prev) => ({ ...prev, emoji }))}
                />
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep("type")}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep("details")}
                >
                  Skip
                </Button>
                <Button
                  onClick={() => setStep("details")}
                  disabled={!canProceedFromRating}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-zinc-100">
                Tell us more
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Share your thoughts and we will get back to you
              </p>
            </div>

            <Input
              label="Email (optional)"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              helper="We will only use this to respond to your feedback"
            />

            <Input
              label="Subject (optional)"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief summary of your feedback"
            />

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Your Feedback <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Please describe your feedback in detail..."
                rows={5}
                className="w-full px-3 py-2.5 bg-neutral-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors resize-none"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {formData.message.length < 10
                  ? `Minimum 10 characters (${formData.message.length}/10)`
                  : `${formData.message.length} characters`}
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep("rating")}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                isLoading={isSubmitting}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {(["type", "rating", "details"] as Step[]).map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`
                w-2.5 h-2.5 rounded-full transition-colors
                ${
                  s === step
                    ? "bg-accent-500"
                    : index < ["type", "rating", "details"].indexOf(step)
                    ? "bg-accent-700"
                    : "bg-zinc-700"
                }
              `}
            />
            {index < 2 && (
              <div
                className={`
                  w-8 h-0.5 transition-colors
                  ${
                    index < ["type", "rating", "details"].indexOf(step)
                      ? "bg-accent-700"
                      : "bg-zinc-700"
                  }
                `}
              />
            )}
          </div>
        ))}
      </div>

      {renderStep()}
    </div>
  );
}