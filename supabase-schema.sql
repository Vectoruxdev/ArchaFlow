-- ========================================
-- ArchaFlow Database Schema
-- STEP 1 of 3: Core Foundation
-- ========================================
-- Run this FIRST in your Supabase SQL Editor
-- Then run: supabase-auth-schema.sql
-- Then run: supabase-projects-schema.sql
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses table (multi-tenancy)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN DEFAULT false,
  visibility_flags JSONB DEFAULT '{}',
  UNIQUE(role_id, feature_type, action)
);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, business_id)
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ⚠️ DEVELOPMENT POLICIES BELOW ⚠️
-- These policies allow broad access to avoid circular dependencies during initial setup
-- They are REPLACED by secure policies when you run supabase-auth-schema.sql
-- DO NOT use these policies in production!

-- RLS Policies for businesses
CREATE POLICY "Allow public read access to businesses"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage businesses"
  ON businesses FOR ALL
  USING (true);

-- RLS Policies for roles
CREATE POLICY "Allow public read access to roles"
  ON roles FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage roles"
  ON roles FOR ALL
  USING (true);

-- RLS Policies for permissions
CREATE POLICY "Allow public read access to permissions"
  ON permissions FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage permissions"
  ON permissions FOR ALL
  USING (true);

-- RLS Policies for user_roles
-- Note: These are temporary policies for initial setup
-- They will be replaced by secure policies in supabase-auth-schema.sql
CREATE POLICY "Allow public read access to user_roles"
  ON user_roles FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage user_roles"
  ON user_roles FOR ALL
  USING (true);

-- Insert sample business
INSERT INTO businesses (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Sample Business');

-- Insert system roles
INSERT INTO roles (business_id, name, is_custom) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Owner', false),
  ('00000000-0000-0000-0000-000000000001', 'Admin', false),
  ('00000000-0000-0000-0000-000000000001', 'Editor', false),
  ('00000000-0000-0000-0000-000000000001', 'Viewer', false);
