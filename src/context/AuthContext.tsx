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
        // Use RPC function to get role without recursion
        const { data: role, error: roleError } = await supabase.rpc(
          'get_user_role',
          { user_id: session.user.id }
        );

        if (roleError) {
          console.error('Error fetching user role:', roleError);
          setState({
            user: { ...session.user, role: null },
            loading: false,
            error: roleError
          });
          return;
        }

        setState({
          user: { ...session.user, role },
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