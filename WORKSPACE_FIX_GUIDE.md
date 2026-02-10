# Workspace Loading Fix Guide

## What Was Implemented

Your application now has:

1. **Enhanced Diagnostic Logging**: Detailed error messages when workspaces don't load
2. **Automatic Workspace Creation**: If no workspaces exist, the app will try to create one automatically
3. **Diagnostic SQL Scripts**: Ready-to-run queries to identify the problem
4. **Fix Scripts for Each Scenario**: SQL scripts to fix the most common issues

## Current Status

Your dev server is running at **http://localhost:3001**

The "No Workspaces Found" issue you're seeing means the `user_roles` table has no data for your user account.

## Step-by-Step Fix Process

### Step 1: Run Diagnostic Queries

1. **Open Supabase Dashboard**: Go to your project at supabase.com
2. **Navigate to SQL Editor**: Click "SQL Editor" in the left sidebar
3. **Open the diagnostic file**: `diagnose-workspaces.sql`
4. **Run each query section one at a time** (copy/paste into Supabase SQL Editor)

### Step 2: Identify Your Scenario

Based on the diagnostic results, you'll have one of three scenarios:

#### **Scenario A: No Data Exists** (Most Likely)
**Symptoms:**
- Query 1 returns 0 or very few rows
- Query 3 shows no user_roles for your user_id
- You see "My Workspace" in the sidebar but it's not actually in the database

**Fix:** Run `fix-workspaces-scenario-a.sql` in Supabase SQL Editor

This will create 4 workspaces with proper roles and project statuses.

#### **Scenario B: RLS Policy Blocking Access**
**Symptoms:**
- Query 3 (without RLS) shows user_roles data exists
- Query 5 (with RLS) returns empty
- Query 4 shows NULL for auth.uid()

**Fix:** Run `fix-workspaces-scenario-b.sql` in Supabase SQL Editor

This will fix the Row Level Security policies.

#### **Scenario C: User ID Mismatch**
**Symptoms:**
- Query 3 shows user_roles with a different user_id than your current auth.uid()
- You created workspaces with one account, logged in with another

**Fix:** Run `fix-workspaces-scenario-c.sql` in Supabase SQL Editor

This will update the user_id to match your current account.

### Step 3: Verify the Fix

After running the appropriate fix script:

1. **In Supabase SQL Editor**, run:
   ```sql
   SELECT 
     b.name as workspace_name,
     r.name as your_role,
     ur.assigned_at
   FROM user_roles ur
   JOIN businesses b ON ur.business_id = b.id
   JOIN roles r ON ur.role_id = r.id
   WHERE ur.user_id = auth.uid();
   ```

2. **Expected Result**: Should show 4 workspaces

### Step 4: Test in Your Application

1. **Go to**: http://localhost:3001/login
2. **Hard refresh**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. **Open Browser Console**: Press `F12` → Console tab
4. **Log out** if already logged in
5. **Clear browser data**:
   - Clear localStorage (F12 → Application → Local Storage → Clear)
   - Clear cookies
6. **Log back in**

### Step 5: Check Console Logs

You should now see detailed diagnostic information:

**If workspaces load successfully:**
```
🔄 Loading workspaces for user: [your-id]
⏳ Querying user_roles...
✅ User roles query result: { data: [...], error: null }
Business IDs: [...]
Parsed workspaces: [...]
✅ Setting current workspace: {...}
✅ Workspaces loaded successfully
```

**If no workspaces found:**
```
🚨 DIAGNOSTIC: No user roles found
User ID: [your-id]
This means either:
1. No data exists in user_roles for this user
2. RLS policy is blocking access
3. auth.uid() in Supabase doesn't match this user_id
⚠️ No user roles found for user, attempting to create default workspace...
```

If you see the second message, the app will automatically try to create a workspace using the `create_default_workspace` function.

## Automatic Workspace Creation

The app now includes a fallback mechanism:

- If no workspaces are found, it will automatically call `create_default_workspace`
- This creates a new workspace named "My Workspace" with you as the owner
- If successful, it will reload and your workspace should appear
- If it fails, you'll need to manually create workspaces using the SQL scripts

## Files Created

1. **diagnose-workspaces.sql**: Diagnostic queries to identify the problem
2. **fix-workspaces-scenario-a.sql**: Fix for missing data (creates 4 workspaces)
3. **fix-workspaces-scenario-b.sql**: Fix for RLS policy issues
4. **fix-workspaces-scenario-c.sql**: Fix for user ID mismatches

## Common Issues

### Issue: auth.uid() returns NULL in SQL Editor

**Solution**: You need to be authenticated in the Supabase SQL Editor context. The queries that use `auth.uid()` only work when run from your application's context, not the SQL Editor's service role context.

**Workaround**: Replace `auth.uid()` in the scripts with your actual user UUID.

### Issue: create_default_workspace function doesn't exist

**Solution**: Run the `supabase-auth-schema.sql` script to create the function.

### Issue: Workspaces still not showing after running fixes

**Checklist:**
1. Did you run the fix script in Supabase SQL Editor?
2. Did the script complete successfully (check for errors)?
3. Did you verify the data exists (run the verification query)?
4. Did you clear browser cache and cookies?
5. Did you log out and log back in?
6. Did you hard refresh the page?

## Support

If workspaces still aren't loading after following all steps:

1. Check the browser console for the detailed diagnostic messages
2. Run the diagnostic queries again in Supabase
3. Check if `create_default_workspace` function exists
4. Verify your `.env.local` file has correct Supabase credentials
5. Check Supabase logs for any errors

## Next Steps After Fix

Once workspaces are loading:

1. You should see 4 workspaces in the sidebar dropdown
2. You can switch between them
3. You can create projects in each workspace
4. The kanban board should load correctly
5. You can create additional workspaces using the "+ Create Workspace" button

## Data Architecture Reference

**User Data (Individual)**:
- `user_profiles`: Your name, avatar, etc.

**Workspace Data (Business/Tenant)**:
- `businesses`: The workspace containers
- `roles`: Permissions within each workspace
- `projects`: Project data scoped to a workspace
- `project_statuses`: Kanban board columns per workspace

**Combined Data (Links)**:
- `user_roles`: Links you to workspaces with specific roles
- A user can belong to multiple workspaces
- A workspace can have multiple users
