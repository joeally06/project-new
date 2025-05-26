-- Create public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to storage bucket
CREATE POLICY "Give public access to public bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');

-- Allow authenticated users to upload to public bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Allow admin users to delete files
CREATE POLICY "Allow admin users to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);