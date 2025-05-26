const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkUser() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error checking auth.users:', authError);
    } else {
      console.log('Auth users:', authData.users.map(u => ({ id: u.id, email: u.email })));
    }

    // Check public.users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error checking users table:', usersError);
    } else {
      console.log('Users table data:', usersData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();
