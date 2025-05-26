import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function UserDebugComponent() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserState() {
      const addLog = (message: string) => {
        console.log(message);
        setLog(prev => [...prev, message]);
      };

      try {
        // 1. Check current auth state
        const { data: { session } } = await supabase.auth.getSession();
        addLog(`Current session: ${session ? 'Yes' : 'No'}`);
        if (session?.user) {
          addLog(`User ID: ${session.user.id}`);
          addLog(`User Email: ${session.user.email}`);
        }

        // 2. Check users table
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');

        if (usersError) {
          addLog(`Error checking users table: ${usersError.message}`);
        } else {
          addLog(`Users in table: ${JSON.stringify(usersData)}`);
        }

        // 3. Try to sign in as admin
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@tapt.org',
          password: '27Ja@1396!@'
        });

        if (signInError) {
          addLog(`Sign in error: ${signInError.message}`);
        } else if (signInData.user) {
          addLog(`Signed in successfully as: ${signInData.user.email}`);
          
          // 4. Check if user record exists
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', signInData.user.id)
            .single();

          if (userError) {
            addLog(`Error checking user record: ${userError.message}`);
          } else {
            addLog(`User record: ${JSON.stringify(userData)}`);
          }

          // [SECURITY] Direct admin record creation removed. Use Edge Function for role changes.
          addLog('Direct admin record creation removed for security. Use Edge Function for role changes.');
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`Error: ${msg}`);
      } finally {
        setLoading(false);
      }
    }

    checkUserState();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Debug Information</h1>
      <div className={`bg-gray-100 p-4 rounded ${loading ? 'opacity-50' : ''}`}>
        <pre className="whitespace-pre-wrap">
          {log.join('\n')}
        </pre>
      </div>
    </div>
  );
}
