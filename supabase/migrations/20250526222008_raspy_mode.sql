-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Only admin service role can update roles" ON public.users;
DROP POLICY IF EXISTS "Allow public user creation" ON public.users;

-- Create new policies that avoid recursion
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for admins using direct comparison
CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.users
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Check if policy exists before creating
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public user creation' AND tablename = 'users' AND schemaname = 'public') THEN
        CREATE POLICY "Allow public user creation" ON public.users
        FOR INSERT
        TO public
        WITH CHECK (true);
    END IF;
END$$;

-- Create or replace function to get user role without recursion
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO anon;

-- Create trigger for role updates
DROP FUNCTION IF EXISTS update_user_role() CASCADE;
CREATE OR REPLACE FUNCTION update_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if role_change_audit table exists before trying to insert
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_change_audit') THEN
    -- Log the role change
    INSERT INTO role_change_audit (
      requesting_user_id,
      target_user_id,
      action,
      success,
      details
    ) VALUES (
      auth.uid(),
      NEW.id,
      'update_role',
      TRUE,
      jsonb_build_object(
        'old_role', CASE WHEN TG_OP = 'UPDATE' THEN OLD.role ELSE NULL END,
        'new_role', NEW.role
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role updates
DROP TRIGGER IF EXISTS on_role_update ON users;
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role();

-- Create role_change_audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_user_id uuid REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  success boolean NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  details jsonb
);

-- Enable RLS on role_change_audit
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to insert
DROP POLICY IF EXISTS "Allow service role insert" ON public.role_change_audit;
CREATE POLICY "Allow service role insert"
  ON public.role_change_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create admin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  outcome text NOT NULL,
  error text,
  details jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_logs
DROP POLICY IF EXISTS "Admins can read logs" ON public.admin_logs;
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

DROP POLICY IF EXISTS "Service role can insert logs" ON public.admin_logs;
CREATE POLICY "Service role can insert logs"
  ON public.admin_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index for admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_timestamp
  ON public.admin_logs (user_id, "timestamp" DESC);

-- Create rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  last_attempt timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Add policy for service role only
DROP POLICY IF EXISTS "Service role access only" ON rate_limits;
CREATE POLICY "Service role access only"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);