-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Check-In/Out Table
CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  breaks JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);

-- Insert sample products
INSERT INTO products (name, description, price, category, rating, reviews_count) VALUES
('Cappuccino', 'Rich espresso with steamed milk and foam', 4.50, 'Cappuccino', 4.8, 120),
('Cappuccino with Chocolate', 'Classic cappuccino with chocolate syrup', 4.53, 'Cappuccino', 4.6, 95),
('Macchiato', 'Espresso with a dollop of steamed milk', 4.25, 'Macchiato', 4.7, 80),
('Latte', 'Smooth espresso with steamed milk', 4.75, 'Latte', 4.5, 110),
('Americano', 'Espresso with hot water', 3.50, 'Americano', 4.3, 75),
('Croissant', 'Buttery, flaky pastry', 2.50, 'Pastry', 4.4, 60),
('Muffin', 'Fresh baked blueberry muffin', 3.00, 'Pastry', 4.2, 45);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "Public can insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can insert service requests" ON service_requests FOR INSERT TO anon WITH CHECK (true);
