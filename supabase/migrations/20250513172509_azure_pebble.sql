/*
  # Add test conference registration

  1. New Data
    - Adds a test registration to verify the system
    - Includes both registration and attendee records
  
  2. Purpose
    - Verify conference registration functionality
    - Test admin panel display
*/

-- Insert test conference registration
INSERT INTO conference_registrations (
  id,
  school_district,
  first_name,
  last_name,
  street_address,
  city,
  state,
  zip_code,
  email,
  phone,
  total_attendees,
  total_amount,
  conference_id
) VALUES (
  gen_random_uuid(),
  'Test School District',
  'John',
  'Doe',
  '123 Main St',
  'Nashville',
  'TN',
  '37201',
  'john.doe@test.com',
  '615-555-0123',
  2,
  350.00,
  NULL
) ON CONFLICT DO NOTHING;

-- Get the ID of the registration we just inserted
WITH new_registration AS (
  SELECT id FROM conference_registrations 
  WHERE email = 'john.doe@test.com' 
  LIMIT 1
)
INSERT INTO conference_attendees (
  registration_id,
  first_name,
  last_name,
  email
) 
SELECT 
  id,
  'Jane',
  'Smith',
  'jane.smith@test.com'
FROM new_registration
ON CONFLICT DO NOTHING;