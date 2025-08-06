-- Add rating and reviews_count columns to products table if they don't exist
DO $$ 
BEGIN
    -- Add rating column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'rating') THEN
        ALTER TABLE products ADD COLUMN rating DECIMAL(3,2) DEFAULT 4.5;
    END IF;
    
    -- Add reviews_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'reviews_count') THEN
        ALTER TABLE products ADD COLUMN reviews_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing products to have default rating if null
UPDATE products SET rating = 4.5 WHERE rating IS NULL;
UPDATE products SET reviews_count = 0 WHERE reviews_count IS NULL;

-- Add constraints to ensure rating is between 0 and 5
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'products_rating_check') THEN
        ALTER TABLE products ADD CONSTRAINT products_rating_check CHECK (rating >= 0 AND rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'products_reviews_count_check') THEN
        ALTER TABLE products ADD CONSTRAINT products_reviews_count_check CHECK (reviews_count >= 0);
    END IF;
END $$;