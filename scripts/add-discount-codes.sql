-- Add discount_codes table for code-based discounts
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
  value DECIMAL(10,2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  usage_limit INTEGER, -- null = unlimited
  usage_count INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10,2), -- null = no minimum
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

-- Enable RLS for security
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active discount codes" ON discount_codes FOR SELECT USING (active = true); 