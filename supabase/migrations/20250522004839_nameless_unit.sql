/*
  # Update Hall of Fame Nominations RLS Policies

  1. Changes
    - Remove public INSERT policy
    - Keep public SELECT policy for transparency
    - Keep admin full access policy
*/

-- Remove the public INSERT policy
DROP POLICY IF EXISTS "Anyone can insert hall of fame nominations" ON public.hall_of_fame_nominations;

-- Keep existing policies:
-- "Allow admin full access to nominations"
-- "Allow public to read nominations"