-- Fix foreign key constraint issue for todays_celebration table
-- Make created_by field nullable to handle cases where user doesn't exist in staff_profiles

-- First, set any invalid created_by references to null
UPDATE todays_celebration 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND created_by NOT IN (SELECT user_id FROM staff_profiles);

-- Make the created_by column nullable (if it's not already)
ALTER TABLE todays_celebration 
ALTER COLUMN created_by DROP NOT NULL;

-- Update the foreign key constraint to allow null values
-- Drop the existing constraint if it exists
ALTER TABLE todays_celebration 
DROP CONSTRAINT IF EXISTS todays_celebration_created_by_fkey;

-- Re-add the constraint with proper null handling
ALTER TABLE todays_celebration 
ADD CONSTRAINT todays_celebration_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES staff_profiles(user_id) 
ON DELETE SET NULL;

-- Add a comment to document the change
COMMENT ON COLUMN todays_celebration.created_by IS 'References staff_profiles.user_id, can be null if user is not in staff_profiles'; 