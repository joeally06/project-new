/*
  # Create Admin User

  1. Changes
    - Creates admin user in auth.users table
    - Sets admin role in public.users table
    
  2. Security
    - Sets up initial admin account with secure password
    - Ensures proper role assignment
*/

-- Create admin user with a specific UUID to ensure consistency
DO $$
DECLARE
  admin_uuid uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Insert admin user into auth.users if not exists
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
    role,
    aud,
    confirmation_token
  )
  VALUES (
    admin_uuid,
    '00000000-0000-0000-0000-000000000000',
    'admin@tapt.org',
    crypt('27Ja@1396!@', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated',
    'confirmed'
  )
  ON CONFLICT DO NOTHING;

  -- Set admin role in public.users table
  INSERT INTO public.users (id, role)
  VALUES (admin_uuid, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END $$;