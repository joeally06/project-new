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

-- Enable RLS on archive tables
ALTER TABLE conference_attendees_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_conference_attendees_archive ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for archive tables
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

-- Create indexes for archive tables
CREATE INDEX IF NOT EXISTS idx_conference_attendees_archive_registration_id
ON conference_attendees_archive(registration_id);

CREATE INDEX IF NOT EXISTS idx_tech_conference_attendees_archive_registration_id
ON tech_conference_attendees_archive(registration_id);

CREATE INDEX IF NOT EXISTS idx_conference_attendees_archive_archive_id
ON conference_attendees_archive(archive_id);

CREATE INDEX IF NOT EXISTS idx_tech_conference_attendees_archive_archive_id
ON tech_conference_attendees_archive(archive_id);