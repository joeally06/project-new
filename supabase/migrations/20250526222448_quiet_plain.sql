-- Add is_active column to hall_of_fame_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hall_of_fame_settings' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE hall_of_fame_settings ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Create unique index to ensure only one active settings record
CREATE UNIQUE INDEX IF NOT EXISTS hall_of_fame_settings_active_idx 
ON hall_of_fame_settings (is_active) 
WHERE is_active = true;

-- Add missing indexes for hall_of_fame_nominations
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_nominations_status 
ON hall_of_fame_nominations(status);

CREATE INDEX IF NOT EXISTS idx_hall_of_fame_nominations_dates 
ON hall_of_fame_nominations(start_date, end_date);

-- Add missing indexes for hall_of_fame_members
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_members_induction 
ON hall_of_fame_members(induction_year DESC);

-- Add missing indexes for membership_applications
CREATE INDEX IF NOT EXISTS idx_membership_applications_email 
ON membership_applications(email);

CREATE INDEX IF NOT EXISTS idx_membership_applications_status 
ON membership_applications(status);