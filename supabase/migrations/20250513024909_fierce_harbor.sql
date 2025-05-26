/*
  # Create admin user

  1. Changes
    - Creates an admin user with the specified email
    - Sets up the user role as 'admin'
*/

-- Create the admin user if it doesn't exist
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into auth.users if the email doesn't exist
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    instance_id
  )
  SELECT 
    'admin@tapt.org',
    crypt('27Ja@1396!@', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@tapt.org'
  )
  RETURNING id INTO new_user_id;

  -- If we created a new user, insert into public.users
  IF new_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, role)
    VALUES (new_user_id, 'admin');
  END IF;
END $$;