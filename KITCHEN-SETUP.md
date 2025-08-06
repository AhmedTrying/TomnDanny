# Kitchen User Setup

This document explains how to set up and access the kitchen display system for Tomm&Danny café.

## Problem Solved

The kitchen page was previously accessible without authentication, which was a security issue. Now it's properly protected and requires a kitchen user to log in.

## Changes Made

1. **Added Authentication Protection**: The kitchen page now requires login with a "kitchen" role
2. **Updated Role System**: Added "kitchen" as a supported role in the ProtectedRoute component
3. **Updated Login Redirects**: Login page now properly redirects kitchen users to the kitchen page
4. **Added Logout Functionality**: Kitchen page now has a sign-out button

## Setting Up Kitchen User

### Option 1: Using the API Script (Recommended)

1. Make sure your development server is running:
   ```bash
   npm run dev
   ```

2. Run the kitchen user creation script:
   ```bash
   node scripts/create-kitchen-user.js
   ```

3. You should see a success message confirming the user was created.

### Option 2: Manual Creation via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Fill in the details:
   - Email: `kitchen@tommdanny.com`
   - Password: `kitchen123`
   - User Metadata: 
     ```json
     {
       "full_name": "Kitchen Staff",
       "role": "kitchen"
     }
     ```

5. Run the SQL script in the SQL editor:
   ```sql
   -- Run the contents of scripts/add-kitchen-user.sql
   -- Make sure to replace the user_id with the actual ID from auth.users
   ```

## Login Credentials

- **Email**: `kitchen@tommdanny.com`
- **Password**: `kitchen123`
- **Role**: `kitchen`

## Accessing the Kitchen Page

1. Go to the login page: `http://localhost:3000/login`
2. Enter the kitchen credentials
3. You'll be automatically redirected to `/kitchen`
4. The kitchen display system will show all active orders that need preparation

## Features

- **Real-time Updates**: Orders appear automatically when placed
- **Order Management**: Mark orders as "preparing" or "ready"
- **Urgent Alerts**: Orders older than 15 minutes are highlighted
- **Secure Access**: Only users with "kitchen" role can access this page

## Troubleshooting

### "Access Denied" Error
- Make sure you're logged in with a user that has the "kitchen" role
- Check that the user metadata contains `"role": "kitchen"`

### No Orders Showing
- Ensure there are products with `show_in_kitchen: true` in the database
- Check that there are orders with status "pending" or "preparing"

### User Creation Fails
- Verify your Supabase environment variables are set correctly
- Check that the service role key has the necessary permissions
- Ensure the development server is running when using the API script 