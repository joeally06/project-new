/*
  # Add original_id column to archive tables

  1. Changes
    - Add original_id column to all archive tables
    - Update archive functions to store original IDs
    
  2. Purpose
    - Maintain reference to original records
    - Fix duplicate key errors during rollover
*/

-- Add original_id column to conference_registrations_archive
ALTER TABLE conference_registrations_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;

-- Add original_id column to tech_conference_registrations_archive
ALTER TABLE tech_conference_registrations_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;

-- Add original_id column to hall_of_fame_nominations_archive
ALTER TABLE hall_of_fame_nominations_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;

-- Add original_id column to conference_attendees_archive
ALTER TABLE conference_attendees_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;

-- Add original_id column to tech_conference_attendees_archive
ALTER TABLE tech_conference_attendees_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;