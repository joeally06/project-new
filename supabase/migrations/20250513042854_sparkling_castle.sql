/*
  # Create Admin User

  1. Changes
    - Creates an admin user in auth.users
    - Ensures corresponding entry in public.users table
    - Sets admin role for the user

  2. Security
    - Uses secure password hashing
    - Sets admin role through proper channels
*/

-- First, create the admin user in auth.users if it doesn't exist
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'admin@tapt.org';

  -- If admin user doesn't exist, create it
  IF new_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',  -- instance_id
      gen_random_uuid(),                        -- id
      'authenticated',                          -- aud
      'authenticated',                          -- role
      'admin@tapt.org',                        -- email
      crypt('Admin123!', gen_salt('bf')),      -- encrypted_password (change this in production)
      NOW(),                                    -- email_confirmed_at
      NOW(),                                    -- recovery_sent_at
      NOW(),                                    -- last_sign_in_at
      '{"provider":"email","providers":["email"]}',  -- raw_app_meta_data
      '{}',                                    -- raw_user_meta_data
      NOW(),                                    -- created_at
      NOW(),                                    -- updated_at
      '',                                       -- confirmation_token
      '',                                       -- email_change
      '',                                       -- email_change_token_new
      ''                                        -- recovery_token
    )
    RETURNING id INTO new_user_id;

    -- Log the creation
    RAISE NOTICE 'Created new admin user with ID: %', new_user_id;
  END IF;

  -- Ensure the user has an admin role in public.users
  INSERT INTO public.users (id, role)
  VALUES (new_user_id, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

  -- Log the role assignment
  RAISE NOTICE 'Assigned admin role to user ID: %', new_user_id;
END $$;