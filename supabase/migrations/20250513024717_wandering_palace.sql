/*
  # User Role and Policy Setup

  1. Changes
    - Add role column to users table if it doesn't exist
    - Add policy for users to read their own data

  2. Security
    - Enable RLS policies for user data access
    - Ensure users can only read their own data
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

-- Add policy for users to read their own data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;