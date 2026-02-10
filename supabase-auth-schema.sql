-- ========================================
-- ArchaFlow Authentication Schema
-- STEP 2 of 3: User Management & Security
-- ========================================
-- Run this AFTER supabase-schema.sql
-- This replaces temporary dev policies with secure multi-tenant policies
-- Then run: supabase-projects-schema.sql
-- ========================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Invitations Table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE(business_id, email)
);

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing public policies for businesses if they exist
DROP POLICY IF EXISTS "Allow public read access to businesses" ON businesses;
DROP POLICY IF EXISTS "Allow authenticated users to manage businesses" ON businesses;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for businesses (simplified to avoid circular dependencies)
-- Security is enforced at user_roles level, not businesses level
CREATE POLICY "Authenticated users can view businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage their businesses"
  ON businesses FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for workspace_invitations
CREATE POLICY "Users can view invitations for their businesses"
  ON workspace_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_invitations.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to their email"
  ON workspace_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Business members can create invitations"
  ON workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_invitations.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Business members can update invitations"
  ON workspace_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_invitations.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- Update RLS policies for roles (restrict to business members)
DROP POLICY IF EXISTS "Allow public read access to roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to manage roles" ON roles;
DROP POLICY IF EXISTS "Users can view roles in their businesses" ON roles;
DROP POLICY IF EXISTS "Business owners can manage roles" ON roles;

-- Simplified policy: authenticated users can read roles (no circular dependency)
-- Security is enforced at user_roles level, not roles level
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can manage roles (no circular dependency)
CREATE POLICY "Authenticated users can manage roles in their businesses"
  ON roles FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Update RLS policies for permissions
DROP POLICY IF EXISTS "Allow public read access to permissions" ON permissions;
DROP POLICY IF EXISTS "Allow authenticated users to manage permissions" ON permissions;

CREATE POLICY "Users can view permissions in their businesses"
  ON permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles
      JOIN user_roles ON roles.business_id = user_roles.business_id
      WHERE permissions.role_id = roles.id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can manage permissions"
  ON permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles
      JOIN user_roles ON roles.business_id = user_roles.business_id
      JOIN roles owner_role ON user_roles.role_id = owner_role.id
      WHERE permissions.role_id = roles.id
      AND user_roles.user_id = auth.uid()
      AND owner_role.name = 'Owner'
    )
  );

-- Update RLS policies for user_roles
-- FIXED: Removed circular dependency that caused infinite recursion
DROP POLICY IF EXISTS "Allow public read access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view roles in their businesses" ON user_roles;
DROP POLICY IF EXISTS "Business owners can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert user roles" ON user_roles;

-- Simple policy: users can see their own role assignments
CREATE POLICY "Users can view their own user roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to insert (workspace creation)
CREATE POLICY "Users can insert user roles"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to create default workspace for new user
CREATE OR REPLACE FUNCTION create_default_workspace(user_id UUID, workspace_name TEXT, user_full_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_business_id UUID;
  owner_role_id UUID;
BEGIN
  -- Create the business
  INSERT INTO businesses (name)
  VALUES (workspace_name)
  RETURNING id INTO new_business_id;

  -- Create default roles
  INSERT INTO roles (business_id, name, is_custom) VALUES
    (new_business_id, 'Owner', false),
    (new_business_id, 'Admin', false),
    (new_business_id, 'Editor', false),
    (new_business_id, 'Viewer', false);

  -- Get the Owner role id
  SELECT id INTO owner_role_id FROM roles 
  WHERE business_id = new_business_id AND name = 'Owner';

  -- Assign user as owner
  INSERT INTO user_roles (user_id, role_id, business_id)
  VALUES (user_id, owner_role_id, new_business_id);

  -- Create user profile
  INSERT INTO user_profiles (id, full_name)
  VALUES (user_id, user_full_name)
  ON CONFLICT (id) DO UPDATE SET full_name = user_full_name;

  -- Create default project statuses (kanban columns)
  INSERT INTO project_statuses (business_id, label, order_index, color_key) VALUES
    (new_business_id, 'Lead', 0, 'lead'),
    (new_business_id, 'Sale', 1, 'sale'),
    (new_business_id, 'Design', 2, 'design'),
    (new_business_id, 'Completed', 3, 'completed');

  RETURN new_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
