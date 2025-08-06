-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES staff_profiles(id)
);

-- Create product_sizes table for flexible sizing
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_name TEXT NOT NULL CHECK (size_name IN ('S', 'M', 'L', 'XL')),
  price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  price_override DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, size_name)
);

-- Create fees table for additional charges
CREATE TABLE IF NOT EXISTS fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('dine_in', 'takeaway', 'both')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table for cafe info and system configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_name TEXT NOT NULL DEFAULT 'Tomm&Danny',
  location TEXT NOT NULL DEFAULT 'Eco Botanic, Johor',
  phone_number TEXT NOT NULL DEFAULT '+60129966238',
  operating_hours JSONB NOT NULL DEFAULT '{"open": "06:00", "close": "22:00"}',
  system_config JSONB NOT NULL DEFAULT '{"auto_print": true, "notifications": true, "kitchen_auto_refresh": true, "order_timeout_alerts": true}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_fees junction table
CREATE TABLE IF NOT EXISTS order_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES fees(id),
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_edit_history table for tracking changes
CREATE TABLE IF NOT EXISTS order_edit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_profiles(id),
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qr_codes table for table management
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  qr_code_url TEXT NOT NULL,
  menu_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add additional columns to orders table
DO $$ 
BEGIN
    -- Add dining type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dining_type') THEN
        ALTER TABLE orders ADD COLUMN dining_type TEXT DEFAULT 'dine_in' CHECK (dining_type IN ('dine_in', 'takeaway'));
    END IF;
    
    -- Add discount amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
        ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add discount reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_reason') THEN
        ALTER TABLE orders ADD COLUMN discount_reason TEXT;
    END IF;
    
    -- Add global order notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_notes') THEN
        ALTER TABLE orders ADD COLUMN order_notes TEXT;
    END IF;
    
    -- Add subtotal before fees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);
    END IF;
    
    -- Add fees total
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'fees_total') THEN
        ALTER TABLE orders ADD COLUMN fees_total DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Insert default product sizes for existing products
INSERT INTO product_sizes (product_id, size_name, price_multiplier)
SELECT id, 'S', 0.8 FROM products
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO product_sizes (product_id, size_name, price_multiplier)
SELECT id, 'M', 1.0 FROM products
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO product_sizes (product_id, size_name, price_multiplier)
SELECT id, 'L', 1.2 FROM products
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Insert default fees
INSERT INTO fees (name, description, amount, type, applies_to) VALUES
('Service Charge', '10% service charge for dine-in orders', 10.00, 'percentage', 'dine_in'),
('Takeaway Fee', 'Packaging fee for takeaway orders', 2.00, 'fixed', 'takeaway'),
('Delivery Fee', 'Delivery charge for orders', 5.00, 'fixed', 'takeaway')
ON CONFLICT DO NOTHING;

-- Generate QR codes for existing tables
INSERT INTO qr_codes (table_id, qr_code_url, menu_url)
SELECT 
  id, 
  'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' || encode(('https://tommdanny.com/dine-in?table=' || number::text)::bytea, 'base64'),
  'https://tommdanny.com/dine-in?table=' || number::text
FROM tables
ON CONFLICT DO NOTHING;

-- Enable RLS for new tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Enable all operations for reviews" ON reviews FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable read for product_sizes" ON product_sizes FOR SELECT TO anon USING (true);
CREATE POLICY "Enable read for fees" ON fees FOR SELECT TO anon USING (true);
CREATE POLICY "Enable all operations for order_fees" ON order_fees FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for order_edit_history" ON order_edit_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable read for qr_codes" ON qr_codes FOR SELECT TO anon USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_table_number ON reviews(table_number);
CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_order_fees_order_id ON order_fees(order_id);
CREATE INDEX IF NOT EXISTS idx_order_edit_history_order_id ON order_edit_history(order_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_table_id ON qr_codes(table_id);

-- Function to log order changes
CREATE OR REPLACE FUNCTION log_order_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO order_edit_history (order_id, action, old_data, new_data)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO order_edit_history (order_id, action, new_data)
    VALUES (NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO order_edit_history (order_id, action, old_data)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order change logging
DROP TRIGGER IF EXISTS trigger_log_order_change ON orders;
CREATE TRIGGER trigger_log_order_change
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_change();

-- Update currency display function
CREATE OR REPLACE FUNCTION format_currency(amount DECIMAL)
RETURNS TEXT AS $$
BEGIN
  RETURN 'RM' || to_char(amount, 'FM999,999,990.00');
END;
$$ LANGUAGE plpgsql;
