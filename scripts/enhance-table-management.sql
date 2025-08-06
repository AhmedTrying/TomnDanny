-- Enhance Table Management System
-- This script adds proper table status management for the order/payment system

-- Add new status values to tables table
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES orders(id),
ADD COLUMN IF NOT EXISTS last_payment_time TIMESTAMP WITH TIME ZONE;

-- Update table status enum to include 'occupied' and 'outstanding'
ALTER TABLE tables 
DROP CONSTRAINT IF EXISTS tables_status_check;

ALTER TABLE tables 
ADD CONSTRAINT tables_status_check 
CHECK (status IN ('active', 'maintenance', 'reserved', 'occupied', 'outstanding'));

-- Function to update table status based on orders
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new order is created
  IF TG_OP = 'INSERT' THEN
    -- Mark table as occupied
    UPDATE tables 
    SET status = 'occupied', 
        current_order_id = NEW.id,
        is_available = false
    WHERE number = NEW.table_number;
    
  -- When an order is updated
  ELSIF TG_OP = 'UPDATE' THEN
    -- If order is paid, mark table as available
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
      UPDATE tables 
      SET status = 'active',
          current_order_id = NULL,
          is_available = true,
          last_payment_time = NOW()
      WHERE number = NEW.table_number;
      
    -- If order status changes to something other than paid, ensure table is occupied
    ELSIF NEW.status != 'paid' AND OLD.status = 'paid' THEN
      UPDATE tables 
      SET status = 'occupied',
          current_order_id = NEW.id,
          is_available = false
      WHERE number = NEW.table_number;
    END IF;
    
  -- When an order is deleted
  ELSIF TG_OP = 'DELETE' THEN
    -- Mark table as available if no other active orders exist
    IF NOT EXISTS (
      SELECT 1 FROM orders 
      WHERE table_number = OLD.table_number 
      AND status != 'paid' 
      AND id != OLD.id
    ) THEN
      UPDATE tables 
      SET status = 'active',
          current_order_id = NULL,
          is_available = true
      WHERE number = OLD.table_number;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic table status updates
DROP TRIGGER IF EXISTS trigger_update_table_status ON orders;
CREATE TRIGGER trigger_update_table_status
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_table_status();

-- Function to check if table is available for new orders
CREATE OR REPLACE FUNCTION is_table_available(table_num INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tables 
    WHERE number = table_num 
    AND is_available = true 
    AND status IN ('active', 'reserved')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get table status summary
CREATE OR REPLACE FUNCTION get_table_status_summary()
RETURNS TABLE (
  table_number INTEGER,
  status TEXT,
  is_available BOOLEAN,
  current_order_id UUID,
  order_total DECIMAL(10,2),
  order_status TEXT,
  time_occupied INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.number,
    t.status,
    t.is_available,
    t.current_order_id,
    o.total,
    o.status as order_status,
    CASE 
      WHEN o.created_at IS NOT NULL THEN NOW() - o.created_at
      ELSE NULL
    END as time_occupied
  FROM tables t
  LEFT JOIN orders o ON t.current_order_id = o.id
  ORDER BY t.number;
END;
$$ LANGUAGE plpgsql;

-- Function to get outstanding tables (tables with unpaid orders)
CREATE OR REPLACE FUNCTION get_outstanding_tables()
RETURNS TABLE (
  table_number INTEGER,
  order_id UUID,
  total_amount DECIMAL(10,2),
  order_status TEXT,
  time_occupied INTERVAL,
  items_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.table_number,
    o.id as order_id,
    o.total as total_amount,
    o.status as order_status,
    NOW() - o.created_at as time_occupied,
    jsonb_array_length(o.items) as items_count
  FROM orders o
  WHERE o.status != 'paid'
  ORDER BY o.created_at;
END;
$$ LANGUAGE plpgsql;

-- Update existing tables to have proper initial status
UPDATE tables 
SET status = 'active', 
    is_available = true 
WHERE status NOT IN ('maintenance', 'reserved');

-- Create view for table dashboard
CREATE OR REPLACE VIEW table_dashboard AS
SELECT 
  t.number as table_number,
  t.zone,
  t.capacity,
  t.status as table_status,
  t.is_available,
  o.id as current_order_id,
  o.status as order_status,
  o.total as order_total,
  o.created_at as order_start_time,
  CASE 
    WHEN o.created_at IS NOT NULL THEN NOW() - o.created_at
    ELSE NULL
  END as time_occupied,
  jsonb_array_length(o.items) as items_count
FROM tables t
LEFT JOIN orders o ON t.current_order_id = o.id
ORDER BY t.number;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tables_current_order_id ON tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_tables_status_available ON tables(status, is_available);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_number, status);

-- Insert sample data for testing
INSERT INTO tables (number, zone, capacity, status, is_available) VALUES
(9, 'Indoor', 4, 'active', true),
(10, 'Outdoor', 6, 'active', true)
ON CONFLICT (number) DO NOTHING;

-- Ensure only one open order per table (status not paid/cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS one_open_order_per_table
ON orders(table_number)
WHERE status != 'paid' AND status != 'cancelled';

-- Add payment_method, payment_notes, and payment_proof_url columns to orders table if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_notes') THEN
    ALTER TABLE orders ADD COLUMN payment_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_proof_url') THEN
    ALTER TABLE orders ADD COLUMN payment_proof_url TEXT;
  END IF;
END $$;

-- Add payments table for split-by-items payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL,
  notes TEXT,
  proof_url TEXT,
  items JSONB, -- array of item IDs or objects for split-by-items
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id); 