-- Drop the existing users table and recreate it with the correct structure
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own data"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create policy to allow admins to read all data
CREATE POLICY "Admins can read all data"
    ON public.users
    FOR ALL  -- Changed from SELECT to ALL to allow admins to modify data
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    ));

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

-- Insert the admin user
INSERT INTO public.users (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@tapt.org'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Recreate the policies that depend on the users table
CREATE POLICY "Admin users can access all registrations"
    ON conference_registrations
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Users can read own conference registrations"
    ON conference_registrations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admin users can access all attendees"
    ON conference_attendees
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Allow admin full access to conference settings"
    ON conference_settings
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ));
