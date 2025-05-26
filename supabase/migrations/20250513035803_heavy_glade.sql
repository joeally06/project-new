/*
  # Fix Users Table RLS Policies

  1. Changes
    - Add policy to allow authenticated users to create their own profile
    - Add policy to allow authenticated users to read their own profile
    - Add policy to allow admins to manage all user profiles

  2. Security
    - Ensures users can only create/read their own profiles
    - Maintains admin access to all profiles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin users can access everything" ON users;

-- Policy for users to create their own profile
CREATE POLICY "Users can create own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy for admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);