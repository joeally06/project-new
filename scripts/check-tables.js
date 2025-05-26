import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkTables() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('Error querying users table:', usersError);
    } else {
      console.log('Users table exists, sample data:', usersData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
