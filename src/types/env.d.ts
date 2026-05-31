// File: src/types/env.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    RESEND_API_KEY?: string;
    FEEDBACK_EMAIL?: string;
  }
}