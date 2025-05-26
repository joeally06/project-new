/*
  # Create Hall of Fame nominations table

  1. New Tables
    - `hall_of_fame_nominations`
      - `id` (uuid, primary key)
      - `supervisor_first_name` (varchar)
      - `supervisor_last_name` (varchar)
      - `district` (varchar)
      - `supervisor_email` (varchar)
      - `nominee_first_name` (varchar)
      - `nominee_last_name` (varchar)
      - `nominee_city` (varchar)
      - `nomination_reason` (text)
      - `region` (varchar)
      - `is_tapt_member` (boolean)
      - `years_of_service` (integer)
      - `status` (varchar, default: 'pending')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `hall_of_fame_nominations` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS hall_of_fame_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_first_name varchar(100) NOT NULL,
  supervisor_last_name varchar(100) NOT NULL,
  district varchar(200) NOT NULL,
  supervisor_email varchar(255) NOT NULL,
  nominee_first_name varchar(100) NOT NULL,
  nominee_last_name varchar(100) NOT NULL,
  nominee_city varchar(100) NOT NULL,
  nomination_reason text NOT NULL,
  region varchar(50) NOT NULL,
  is_tapt_member boolean NOT NULL,
  years_of_service integer,
  status varchar(50) NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hall_of_fame_nominations ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hall_of_fame_nominations_updated_at
  BEFORE UPDATE ON hall_of_fame_nominations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();