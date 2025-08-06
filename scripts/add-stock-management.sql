-- Add stock management to products table
DO $$ 
BEGIN
    -- Add stock_quantity column to products table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
        ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add low_stock_threshold column to products table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'low_stock_threshold') THEN
        ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 10;
    END IF;
    
    -- Add track_stock column to products table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'track_stock') THEN
        ALTER TABLE products ADD COLUMN track_stock BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create stock_history table for tracking stock changes
CREATE TABLE IF NOT EXISTS stock_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('initial', 'restock', 'sale', 'adjustment', 'waste', 'return')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  staff_id UUID REFERENCES staff_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_track_stock ON products(track_stock);

-- Update existing products to have default stock quantities
UPDATE products SET stock_quantity = 50 WHERE stock_quantity IS NULL OR stock_quantity = 0;

-- Insert sample stock history for existing products
INSERT INTO stock_history (product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, notes)
SELECT 
  id,
  'initial',
  50,
  0,
  50,
  'Initial stock setup',
  'Default stock quantity added during system setup'
FROM products
WHERE id NOT IN (SELECT DISTINCT product_id FROM stock_history); 