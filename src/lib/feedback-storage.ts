// File: src/lib/feedback-storage.ts

import { FeedbackData } from "@/components/feedback";
import fs from "fs";
import path from "path";

const FEEDBACK_DIR = path.join(process.cwd(), "feedback-data");
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, "feedback.json");

interface StoredFeedback extends FeedbackData {
  id: string;
  emailSent: boolean;
  createdAt: string;
}

function ensureDirectoryExists(): void {
  if (!fs.existsSync(FEEDBACK_DIR)) {
    fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
  }
}

function readFeedbackFile(): StoredFeedback[] {
  ensureDirectoryExists();
  
  if (!fs.existsSync(FEEDBACK_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(FEEDBACK_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading feedback file:", error);
    return [];
  }
}

function writeFeedbackFile(feedbacks: StoredFeedback[]): void {
  ensureDirectoryExists();
  
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing feedback file:", error);
    throw error;
  }
}

export function storeFeedback(feedback: FeedbackData, emailSent: boolean): StoredFeedback {
  const storedFeedback: StoredFeedback = {
    ...feedback,
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    emailSent,
    createdAt: new Date().toISOString(),
  };

  const feedbacks = readFeedbackFile();
  feedbacks.push(storedFeedback);
  writeFeedbackFile(feedbacks);

  return storedFeedback;
}

export function getAllFeedback(): StoredFeedback[] {
  return readFeedbackFile();
}

export function getFeedbackById(id: string): StoredFeedback | undefined {
  const feedbacks = readFeedbackFile();
  return feedbacks.find((f) => f.id === id);
}

export function updateFeedbackEmailStatus(id: string, emailSent: boolean): void {
  const feedbacks = readFeedbackFile();
  const index = feedbacks.findIndex((f) => f.id === id);
  
  if (index !== -1) {
    feedbacks[index].emailSent = emailSent;
    writeFeedbackFile(feedbacks);
  }
}