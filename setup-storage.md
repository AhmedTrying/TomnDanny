# Supabase Storage Setup Guide

To enable image uploads in the admin panel, you need to set up a storage bucket in your Supabase project.

## Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Create Storage Bucket**
   - Go to Storage in the left sidebar
   - Click "Create a new bucket"
   - Name: `images`
   - Make it public (check "Public bucket")
   - Click "Create bucket"

3. **Set Storage Policies**
   - Click on the `images` bucket
   - Go to "Policies" tab
   - Add the following policies:

### Policy 1: Allow public read access
```sql
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
```

### Policy 2: Allow authenticated uploads
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
```

### Policy 3: Allow authenticated updates
```sql
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

### Policy 4: Allow authenticated deletes
```sql
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

4. **Test the Setup**
   - Go to your admin panel
   - Try uploading an image for a product or category
   - The image should upload successfully and display

## Note:
If you're not using authentication in your app, you might need to adjust the policies to allow anonymous uploads. In that case, replace `auth.role() = 'authenticated'` with `true` in the policies above. 