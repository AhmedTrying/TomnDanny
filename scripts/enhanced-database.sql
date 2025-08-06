-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#D5A373',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
('Coffee', 'Hot and cold coffee beverages', '#7C4F35'),
('Latte', 'Latte variations and specialty drinks', '#4B2E2B'),
('Cappuccino', 'Traditional and flavored cappuccinos', '#102341'),
('Americano', 'Americano and espresso-based drinks', '#D5A373'),
('Pastry', 'Fresh baked goods and snacks', '#8B4513'),
('Macchiato', 'Macchiato and caramel drinks', '#A0522D')
ON CONFLICT (name) DO NOTHING;

-- Add category_id to products table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
        ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);
    END IF;
END $$;

-- Update existing products to link with categories
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE name = products.category LIMIT 1
) WHERE category_id IS NULL;

-- Create staff_profiles table
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier', 'kitchen', 'manager')),
  email TEXT UNIQUE,
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

-- Insert default staff profiles
INSERT INTO staff_profiles (name, role, email) VALUES
('Admin User', 'admin', 'admin@tommdanny.com'),
('Cashier 1', 'cashier', 'cashier1@tommdanny.com'),
('Kitchen Staff', 'kitchen', 'kitchen@tommdanny.com'),
('Manager', 'manager', 'manager@tommdanny.com')
ON CONFLICT (email) DO NOTHING;

-- Add staff_id to orders for tracking who processed the order
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'processed_by') THEN
        ALTER TABLE orders ADD COLUMN processed_by UUID REFERENCES staff_profiles(id);
    END IF;
END $$;

-- Create order_history_archive table for better performance
CREATE TABLE IF NOT EXISTS order_history_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_order_id UUID,
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT,
  processed_by UUID REFERENCES staff_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Enable RLS for new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history_archive ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Enable all operations for categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable read for staff_profiles" ON staff_profiles FOR SELECT TO anon USING (true);
CREATE POLICY "Enable all operations for order_history_archive" ON order_history_archive FOR ALL TO anon USING (true) WITH CHECK (true);

-- Function to automatically archive completed orders
CREATE OR REPLACE FUNCTION archive_completed_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('paid', 'cancelled') AND OLD.status != NEW.status THEN
    INSERT INTO order_history_archive (
      original_order_id, table_number, items, total, status, processed_by, created_at
    ) VALUES (
      NEW.id, NEW.table_number, NEW.items, NEW.total, NEW.status, NEW.processed_by, NEW.created_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for archiving
DROP TRIGGER IF EXISTS trigger_archive_completed_order ON orders;
CREATE TRIGGER trigger_archive_completed_order
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION archive_completed_order();
