// File: src/lib/email-templates.ts

import { FeedbackData } from "@/components/feedback";

export function createFeedbackEmailHtml(feedback: FeedbackData): string {
  const typeColors: Record<string, string> = {
    bug: "#ef4444",
    feature: "#a855f7",
    improvement: "#3b82f6",
    praise: "#ec4899",
    general: "#71717a",
  };

  const typeLabels: Record<string, string> = {
    bug: "Bug Report",
    feature: "Feature Request",
    improvement: "Improvement",
    praise: "Praise",
    general: "General Feedback",
  };

  const emojiLabels: Record<string, string> = {
    angry: "Very Dissatisfied",
    sad: "Dissatisfied",
    neutral: "Neutral",
    happy: "Satisfied",
    love: "Very Satisfied",
  };

  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const typeColor = typeColors[feedback.type] || "#71717a";
  const typeLabel = typeLabels[feedback.type] || feedback.type;
  const emojiLabel = feedback.emoji ? emojiLabels[feedback.emoji] || feedback.emoji : "Not provided";
  const ratingLabel = feedback.rating > 0 ? `${feedback.rating}/5 - ${ratingLabels[feedback.rating]}` : "Not provided";

  const formattedDate = new Date(feedback.timestamp).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Feedback from AxiomPips</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #171717; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #27272a;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">New Feedback Received</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">AxiomPips Feedback System</p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background-color: ${typeColor}20; color: ${typeColor}; font-size: 12px; font-weight: 600; border-radius: 6px; text-transform: uppercase;">
                      ${typeLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ratings Section -->
          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding-right: 12px;">
                    <div style="background-color: #262626; border-radius: 12px; padding: 16px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Star Rating</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #fbbf24;">${ratingLabel}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 12px;">
                    <div style="background-color: #262626; border-radius: 12px; padding: 16px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Feeling</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #22d3ee;">${emojiLabel}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subject -->
          ${feedback.subject ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Subject</p>
              <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 500;">${escapeHtml(feedback.subject)}</p>
            </td>
          </tr>
          ` : ""}

          <!-- Message -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Message</p>
              <div style="background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 12px; padding: 16px;">
                <p style="margin: 0; font-size: 15px; color: #e4e4e7; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(feedback.message)}</p>
              </div>
            </td>
          </tr>

          <!-- User Info -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #262626; border-radius: 12px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a;">Email</p>
                          <p style="margin: 0; font-size: 14px; color: #ffffff;">${feedback.email || "Not provided"}</p>
                        </td>
                        <td align="right">
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a;">Page</p>
                          <p style="margin: 0; font-size: 14px; color: #ffffff;">${feedback.page || "/"}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0a0a0a; border-top: 1px solid #27272a;">
              <p style="margin: 0; font-size: 12px; color: #52525b; text-align: center;">
                Submitted on ${formattedDate}
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #52525b; text-align: center;">
                AxiomPips
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function createFeedbackEmailText(feedback: FeedbackData): string {
  const typeLabels: Record<string, string> = {
    bug: "Bug Report",
    feature: "Feature Request",
    improvement: "Improvement",
    praise: "Praise",
    general: "General Feedback",
  };

  const emojiLabels: Record<string, string> = {
    angry: "Very Dissatisfied",
    sad: "Dissatisfied",
    neutral: "Neutral",
    happy: "Satisfied",
    love: "Very Satisfied",
  };

  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const typeLabel = typeLabels[feedback.type] || feedback.type;
  const emojiLabel = feedback.emoji ? emojiLabels[feedback.emoji] || feedback.emoji : "Not provided";
  const ratingLabel = feedback.rating > 0 ? `${feedback.rating}/5 - ${ratingLabels[feedback.rating]}` : "Not provided";

  const formattedDate = new Date(feedback.timestamp).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
NEW FEEDBACK RECEIVED - AXIOMPIPS
================================

Type: ${typeLabel}
Star Rating: ${ratingLabel}
Feeling: ${emojiLabel}

${feedback.subject ? `Subject: ${feedback.subject}\n` : ""}
Message:
${feedback.message}

---
User Email: ${feedback.email || "Not provided"}
Page: ${feedback.page || "/"}
Submitted: ${formattedDate}

---
AxiomPips
  `.trim();
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}