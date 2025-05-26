/*
  # Add Featured Events Column

  1. Changes
    - Add `is_featured` column to content table
    - Add constraint to limit number of featured events
    - Add trigger to enforce featured event limit

  2. Security
    - Only admins can update featured status
*/

-- Add is_featured column
ALTER TABLE public.content
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

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

-- Create trigger to enforce featured events limit
CREATE TRIGGER enforce_featured_events_limit
  BEFORE INSERT OR UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION check_featured_events_limit();

-- Update RLS policies to ensure only admins can update featured status
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