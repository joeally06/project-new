-- Performance Indexes for Conference Registrations and Attendees
-- Created: 2025-05-26

-- Index for sorting/pagination by created_at
CREATE INDEX IF NOT EXISTS idx_conference_registrations_created_at
  ON conference_registrations (created_at);

-- Index for filtering by conference_id
CREATE INDEX IF NOT EXISTS idx_conference_registrations_conference_id
  ON conference_registrations (conference_id);

-- Composite index for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_conference_registrations_conference_id_created_at
  ON conference_registrations (conference_id, created_at);

-- Index for joining attendees to registrations
CREATE INDEX IF NOT EXISTS idx_conference_attendees_registration_id
  ON conference_attendees (registration_id);

-- Index for attendee email lookups
CREATE INDEX IF NOT EXISTS idx_conference_attendees_email
  ON conference_attendees (email);

-- Indexes for resources table (if not already present)
CREATE INDEX IF NOT EXISTS idx_resources_category
  ON resources (category);

CREATE INDEX IF NOT EXISTS idx_resources_created_at
  ON resources (created_at);
