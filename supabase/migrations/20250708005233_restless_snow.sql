/*
  # Fix Settings Active Default Value

  1. Changes
    - Change default value of is_active column from TRUE to FALSE for all settings tables
    - This ensures new settings are created as inactive by default
    - Activation is handled explicitly by the "Activate" button in the admin panel
    
  2. Purpose
    - Prevent unique constraint violations when inserting new settings
    - Fix the issue where settings are reported as successfully submitted but don't appear in the database
*/

-- Change default value for conference_settings
ALTER TABLE conference_settings 
ALTER COLUMN is_active SET DEFAULT false;

-- Change default value for tech_conference_settings
ALTER TABLE tech_conference_settings 
ALTER COLUMN is_active SET DEFAULT false;

-- Change default value for exhibitor_settings
ALTER TABLE exhibitor_settings 
ALTER COLUMN is_active SET DEFAULT false;

-- Change default value for hall_of_fame_settings
ALTER TABLE hall_of_fame_settings 
ALTER COLUMN is_active SET DEFAULT false;

-- Change default value for student_scholarship_settings
ALTER TABLE student_scholarship_settings 
ALTER COLUMN is_active SET DEFAULT false;