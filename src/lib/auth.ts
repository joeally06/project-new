import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!session?.user) throw new Error('No user returned from sign in');

  // Get user role from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userError) throw userError;
  if (!userData) throw new Error('User role not found');

  return {
    id: session.user.id,
    email: session.user.email!,
    role: userData.role
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  if (!session?.user) return null;

  // Get user role from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userError) throw userError;
  if (!userData) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    role: userData.role
  };
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === 'admin';
  } catch {
    return false;
  }
}