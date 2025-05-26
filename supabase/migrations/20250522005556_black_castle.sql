-- Remove public insert policy
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.membership_applications;

-- Keep existing policies:
-- "Allow admin full access"
-- "Enable read access for all users"