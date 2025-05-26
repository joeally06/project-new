import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Test function
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: Error }> => {
  try {
    // Try to access a table to verify the connection
    const { error } = await supabase
      .from('conference_registrations')
      .select('count')
      .limit(1)
      .single();
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown connection error') 
    };
  }
};

// Function to verify user role
export const verifyUserRole = async (userId: string): Promise<string | null> => {
  try {
    console.log('Verifying user role for ID:', userId);
    
    if (!userId) {
      console.error('No userId provided to verifyUserRole');
      return null;
    }

    // Use RPC call to avoid RLS recursion
    const { data, error } = await supabase.rpc('get_user_role', {
      user_id: userId
    });

    if (error) {
      console.error('Error fetching user role:', error);
      throw error;
    }

    if (!data) {
      console.log('No user data found for ID:', userId);
      return null;
    }

    console.log('User role found:', data);
    return data;

  } catch (error) {
    console.error('Error in verifyUserRole:', error);
    return null;
  }
};