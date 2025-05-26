/*
  # Add user creation trigger

  1. Changes
    - Add trigger function to handle new user creation
    - Add trigger to automatically create user profile when new auth user is created
    
  2. Details
    - Creates a trigger function that runs when a new user is created in auth.users
    - Automatically creates a corresponding profile in public.users with default role 'user'
    - Ensures user profiles always exist for authenticated users
*/

-- Create trigger function to handle new user creation
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

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();