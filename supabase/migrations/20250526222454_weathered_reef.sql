-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@tapt.org'
  ) INTO admin_exists;

  IF NOT admin_exists THEN
    -- Create admin user in auth.users
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
    RETURNING id INTO admin_user_id;

    -- Insert into public.users with admin role
    INSERT INTO public.users (id, role)
    VALUES (admin_user_id, 'admin');
  ELSE
    -- Get the admin user ID
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@tapt.org';

    -- Ensure admin role in public.users
    INSERT INTO public.users (id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
  END IF;
END $$;