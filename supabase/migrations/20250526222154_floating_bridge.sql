/*
  # Add text search capabilities

  1. Changes
    - Add pg_trgm extension if not already enabled
    - Create GIN indexes for text search on content and resources tables
    - Add function to search content with filters
    - Add function to search resources with filters

  2. Performance
    - Improves search performance with proper indexes
    - Enables partial text matching with trigram similarity
*/

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for text search on content table
CREATE INDEX IF NOT EXISTS idx_content_title_trgm 
ON content USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_content_description_trgm 
ON content USING GIN (description gin_trgm_ops);

-- Create GIN indexes for text search on resources table
CREATE INDEX IF NOT EXISTS idx_resources_title_trgm 
ON resources USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_resources_description_trgm 
ON resources USING GIN (description gin_trgm_ops);

-- Create function to search content with filters
CREATE OR REPLACE FUNCTION search_content(
  search_term TEXT,
  content_type TEXT DEFAULT NULL,
  content_status TEXT DEFAULT NULL,
  content_category TEXT DEFAULT NULL
)
RETURNS SETOF content
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM content
  WHERE 
    (
      title ILIKE '%' || search_term || '%' OR 
      description ILIKE '%' || search_term || '%'
    )
    AND (content_type IS NULL OR type = content_type)
    AND (content_status IS NULL OR status = content_status)
    AND (content_category IS NULL OR category = content_category)
  ORDER BY
    CASE
      WHEN title ILIKE '%' || search_term || '%' THEN 0
      ELSE 1
    END,
    created_at DESC;
END;
$$;

-- Create function to search resources with filters
CREATE OR REPLACE FUNCTION search_resources(
  search_term TEXT,
  resource_category TEXT DEFAULT NULL
)
RETURNS SETOF resources
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM resources
  WHERE 
    (
      title ILIKE '%' || search_term || '%' OR 
      description ILIKE '%' || search_term || '%'
    )
    AND (resource_category IS NULL OR category = resource_category)
  ORDER BY
    CASE
      WHEN title ILIKE '%' || search_term || '%' THEN 0
      ELSE 1
    END,
    created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_content TO authenticated;
GRANT EXECUTE ON FUNCTION search_content TO anon;
GRANT EXECUTE ON FUNCTION search_resources TO authenticated;
GRANT EXECUTE ON FUNCTION search_resources TO anon;