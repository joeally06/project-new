/*
  # Create Content Management Tables

  1. New Tables
    - `content`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `type` (text, not null)
      - `status` (text, not null)
      - `featured` (boolean, default false)
      - `image_url` (text)
      - `date` (timestamptz)
      - `category` (text)
      - `link` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add policies for public read access
*/

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  featured boolean DEFAULT false,
  image_url text,
  date timestamptz,
  category text,
  link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraint to validate type
  CONSTRAINT valid_content_type CHECK (
    type IN ('event', 'announcement', 'resource', 'news')
  ),
  
  -- Add constraint to validate status
  CONSTRAINT valid_content_status CHECK (
    status IN ('draft', 'published')
  )
);

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admin to manage content"
  ON content
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

CREATE POLICY "Allow public to read published content"
  ON content
  FOR SELECT
  TO public
  USING (status = 'published');

-- Create updated_at trigger
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();