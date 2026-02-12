# ✅ Supabase Authentication Setup Guide

This guide will walk you through setting up complete authentication for ArchaFlow using Supabase Auth.

## Prerequisites

- Supabase project created (https://yhxfkizxrqrqrmnphkny.supabase.co)
- Environment variables configured in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://yhxfkizxrqrqrmnphkny.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

## Step 1: Enable Email Authentication in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/yhxfkizxrqrqrmnphkny
2. Navigate to **Authentication** → **Providers**
3. Make sure **Email** is enabled
4. Configure the following settings:
   - **Confirm email**: Disabled (for development, enable for production)
   - **Secure email change**: Enabled
   - **Enable email signups**: Enabled

## Step 2: Configure Authentication URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set the following URLs:
   - **Site URL**: `http://localhost:3000` (development)
   - **Redirect URLs**: Add these:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/reset-password`

## Step 3: Run Database Schema

Run the authentication schema SQL in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Copy and paste the contents of `supabase-auth-schema.sql`
4. Click **Run** to execute

This will create:
- `user_profiles` table - stores user profile information
- `workspace_invitations` table - manages workspace invitations
- Updated RLS (Row-Level Security) policies for proper multi-tenancy
- `create_default_workspace()` function - automatically creates workspace on signup

## Step 4: Verify Installation

Dependencies have been installed:
- ✅ `@supabase/ssr` - Server-side rendering support
- ✅ `@supabase/supabase-js` - Supabase client

## What Was Implemented

### 🔐 Authentication System

#### Auth Pages (in `app/(auth)/`)
- **Login** (`/login`) - Email/password authentication
- **Signup** (`/signup`) - Create account with workspace
- **Forgot Password** (`/forgot-password`) - Request password reset
- **Reset Password** (`/reset-password`) - Set new password

#### Auth Components
- **AuthProvider** (`lib/auth/auth-context.tsx`) - Global auth state management
- **CreateWorkspaceDialog** - Modal for creating new workspaces
- **Route Protection** (`middleware.ts`) - Session refresh middleware

#### Supabase Clients
- **Browser Client** (`lib/supabase/client.ts`) - For client components
- **Server Client** (`lib/supabase/server.ts`) - For server components/actions
- **Middleware Client** (`lib/supabase/middleware.ts`) - For session refresh

### 🏢 Workspace Management

- Users can belong to multiple workspaces
- Workspace selector in sidebar
- Create new workspaces with custom name and icon
- Switch between workspaces (data isolation)
- Role-based access (Owner, Admin, Editor, Viewer)

### 🔒 Security Features

- **Row-Level Security (RLS)** - All tables protected
- **Multi-tenancy** - Users only see their workspace data
- **Password Requirements** - Minimum 8 characters
- **Session Management** - Automatic refresh via middleware
- **Protected Routes** - Auth required for workflow and other pages

## User Flows

### Sign Up Flow

1. User visits `/signup`
2. Enters: email, password, name, optional workspace name
3. Supabase creates user in `auth.users`
4. `create_default_workspace()` function:
   - Creates business record
   - Creates 4 default roles (Owner, Admin, Editor, Viewer)
   - Assigns user as Owner
   - Creates user profile
5. User redirected to `/workflow`
6. AuthProvider loads user's workspaces

### Login Flow

1. User visits `/login`
2. Enters email and password
3. Supabase validates credentials
4. AuthProvider loads user's workspaces
5. Sets current workspace (last used or first available)
6. User redirected to `/workflow`

### Workspace Switching

1. User clicks workspace dropdown in sidebar
2. Sees all workspaces they're a member of
3. Selects different workspace
4. CurrentWorkspace updates in context
5. Saved to localStorage
6. Page reloads with new workspace data

### Password Reset

1. User clicks "Forgot password?" on login
2. Enters email address
3. Supabase sends reset email
4. User clicks link in email
5. Redirected to `/reset-password`
6. Enters new password
7. Redirected to `/login`

## Testing the Authentication

### Test Sign Up

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Should redirect to `/login`
4. Click "Sign up"
5. Fill in the form:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Workspace Name: "John's Architecture" (optional)
   - Password: "password123"
   - Confirm Password: "password123"
   - Accept terms
6. Click "Create account"
7. Should redirect to `/workflow`
8. Check Supabase dashboard:
   - **Authentication** → **Users**: New user should appear
   - **Table Editor** → **businesses**: New workspace created
   - **Table Editor** → **user_profiles**: Profile created
   - **Table Editor** → **user_roles**: User assigned as Owner

### Test Login

1. Visit `/login`
2. Enter credentials from signup
3. Click "Sign in"
4. Should redirect to `/workflow`
5. Workspace selector should show your workspace

### Test Logout

1. In the sidebar, click the "Logout" button
2. Should redirect to `/login`
3. Session cleared

### Test Workspace Creation

1. Login to Workflow
2. Click workspace dropdown in sidebar
3. Click "Create Workspace"
4. Enter:
   - Name: "Second Workspace"
   - Choose an icon
5. Click "Create Workspace"
6. New workspace should appear in dropdown
7. Check Supabase:
   - New business record created
   - 4 default roles created
   - User assigned as Owner

### Test Protected Routes

1. Logout (if logged in)
2. Try to visit `/workflow` directly
3. Middleware refreshes session (finds none)
4. AuthProvider redirects to `/login`
5. Try `/settings`, `/projects`, etc. - all should redirect to login

## Architecture

### Authentication Flow

```
User Request
    ↓
Middleware (middleware.ts)
    ↓ (refreshes session)
AuthProvider (auth-context.tsx)
    ↓ (manages state)
Workflow/Pages
    ↓
Protected Content
```

### Data Access Flow

```
User Action
    ↓
Component
    ↓
useAuth() Hook
    ↓
AuthContext
    ↓
Supabase Client
    ↓
Supabase (RLS checks)
    ↓
Database
```

## Important Notes

### Environment Variables

Make sure your `.env.local` file is configured correctly:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yhxfkizxrqrqrmnphkny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloeGZraXp4cnFycXJtbnBoa255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjY4NzMsImV4cCI6MjA4NTgwMjg3M30.23Sbjp3BPP-cA0nQbcNQp18HnEt7hQiCY676-C9L-hg
```

### Development vs Production

**Development:**
- Email confirmation disabled
- Password reset redirects to localhost
- Insecure cookies (http)

**Production:**
- Enable email confirmation
- Set production URLs in Supabase
- Enable secure cookies
- Configure proper SMTP for emails

### RLS Policies

All tables have Row-Level Security enabled. Users can only:
- See businesses they're members of
- Access data in their workspaces
- Manage content based on their role

### Sessions

- Sessions last 1 hour by default
- Refresh tokens last 7 days
- Middleware automatically refreshes sessions
- Logout clears all session data

## Troubleshooting

### "Invalid or expired reset link"

- Check that redirect URLs are configured in Supabase
- Make sure you're using the link immediately
- Links expire after 1 hour

### "Failed to create account"

- Check Supabase logs (Dashboard → Logs)
- Verify `create_default_workspace()` function exists
- Check RLS policies are not too restrictive

### "Cannot access workspace data"

- Verify user has role assigned in `user_roles`
- Check `currentWorkspace` is set in AuthContext
- Inspect RLS policies in Supabase

### "Redirect loop on login"

- Clear browser cookies
- Check middleware configuration
- Verify AuthProvider is wrapping app correctly

## Next Steps

### Recommended Enhancements

1. **Email Templates** - Customize Supabase auth emails
2. **Email Verification** - Enable for production
3. **Social Auth** - Add Google/GitHub login
4. **2FA** - Implement two-factor authentication
5. **Workspace Invitations** - Send email invites to join workspace
6. **User Management** - Add/remove team members
7. **Role Management** - Custom roles per workspace
8. **Audit Logs** - Track user actions
9. **Session Management** - View active sessions, remote logout

### Production Checklist

- [ ] Enable email confirmation
- [ ] Configure production URLs
- [ ] Set up custom SMTP
- [ ] Enable RLS on all tables
- [ ] Test RLS policies thoroughly
- [ ] Set password requirements
- [ ] Enable rate limiting
- [ ] Configure CORS
- [ ] Set up monitoring
- [ ] Implement error tracking
- [ ] Create backup strategy

## Support

For issues:
1. Check Supabase logs
2. Review browser console
3. Verify environment variables
4. Test SQL queries directly

---

✅ **Authentication is now fully set up!** Users can sign up, log in, create workspaces, and access protected routes.
