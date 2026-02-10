-- ========================================
-- FIX FOR SCENARIO B: RLS Policy Blocking Access
-- ========================================
-- Use this script if diagnostic queries showed:
-- - Query 3 (without RLS) shows user_roles data exists
-- - Query 5 (with RLS) returns empty
-- - Query 4 shows NULL for auth.uid()
-- This means RLS policies are blocking access
-- ========================================

-- ========================================
-- FIX 1: Drop and Recreate RLS Policies
-- ========================================

-- Drop ALL old/broken policies on user_roles
DROP POLICY IF EXISTS "Users can view roles in their businesses" ON user_roles;
DROP POLICY IF EXISTS "Business owners can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Allow public read access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own user roles" ON user_roles;

-- Create correct, simple policies
CREATE POLICY "Users can view their own user roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert user roles"
  ON user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ========================================
-- VERIFY POLICIES WERE CREATED
-- ========================================

SELECT 
  policyname, 
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Expected output: 2 policies
-- 1. "Users can view their own user roles" (SELECT)
-- 2. "Users can insert user roles" (INSERT)

-- ========================================
-- TEST IF POLICIES WORK NOW
-- ========================================

-- This should now return your workspaces
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- If still empty, check auth.uid()
SELECT 
  auth.uid() as my_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED - You need to log in'
    ELSE '✅ AUTHENTICATED'
  END as auth_status;

-- ========================================
-- FIX 2: If auth.uid() is NULL (Alternative)
-- ========================================
-- If the above still doesn't work and auth.uid() returns NULL,
-- you may need to check businesses and roles policies too

-- Check policies on businesses table
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'businesses';

-- Check policies on roles table  
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'roles';

-- Ensure these tables have appropriate policies
-- They should allow users to read businesses/roles they have access to via user_roles

-- ========================================
-- FIX 3: Temporarily Disable RLS (DEBUG ONLY)
-- ========================================
-- CAUTION: Only use this temporarily to test if RLS is the issue
-- DO NOT leave RLS disabled in production!

-- Disable RLS temporarily
-- ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Test query in your app - does it work now?

-- Re-enable immediately after testing:
-- ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- NEXT STEPS
-- ========================================
-- 1. Go back to your browser
-- 2. Log out completely
-- 3. Clear browser cache/cookies
-- 4. Log back in
-- 5. Check if workspaces now load
-- 6. Check browser console for any RLS errors
