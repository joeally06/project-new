/*
  # Add category field to content table

  1. Changes
    - Add category validation to content table
    - Update existing content to have default category
*/

-- Add category validation to content table
ALTER TABLE content DROP CONSTRAINT IF EXISTS valid_content_category;
ALTER TABLE content ADD CONSTRAINT valid_content_category 
  CHECK (
    (type != 'news') OR 
    (category = ANY (ARRAY[
      'announcements',
      'events',
      'safety',
      'regulations', 
      'industry'
    ]))
  );

-- Set default category for existing news content
UPDATE content 
SET category = 'announcements'
WHERE type = 'news' AND category IS NULL;