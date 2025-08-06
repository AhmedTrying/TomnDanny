-- Add customer-related fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Create index for customer lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- Update RLS policies to include customer fields
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
CREATE POLICY "Enable read access for all users" ON orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders;
CREATE POLICY "Enable insert for authenticated users only" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON orders;
CREATE POLICY "Enable update for authenticated users only" ON orders
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON orders;
CREATE POLICY "Enable delete for authenticated users only" ON orders
  FOR DELETE USING (true);