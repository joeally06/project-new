/*
  # Add Conference Settings and Update Registrations

  1. New Tables
    - `conference_settings`
      - `id` (uuid, primary key)
      - `name` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `registration_end_date` (timestamptz)
      - `location` (text)
      - `venue` (text)
      - `fee` (numeric)
      - `payment_instructions` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `conference_id` to conference_registrations table
    - Add foreign key constraint

  3. Security
    - Enable RLS on conference_settings
    - Add policies for admin access
*/

-- Create conference settings table
CREATE TABLE IF NOT EXISTS conference_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  registration_end_date timestamptz NOT NULL,
  location text NOT NULL,
  venue text NOT NULL,
  fee numeric NOT NULL,
  payment_instructions text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add conference_id to registrations
ALTER TABLE conference_registrations 
ADD COLUMN IF NOT EXISTS conference_id uuid REFERENCES conference_settings(id);

-- Enable RLS
ALTER TABLE conference_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin full access to conference settings"
  ON conference_settings
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Allow public to read conference settings"
  ON conference_settings
  FOR SELECT
  TO public
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_conference_settings_updated_at
  BEFORE UPDATE ON conference_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();