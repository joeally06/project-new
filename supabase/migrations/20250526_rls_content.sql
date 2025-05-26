-- Enable RLS and restrict mutations to Edge Functions (service role) for content
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users" ON content
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for service role (Edge Functions)
CREATE POLICY "Allow service role mutations" ON content
  FOR ALL USING (auth.role() = 'service_role');
