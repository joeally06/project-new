-- Drop existing constraint
ALTER TABLE hall_of_fame_nominations 
DROP CONSTRAINT IF EXISTS end_date_after_created;

-- Add modified constraint that allows NULL end dates
ALTER TABLE hall_of_fame_nominations
ADD CONSTRAINT end_date_after_created 
CHECK (end_date IS NULL OR end_date > created_at);

-- Create function to validate end date updates
CREATE OR REPLACE FUNCTION validate_end_date()
RETURNS trigger AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.end_date <= NEW.created_at THEN
    RAISE EXCEPTION 'End date must be after creation date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate end date updates
CREATE TRIGGER validate_end_date_trigger
BEFORE INSERT OR UPDATE OF end_date ON hall_of_fame_nominations
FOR EACH ROW
EXECUTE FUNCTION validate_end_date();