/*
  # Add user role function

  1. New Functions
    - `get_user_role`: Safely retrieves a user's role without triggering RLS recursion
  
  2. Security
    - Function is accessible to authenticated users only
    - Uses SECURITY DEFINER to bypass RLS
*/

-- Create function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM users
    WHERE id = user_id
    LIMIT 1
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;