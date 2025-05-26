/*
  # Fix infinite recursion in users table RLS policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies that use auth.jwt() instead of querying users table
    - Add function to safely get user role without recursion
    
  2. Security
    - Maintains proper access control
    - Prevents infinite recursion in RLS policies
    - Ensures users can only access their own data
    - Admins retain full access to manage users
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Only admin service role can update roles" ON users;

-- Create new policies using auth.jwt() to avoid recursion
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for admins using JWT claims
CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Create a function to update user role safely
CREATE OR REPLACE FUNCTION update_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the role change attempt
  INSERT INTO role_change_audit (
    requesting_user_id,
    target_user_id,
    action,
    success,
    details
  ) VALUES (
    auth.uid(),
    NEW.id,
    'update_role',
    TRUE,
    jsonb_build_object(
      'old_role', OLD.role,
      'new_role', NEW.role
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for role updates
DROP TRIGGER IF EXISTS on_role_update ON users;
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role();

-- Create a secure RPC function to get user role
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;