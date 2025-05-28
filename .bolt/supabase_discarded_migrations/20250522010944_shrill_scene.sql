/*
  # Storage Security Configuration

  1. Changes
    - Create public and private storage buckets
    - Configure RLS policies for storage.objects table
    - Set up secure access patterns for authenticated and public users

  2. Security
    - Public bucket allows read-only access to all users
    - Private bucket requires authentication
    - Users can only access their own files in private bucket
    - Admins have full access to all files
    - All operations are properly scoped and secured

  Note: This migration uses Supabase's built-in storage schema and tables
*/

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('private', 'private', false),
  ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Give users authenticated access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Give public users access to public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users access to public bucket" ON storage.objects;

-- Create new policies

-- Public bucket read access
CREATE POLICY "Allow public read access on public bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'public');

-- Private bucket policies for authenticated users
CREATE POLICY "Allow authenticated users to read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'private'
    AND (
      -- Admin users can read all files
      EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.users ON users.id = auth.users.id
        WHERE auth.users.id = auth.uid()
        AND users.role = 'admin'
      )
      OR
      -- Users can read their own files
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "Allow authenticated users to upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow authenticated users to update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow authenticated users to delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin policies
CREATE POLICY "Allow admins full access to all files"
  ON storage.objects
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.users ON users.id = auth.users.id
      WHERE auth.users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.users ON users.id = auth.users.id
      WHERE auth.users.id = auth.uid()
      AND users.role = 'admin'
    )
  );