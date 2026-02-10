-- ========================================
-- WORKSPACE DIAGNOSTIC QUERIES
-- ========================================
-- Run these queries in Supabase SQL Editor to diagnose why workspaces aren't loading
-- Copy and paste each section one at a time
-- ========================================

-- ========================================
-- STEP 1: CHECK WHAT DATA EXISTS
-- ========================================

-- 1. Check if ANY user_roles exist at all
SELECT COUNT(*) as total_user_roles FROM user_roles;
-- Expected: Should return a number > 0 if any data exists

-- 2. Check if ANY businesses exist
SELECT id, name, created_at FROM businesses ORDER BY created_at DESC;
-- Expected: Should show your workspaces if they were created

-- 3. Check what user_roles exist (bypassing RLS - shows all data)
SELECT 
  ur.id,
  ur.user_id,
  ur.business_id,
  b.name as business_name,
  r.name as role_name,
  ur.assigned_at
FROM user_roles ur
LEFT JOIN businesses b ON ur.business_id = b.id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY ur.assigned_at DESC;
-- Expected: Should show all user_roles in database
-- If this returns data but next query doesn't, RLS is blocking you

-- 4. Check your current auth user ID
SELECT auth.uid() as my_user_id;
-- Expected: Should show your UUID (e.g., '5b04e732-21d4-432a-bac4-2923a0c477fa')
-- If this returns NULL, you're not authenticated in SQL Editor context

-- 5. Check if YOUR user has any roles (respects RLS)
SELECT 
  ur.*,
  b.name as business_name,
  r.name as role_name
FROM user_roles ur
LEFT JOIN businesses b ON ur.business_id = b.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
-- Expected: Should show YOUR workspaces
-- If empty but query 3 showed data, RLS is blocking access

-- ========================================
-- STEP 2: VERIFY RLS POLICIES
-- ========================================

-- Check what policies exist on user_roles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;
-- Expected: Should show exactly 2 policies:
-- - "Users can view their own user roles" (SELECT)
-- - "Users can insert user roles" (INSERT)

-- ========================================
-- STEP 3: TEST RLS IN ACTION
-- ========================================

-- This should work and return your workspaces
-- If it returns empty, RLS is blocking you
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- This shows what auth.uid() returns and authentication status
-- If auth.uid() is NULL, authentication isn't working in RLS context
SELECT 
  auth.uid() as current_user_id,
  current_user as postgres_user,
  session_user;

-- ========================================
-- STEP 4: CHECK create_default_workspace FUNCTION
-- ========================================

-- Check if function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_default_workspace';
-- Expected: Should show function definition
-- If empty, function doesn't exist and needs to be created

-- ========================================
-- DIAGNOSIS RESULTS
-- ========================================
-- Based on the results above, determine which scenario applies:
--
-- SCENARIO A: No data exists
--   - Query 1 returns 0 or very few rows
--   - Query 3 shows no user_roles for your user_id
--   - Solution: Run fix-workspaces-scenario-a.sql
--
-- SCENARIO B: RLS blocking access
--   - Query 3 shows user_roles data
--   - Query 5 returns empty
--   - Query 4 shows NULL for auth.uid()
--   - Solution: Run fix-workspaces-scenario-b.sql
--
-- SCENARIO C: User ID mismatch
--   - Query 3 shows user_roles with different user_id than your auth.uid()
--   - Solution: Run fix-workspaces-scenario-c.sql
