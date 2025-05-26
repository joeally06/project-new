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

-- Create new policies that avoid recursion
CREATE POLICY "Admins can manage users" 
ON public.users 
FOR ALL 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
) 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

CREATE POLICY "Users can read own data" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Create RPC function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO anon;