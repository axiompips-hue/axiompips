// File: src/app/api/feedback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { FeedbackData } from "@/components/feedback";
import { createFeedbackEmailHtml, createFeedbackEmailText } from "@/lib/email-templates";
import { storeFeedback } from "@/lib/feedback-storage";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";

const resend = new Resend(process.env.RESEND_API_KEY);

const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL || "support@axiompips.com";

interface FeedbackRequestBody {
  type: string;
  rating: number;
  emoji: string;
  email: string;
  subject: string;
  message: string;
  page: string;
  timestamp: string;
}

function validateFeedback(body: FeedbackRequestBody): { valid: boolean; error?: string } {
  const validTypes = ["bug", "feature", "improvement", "general", "praise"];

  if (!body.type || !validTypes.includes(body.type)) {
    return { valid: false, error: "Invalid feedback type" };
  }

  if (!body.message || typeof body.message !== "string") {
    return { valid: false, error: "Message is required" };
  }

  if (body.message.trim().length < 10) {
    return { valid: false, error: "Message must be at least 10 characters" };
  }

  if (body.message.length > 5000) {
    return { valid: false, error: "Message must be less than 5000 characters" };
  }

  if (body.email && typeof body.email === "string" && body.email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return { valid: false, error: "Invalid email format" };
    }
  }

  if (body.rating && (typeof body.rating !== "number" || body.rating < 0 || body.rating > 5)) {
    return { valid: false, error: "Invalid rating" };
  }

  if (body.subject && body.subject.length > 200) {
    return { valid: false, error: "Subject must be less than 200 characters" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests",
          message: `Please wait ${Math.ceil(rateLimit.resetIn / 1000)} seconds before submitting again`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": Math.ceil(rateLimit.resetIn / 1000).toString(),
          },
        }
      );
    }

    // Parse request body
    let body: FeedbackRequestBody;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON", message: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    // Validate feedback
    const validation = validateFeedback(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: validation.error },
        { status: 400 }
      );
    }

    // Create feedback data
    const feedbackData: FeedbackData = {
      type: body.type as FeedbackData["type"],
      rating: body.rating || 0,
      emoji: body.emoji || "",
      email: body.email || "",
      subject: body.subject || "",
      message: body.message.trim(),
      page: body.page || "/",
      timestamp: body.timestamp || new Date().toISOString(),
    };

    // Try to send email
    let emailSent = false;
    let emailError: string | null = null;

    if (process.env.RESEND_API_KEY) {
      try {
        const typeLabels: Record<string, string> = {
          bug: "Bug Report",
          feature: "Feature Request",
          improvement: "Improvement",
          praise: "Praise",
          general: "General Feedback",
        };

        const subjectLine = feedbackData.subject
          ? `[${typeLabels[feedbackData.type]}] ${feedbackData.subject}`
          : `[${typeLabels[feedbackData.type]}] New Feedback from AxiomPips`;

        const result = await resend.emails.send({
          from: "AxiomPips Feedback <onboarding@resend.dev>",
          to: FEEDBACK_EMAIL,
          subject: subjectLine,
          html: createFeedbackEmailHtml(feedbackData),
          text: createFeedbackEmailText(feedbackData),
          replyTo: feedbackData.email || undefined,
        });

        if (result.error) {
          emailError = result.error.message;
          console.error("Resend error:", result.error);
        } else {
          emailSent = true;
        }
      } catch (error) {
        emailError = error instanceof Error ? error.message : "Unknown email error";
        console.error("Email sending error:", error);
      }
    } else {
      emailError = "Email service not configured";
      console.warn("RESEND_API_KEY not set, skipping email");
    }

    // Store feedback locally (backup)
    try {
      storeFeedback(feedbackData, emailSent);
    } catch (storageError) {
      console.error("Feedback storage error:", storageError);
    }

    // Return response
    if (emailSent) {
      return NextResponse.json(
        {
          success: true,
          message: "Feedback submitted successfully",
          emailSent: true,
        },
        { status: 200 }
      );
    } else {
      // Even if email fails, feedback is stored locally
      return NextResponse.json(
        {
          success: true,
          message: "Feedback received (email delivery pending)",
          emailSent: false,
          warning: emailError,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Feedback API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "feedback",
    timestamp: new Date().toISOString(),
  });
}