/*
  # Create admin logs table

  1. New Tables
    - `admin_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `action` (text)
      - `outcome` (text)
      - `error` (text, nullable)
      - `details` (jsonb, nullable)
      - `timestamp` (timestamptz)
  2. Security
    - Enable RLS on `admin_logs` table
    - Add policy for service role to insert logs
    - Add policy for admins to read logs
*/

-- Create admin logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  outcome text NOT NULL,
  error text,
  details jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can insert logs"
  ON public.admin_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can read logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_timestamp
  ON public.admin_logs (user_id, timestamp DESC);