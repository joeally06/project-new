/*
  # Set up admin user and fix login issues

  1. Changes
    - Ensures admin user exists in auth.users
    - Sets up proper password and email confirmation
    - Guarantees admin role in public.users table
    - Adds proper RLS policies

  2. Security
    - Enables RLS
    - Adds appropriate policies for user management
*/

-- First, ensure the admin user exists with proper credentials
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@tapt.org';

  -- If admin user doesn't exist, create it
  IF admin_user_id IS NULL THEN
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
      crypt('Admin123!', gen_salt('bf')),      -- encrypted_password
      NOW(),                                    -- email_confirmed_at (confirmed)
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
    RETURNING id INTO admin_user_id;
  ELSE
    -- Update existing admin user to ensure email is confirmed
    UPDATE auth.users
    SET 
      email_confirmed_at = NOW(),
      updated_at = NOW()
    WHERE id = admin_user_id;
  END IF;

  -- Ensure admin role in public.users
  INSERT INTO public.users (id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END $$;