# Authentication Setup Guide

This guide will help you set up proper authentication for the Tomm&Danny café management system.

## Prerequisites

1. A Supabase project with the database schema already set up
2. Access to your Supabase dashboard

## Step 1: Enable Email Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Make sure **Email** is enabled
4. Configure email templates if needed (optional)

## Step 2: Create Users via Supabase Auth UI

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click **"Add user"** to create each user manually:

### Admin User
- **Email**: admin@tommdanny.com
- **Password**: admin123
- **User Metadata**: 
  ```json
  {
    "name": "Administrator",
    "role": "admin"
  }
  ```

### Cashier User
- **Email**: cashier@tommdanny.com
- **Password**: cashier123
- **User Metadata**:
  ```json
  {
    "name": "Cashier User", 
    "role": "cashier"
  }
  ```

### Manager User
- **Email**: manager@tommdanny.com
- **Password**: manager123
- **User Metadata**:
  ```json
  {
    "name": "Manager User",
    "role": "admin"
  }
  ```

## Step 3: Create Staff Profiles

After creating the users in Supabase Auth, run this SQL in the **SQL Editor**:

```sql
-- Get the user IDs from auth.users
SELECT id, email FROM auth.users WHERE email IN (
  'admin@tommdanny.com',
  'cashier@tommdanny.com', 
  'manager@tommdanny.com'
);

-- Create staff profiles (replace the user IDs with actual IDs from the query above)
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
    'REPLACE_WITH_ADMIN_USER_ID', -- Replace with actual user ID
    'Administrator',
    'admin',
    'admin@tommdanny.com',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'REPLACE_WITH_CASHIER_USER_ID', -- Replace with actual user ID
    'Cashier User',
    'cashier',
    'cashier@tommdanny.com',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'REPLACE_WITH_MANAGER_USER_ID', -- Replace with actual user ID
    'Manager User',
    'admin',
    'manager@tommdanny.com',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;
```

## Step 4: Configure Environment Variables

Make sure your `.env.local` file has the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 5: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Try logging in with the credentials you created
4. You should be redirected to the appropriate dashboard based on your role

## Troubleshooting

### Common Issues:

1. **"Invalid login credentials"**: Make sure the user exists in Supabase Auth and the password is correct
2. **"User not found"**: Ensure the staff profile was created with the correct user_id
3. **Role-based access issues**: Check that the user metadata contains the correct role

### Manual User Creation (Alternative)

If you prefer to create users programmatically, you can use the Supabase Auth API:

```javascript
// Example: Create user via API
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@tommdanny.com',
  password: 'admin123',
  user_metadata: {
    name: 'Administrator',
    role: 'admin'
  }
})
```

## Security Notes

- Change default passwords after first login
- Consider implementing password policies
- Enable MFA for admin accounts if needed
- Regularly review user access and permissions

## Features

### Authentication Context
- Manages user state across the application
- Provides login/logout functionality
- Handles role-based access control

### Protected Routes
- Admin pages require `admin` role
- Cashier pages require `cashier` role
- Unauthorized users are redirected to login

### User Management
- Users are stored in both `auth.users` and `staff_profiles`
- Role information is stored in user metadata
- Active/inactive status tracking

## Security Notes

1. **Password Security**: In production, use stronger passwords and consider implementing password policies
2. **Email Verification**: Consider enabling email verification for new users
3. **Session Management**: Sessions are managed by Supabase Auth
4. **Role-Based Access**: The system enforces role-based access at the frontend level

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Check if the user exists in Supabase Auth
   - Verify the password is correct
   - Make sure the user is active

2. **"Access denied" errors**
   - Check if the user has the correct role
   - Verify RLS policies are set up correctly
   - Check the user's `active` status in `staff_profiles`

3. **Redirect loops**
   - Check the `ProtectedRoute` component logic
   - Verify user role metadata is set correctly

### Debugging

1. Check browser console for errors
2. Use Supabase dashboard to inspect user data
3. Check network requests in browser dev tools
4. Verify environment variables are loaded correctly

## Production Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Password Policies**: Implement strong password requirements
3. **Rate Limiting**: Consider implementing rate limiting for login attempts
4. **Audit Logging**: Log authentication events for security monitoring
5. **Backup**: Regularly backup your Supabase data 