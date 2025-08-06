-- Setup initial users for Tomm&Danny café system
-- This script should be run in the Supabase SQL editor

-- First, enable the auth schema if not already enabled
-- Note: This is typically done automatically by Supabase

-- Create a function to create users with roles
CREATE OR REPLACE FUNCTION create_staff_user(
  email TEXT,
  password TEXT,
  full_name TEXT,
  role TEXT
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Create the user in auth.users with proper UUID
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    email,
    crypt(password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object(
      'name', full_name,
      'role', role
    )
  ) RETURNING id INTO user_id;

  -- Create the corresponding staff profile
  INSERT INTO staff_profiles (
    id,
    user_id,
    full_name,
    role,
    email,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    full_name,
    role,
    email,
    true,
    NOW(),
    NOW()
  );

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Create initial users
-- Note: You'll need to manually create these users through the Supabase Auth UI
-- or use the Supabase Auth API, as direct insertion into auth.users is restricted

-- For now, let's create the staff profiles for existing users
-- You can create the auth users manually in the Supabase Dashboard

-- Create staff profiles (run this after creating users in Supabase Auth UI)
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
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID from auth.users
    'Administrator',
    'admin',
    'admin@tommdanny.com',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002', -- Replace with actual user ID from auth.users
    'Cashier User',
    'cashier',
    'cashier@tommdanny.com',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003', -- Replace with actual user ID from auth.users
    'Manager User',
    'manager',
    'manager@tommdanny.com',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Clean up the function
DROP FUNCTION IF EXISTS create_staff_user(TEXT, TEXT, TEXT, TEXT);

-- Verify the users were created
SELECT 
  u.email,
  u.raw_user_meta_data->>'name' as name,
  u.raw_user_meta_data->>'role' as role,
  u.created_at
FROM auth.users u
WHERE u.email IN (
  'admin@tommdanny.com',
  'cashier@tommdanny.com',
  'manager@tommdanny.com'
);

-- Verify staff profiles
SELECT 
  name,
  email,
  role,
  active,
  created_at
FROM public.staff_profiles
WHERE email IN (
  'admin@tommdanny.com',
  'cashier@tommdanny.com',
  'manager@tommdanny.com'
); 