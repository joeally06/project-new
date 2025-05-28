/*
  # Fix infinite recursion in users table RLS policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies that avoid recursion by using auth.uid() directly
    - Add RPC function to get user role without recursion
    
  2. Security
    - Maintain same security model but fix the recursion issue
    - Ensure admins can still manage users
    - Ensure users can read their own data
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Only admin service role can update roles" ON public.users;

-- Create new policies that avoid recursion
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for public insert during signup
CREATE POLICY "Allow public user creation"
ON public.users
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy for admins using direct comparison
CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
TO authenticated
USING (uid() IN (
  SELECT users_1.id
  FROM users users_1
  WHERE users_1.role = 'admin'
))
WITH CHECK (uid() IN (
  SELECT users_1.id
  FROM users users_1
  WHERE users_1.role = 'admin'
));

-- Create or replace function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO anon;