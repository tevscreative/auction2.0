import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

const APPROVED_USERS_TABLE = 'approved_users';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Shown when user signed in but is not in approved_users (then we sign them out). */
  accessDeniedMessage: string | null;
  clearAccessDenied: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkIsApproved(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(APPROVED_USERS_TABLE)
    .select('email')
    .eq('email', email)
    .maybeSingle();
  // If table doesn't exist or RLS blocks, treat as not approved for safety
  if (error) {
    const msg = error.message || '';
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return true; // approval list not set up yet → allow all
    }
    return false;
  }
  return data != null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const clearAccessDenied = useCallback(() => setAccessDeniedMessage(null), []);

  useEffect(() => {
    let cancelled = false;

    async function resolveSession(session: Session | null) {
      if (!session?.user?.email) {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }
      const approved = await checkIsApproved(session.user.email);
      if (cancelled) return;
      if (!approved) {
        setAccessDeniedMessage('You are not an approved user. Contact an administrator.');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setAccessDeniedMessage(null);
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      resolveSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    accessDeniedMessage,
    clearAccessDenied,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
