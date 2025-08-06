-- Add customers table for POS customer management
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  date_of_birth DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers(loyalty_points);

-- Add some sample customers for testing
INSERT INTO customers (name, phone, email, loyalty_points, total_orders, total_spent) VALUES
('John Doe', '+60123456789', 'john.doe@email.com', 150, 12, 245.50),
('Jane Smith', '+60198765432', 'jane.smith@email.com', 89, 8, 156.75),
('Ahmad Rahman', '+60187654321', 'ahmad.rahman@email.com', 220, 18, 398.25),
('Siti Nurhaliza', '+60176543210', 'siti.nurhaliza@email.com', 45, 5, 89.50),
('David Tan', '+60165432109', 'david.tan@email.com', 310, 25, 567.80),
('Maria Garcia', '+60154321098', 'maria.garcia@email.com', 78, 7, 134.25),
('Raj Patel', '+60143210987', 'raj.patel@email.com', 195, 15, 289.90),
('Lisa Wong', '+60132109876', 'lisa.wong@email.com', 67, 6, 112.40)
ON CONFLICT (phone) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at_trigger
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Add RLS policies if needed
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customers TO service_role;