-- Add sort_order column to menu_promos table
ALTER TABLE menu_promos ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing promos to have sequential sort_order
UPDATE menu_promos 
SET sort_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num 
  FROM menu_promos
) AS subquery 
WHERE menu_promos.id = subquery.id;

-- Make sort_order NOT NULL after setting values
ALTER TABLE menu_promos ALTER COLUMN sort_order SET NOT NULL;

-- Add index for better performance when ordering
CREATE INDEX idx_menu_promos_sort_order ON menu_promos(sort_order);

-- Update the API query to order by sort_order
-- The API will now return promos ordered by sort_order ASC 