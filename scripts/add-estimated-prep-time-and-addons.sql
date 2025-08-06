-- Add estimated_prep_time to products
ALTER TABLE public.products ADD COLUMN estimated_prep_time text;

-- Create product_add_ons table
CREATE TABLE public.product_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  active boolean DEFAULT true
); 