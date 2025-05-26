/*
  # Create function for user profile creation

  This migration adds a database function that safely creates user profiles
  while bypassing RLS. This is necessary for initial user creation during
  authentication flow.

  1. New Function
    - create_user_profile(user_id UUID, user_role TEXT)
      Creates a new user profile with the specified role

  2. Security
    - Function executes with SECURITY DEFINER to bypass RLS
    - Validates input parameters
    - Only allows 'user' role for new profiles
*/

CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, user_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate role is 'user'
  IF user_role != 'user' THEN
    RAISE EXCEPTION 'Only user role is allowed for new profiles';
  END IF;

  -- Insert new user profile
  INSERT INTO users (id, role)
  VALUES (user_id, user_role)
  ON CONFLICT (id) DO NOTHING;
END;
$$;