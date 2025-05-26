import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setState({ user: null, loading: false, error });
        return;
      }
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setState({
          user: { ...session.user, role: userData?.role },
          loading: false,
          error: null,
        });
      } else {
        setState({ user: null, loading: false, error: null });
      }
    };
    getSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => getSession());
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
