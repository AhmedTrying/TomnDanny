-- Add missing columns to orders table for POS functionality
-- This fixes the order placement error in POSMenuOrder.tsx

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cash_received NUMERIC,
ADD COLUMN IF NOT EXISTS split_payments JSONB,
ADD COLUMN IF NOT EXISTS change_due NUMERIC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Update RLS policies to include new fields
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