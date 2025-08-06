-- This script fixes the storage permission errors by creating the correct
-- Row Level Security (RLS) policies for the 'images' bucket.

-- It first removes any potentially conflicting old policies to ensure a clean slate.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create new, correct policies below:

-- 1. Allow public, anonymous read access to files in the "images" bucket.
--    This allows your app to display the images.
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING ( bucket_id = 'images' );

-- 2. Allow anonymous uploads to the "images" bucket.
--    This is the key policy that will fix the "violates row-level security" error.
CREATE POLICY "Anon can upload images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK ( bucket_id = 'images' ); 