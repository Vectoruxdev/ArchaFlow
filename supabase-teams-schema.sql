-- ========================================
-- ArchaFlow Teams Schema
-- Team Management, Invitations, Profiles
-- ========================================
-- Run this AFTER supabase-auth-schema.sql
-- ========================================

-- ========================================
-- 1. Alter user_profiles: add first_name, last_name, phone
-- ========================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ========================================
-- 2. Alter workspace_invitations: add token, position, message
-- ========================================
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS token UUID DEFAULT uuid_generate_v4() UNIQUE;
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS message TEXT;

-- ========================================
-- 3. Alter user_roles: add position
-- ========================================
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS position TEXT;

-- ========================================
-- 4. RLS: Users can view profiles of workspace members
-- ========================================
DROP POLICY IF EXISTS "Users can view profiles of workspace members" ON user_profiles;
CREATE POLICY "Users can view profiles of workspace members"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur1
      JOIN user_roles ur2 ON ur1.business_id = ur2.business_id
      WHERE ur1.user_id = auth.uid() AND ur2.user_id = user_profiles.id
    )
  );

-- ========================================
-- 5. Helper functions for non-recursive RLS on user_roles
-- ========================================
-- These SECURITY DEFINER functions bypass RLS, preventing infinite recursion
-- when user_roles policies need to look up the user's own memberships.

CREATE OR REPLACE FUNCTION get_user_business_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT business_id FROM user_roles WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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
-- 5b. RLS: Workspace members can view each other's roles (non-recursive)
-- ========================================
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view roles of workspace members" ON user_roles;
CREATE POLICY "Users can view roles of workspace members"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    business_id IN (SELECT get_user_business_ids(auth.uid()))
  );

-- Allow owners/admins to update user_roles (non-recursive)
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
CREATE POLICY "Admins can update user roles"
  ON user_roles FOR UPDATE
  USING (
    is_workspace_admin(auth.uid(), business_id)
  );

-- Allow owners/admins to delete user_roles (non-recursive)
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
CREATE POLICY "Admins can delete user roles"
  ON user_roles FOR DELETE
  USING (
    -- user removing themselves
    user_id = auth.uid()
    OR
    -- admin/owner removing others
    is_workspace_admin(auth.uid(), business_id)
  );

-- ========================================
-- 6. RLS: Allow deleting invitations
-- ========================================
DROP POLICY IF EXISTS "Business members can delete invitations" ON workspace_invitations;
CREATE POLICY "Business members can delete invitations"
  ON workspace_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_invitations.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- ========================================
-- 7. Function: accept_workspace_invitation
-- ========================================
CREATE OR REPLACE FUNCTION accept_workspace_invitation(invitation_token UUID)
RETURNS JSONB AS $$
DECLARE
  inv RECORD;
  calling_user_id UUID;
  calling_user_email TEXT;
  new_user_role_id UUID;
BEGIN
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the user's email
  SELECT email INTO calling_user_email
  FROM auth.users WHERE id = calling_user_id;

  -- Find the invitation
  SELECT * INTO inv
  FROM workspace_invitations
  WHERE token = invitation_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Check status
  IF inv.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation has already been %', inv.status;
  END IF;

  -- Check expiry
  IF inv.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- Check email matches
  IF LOWER(inv.email) != LOWER(calling_user_email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  -- Check if user is already a member of this workspace
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = calling_user_id AND business_id = inv.business_id
  ) THEN
    -- Already a member, just mark invitation as accepted
    UPDATE workspace_invitations SET status = 'accepted' WHERE id = inv.id;
    RETURN jsonb_build_object('status', 'already_member', 'business_id', inv.business_id);
  END IF;

  -- Create user_roles entry
  INSERT INTO user_roles (user_id, role_id, business_id, position)
  VALUES (calling_user_id, inv.role_id, inv.business_id, inv.position)
  RETURNING id INTO new_user_role_id;

  -- Update invitation status
  UPDATE workspace_invitations SET status = 'accepted' WHERE id = inv.id;

  -- Upsert user profile
  INSERT INTO user_profiles (id)
  VALUES (calling_user_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object(
    'status', 'accepted',
    'business_id', inv.business_id,
    'user_role_id', new_user_role_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. Index for invitation token lookups
-- ========================================
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_business_status ON workspace_invitations(business_id, status);
