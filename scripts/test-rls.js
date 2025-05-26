import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
  console.log('Testing RLS policies...');
  
  // Test 1: Anonymous access to public content
  console.log('\n--- Test 1: Anonymous access to public content ---');
  const { data: publicContent, error: publicError } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'published')
    .limit(5);
  
  if (publicError) {
    console.error('Error accessing public content:', publicError);
  } else {
    console.log('Success! Anonymous users can access published content.');
    console.log(`Found ${publicContent.length} published content items.`);
  }
  
  // Test 2: Anonymous access to draft content (should fail)
  console.log('\n--- Test 2: Anonymous access to draft content ---');
  const { data: draftContent, error: draftError } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'draft')
    .limit(5);
  
  if (draftError) {
    console.error('Error accessing draft content:', draftError);
  } else if (draftContent.length === 0) {
    console.log('Success! Anonymous users cannot access draft content.');
  } else {
    console.warn('Warning: Anonymous users can access draft content!');
  }
  
  // Test 3: Anonymous access to users table (should fail)
  console.log('\n--- Test 3: Anonymous access to users table ---');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5);
  
  if (usersError) {
    console.log('Success! Anonymous users cannot access users table.');
  } else {
    console.warn('Warning: Anonymous users can access users table!');
    console.log(`Found ${users.length} user records.`);
  }
  
  // Test 4: Try to sign in as admin
  console.log('\n--- Test 4: Sign in as admin ---');
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@tapt.org',
      password: 'Admin123!'
    });
    
    if (signInError) {
      console.error('Error signing in as admin:', signInError);
    } else if (signInData.user) {
      console.log('Success! Signed in as admin:', signInData.user.email);
      
      // Test 5: Admin access to users table
      console.log('\n--- Test 5: Admin access to users table ---');
      const { data: adminUsers, error: adminUsersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      if (adminUsersError) {
        console.error('Error: Admin cannot access users table:', adminUsersError);
      } else {
        console.log('Success! Admin can access users table.');
        console.log(`Found ${adminUsers.length} user records.`);
      }
      
      // Test 6: Admin access to draft content
      console.log('\n--- Test 6: Admin access to draft content ---');
      const { data: adminDraftContent, error: adminDraftError } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'draft')
        .limit(5);
      
      if (adminDraftError) {
        console.error('Error: Admin cannot access draft content:', adminDraftError);
      } else {
        console.log('Success! Admin can access draft content.');
        console.log(`Found ${adminDraftContent.length} draft content items.`);
      }
      
      // Test 7: Sign out
      console.log('\n--- Test 7: Sign out ---');
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Error signing out:', signOutError);
      } else {
        console.log('Success! Signed out.');
      }
    }
  } catch (error) {
    console.error('Error during admin tests:', error);
  }
  
  console.log('\nRLS testing complete!');
}

testRLS().catch(console.error);