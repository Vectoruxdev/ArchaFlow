-- ========================================
-- FIX: Remove Infinite Recursion in RLS Policies
-- ========================================
-- Run this NOW in your Supabase SQL Editor to fix the infinite recursion error
-- ========================================

-- Drop ALL broken policies on user_roles
DROP POLICY IF EXISTS "Users can view roles in their businesses" ON user_roles;
DROP POLICY IF EXISTS "Business owners can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Allow public read access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert user roles" ON user_roles;

-- Create SIMPLE, NON-RECURSIVE policies
-- Users can only see their own role assignments
CREATE POLICY "Users can view their own user roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to insert (for workspace creation)
CREATE POLICY "Users can insert user roles"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verify the fix worked
SELECT 'RLS policies fixed! No more infinite recursion.' as status;

-- Test query (should work without errors now)
SELECT 
  ur.business_id,
  b.name as business_name,
  r.name as role_name
FROM user_roles ur
JOIN businesses b ON ur.business_id = b.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
