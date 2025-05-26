-- Enable RLS and restrict mutations to Edge Functions (service role) for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users" ON resources
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for service role (Edge Functions)
CREATE POLICY "Allow service role mutations" ON resources
  FOR ALL USING (auth.role() = 'service_role');
