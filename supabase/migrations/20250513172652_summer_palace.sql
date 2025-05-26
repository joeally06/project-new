/*
  # Add Test Conference Registrations

  1. New Data
    - Adds three test conference registrations with attendees
    - Each registration has different number of attendees
    - Uses realistic test data
  
  2. Purpose
    - Verify conference registration functionality
    - Provide sample data for testing
*/

-- First Registration
INSERT INTO conference_registrations (
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
  total_amount
) VALUES (
  'Metro Nashville Public Schools',
  'Michael',
  'Johnson',
  '2601 Bransford Ave',
  'Nashville',
  'TN',
  '37204',
  'michael.johnson@mnps.org',
  '615-555-0101',
  3,
  525.00
) ON CONFLICT DO NOTHING;

-- Get the ID of the first registration
WITH first_reg AS (
  SELECT id FROM conference_registrations 
  WHERE email = 'michael.johnson@mnps.org' 
  LIMIT 1
)
INSERT INTO conference_attendees (
  registration_id,
  first_name,
  last_name,
  email
) 
SELECT 
  id as registration_id,
  unnest(ARRAY['Sarah', 'David']) as first_name,
  unnest(ARRAY['Williams', 'Miller']) as last_name,
  unnest(ARRAY['sarah.w@mnps.org', 'david.m@mnps.org']) as email
FROM first_reg
ON CONFLICT DO NOTHING;

-- Second Registration
INSERT INTO conference_registrations (
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
  total_amount
) VALUES (
  'Hamilton County Schools',
  'Jennifer',
  'Davis',
  '3074 Hickory Valley Road',
  'Chattanooga',
  'TN',
  '37421',
  'jennifer.davis@hcde.org',
  '423-555-0202',
  2,
  350.00
) ON CONFLICT DO NOTHING;

-- Get the ID of the second registration
WITH second_reg AS (
  SELECT id FROM conference_registrations 
  WHERE email = 'jennifer.davis@hcde.org' 
  LIMIT 1
)
INSERT INTO conference_attendees (
  registration_id,
  first_name,
  last_name,
  email
) 
SELECT 
  id as registration_id,
  'Robert' as first_name,
  'Thompson' as last_name,
  'robert.t@hcde.org' as email
FROM second_reg
ON CONFLICT DO NOTHING;

-- Third Registration
INSERT INTO conference_registrations (
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
  total_amount
) VALUES (
  'Knox County Schools',
  'Patricia',
  'Anderson',
  '912 S. Gay Street',
  'Knoxville',
  'TN',
  '37902',
  'patricia.anderson@knoxschools.org',
  '865-555-0303',
  4,
  700.00
) ON CONFLICT DO NOTHING;

-- Get the ID of the third registration
WITH third_reg AS (
  SELECT id FROM conference_registrations 
  WHERE email = 'patricia.anderson@knoxschools.org' 
  LIMIT 1
)
INSERT INTO conference_attendees (
  registration_id,
  first_name,
  last_name,
  email
) 
SELECT 
  id as registration_id,
  unnest(ARRAY['James', 'Lisa', 'Mark']) as first_name,
  unnest(ARRAY['Wilson', 'Brown', 'Taylor']) as last_name,
  unnest(ARRAY['james.w@knoxschools.org', 'lisa.b@knoxschools.org', 'mark.t@knoxschools.org']) as email
FROM third_reg
ON CONFLICT DO NOTHING;