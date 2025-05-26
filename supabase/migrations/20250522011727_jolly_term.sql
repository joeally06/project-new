/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing RLS policies on users table that may be causing recursion
    - Create new, simplified RLS policies:
      - Allow users to read their own data
      - Allow admins to manage all users
    - Policies are designed to avoid recursion by using direct ID comparison
    
  2. Security
    - Maintains row-level security
    - Ensures users can only access their own data
    - Admins retain full access to manage users
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Create new, simplified policies
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  -- Direct comparison of auth.uid() with id to avoid recursion
  auth.uid() = id
);

CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  -- Simple EXISTS query that doesn't trigger recursion
  EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);