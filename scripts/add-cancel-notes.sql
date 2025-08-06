-- Add cancel_notes column to orders table
-- This allows storing the reason when an order is cancelled

ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN orders.cancel_notes IS 'Reason/notes for order cancellation';

-- Create index for better performance when querying cancelled orders
CREATE INDEX IF NOT EXISTS idx_orders_cancel_notes ON orders(cancel_notes) WHERE cancel_notes IS NOT NULL; 