-- Remove direct role assignment capability
DROP POLICY IF EXISTS "Users table access policy" ON public.users;

-- Add new policy that only allows users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add policy for admins to manage users
CREATE POLICY "Admins can manage users"
  ON users
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );