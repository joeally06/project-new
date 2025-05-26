-- Add created_by column to resources table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE resources ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index for resources created_by
CREATE INDEX IF NOT EXISTS idx_resources_created_by 
ON resources(created_by);

-- Add policy for users to manage their own resources
DROP POLICY IF EXISTS "Users can manage own resources" ON resources;
CREATE POLICY "Users can manage own resources"
  ON resources
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());