// File Location: src/lib/supabase/client.ts
// Description: Supabase client for browser/client components
// Use this in components that have 'use client' directive

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}