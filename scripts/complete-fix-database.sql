-- Drop existing tables if they exist to recreate with proper structure
DROP TABLE IF EXISTS order_fees CASCADE;
DROP TABLE IF EXISTS order_edit_history CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS upsell_rules CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create products table with all required columns
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  show_in_kitchen BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  color TEXT DEFAULT '#D5A373',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables table
CREATE TABLE tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  zone TEXT NOT NULL DEFAULT 'Indoor',
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'reserved')),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table with proper structure
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  fees_total DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  dining_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (dining_type IN ('dine_in', 'takeaway')),
  order_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call_service', 'request_payment', 'assistance')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upsell_rules table
CREATE TABLE upsell_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_product TEXT NOT NULL,
  suggested_product TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fees table
CREATE TABLE fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
  applies_to TEXT NOT NULL DEFAULT 'both' CHECK (applies_to IN ('dine_in', 'takeaway', 'both')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_profiles table
CREATE TABLE staff_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier', 'kitchen')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE TABLE order_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_edit_history table
CREATE TABLE order_edit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_profiles(id),
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO categories (name, description, color) VALUES
('Coffee', 'Hot and cold coffee beverages', '#8B4513'),
('Tea', 'Various tea selections', '#228B22'),
('Pastries', 'Fresh baked goods', '#DAA520'),
('Cold Drinks', 'Refreshing cold beverages', '#4169E1'),
('Snacks', 'Light snacks and appetizers', '#FF6347');

INSERT INTO products (name, description, price, category, rating, reviews_count, show_in_kitchen, image_url) VALUES
('Americano', 'Rich and bold coffee with hot water', 12.50, 'Coffee', 4.5, 125, true, '/placeholder.svg?height=200&width=200'),
('Cappuccino', 'Espresso with steamed milk and foam', 15.00, 'Coffee', 4.7, 98, true, '/placeholder.svg?height=200&width=200'),
('Latte', 'Smooth espresso with steamed milk', 16.50, 'Coffee', 4.6, 87, true, '/placeholder.svg?height=200&width=200'),
('Mocha', 'Chocolate and espresso blend', 18.00, 'Coffee', 4.8, 76, true, '/placeholder.svg?height=200&width=200'),
('Green Tea', 'Fresh green tea leaves', 10.00, 'Tea', 4.3, 45, false, '/placeholder.svg?height=200&width=200'),
('Earl Grey', 'Classic black tea with bergamot', 11.00, 'Tea', 4.4, 32, false, '/placeholder.svg?height=200&width=200'),
('Croissant', 'Buttery flaky pastry', 8.50, 'Pastries', 4.2, 67, true, '/placeholder.svg?height=200&width=200'),
('Chocolate Muffin', 'Rich chocolate muffin', 9.00, 'Pastries', 4.5, 54, true, '/placeholder.svg?height=200&width=200'),
('Iced Coffee', 'Cold brew coffee over ice', 13.00, 'Cold Drinks', 4.4, 89, true, '/placeholder.svg?height=200&width=200'),
('Smoothie', 'Fresh fruit smoothie', 14.50, 'Cold Drinks', 4.6, 43, true, '/placeholder.svg?height=200&width=200');

INSERT INTO tables (number, zone, capacity, status) VALUES
(1, 'Indoor', 2, 'active'),
(2, 'Indoor', 4, 'active'),
(3, 'Indoor', 4, 'active'),
(4, 'Outdoor', 6, 'active'),
(5, 'Outdoor', 4, 'active'),
(6, 'VIP', 8, 'active'),
(7, 'Indoor', 2, 'maintenance'),
(8, 'Indoor', 4, 'active');

INSERT INTO fees (name, description, amount, type, applies_to) VALUES
('Service Charge', 'Standard service charge', 10.00, 'percentage', 'dine_in'),
('Takeaway Fee', 'Packaging and handling fee', 2.50, 'fixed', 'takeaway'),
('Late Night Surcharge', 'Additional charge for late orders', 5.00, 'fixed', 'both'),
('GST', 'Goods and Services Tax', 6.00, 'percentage', 'both');

INSERT INTO staff_profiles (name, email, password_hash, role) VALUES
('Admin User', 'admin@tommdanny.com', '$2b$10$hashedpassword1', 'admin'),
('John Cashier', 'john@tommdanny.com', '$2b$10$hashedpassword2', 'cashier'),
('Mary Kitchen', 'mary@tommdanny.com', '$2b$10$hashedpassword3', 'kitchen'),
('Sarah Manager', 'sarah@tommdanny.com', '$2b$10$hashedpassword4', 'admin');

INSERT INTO upsell_rules (trigger_product, suggested_product, description, active) VALUES
('Americano', 'Chocolate Muffin', 'Perfect pairing with coffee', true),
('Cappuccino', 'Croissant', 'Great breakfast combination', true),
('Green Tea', 'Pastries', 'Light snack with tea', true),
('Iced Coffee', 'Smoothie', 'Double refreshment combo', false);

-- Create indexes for better performance
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_edit_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON tables FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON service_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON upsell_rules FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON reviews FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON fees FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON staff_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON order_fees FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON order_edit_history FOR ALL USING (true);
