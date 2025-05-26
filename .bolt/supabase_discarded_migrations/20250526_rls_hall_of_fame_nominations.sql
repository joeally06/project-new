-- Enable RLS and restrict mutations to Edge Functions (service role) for hall_of_fame_nominations
ALTER TABLE hall_of_fame_nominations ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users" ON hall_of_fame_nominations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for service role (Edge Functions)
CREATE POLICY "Allow service role mutations" ON hall_of_fame_nominations
  FOR ALL USING (auth.role() = 'service_role');
