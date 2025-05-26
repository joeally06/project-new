/*
  # Add Hall of Fame End Date

  1. Changes
    - Add end_date column to hall_of_fame_nominations table
    - Add check constraint to ensure end_date is after created_at
    - Add function to check if nominations are still open
  
  2. Security
    - No changes to existing policies
*/

-- Add end_date column
ALTER TABLE hall_of_fame_nominations 
ADD COLUMN end_date timestamptz;

-- Add check constraint
ALTER TABLE hall_of_fame_nominations
ADD CONSTRAINT end_date_after_created CHECK (end_date > created_at);

-- Create function to check if nominations are open
CREATE OR REPLACE FUNCTION is_nomination_open()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM hall_of_fame_nominations 
    WHERE end_date > CURRENT_TIMESTAMP
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;