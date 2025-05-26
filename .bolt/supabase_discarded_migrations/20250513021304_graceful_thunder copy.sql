/*
  # Add Hall of Fame Nomination Policies

  1. Security Changes
    - Add RLS policies for hall_of_fame_nominations table:
      - Allow public users to insert nominations
      - Allow admin users to manage all nominations
      - Allow public users to read nominations
*/

-- Allow public users to insert nominations
CREATE POLICY "Anyone can insert hall of fame nominations" ON public.hall_of_fame_nominations
FOR INSERT TO public
WITH CHECK (true);

-- Allow admin users to manage all nominations
CREATE POLICY "Allow admin full access to nominations" ON public.hall_of_fame_nominations
FOR ALL TO public
USING ((jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((jwt() ->> 'role'::text) = 'admin'::text);

-- Allow public users to read nominations
CREATE POLICY "Allow public to read nominations" ON public.hall_of_fame_nominations
FOR SELECT TO public
USING (true);