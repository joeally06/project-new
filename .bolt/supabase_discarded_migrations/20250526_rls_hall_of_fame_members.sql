-- Enable RLS and restrict mutations to Edge Functions (service role) for hall_of_fame_members
ALTER TABLE hall_of_fame_members ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users" ON hall_of_fame_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for service role (Edge Functions)
CREATE POLICY "Allow service role mutations" ON hall_of_fame_members
  FOR ALL USING (auth.role() = 'service_role');

-- Optionally, restrict update/delete to only Edge Functions (not client)
-- You can further refine policies as needed for your use case.
