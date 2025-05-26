/*
  # Add rate limiting table

  1. New Tables
    - `rate_limits`
      - `key` (text, primary key) - Unique identifier for the rate limit
      - `count` (integer) - Number of attempts
      - `last_attempt` (timestamp) - Timestamp of the last attempt
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `rate_limits` table
    - Add policy for service role access only
*/

-- Create rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  last_attempt timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Add policy for service role only
CREATE POLICY "Service role access only"
  ON rate_limits
  USING (false);