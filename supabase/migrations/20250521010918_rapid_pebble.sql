/*
  # Add featured events functionality

  1. Changes
    - Add is_featured column to content table if it doesn't exist
    - Create function to enforce featured events limit
    - Add trigger for featured events limit
    - Add RLS policy for admin-only featured status updates

  2. Security
    - Only admins can update featured status
    - Limit of 3 featured items per type
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'is_featured') THEN
    ALTER TABLE public.content
    ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create a function to check featured events limit
CREATE OR REPLACE FUNCTION check_featured_events_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = TRUE THEN
    IF (
      SELECT COUNT(*)
      FROM content
      WHERE type = NEW.type 
      AND is_featured = TRUE 
      AND id != NEW.id
    ) >= 3 THEN
      RAISE EXCEPTION 'Cannot have more than 3 featured items of the same type';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_featured_events_limit ON content;

-- Create trigger to enforce featured events limit
CREATE TRIGGER enforce_featured_events_limit
  BEFORE INSERT OR UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION check_featured_events_limit();

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow admin to update featured status" ON content;

-- Create policy to ensure only admins can update featured status
CREATE POLICY "Allow admin to update featured status" ON public.content
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);