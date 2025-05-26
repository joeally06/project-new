/*
  # Create conference registrations table

  1. New Tables
    - `conference_registrations`
      - `id` (uuid, primary key)
      - `school_district` (text, not null)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `street_address` (text, not null)
      - `city` (text, not null)
      - `state` (text, not null)
      - `zip_code` (text, not null)
      - `email` (text, not null)
      - `phone` (text, not null)
      - `total_attendees` (integer, not null)
      - `total_amount` (numeric, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `conference_registrations` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS conference_registrations (
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
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;

-- All conference registrations must be submitted via secure Edge Functions with validation and rate limiting.
-- No public or anon insert policy exists.

CREATE POLICY "Users can read own conference registrations"
  ON conference_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conference_registrations_updated_at
BEFORE UPDATE ON conference_registrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();