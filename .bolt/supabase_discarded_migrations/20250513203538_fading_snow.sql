-- Drop existing constraint and trigger
ALTER TABLE hall_of_fame_nominations 
DROP CONSTRAINT IF EXISTS end_date_after_created;

DROP TRIGGER IF EXISTS validate_end_date_trigger ON hall_of_fame_nominations;

-- Add start_date column
ALTER TABLE hall_of_fame_nominations 
ADD COLUMN start_date timestamptz;

-- Add constraints for date validation
ALTER TABLE hall_of_fame_nominations
ADD CONSTRAINT valid_nomination_dates 
CHECK (
  (start_date IS NULL AND end_date IS NULL) OR
  (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date > start_date)
);

-- Create updated validation function
CREATE OR REPLACE FUNCTION validate_nomination_dates()
RETURNS trigger AS $$
BEGIN
  -- Ensure both dates are set together
  IF (NEW.start_date IS NULL AND NEW.end_date IS NOT NULL) OR
     (NEW.start_date IS NOT NULL AND NEW.end_date IS NULL) THEN
    RAISE EXCEPTION 'Both start_date and end_date must be set together';
  END IF;

  -- Validate date order if dates are set
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    IF NEW.start_date > NEW.end_date THEN
      RAISE EXCEPTION 'Start date must be before end date';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for date validation
CREATE TRIGGER validate_nomination_dates_trigger
BEFORE INSERT OR UPDATE OF start_date, end_date ON hall_of_fame_nominations
FOR EACH ROW
EXECUTE FUNCTION validate_nomination_dates();

-- Update is_nomination_open function
CREATE OR REPLACE FUNCTION is_nomination_open()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM hall_of_fame_nominations 
    WHERE (
      start_date IS NULL OR 
      (CURRENT_TIMESTAMP BETWEEN start_date AND end_date)
    )
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;