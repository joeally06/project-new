/*
  # Create Board Members Table

  1. New Tables
    - `board_members`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `title` (text, not null)
      - `district` (text)
      - `bio` (text)
      - `image` (text)
      - `order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add policies for public read access
*/

CREATE TABLE IF NOT EXISTS board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  district text,
  bio text,
  image text,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin full access to board members"
  ON board_members
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "Allow public to read board members"
  ON board_members
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_board_members_updated_at
  BEFORE UPDATE ON board_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();