-- Fix infinite recursion in users table RLS policies (May 26, 2025)
-- Drops all problematic policies and recreates only safe, non-recursive policies

-- Drop all existing policies on public.users that could cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Only admin service role can update roles" ON public.users;
DROP POLICY IF EXISTS "Admins can read all data" ON public.users;
DROP POLICY IF EXISTS "Users table access policy" ON public.users;
DROP POLICY IF EXISTS "Allow public user creation" ON public.users;

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to manage all users, using JWT claim (no subquery)
CREATE POLICY "Admins can manage users"
  ON public.users
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role')::text = 'admin');
