-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  color text DEFAULT '#D5A373'::text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.checkins (
  id integer NOT NULL DEFAULT nextval('checkins_id_seq'::regclass),
  user_id uuid,
  date date NOT NULL,
  check_in_time timestamp without time zone,
  check_out_time timestamp without time zone,
  breaks jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT checkins_pkey PRIMARY KEY (id),
  CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.discount_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type = ANY (ARRAY['fixed'::text, 'percentage'::text])),
  value numeric NOT NULL,
  description text,
  active boolean DEFAULT true,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  min_order_amount numeric,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  applies_to ARRAY DEFAULT ARRAY['dine_in'::text, 'takeaway'::text, 'reservation'::text],
  CONSTRAINT discount_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  customer_name character varying NOT NULL,
  customer_email character varying,
  customer_phone character varying,
  number_of_guests integer DEFAULT 1,
  status character varying DEFAULT 'confirmed'::character varying CHECK (status::text = ANY (ARRAY['confirmed'::character varying::text, 'cancelled'::character varying::text, 'waitlist'::character varying::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  date timestamp with time zone NOT NULL,
  image_url text,
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'published'::character varying::text, 'cancelled'::character varying::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['fixed'::text, 'percentage'::text])),
  applies_to text NOT NULL DEFAULT 'both'::text CHECK (applies_to = ANY (ARRAY['dine_in'::text, 'takeaway'::text, 'reservation'::text, 'both'::text])),
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fees_pkey PRIMARY KEY (id)
);
CREATE TABLE public.menu_promos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  promo_text text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT menu_promos_pkey PRIMARY KEY (id),
  CONSTRAINT menu_promos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.order_edit_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  staff_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_edit_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_edit_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_edit_history_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.order_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  fee_id uuid NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_fees_pkey PRIMARY KEY (id),
  CONSTRAINT order_fees_fee_id_fkey FOREIGN KEY (fee_id) REFERENCES public.fees(id),
  CONSTRAINT order_fees_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_history_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  original_order_id uuid,
  table_number integer NOT NULL,
  items jsonb NOT NULL,
  total numeric NOT NULL,
  status text,
  processed_by uuid,
  created_at timestamp with time zone,
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_history_archive_pkey PRIMARY KEY (id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_number integer NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  fees_total numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  discount_reason text,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'preparing'::text, 'ready'::text, 'served'::text, 'paid'::text, 'cancelled'::text, 'reservation_confirmed'::text, 'reservation_ready'::text])),
  dining_type text NOT NULL DEFAULT 'dine_in'::text CHECK (dining_type = ANY (ARRAY['dine_in'::text, 'takeaway'::text, 'reservation'::text])),
  order_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_method text,
  payment_notes text,
  payment_proof_url text,
  payment_status text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text])),
  cancel_notes text,
  is_reservation boolean DEFAULT false,
  reservation_time time without time zone,
  reservation_date date,
  number_of_people integer,
  table_preference text,
  customer_name text,
  customer_phone text,
  customer_email text,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  amount numeric NOT NULL,
  method text NOT NULL,
  notes text,
  proof_url text,
  items jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.product_add_ons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  CONSTRAINT product_add_ons_pkey PRIMARY KEY (id),
  CONSTRAINT product_add_ons_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_sizes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  size_name text NOT NULL CHECK (size_name = ANY (ARRAY['S'::text, 'M'::text, 'L'::text, 'XL'::text])),
  price_multiplier numeric NOT NULL DEFAULT 1.0,
  price_override numeric,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_sizes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text NOT NULL,
  rating numeric DEFAULT 4.5 CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  reviews_count integer DEFAULT 0 CHECK (reviews_count >= 0),
  show_in_kitchen boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'available'::character varying,
  last_updated timestamp without time zone DEFAULT now(),
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  track_stock boolean DEFAULT true,
  isbestselling boolean DEFAULT false,
  is_supply boolean NOT NULL DEFAULT false,
  sale_price numeric,
  tags ARRAY,
  sort_order integer DEFAULT 0,
  allergens ARRAY,
  detailed_description text,
  estimated_prep_time text,
  ribbon_text character varying,
  ribbon_color character varying DEFAULT '#ef4444'::character varying,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.qr_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL,
  qr_code_url text NOT NULL,
  menu_url text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT qr_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  reservation_date date NOT NULL,
  reservation_time time without time zone NOT NULL,
  number_of_people integer NOT NULL,
  table_preference text,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])),
  special_requests text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  preorder_items jsonb,
  payment_method text,
  payment_proof_url text,
  payment_notes text,
  table_id uuid,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  table_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  approved_at timestamp with time zone,
  approved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);
CREATE TABLE public.service_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_number integer NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['call_service'::text, 'request_payment'::text, 'assistance'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cafe_name text NOT NULL DEFAULT 'Tomm&Danny'::text,
  location text NOT NULL DEFAULT 'Birzen, Tanjungbalai'::text,
  phone_number text NOT NULL DEFAULT '+62 123 456 7890'::text,
  operating_hours jsonb NOT NULL DEFAULT '{"open": "06:00", "close": "22:00"}'::jsonb,
  system_config jsonb NOT NULL DEFAULT '{"auto_print": true, "notifications": true, "kitchen_auto_refresh": true, "order_timeout_alerts": true}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff_profiles (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'cashier'::text, 'kitchen'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_profiles_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.stock_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  change_type text NOT NULL CHECK (change_type = ANY (ARRAY['initial'::text, 'restock'::text, 'sale'::text, 'adjustment'::text, 'waste'::text, 'return'::text])),
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reason text,
  notes text,
  staff_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_history_pkey PRIMARY KEY (id),
  CONSTRAINT stock_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.table_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_number integer NOT NULL,
  reservation_date date NOT NULL,
  reservation_time time without time zone NOT NULL,
  duration_minutes integer DEFAULT 120,
  reservation_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT table_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT table_reservations_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  zone text NOT NULL DEFAULT 'Indoor'::text,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'maintenance'::text, 'reserved'::text])),
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  current_order_id uuid,
  CONSTRAINT tables_pkey PRIMARY KEY (id)
);
CREATE TABLE public.todays_celebration (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  coffee_name text NOT NULL,
  description text,
  image_url text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT todays_celebration_pkey PRIMARY KEY (id),
  CONSTRAINT todays_celebration_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.upsell_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trigger_product text NOT NULL,
  suggested_product text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT upsell_rules_pkey PRIMARY KEY (id)
);