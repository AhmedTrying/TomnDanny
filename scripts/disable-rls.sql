-- This script will disable Row Level Security (RLS) on all tables.
-- This is useful for local development but is NOT recommended for production,
-- as it will make your database tables publicly accessible.

ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS for the storage table to allow file uploads
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; 