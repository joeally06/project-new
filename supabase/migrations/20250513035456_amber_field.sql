/*
  # Update admin user role

  1. Changes
    - Updates existing user with admin@tapt.org email to have admin role
    - Handles case where user already exists
    - Ensures proper role assignment in public.users table

  2. Security
    - Maintains existing user credentials
    - Only updates role information
*/

DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  -- Get the ID of the existing user
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'admin@tapt.org';

  -- If we found the user, ensure they have admin role in public.users
  IF existing_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, role)
    VALUES (existing_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
  END IF;
END $$;