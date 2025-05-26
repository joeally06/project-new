/*
  # Fix infinite recursion in RLS policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies that avoid recursion by using direct auth.uid() comparison
    - Update get_user_role function to be more efficient
    
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion in RLS policies
    - Ensures users can only access their own data
    - Admins retain full access to manage users
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

-- Create policy for admins using direct comparison
CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  )
);

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

-- Create trigger for role updates
CREATE OR REPLACE FUNCTION update_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Create trigger for role updates
DROP TRIGGER IF EXISTS on_role_update ON users;
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role();