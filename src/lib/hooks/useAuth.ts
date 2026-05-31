// File Location: src/lib/hooks/useAuth.ts
// Description: Custom React hook for managing authentication state

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const supabase = createClient();

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session refresh error:", error);
        setAuthState({ user: null, session: null, loading: false });
        return;
      }

      setAuthState({
        user: data.session?.user ?? null,
        session: data.session,
        loading: false,
      });
    } catch (error) {
      console.error("Session refresh error:", error);
      setAuthState({ user: null, session: null, loading: false });
    }
  }, [supabase.auth]);

  useEffect(() => {
    refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, refreshSession]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
  }, [supabase.auth]);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signOut,
    refreshSession,
  };
}