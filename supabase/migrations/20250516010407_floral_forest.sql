-- Create hall of fame settings table
CREATE TABLE IF NOT EXISTS hall_of_fame_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  description text,
  nomination_instructions text NOT NULL,
  eligibility_criteria text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hall_of_fame_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin to manage hall of fame settings"
  ON hall_of_fame_settings
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

CREATE POLICY "Allow public to read hall of fame settings"
  ON hall_of_fame_settings
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_hall_of_fame_settings_updated_at
  BEFORE UPDATE ON hall_of_fame_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();