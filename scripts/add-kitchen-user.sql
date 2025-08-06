-- Add kitchen user to Tomm&Danny café system
-- This script should be run in the Supabase SQL editor

-- Create staff profile for kitchen user
-- Note: You'll need to create the auth user manually in Supabase Auth UI first
-- Email: kitchen@tommdanny.com
-- Password: kitchen123
-- Role: kitchen

INSERT INTO staff_profiles (
  id,
  user_id,
  full_name,
  role,
  email,
  is_active,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004', -- Replace with actual user ID from auth.users
    'Kitchen Staff',
    'kitchen',
    'kitchen@tommdanny.com',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Verify the kitchen user was created
SELECT 
  name,
  email,
  role,
  active,
  created_at
FROM public.staff_profiles
WHERE email = 'kitchen@tommdanny.com'; 