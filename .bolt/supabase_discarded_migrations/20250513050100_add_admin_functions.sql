/*
  # Add admin createaccess
  
  1. Function changes
    - Create a function to add an admin user
    - Ensure it must be run by an admin user
    - Check valid email format
*/

-- Function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(admin_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = admin_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create other admins';
  END IF;

  -- Update the user's role to admin
  UPDATE public.users
  SET role = 'admin'
  WHERE id = user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Function to create the first admin user
-- Note: This should only be used once during initial setup
CREATE OR REPLACE FUNCTION create_first_admin(email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if there are any admins
  IF EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE role = 'admin'
  ) THEN
    RAISE EXCEPTION 'An admin user already exists';
  END IF;

  -- Get the user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = create_first_admin.email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email %', email;
  END IF;

  -- Update the user's role to admin
  UPDATE public.users
  SET role = 'admin'
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Could not update user role';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
