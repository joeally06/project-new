/*
  # Tech Conference Registration Tables

  1. New Tables
    - `tech_conference_registrations`
      - Primary registration info
      - Tracks attendee count and total amount
      - Links to user if authenticated
    - `tech_conference_attendees`
      - Additional attendee information
      - Links to registration

  2. Security
    - Enable RLS on both tables
    - Public can create registrations
    - Users can view their own registrations
    - Admins have full access
*/

-- Create tech conference registrations table
CREATE TABLE IF NOT EXISTS tech_conference_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_district text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  total_attendees integer NOT NULL,
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create tech conference attendees table
CREATE TABLE IF NOT EXISTS tech_conference_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES tech_conference_registrations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tech_conference_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_conference_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for tech_conference_registrations
CREATE POLICY "Allow admin full access to tech conference registrations"
  ON tech_conference_registrations
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "Users can read own tech conference registrations"
  ON tech_conference_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- All public insert policies have been removed.
-- All inserts must be routed through secure Edge Functions with validation and rate limiting.

-- Policies for tech_conference_attendees
CREATE POLICY "Allow admin full access to tech conference attendees"
  ON tech_conference_attendees
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "Users can read own tech conference attendees"
  ON tech_conference_attendees
  FOR SELECT
  TO authenticated
  USING (
    registration_id IN (
      SELECT id FROM tech_conference_registrations
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_tech_conference_registrations_updated_at
  BEFORE UPDATE ON tech_conference_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tech_conference_attendees_updated_at
  BEFORE UPDATE ON tech_conference_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();