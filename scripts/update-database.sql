-- Create tables table for table management
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  zone TEXT NOT NULL DEFAULT 'Indoor',
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upsell_rules table
CREATE TABLE IF NOT EXISTS upsell_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_product TEXT NOT NULL,
  suggested_product TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample tables
INSERT INTO tables (number, zone, capacity, status) VALUES
(1, 'Indoor', 4, 'active'),
(2, 'Indoor', 2, 'active'),
(3, 'Outdoor', 6, 'active'),
(4, 'VIP', 8, 'active'),
(5, 'Indoor', 4, 'maintenance'),
(6, 'Outdoor', 4, 'active');

-- Insert sample upsell rules
INSERT INTO upsell_rules (trigger_product, suggested_product, description, active) VALUES
('Americano', 'Banana Muffin', 'Perfect pairing for morning coffee', true),
('Cappuccino', 'Croissant', 'Classic European breakfast combo', true),
('Latte', 'Chocolate Cookie', 'Sweet complement to creamy latte', true),
('Macchiato', 'Almond Biscotti', 'Traditional Italian pairing', true);

-- Enable RLS for new tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Public can read tables" ON tables FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read upsell rules" ON upsell_rules FOR SELECT TO anon USING (true);
