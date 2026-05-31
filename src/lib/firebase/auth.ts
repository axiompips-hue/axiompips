// File: src/lib/firebase/auth.ts
// Supabase-integrated authentication for Firebase sync

import { createClient } from '@/lib/supabase/client';

/**
 * Get current Supabase user
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current user ID from Supabase
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Check if user is authenticated in Supabase
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * Subscribe to Supabase auth state changes
 */
export function subscribeToAuthState(
  callback: (userId: string | null) => void
): () => void {
  const supabase = createClient();
  
  // Initial state
  supabase.auth.getUser().then(({ data: { user } }) => {
    callback(user?.id || null);
  });

  // Listen for changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(session?.user?.id || null);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Get user display info from Supabase
 */
export async function getUserInfo(): Promise<{
  uid: string | null;
  email: string | null;
  displayName: string | null;
}> {
  const user = await getCurrentUser();
  return {
    uid: user?.id || null,
    email: user?.email || null,
    displayName: user?.user_metadata?.full_name || user?.email || null,
  };
}

// Keep these as no-ops since we're using Supabase for actual auth
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function signUp(email: string, password: string, displayName?: string) {
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
      },
    },
  });
}