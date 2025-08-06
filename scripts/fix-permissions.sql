-- Update RLS policies to allow proper CRUD operations

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for products" ON products;
DROP POLICY IF EXISTS "Enable all operations for orders" ON orders;
DROP POLICY IF EXISTS "Enable all operations for service_requests" ON service_requests;
DROP POLICY IF EXISTS "Enable all operations for tables" ON tables;
DROP POLICY IF EXISTS "Enable all operations for upsell_rules" ON upsell_rules;
DROP POLICY IF EXISTS "Enable all operations for categories" ON categories;
DROP POLICY IF EXISTS "Enable all operations for reviews" ON reviews;
DROP POLICY IF EXISTS "Enable all operations for fees" ON fees;
DROP POLICY IF EXISTS "Enable all operations for staff_profiles" ON staff_profiles;

-- Enable Row Level Security for all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for products
CREATE POLICY "Enable all operations for products" ON products FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for orders
CREATE POLICY "Enable all operations for orders" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for service_requests
CREATE POLICY "Enable all operations for service_requests" ON service_requests FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for tables
CREATE POLICY "Enable all operations for tables" ON tables FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for upsell_rules
CREATE POLICY "Enable all operations for upsell_rules" ON upsell_rules FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for categories
CREATE POLICY "Enable all operations for categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for reviews
CREATE POLICY "Enable all operations for reviews" ON reviews FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for fees
CREATE POLICY "Enable all operations for fees" ON fees FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create comprehensive policies for staff_profiles
CREATE POLICY "Enable all operations for staff_profiles" ON staff_profiles FOR ALL TO anon USING (true) WITH CHECK (true);
