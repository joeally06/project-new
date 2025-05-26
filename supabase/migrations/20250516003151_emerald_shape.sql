/*
  # Add Tech Conference Settings Table

  1. New Tables
    - `tech_conference_settings`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `start_date` (timestamptz, required)
      - `end_date` (timestamptz, required)
      - `registration_end_date` (timestamptz, required)
      - `location` (text, required)
      - `venue` (text, required)
      - `fee` (numeric, required)
      - `payment_instructions` (text, required)
      - `description` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `tech_conference_settings` table
    - Add policy for admin users to manage settings
    - Add policy for public users to read settings
*/

-- Create tech conference settings table
CREATE TABLE IF NOT EXISTS tech_conference_settings (
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

-- Enable RLS
ALTER TABLE tech_conference_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin to manage tech conference settings"
  ON tech_conference_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "Allow public to read tech conference settings"
  ON tech_conference_settings
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_tech_conference_settings_updated_at
  BEFORE UPDATE ON tech_conference_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();