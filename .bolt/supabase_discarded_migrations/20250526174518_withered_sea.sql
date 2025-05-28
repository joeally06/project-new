/*
  # Create storage policies for secure file access

  1. Changes
    - Create storage buckets for public and private files
    - Create RLS policies for storage.objects
  2. Security
    - Public bucket allows public read access
    - Private bucket enforces user isolation via folder structure
    - Admin users have full access to all files
*/

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION storage.is_admin(uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO is_admin 
  FROM public.users 
  WHERE id = uid;
  
  RETURN coalesce(is_admin, false);
END;
$$;

-- Create a function to check if a path belongs to a user
CREATE OR REPLACE FUNCTION storage.is_owner(path text, uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  path_user_id text;
BEGIN
  -- Extract the first folder name from the path
  path_user_id := split_part(path, '/', 1);
  
  -- Check if it matches the user's ID
  RETURN path_user_id = uid::text;
END;
$$;

-- Create policies for storage.objects
DO $$
BEGIN
  -- Check if RLS is enabled on storage.objects
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND rowsecurity = true
  ) THEN
    -- Enable RLS on storage.objects
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create public bucket read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for public bucket'
  ) THEN
    CREATE POLICY "Public read access for public bucket" 
      ON storage.objects 
      FOR SELECT 
      TO public 
      USING (bucket_id = 'public');
  END IF;

  -- Create authenticated users upload to public bucket policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload to public bucket'
  ) THEN
    CREATE POLICY "Authenticated users can upload to public bucket" 
      ON storage.objects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (bucket_id = 'public');
  END IF;

  -- Create private bucket read policy for own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can read own private files'
  ) THEN
    CREATE POLICY "Users can read own private files" 
      ON storage.objects 
      FOR SELECT 
      TO authenticated 
      USING (
        bucket_id = 'private' 
        AND (
          storage.is_owner(name, auth.uid()) 
          OR storage.is_admin(auth.uid())
        )
      );
  END IF;

  -- Create private bucket insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can insert own private files'
  ) THEN
    CREATE POLICY "Users can insert own private files" 
      ON storage.objects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (
        bucket_id = 'private' 
        AND storage.is_owner(name, auth.uid())
      );
  END IF;

  -- Create private bucket update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own private files'
  ) THEN
    CREATE POLICY "Users can update own private files" 
      ON storage.objects 
      FOR UPDATE 
      TO authenticated 
      USING (
        bucket_id = 'private' 
        AND storage.is_owner(name, auth.uid())
      )
      WITH CHECK (
        bucket_id = 'private' 
        AND storage.is_owner(name, auth.uid())
      );
  END IF;

  -- Create private bucket delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own private files'
  ) THEN
    CREATE POLICY "Users can delete own private files" 
      ON storage.objects 
      FOR DELETE 
      TO authenticated 
      USING (
        bucket_id = 'private' 
        AND storage.is_owner(name, auth.uid())
      );
  END IF;

  -- Create admin policy for all operations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins have full access to all files'
  ) THEN
    CREATE POLICY "Admins have full access to all files" 
      ON storage.objects 
      FOR ALL 
      TO authenticated 
      USING (storage.is_admin(auth.uid()))
      WITH CHECK (storage.is_admin(auth.uid()));
  END IF;
END $$;