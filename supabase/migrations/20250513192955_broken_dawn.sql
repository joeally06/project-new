/*
  # Update Conference Settings Policies

  1. Changes
    - Add admin-only policies for INSERT, UPDATE, and DELETE operations
    - Keep existing public read policy

  2. Security
    - Only admin users can modify conference settings
    - All users can read conference settings
*/

-- Remove any existing policies
DROP POLICY IF EXISTS "Allow public to read conference settings" ON conference_settings;
DROP POLICY IF EXISTS "Allow admin to manage conference settings" ON conference_settings;

-- Add read policy for all users
CREATE POLICY "Allow public to read conference settings"
ON conference_settings
FOR SELECT
TO public
USING (true);

-- Add admin-only policy for all operations
CREATE POLICY "Allow admin to manage conference settings"
ON conference_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);