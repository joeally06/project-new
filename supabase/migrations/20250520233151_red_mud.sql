/*
  # Create membership applications table

  1. New Tables
    - `membership_applications`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `phone` (text)
      - `organization` (text)
      - `position` (text)
      - `membership_type` (text)
      - `is_new_member` (text)
      - `hear_about_us` (text)
      - `interests` (text[])
      - `agree_to_terms` (boolean)
      - `status` (text)

  2. Security
    - Enable RLS on `membership_applications` table
    - Add policies for:
      - Public read access
      - Admin full access
*/

CREATE TABLE public.membership_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT NOT NULL,
    position TEXT NOT NULL,
    membership_type TEXT NOT NULL,
    is_new_member TEXT NOT NULL,
    hear_about_us TEXT,
    interests TEXT[],
    agree_to_terms BOOLEAN NOT NULL,
    status TEXT DEFAULT 'pending'
);

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

-- All membership applications must be submitted via secure Edge Functions with validation and rate limiting.
-- No public or anon insert policy exists.

CREATE POLICY "Enable read access for all users" ON public.membership_applications 
FOR SELECT USING (TRUE);

CREATE POLICY "Allow admin full access" ON public.membership_applications 
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
) 
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);