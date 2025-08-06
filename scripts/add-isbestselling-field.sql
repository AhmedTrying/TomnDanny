-- Add isbestselling column to products table if it doesn't exist
DO $$ 
BEGIN
    -- Add isbestselling column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'isbestselling') THEN
        ALTER TABLE products ADD COLUMN isbestselling BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update existing products to have default isbestselling value if null
UPDATE products SET isbestselling = false WHERE isbestselling IS NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN products.isbestselling IS 'Flag to mark products as best selling items for display on landing pages';