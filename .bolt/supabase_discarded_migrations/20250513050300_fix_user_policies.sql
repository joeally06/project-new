-- First drop all existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all data" ON public.users;

-- Recreate the users table with bypass_rls enabled for the policies
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a new policy that doesn't cause recursion
CREATE POLICY "Users table access policy"
    ON public.users
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        -- Users can read their own data
        auth.uid() = id
        OR 
        -- Users with role 'admin' in their jwt can access all rows
        auth.jwt()->>'role' = 'admin'
    );

-- Create trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert the admin user and set their JWT claim
INSERT INTO public.users (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@tapt.org'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Set the user's JWT role claim using the current role
CREATE OR REPLACE FUNCTION update_user_role()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
      json_build_object('role', NEW.role)::jsonb
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update JWT claims when role changes
DROP TRIGGER IF EXISTS on_role_update ON public.users;
CREATE TRIGGER on_role_update
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role();
