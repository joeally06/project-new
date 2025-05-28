import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: Error | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  refreshAuth: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    refreshAuth: async () => {}
  });

  const refreshAuth = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!session) {
        setState({
          user: null,
          loading: false,
          error: null,
          refreshAuth
        });
        return;
      }
      
      // Use RPC function to get role without recursion
      const { data: role, error: roleError } = await supabase.rpc(
        'get_user_role',
        { user_id: session.user.id }
      );

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setState({
          user: { ...session.user, role: null, access_token: session.access_token },
          loading: false,
          error: roleError,
          refreshAuth
        });
        return;
      }

      setState({
        user: { 
          ...session.user, 
          role, 
          access_token: session.access_token 
        },
        loading: false,
        error: null,
        refreshAuth
      });
    } catch (error) {
      console.error('Auth refresh error:', error);
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown authentication error'),
        refreshAuth
      }));
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      await refreshAuth();
    };
    
    initAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      if (mounted) {
        await refreshAuth();
      }
    });
    
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);