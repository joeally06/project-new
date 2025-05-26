/*
  # Fix User Table RLS Policies

  1. Changes
    - Update RLS policies for the users table to allow proper authentication
    - Add policy for users to read their own data
    - Add policy for admins to manage all users
    - Ensure policies don't conflict with authentication flow

  2. Security
    - Enable RLS on users table
    - Restrict access to user data based on authentication
    - Allow admins full access to manage users
*/

-- First, enable RLS on the users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage users"
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

-- Only allow admins to update user roles via secure Edge Functions (not direct client/database calls)
DROP POLICY IF EXISTS "Allow direct role update" ON users;
CREATE POLICY "Only admin service role can update roles"
  ON users
  FOR UPDATE
  USING (false)
  WITH CHECK (false);
-- All role changes must be performed via Edge Functions with validation, audit logging, and rate limiting.