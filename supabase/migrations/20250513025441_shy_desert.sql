-- Verify admin user exists in auth.users and public.users
DO $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Get the admin user ID from auth.users
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@tapt.org';

  -- If admin exists in auth but not in public.users, add them
  IF auth_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth_user_id
  ) THEN
    INSERT INTO public.users (id, role)
    VALUES (auth_user_id, 'admin');
  END IF;

  -- If admin doesn't exist in auth.users, create them
  IF auth_user_id IS NULL THEN
    -- Insert into auth.users
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
    VALUES (
      'admin@tapt.org',
      crypt('27Ja@1396!@', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      'authenticated',
      '00000000-0000-0000-0000-000000000000'
    )
    RETURNING id INTO auth_user_id;

    -- Insert into public.users
    INSERT INTO public.users (id, role)
    VALUES (auth_user_id, 'admin');
  END IF;

  -- Ensure admin role is set correctly in public.users
  UPDATE public.users 
  SET role = 'admin' 
  WHERE id = auth_user_id;
END $$;