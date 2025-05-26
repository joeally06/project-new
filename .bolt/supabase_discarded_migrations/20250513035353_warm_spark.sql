/*
  # Create admin user

  1. Changes
    - Insert admin user into auth.users table
    - Set admin role in public.users table
*/

-- Insert admin user into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@tapt.org',
  crypt('27Ja@1396!@', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Set admin role in public.users table
INSERT INTO public.users (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@tapt.org'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';