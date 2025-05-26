/*
  # Secure Storage Configuration

  1. Storage Buckets
    - Create private and public buckets
    - Set appropriate RLS policies
  
  2. Security
    - Enable RLS on storage.objects
    - Add policies for authenticated users
    - Add policies for public access where needed
*/

-- Create private bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('private', 'private')
ON CONFLICT (id) DO NOTHING;

-- Create public bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON storage.objects;

-- Add new policies
CREATE POLICY "Allow public read access on public bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');

CREATE POLICY "Allow authenticated users to read private files"
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

CREATE POLICY "Allow authenticated users to upload private files"
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

-- Add admin policies
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