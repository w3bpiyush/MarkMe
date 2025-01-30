import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and set up auth subscription
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error.message);
        toast.error('Session error. Please sign in again.');
      }
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthError = (error: AuthError) => {
    console.error('Auth error:', error.message);
    if (error.message.includes('Invalid login credentials')) {
      toast.error('Invalid email or password');
    } else if (error.message.includes('refresh_token_not_found')) {
      toast.error('Session expired. Please sign in again.');
    } else {
      toast.error('An error occurred. Please try again.');
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe,
        },
      });

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error as AuthError);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear session immediately after signing out
      setSession(null);
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error as AuthError);
      }
      throw error;
    }
  };

  const value = {
    session,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}