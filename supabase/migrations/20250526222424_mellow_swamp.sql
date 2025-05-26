-- This migration reviews and fixes RLS policies for all tables

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_of_fame_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_of_fame_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_conference_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_conference_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- 2. Fix content table policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow admin to manage content" ON public.content;
DROP POLICY IF EXISTS "Allow public to read published content" ON public.content;

-- Recreate policies
CREATE POLICY "Allow admin to manage content"
  ON public.content
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

CREATE POLICY "Allow public to read published content"
  ON public.content
  FOR SELECT
  TO public
  USING (status = 'published');

-- 3. Fix resources table policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow admin full access to resources" ON public.resources;
DROP POLICY IF EXISTS "Allow public read access to resources" ON public.resources;

-- Recreate policies
CREATE POLICY "Allow admin full access to resources"
  ON public.resources
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

CREATE POLICY "Allow public read access to resources"
  ON public.resources
  FOR SELECT
  TO public
  USING (true);

-- 4. Fix hall_of_fame_nominations policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow admin full access to nominations" ON public.hall_of_fame_nominations;
DROP POLICY IF EXISTS "Allow public to read nominations" ON public.hall_of_fame_nominations;

-- Recreate policies
CREATE POLICY "Allow admin full access to nominations"
  ON public.hall_of_fame_nominations
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

CREATE POLICY "Allow public to read nominations"
  ON public.hall_of_fame_nominations
  FOR SELECT
  TO public
  USING (true);

-- 5. Fix hall_of_fame_members policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow admin full access" ON public.hall_of_fame_members;
DROP POLICY IF EXISTS "Allow public read access" ON public.hall_of_fame_members;

-- Recreate policies
CREATE POLICY "Allow admin full access"
  ON public.hall_of_fame_members
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

CREATE POLICY "Allow public read access"
  ON public.hall_of_fame_members
  FOR SELECT
  TO public
  USING (true);

-- 6. Fix membership_applications policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow admin full access" ON public.membership_applications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.membership_applications;

-- Recreate policies
CREATE POLICY "Allow admin full access"
  ON public.membership_applications
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

CREATE POLICY "Enable read access for all users"
  ON public.membership_applications
  FOR SELECT
  TO public
  USING (true);

-- 7. Fix conference_registrations policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Admin users can access all registrations" ON public.conference_registrations;
DROP POLICY IF EXISTS "Users can read own conference registrations" ON public.conference_registrations;

-- Recreate policies
CREATE POLICY "Admin users can access all registrations"
  ON public.conference_registrations
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

CREATE POLICY "Users can read own conference registrations"
  ON public.conference_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 8. Fix tech_conference_registrations policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow admin full access to tech conference registrations" ON public.tech_conference_registrations;
DROP POLICY IF EXISTS "Users can read own tech conference registrations" ON public.tech_conference_registrations;

-- Recreate policies
CREATE POLICY "Allow admin full access to tech conference registrations"
  ON public.tech_conference_registrations
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

CREATE POLICY "Users can read own tech conference registrations"
  ON public.tech_conference_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 9. Fix rate_limits policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Service role access only" ON public.rate_limits;

-- Recreate policies
CREATE POLICY "Service role access only"
  ON public.rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. Fix admin_logs policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Admins can read logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON public.admin_logs;

-- Recreate policies
CREATE POLICY "Admins can read logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert logs"
  ON public.admin_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 11. Fix role_change_audit policies
-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow service role insert" ON public.role_change_audit;

-- Recreate policies
CREATE POLICY "Allow service role insert"
  ON public.role_change_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);