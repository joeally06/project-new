/*
  # Update conference registrations policies

  1. Changes
    - Add policy for admin users to access all registrations
    - Fix existing policies to ensure proper access control

  2. Security
    - Maintains RLS enabled on the table
    - Ensures admin users can access all registrations
    - Preserves existing user access controls
*/

-- First, drop existing admin policy to avoid conflicts
DROP POLICY IF EXISTS "Admin users can access all registrations" ON conference_registrations;

-- Create comprehensive admin policy
CREATE POLICY "Admin users can access all registrations"
  ON conference_registrations
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Update the user read policy to be more specific
DROP POLICY IF EXISTS "Users can read own conference registrations" ON conference_registrations;
CREATE POLICY "Users can read own conference registrations"
  ON conference_registrations
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role'::text) != 'admin'::text 
    AND auth.uid() = id
  );

-- All conference registrations must be submitted via secure Edge Functions with validation and rate limiting.
-- No public or anon insert policy exists.