-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can access all registrations" ON conference_registrations;
DROP POLICY IF EXISTS "Users can read own conference registrations" ON conference_registrations;
DROP POLICY IF EXISTS "Anyone can insert conference registrations" ON conference_registrations;

-- Create comprehensive admin policy
CREATE POLICY "Admin users can access all registrations"
  ON conference_registrations
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Allow authenticated users to read their own registrations
CREATE POLICY "Users can read own conference registrations"
  ON conference_registrations
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) != 'admin'
    AND auth.uid() = id
  );

-- All conference registrations must be submitted via secure Edge Functions with validation and rate limiting.
-- No public or anon insert policy exists.

-- Verify RLS is enabled
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;