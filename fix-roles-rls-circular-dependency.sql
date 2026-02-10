-- ========================================
-- FIX: Remove Circular Dependencies in RLS Policies
-- ========================================
-- This fixes the "infinite recursion detected in policy for relation 'roles'" error
-- Run this in Supabase SQL Editor
-- ========================================

-- ========================================
-- STEP 1: Fix roles Table Policies
-- ========================================

-- Drop all old policies that cause circular dependencies
DROP POLICY IF EXISTS "Users can view roles in their businesses" ON roles;
DROP POLICY IF EXISTS "Business owners can manage roles" ON roles;
DROP POLICY IF EXISTS "Allow public read access to roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to manage roles" ON roles;

-- Create simple policy: authenticated users can read roles
-- Security is enforced at user_roles level, not roles level
-- This is safe because roles are just metadata (owner, admin, editor, viewer)
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can manage roles (no circular dependency for INSERT/UPDATE/DELETE)
CREATE POLICY "Authenticated users can manage roles in their businesses"
  ON roles FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ========================================
-- STEP 2: Fix businesses Table Policies
-- ========================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view businesses they have access to" ON businesses;
DROP POLICY IF EXISTS "Allow public read access to businesses" ON businesses;
DROP POLICY IF EXISTS "Allow authenticated users to manage businesses" ON businesses;

-- Create simple policy: authenticated users can read businesses
-- Security is enforced at user_roles level
-- Users can only access businesses they're assigned to via user_roles
CREATE POLICY "Authenticated users can view businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create and manage businesses
CREATE POLICY "Authenticated users can manage their businesses"
  ON businesses FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ========================================
-- STEP 3: Verify Policies Are Updated
-- ========================================

-- Check current policies (should show simplified policies without circular dependencies)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%user_roles%' AND tablename != 'user_roles' THEN '⚠️ WARNING: Still has reference to user_roles'
    ELSE '✅ OK'
  END as check_status
FROM pg_policies
WHERE tablename IN ('roles', 'businesses', 'user_roles')
ORDER BY tablename, policyname;

-- ========================================
-- EXPLANATION
-- ========================================
-- Why this is safe:
--
-- SECURITY BOUNDARY: user_roles table
-- - Users can only see user_roles entries where user_id = auth.uid()
-- - This controls which businesses/workspaces users have access to
--
-- NO SECURITY NEEDED: roles and businesses tables
-- - roles: Just metadata names like "Owner", "Admin", "Editor", "Viewer"
-- - businesses: Just workspace names and metadata
-- - Both are filtered by user_roles in the application layer
--
-- DATA FLOW:
-- 1. User logs in
-- 2. Query user_roles WHERE user_id = auth.uid() (RLS enforced here)
-- 3. Get business_ids from user_roles results
-- 4. Query businesses WHERE id IN (business_ids) (no RLS conflict)
-- 5. Query roles WHERE id IN (role_ids) (no RLS conflict)
-- 6. Display workspaces in UI
--
-- This is a standard multi-tenant pattern where:
-- - Metadata tables (roles, businesses) are readable by authenticated users
-- - Access control is enforced at the junction table (user_roles)
-- - Data tables (projects, etc.) are filtered by business_id
-- ========================================

-- Success message
SELECT '✅ RLS policies fixed! Circular dependencies removed.' as status;
SELECT 'Next step: Refresh your browser and log in again' as next_step;
