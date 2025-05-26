-- Create hall of fame members table
CREATE TABLE IF NOT EXISTS hall_of_fame_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  role text,
  organization text,
  location text,
  contact_info jsonb,
  image_url text,
  website text,
  notes text,
  term text,
  induction_year integer NOT NULL,
  achievements text[] NOT NULL DEFAULT '{}',
  bio text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hall_of_fame_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin full access"
  ON hall_of_fame_members
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

CREATE POLICY "Allow public read access"
  ON hall_of_fame_members
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_hall_of_fame_members_updated_at
  BEFORE UPDATE ON hall_of_fame_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();