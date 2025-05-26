-- Check if membership_applications table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'membership_applications'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.membership_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      organization TEXT NOT NULL,
      position TEXT NOT NULL,
      membership_type TEXT NOT NULL,
      is_new_member TEXT NOT NULL,
      hear_about_us TEXT,
      interests TEXT[],
      agree_to_terms BOOLEAN NOT NULL,
      status TEXT DEFAULT 'pending'
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.membership_applications;
DROP POLICY IF EXISTS "Allow admin full access" ON public.membership_applications;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.membership_applications 
FOR SELECT USING (TRUE);

CREATE POLICY "Allow admin full access" ON public.membership_applications 
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- All membership applications must be submitted via secure Edge Functions with validation and rate limiting.
-- No public or anon insert policy exists.