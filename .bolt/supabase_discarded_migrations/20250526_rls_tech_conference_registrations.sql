-- Enable RLS and restrict mutations to Edge Functions (service role) for tech_conference_registrations
ALTER TABLE tech_conference_registrations ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users" ON tech_conference_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for service role (Edge Functions)
CREATE POLICY "Allow service role mutations" ON tech_conference_registrations
  FOR ALL USING (auth.role() = 'service_role');
