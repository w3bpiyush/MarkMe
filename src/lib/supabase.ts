import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        toast.error('Network error. Please check your connection.');
        throw err;
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (!navigator.onLine) {
    toast.error('You are offline. Please check your internet connection.');
    return;
  }

  if (error.message?.includes('Failed to fetch')) {
    toast.error('Unable to connect to the server. Please try again later.');
    return;
  }

  if (error.code === 'PGRST301') {
    toast.error('Database error. Please try again.');
    return;
  }

  toast.error(error.message || 'An unexpected error occurred');
};

// Wrapper for Supabase queries with automatic error handling
export const safeQuery = async <T,>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await queryFn();
    if (result.error) {
      handleSupabaseError(result.error);
    }
    return result;
  } catch (error) {
    handleSupabaseError(error);
    return { data: null, error };
  }
};