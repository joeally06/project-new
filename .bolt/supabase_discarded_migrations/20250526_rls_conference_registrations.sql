-- Enable RLS and restrict mutations to Edge Functions (service role) for conference_registrations
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users" ON conference_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for service role (Edge Functions)
CREATE POLICY "Allow service role mutations" ON conference_registrations
  FOR ALL USING (auth.role() = 'service_role');
