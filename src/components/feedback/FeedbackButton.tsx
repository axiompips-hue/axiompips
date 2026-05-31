// File: src/components/feedback/FeedbackButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FeedbackForm, FeedbackData } from "./FeedbackForm";
import { FeedbackSuccess } from "./FeedbackSuccess";
import { useToast } from "@/components/ui/Toast";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { addToast } = useToast();

  // Show tooltip once on first visit, auto-dismiss after 4s
  useEffect(() => {
    const seen = localStorage.getItem("feedback-tooltip-seen");
    if (!seen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        const hide = setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem("feedback-tooltip-seen", "1");
        }, 4000);
        return () => clearTimeout(hide);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (data: FeedbackData) => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(result.message || "Too many requests. Please wait a moment.");
        }
        throw new Error(result.message || "Failed to submit feedback");
      }

      if (result.warning) {
        addToast({
          type: "info",
          title: "Feedback received",
          message: "Your feedback has been saved. We will review it soon.",
        });
      }

      setIsSuccess(true);
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to send feedback",
        message: error instanceof Error ? error.message : "Please try again later",
      });
      throw error;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setIsSuccess(false), 300);
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 left-6 z-40 flex items-end gap-3">
        {/* First-visit tooltip */}
        <div
          className={`
            mb-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200
            text-xs font-medium rounded-xl shadow-lg whitespace-nowrap
            transition-all duration-300 origin-bottom-left
            ${showTooltip ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}
          `}
        >
          💬 Have a suggestion or found a bug?
          <div className="absolute -right-1.5 bottom-3 w-3 h-3 bg-zinc-800 border-r border-b border-zinc-700 rotate-[-45deg]" />
        </div>

        <button
          onClick={() => {
            setIsOpen(true);
            setShowTooltip(false);
            localStorage.setItem("feedback-tooltip-seen", "1");
          }}
          className="group"
          aria-label="Send feedback"
        >
          <div
            className="
              flex items-center gap-2 px-4 py-3
              bg-accent-600 hover:bg-accent-500
              text-white font-medium text-sm
              rounded-full shadow-lg shadow-accent-900/30
              transition-all duration-300
              hover:shadow-xl hover:shadow-accent-900/40
              hover:scale-105
            "
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="hidden sm:inline">Feedback</span>
          </div>
        </button>
      </div>

      {/* Feedback Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isSuccess ? undefined : "Send Feedback"}
        size="default"
        showCloseButton={!isSuccess}
      >
        {isSuccess ? (
          <FeedbackSuccess onClose={handleClose} />
        ) : (
          <FeedbackForm onSubmit={handleSubmit} onClose={handleClose} />
        )}
      </Modal>
    </>
  );
}
