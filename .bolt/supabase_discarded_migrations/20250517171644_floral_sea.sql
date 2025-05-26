-- Conference Registrations Archive
CREATE TABLE IF NOT EXISTS conference_registrations_archive (
  LIKE conference_registrations INCLUDING ALL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archive_id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- Tech Conference Registrations Archive
CREATE TABLE IF NOT EXISTS tech_conference_registrations_archive (
  LIKE tech_conference_registrations INCLUDING ALL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archive_id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- Hall of Fame Nominations Archive
CREATE TABLE IF NOT EXISTS hall_of_fame_nominations_archive (
  LIKE hall_of_fame_nominations INCLUDING ALL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archive_id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- Add is_active column to settings tables
ALTER TABLE conference_settings 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE tech_conference_settings 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE hall_of_fame_settings 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create unique constraints to ensure only one active settings record
CREATE UNIQUE INDEX IF NOT EXISTS conference_settings_active_idx 
ON conference_settings (is_active) 
WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS tech_conference_settings_active_idx 
ON tech_conference_settings (is_active) 
WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS hall_of_fame_settings_active_idx 
ON hall_of_fame_settings (is_active) 
WHERE is_active = true;

-- Function to archive conference registrations
CREATE OR REPLACE FUNCTION archive_conference_registrations()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archive_id uuid;
BEGIN
  -- Generate a new archive ID
  archive_id := gen_random_uuid();
  
  -- Copy registrations to archive
  INSERT INTO conference_registrations_archive (
    SELECT r.*, now(), archive_id 
    FROM conference_registrations r
  );
  
  -- Copy attendees to archive
  INSERT INTO conference_attendees_archive (
    SELECT a.*, now(), archive_id 
    FROM conference_attendees a
    JOIN conference_registrations r ON a.registration_id = r.id
  );
  
  -- Clear main tables
  DELETE FROM conference_attendees;
  DELETE FROM conference_registrations;
  
  RETURN archive_id;
END;
$$;

-- Function to archive tech conference registrations
CREATE OR REPLACE FUNCTION archive_tech_conference_registrations()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archive_id uuid;
BEGIN
  -- Generate a new archive ID
  archive_id := gen_random_uuid();
  
  -- Copy registrations to archive
  INSERT INTO tech_conference_registrations_archive (
    SELECT r.*, now(), archive_id 
    FROM tech_conference_registrations r
  );
  
  -- Copy attendees to archive
  INSERT INTO tech_conference_attendees_archive (
    SELECT a.*, now(), archive_id 
    FROM tech_conference_attendees a
    JOIN tech_conference_registrations r ON a.registration_id = r.id
  );
  
  -- Clear main tables
  DELETE FROM tech_conference_attendees;
  DELETE FROM tech_conference_registrations;
  
  RETURN archive_id;
END;
$$;

-- Function to archive hall of fame nominations
CREATE OR REPLACE FUNCTION archive_hall_of_fame_nominations()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archive_id uuid;
BEGIN
  -- Generate a new archive ID
  archive_id := gen_random_uuid();
  
  -- Copy nominations to archive
  INSERT INTO hall_of_fame_nominations_archive (
    SELECT n.*, now(), archive_id 
    FROM hall_of_fame_nominations n
  );
  
  -- Clear main table
  DELETE FROM hall_of_fame_nominations;
  
  RETURN archive_id;
END;
$$;

-- Enable RLS on archive tables
ALTER TABLE conference_registrations_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_conference_registrations_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame_nominations_archive ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for archive tables
CREATE POLICY "Admin users can access all archived registrations"
ON conference_registrations_archive
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admin users can access all archived tech registrations"
ON tech_conference_registrations_archive
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admin users can access all archived nominations"
ON hall_of_fame_nominations_archive
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);