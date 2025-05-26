/*
  # Add Attendees Table and Relationship

  1. New Tables
    - `conference_attendees`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, foreign key to conference_registrations)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `conference_attendees` table
    - Add policies for admin access and registration relationship
*/

-- Create attendees table
CREATE TABLE IF NOT EXISTS conference_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES conference_registrations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conference_attendees ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_conference_attendees_updated_at
  BEFORE UPDATE ON conference_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Admin policy
CREATE POLICY "Admin users can access all attendees"
  ON conference_attendees
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Monitoring and auditing for API usage should be set up in the Supabase dashboard and/or via Edge Function logging.
-- Ensure all privileged operations are routed through Edge Functions and not direct client/database calls.
-- All public insert policies have been removed. Only admin and authenticated user read policies remain.

-- Allow users to read their own attendees
CREATE POLICY "Users can read own attendees"
  ON conference_attendees
  FOR SELECT
  TO authenticated
  USING (
    registration_id IN (
      SELECT id FROM conference_registrations 
      WHERE auth.uid() = conference_registrations.id
    )
  );