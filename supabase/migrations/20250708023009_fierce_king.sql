/*
  # Update linked_form_type constraint

  1. Changes
    - Update the valid_linked_form_type constraint to include student-scholarship and exhibitor
    - Ensures all form types are properly validated
    
  2. Security
    - Maintains data integrity by validating form types
*/

-- Drop existing constraint
ALTER TABLE content DROP CONSTRAINT IF EXISTS valid_linked_form_type;

-- Add updated constraint with all form types
ALTER TABLE content ADD CONSTRAINT valid_linked_form_type 
  CHECK (linked_form_type IS NULL OR linked_form_type = ANY (ARRAY[
    'conference', 
    'tech-conference', 
    'hall-of-fame', 
    'student-scholarship', 
    'exhibitor'
  ]));