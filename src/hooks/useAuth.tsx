import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check if user is in guest mode - don't call Supabase auth if they are
    const isGuest = localStorage.getItem('isGuestUser') === 'true';

    if (isGuest) {
      // Guest users don't use Supabase auth
      console.log('Guest mode detected - skipping Supabase auth');
      if (mounted) {
        setLoading(false);
        setInitialized(true);
      }
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Current session:', session?.user?.id || 'No session');
          if (mounted) {
            setUser(session?.user ?? null);
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id || 'No user');

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      console.log('User signed out successfully');
    } catch (err) {
      console.error('Sign out failed:', err);
      throw err;
    }
  };

  return {
    user,
    loading,
    initialized,
    signOut,
    isAuthenticated: !!user,
  };
};

export default useAuth;