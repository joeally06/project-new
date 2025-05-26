/*
  # Create users table
  
  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `role` (text, not null) - user's role (admin/user)
      - `created_at` (timestamptz) - when the user was created
      - `updated_at` (timestamptz) - when the user was last updated
  
  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for reading own data
CREATE POLICY "Users can read their own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for admins to read all data
CREATE POLICY "Admins can read all data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();
