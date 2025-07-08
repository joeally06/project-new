/*
  # Allow Multiple Rollovers Per Year

  1. Changes
    - Modify unique constraints on settings tables to use ID instead of is_active
    - Ensure only one active setting at a time
    - Allow multiple rollovers per year
    
  2. Security
    - Maintains proper access control
    - Ensures data integrity
*/

-- Drop existing unique indexes that prevent multiple rollovers
DROP INDEX IF EXISTS conference_settings_active_idx;
DROP INDEX IF EXISTS tech_conference_settings_active_idx;
DROP INDEX IF EXISTS exhibitor_settings_active_idx;
DROP INDEX IF EXISTS hall_of_fame_settings_active_idx;
DROP INDEX IF EXISTS student_scholarship_settings_active_idx;

-- Create new unique indexes that only allow one active setting at a time
CREATE UNIQUE INDEX conference_settings_active_idx 
ON conference_settings (is_active) 
WHERE is_active = true;

CREATE UNIQUE INDEX tech_conference_settings_active_idx 
ON tech_conference_settings (is_active) 
WHERE is_active = true;

CREATE UNIQUE INDEX exhibitor_settings_active_idx 
ON exhibitor_settings (is_active) 
WHERE is_active = true;

CREATE UNIQUE INDEX hall_of_fame_settings_active_idx 
ON hall_of_fame_settings (is_active) 
WHERE is_active = true;

CREATE UNIQUE INDEX student_scholarship_settings_active_idx 
ON student_scholarship_settings (is_active) 
WHERE is_active = true;

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