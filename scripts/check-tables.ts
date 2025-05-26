import { supabase } from '../src/lib/supabase';

async function checkTables() {
  try {
    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.error('Error querying users table:', usersError);
    } else {
      console.log('Users table exists');
    }

    // Check auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error querying auth.users:', authError);
    } else {
      console.log('Auth users found:', authData.users.length);
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();
