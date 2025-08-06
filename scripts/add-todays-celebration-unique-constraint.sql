-- Add unique constraint to todays_celebration table
-- This allows upsert operations to work properly with the date column

-- First, check if there are any duplicate dates and handle them
-- (This will keep the most recent entry for each date)
DELETE FROM todays_celebration 
WHERE id NOT IN (
  SELECT DISTINCT ON (date) id 
  FROM todays_celebration 
  ORDER BY date, updated_at DESC
);

-- Add unique constraint to date column
ALTER TABLE todays_celebration 
ADD CONSTRAINT todays_celebration_date_unique UNIQUE (date);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_todays_celebration_date ON todays_celebration(date); 