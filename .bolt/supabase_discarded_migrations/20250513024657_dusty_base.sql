/*
  # Add admin authentication support
  
  1. Changes
    - Add role column to users table
    - Add admin role check policy
*/

-- Ensure users table has role column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Add policy for admin access
CREATE POLICY "Admin users can access everything"
  ON users
  FOR ALL
  TO authenticated
  USING (role = 'admin')
  WITH CHECK (role = 'admin');

-- Add policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);