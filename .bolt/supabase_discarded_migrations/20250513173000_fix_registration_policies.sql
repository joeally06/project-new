-- Update conference tables security policies

-- First, make sure RLS is enabled on both tables
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_attendees ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can access all registrations" ON conference_registrations;
DROP POLICY IF EXISTS "Users can read own conference registrations" ON conference_registrations;
DROP POLICY IF EXISTS "Admin users can access all attendees" ON conference_attendees;
DROP POLICY IF EXISTS "Users can manage own conference attendance" ON conference_attendees;

-- Create policies for conference_registrations
CREATE POLICY "Admin users can access all registrations"
ON conference_registrations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create policies for conference_attendees
CREATE POLICY "Admin users can access all attendees"
ON conference_attendees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow users to insert and read their own attendance records
CREATE POLICY "Users can manage own conference attendance"
ON conference_attendees
FOR ALL
TO authenticated
USING (
  auth.uid() = created_by
)
WITH CHECK (
  auth.uid() = created_by
);
