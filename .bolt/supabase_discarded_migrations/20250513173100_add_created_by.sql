-- Add created_by column and update RLS policies

-- Add created_by column
ALTER TABLE conference_attendees 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE conference_attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can access all attendees" ON conference_attendees;
DROP POLICY IF EXISTS "Users can manage own conference attendance" ON conference_attendees;

-- Create admin policy
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

-- Create user policy
CREATE POLICY "Users can manage own conference attendance"
ON conference_attendees
FOR ALL
TO authenticated
USING (
  created_by = auth.uid()
)
WITH CHECK (
  created_by = auth.uid()
);
