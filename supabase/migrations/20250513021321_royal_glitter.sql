/*
  # Add RLS policies for Hall of Fame nominations

  1. Security
    - Enable RLS on hall_of_fame_nominations table
    - Add policy for public submissions
    - Add policy for admin access
    - Add policy for public read access

  2. Changes
    - Creates three policies to manage access to hall_of_fame_nominations table
*/

-- All nominations must be submitted via secure Edge Functions with validation and rate limiting.
-- No public or anon insert policy exists.

-- Allow admin users to manage all nominations
CREATE POLICY "Allow admin full access to nominations" ON public.hall_of_fame_nominations
FOR ALL TO public
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Allow public users to read nominations
CREATE POLICY "Allow public to read nominations" ON public.hall_of_fame_nominations
FOR SELECT TO public
USING (true);