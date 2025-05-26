import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminTestComponent() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testAuthAndRole() {
      const addLog = (message: string) => {
        console.log(message);
        setLog(prev => [...prev, message]);
      };

      try {
        // First check if users table exists
        addLog('Checking if users table exists...');
        const { error: usersError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
          
        if (usersError) {
          if (usersError.code === '42P01') { // Table doesn't exist
            addLog('Users table does not exist. Please create it first.');
            setError('Users table is missing. Please ensure all migrations are run.');
            return;
          }
          throw new Error(`Users table check failed: ${usersError.message}`);
        }
        addLog('Users table exists and is accessible');

        // Try to sign in first in case user exists
        const testEmail = 'test@example.com';
        const testPassword = 'test123456';
        
        addLog('Attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        // If sign in fails, create new user
        if (signInError) {
          addLog('Sign in failed, creating new user...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
          });

          if (signUpError) {
            throw signUpError;
          }

          if (!signUpData.user) {
            throw new Error('No user returned from signUp');
          }

          addLog(`New user created with ID: ${signUpData.user.id}`);
        } else {
          if (!signInData.user) {
            throw new Error('No user returned from signIn');
          }
          addLog(`Signed in existing user with ID: ${signInData.user.id}`);
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No user found after authentication');
        }

        // Check user role
        addLog('Checking user role...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) {
          addLog(`Error checking user record: ${userError.message}`);
        } else {
          addLog(`User role: ${userData?.role || 'none'}`);
        }

        // [SECURITY] Role escalation logic removed. Use Edge Function for role changes.
        addLog('Role escalation logic removed for security. Use Edge Function for role changes.');

        // Verify the role change
        const { data: updatedUserData, error: verifyError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (verifyError) {
          addLog(`Error verifying role: ${verifyError.message}`);
        } else {
          addLog(`Updated user role: ${updatedUserData?.role || 'none'}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`Test failed: ${msg}`);
        console.error('Test failed:', error);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    testAuthAndRole();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Testing User Creation and Role Verification</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}
      <div className={`bg-gray-100 p-4 rounded ${loading ? 'opacity-50' : ''}`}>
        <pre className="whitespace-pre-wrap">
          {log.length > 0 ? log.join('\n') : 'Starting tests...'}
        </pre>
      </div>
    </div>
  );
}