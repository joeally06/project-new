/*
  # Storage Bucket Access Restrictions

  1. Changes
    - Create private and public buckets
    - Enable RLS on storage.objects
    - Add granular access policies for storage.objects
    - Ensure secure file access patterns

  2. Security
    - Public bucket: Only allows read access to public files
    - Private bucket: Requires authentication and proper authorization
    - User isolation: Users can only access their own files
    - Admin access: Full access to all files for admin users

  3. Notes
    - Uses security definer function to handle permissions
    - Implements proper bucket isolation
    - Enforces strict access controls
*/

-- Create function to handle storage setup with elevated privileges
CREATE OR REPLACE FUNCTION setup_storage_security()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create buckets if they don't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('private', 'private', false),
    ('public', 'public', true)
  ON CONFLICT (id) DO NOTHING;

  -- Enable RLS
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Remove any existing policies
  DROP POLICY IF EXISTS "Allow public read access on public bucket" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to read private files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload private files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow admins full access to all files" ON storage.objects;

  -- Create new policies
  
  -- Public bucket read access
  CREATE POLICY "Allow public read access on public bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'public');

  -- Private files read access
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

  -- Private files upload
  CREATE POLICY "Allow authenticated users to upload private files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'private'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Private files update
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

  -- Private files delete
  CREATE POLICY "Allow authenticated users to delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'private'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Admin full access
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
END;
$$;

-- Execute the function to apply changes
SELECT setup_storage_security();

-- Clean up by dropping the function
DROP FUNCTION setup_storage_security();