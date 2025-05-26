/*
  # Content Table Performance Improvements

  1. Changes
    - Add indexes on frequently queried columns (type, status, category, date)
    - Add full-text search capability for title and description
    - Add index for is_featured flag
    
  2. Benefits
    - Faster filtering by type, status, category, and date
    - Efficient text search across content
    - Improved performance for featured content queries
*/

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_date ON content(date);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
CREATE INDEX IF NOT EXISTS idx_content_is_featured ON content(is_featured) WHERE is_featured = true;

-- Create composite indexes for common combined filters
CREATE INDEX IF NOT EXISTS idx_content_type_status ON content(type, status);
CREATE INDEX IF NOT EXISTS idx_content_type_date ON content(type, date);
CREATE INDEX IF NOT EXISTS idx_content_type_category ON content(type, category);

-- Add full-text search capability
-- First, make sure the extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for text search on title and description
CREATE INDEX IF NOT EXISTS idx_content_title_trgm ON content USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_content_description_trgm ON content USING GIN (description gin_trgm_ops);

-- Create a function to search content
CREATE OR REPLACE FUNCTION search_content(search_term TEXT)
RETURNS SETOF content AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM content
  WHERE 
    title ILIKE '%' || search_term || '%' OR
    description ILIKE '%' || search_term || '%'
  ORDER BY
    CASE
      WHEN title ILIKE '%' || search_term || '%' THEN 0
      ELSE 1
    END,
    created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a more advanced search function with type and status filters
CREATE OR REPLACE FUNCTION search_content_filtered(
  search_term TEXT,
  content_type TEXT DEFAULT NULL,
  content_status TEXT DEFAULT NULL,
  content_category TEXT DEFAULT NULL
)
RETURNS SETOF content AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM content
  WHERE 
    (title ILIKE '%' || search_term || '%' OR description ILIKE '%' || search_term || '%')
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
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the search functions
GRANT EXECUTE ON FUNCTION search_content TO public;
GRANT EXECUTE ON FUNCTION search_content_filtered TO public;