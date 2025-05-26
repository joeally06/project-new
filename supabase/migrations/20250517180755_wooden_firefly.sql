/*
  # Add archive tables and original_id columns

  1. Changes
    - Create archive tables if they don't exist
    - Add original_id column to track source records
    - Enable RLS on archive tables
    - Add admin-only policies

  2. Security
    - Only admins can access archive data
    - Maintain referential tracking with original records
*/

-- Create conference_attendees_archive table if it doesn't exist
CREATE TABLE IF NOT EXISTS conference_attendees_archive (
  LIKE conference_attendees INCLUDING ALL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archive_id uuid NOT NULL DEFAULT gen_random_uuid(),
  original_id uuid
);

-- Create tech_conference_attendees_archive table if it doesn't exist
CREATE TABLE IF NOT EXISTS tech_conference_attendees_archive (
  LIKE tech_conference_attendees INCLUDING ALL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archive_id uuid NOT NULL DEFAULT gen_random_uuid(),
  original_id uuid
);

-- Add original_id column to existing archive tables
ALTER TABLE conference_registrations_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;

ALTER TABLE tech_conference_registrations_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;

ALTER TABLE hall_of_fame_nominations_archive 
ADD COLUMN IF NOT EXISTS original_id uuid;

-- Enable RLS on new archive tables
ALTER TABLE conference_attendees_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_conference_attendees_archive ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for new archive tables
CREATE POLICY "Admin users can access all archived attendees"
ON conference_attendees_archive
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admin users can access all archived tech attendees"
ON tech_conference_attendees_archive
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);