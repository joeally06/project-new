/*
  # Update conference registrations policies
  
  1. Changes
    - Add policy for admin users to access all conference registrations
    - Keep existing policies for user access and inserts
  
  2. Security
    - Maintains RLS
    - Adds admin access policy
    - Preserves existing user policies
*/

-- Add policy for admin users to access all registrations
CREATE POLICY "Admin users can access all registrations"
  ON conference_registrations
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- All conference registrations must be submitted via secure Edge Functions with validation and rate limiting.
-- No public or anon insert policy exists.