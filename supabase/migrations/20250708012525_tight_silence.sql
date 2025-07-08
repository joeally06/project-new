/*
  # Allow Multiple Rollovers Per Year

  1. Changes
    - Ensure all settings tables have is_active column defaulting to false
    - Add unique constraint to ensure only one active setting at a time
    - Update existing settings to have consistent behavior
    
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with constraints
*/

-- Ensure all settings tables have is_active column defaulting to false
ALTER TABLE conference_settings 
ALTER COLUMN is_active SET DEFAULT false;

ALTER TABLE tech_conference_settings 
ALTER COLUMN is_active SET DEFAULT false;

ALTER TABLE exhibitor_settings 
ALTER COLUMN is_active SET DEFAULT false;

ALTER TABLE hall_of_fame_settings 
ALTER COLUMN is_active SET DEFAULT false;

ALTER TABLE student_scholarship_settings 
ALTER COLUMN is_active SET DEFAULT false;

-- Ensure unique constraints exist for active settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'conference_settings_active_idx'
  ) THEN
    CREATE UNIQUE INDEX conference_settings_active_idx 
    ON conference_settings (is_active) 
    WHERE is_active = true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'tech_conference_settings_active_idx'
  ) THEN
    CREATE UNIQUE INDEX tech_conference_settings_active_idx 
    ON tech_conference_settings (is_active) 
    WHERE is_active = true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'exhibitor_settings_active_idx'
  ) THEN
    CREATE UNIQUE INDEX exhibitor_settings_active_idx 
    ON exhibitor_settings (is_active) 
    WHERE is_active = true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'hall_of_fame_settings_active_idx'
  ) THEN
    CREATE UNIQUE INDEX hall_of_fame_settings_active_idx 
    ON hall_of_fame_settings (is_active) 
    WHERE is_active = true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'student_scholarship_settings_active_idx'
  ) THEN
    CREATE UNIQUE INDEX student_scholarship_settings_active_idx 
    ON student_scholarship_settings (is_active) 
    WHERE is_active = true;
  END IF;
END $$;