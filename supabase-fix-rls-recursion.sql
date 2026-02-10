-- ========================================
-- ArchaFlow: Fix Infinite Recursion in user_roles RLS Policies
-- ========================================
-- Run this in the Supabase SQL Editor.
--
-- Problem: Three RLS policies on user_roles reference user_roles in their
-- own USING clause, causing PostgreSQL error 42P17 (infinite recursion).
--
-- Fix: Use SECURITY DEFINER helper functions that bypass RLS to look up
-- the user's business memberships and admin status.
-- ========================================

-- ========================================
-- Step 1: Create SECURITY DEFINER helper functions
-- ========================================

-- Returns all business_ids that a user belongs to (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_business_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT business_id FROM user_roles WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Checks if a user is an Owner or Admin in a specific workspace (bypasses RLS)
CREATE OR REPLACE FUNCTION is_workspace_admin(uid UUID, bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = uid
    AND ur.business_id = bid
    AND r.name IN ('Owner', 'Admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================================
-- Step 2: Drop all recursive / duplicate policies on user_roles
-- ========================================

-- Drop the recursive SELECT policy added by teams schema
DROP POLICY IF EXISTS "Users can view roles of workspace members" ON user_roles;

-- Drop the original simple SELECT policy from auth schema (we'll replace it with one combined policy)
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;

-- Drop the recursive UPDATE policy
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;

-- Drop the recursive DELETE policy
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;

-- ========================================
-- Step 3: Recreate non-recursive policies using helper functions
-- ========================================

-- SELECT: Users can see their own roles + roles of everyone in the same workspace
CREATE POLICY "Users can view roles of workspace members"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    business_id IN (SELECT get_user_business_ids(auth.uid()))
  );

-- UPDATE: Only owners/admins can update roles in their workspace
CREATE POLICY "Admins can update user roles"
  ON user_roles FOR UPDATE
  USING (
    is_workspace_admin(auth.uid(), business_id)
  );

-- DELETE: Users can remove themselves, or owners/admins can remove others
CREATE POLICY "Admins can delete user roles"
  ON user_roles FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    is_workspace_admin(auth.uid(), business_id)
  );
