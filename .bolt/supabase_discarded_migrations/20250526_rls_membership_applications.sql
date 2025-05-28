-- Enable RLS and restrict mutations to Edge Functions (service role) for membership_applications
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read for authenticated users" ON membership_applications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for service role (Edge Functions)
CREATE POLICY "Allow service role mutations" ON membership_applications
  FOR ALL USING (auth.role() = 'service_role');
