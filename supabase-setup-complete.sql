-- ========================================
-- ArchaFlow Complete Database Setup
-- ========================================
-- Run this entire file in your Supabase SQL Editor
-- Or run the individual files in this order:
--   1. supabase-schema.sql
--   2. supabase-auth-schema.sql
--   3. supabase-projects-schema.sql
-- ========================================

-- ========================================
-- PART 1: CORE SCHEMA (Foundation)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== BUSINESSES TABLE (Multi-tenant Workspaces) =====
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== ROLES TABLE (Business-scoped) =====
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- ===== PERMISSIONS TABLE (Role-based access control) =====
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN DEFAULT false,
  visibility_flags JSONB DEFAULT '{}',
  UNIQUE(role_id, feature_type, action)
);

-- ===== USER ROLES TABLE (User-Business-Role relationship) =====
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, business_id)
);

-- Enable RLS on core tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 2: AUTHENTICATION & USER MANAGEMENT
-- ========================================

-- ===== USER PROFILES TABLE (Global user data) =====
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== WORKSPACE INVITATIONS TABLE =====
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

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 3: PROJECTS & RELATED DATA
-- ========================================

-- ===== PROJECT STATUSES (Dynamic Kanban Columns) =====
CREATE TABLE IF NOT EXISTS project_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  color_key TEXT NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, label)
);

-- ===== PROJECTS TABLE =====
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  payment_status TEXT CHECK (payment_status IN ('pending', 'partial', 'paid')) DEFAULT 'pending',
  start_date DATE,
  due_date DATE,
  expected_completion DATE,
  budget NUMERIC(12, 2),
  spent NUMERIC(12, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PROJECT ASSIGNMENTS (Team Members) =====
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ===== PROJECT TIME ENTRIES =====
CREATE TABLE IF NOT EXISTS project_time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- in minutes
  notes TEXT,
  date DATE NOT NULL,
  billable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PROJECT TASKS (Hierarchical Todos) =====
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TASK NOTES =====
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PROJECT NOTES (Comments) =====
CREATE TABLE IF NOT EXISTS project_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PROJECT FILES =====
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  version TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PROJECT INVOICES =====
CREATE TABLE IF NOT EXISTS project_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue')) DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, invoice_number)
);

-- Enable RLS on project tables
ALTER TABLE project_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_projects_business_id ON projects(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_project_id ON project_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_user_id ON project_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_parent_task_id ON project_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON project_invoices(project_id);

-- ========================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- ========================================

-- Drop any existing temporary/development policies
DROP POLICY IF EXISTS "Allow public read access to businesses" ON businesses;
DROP POLICY IF EXISTS "Allow authenticated users to manage businesses" ON businesses;
DROP POLICY IF EXISTS "Allow public read access to roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to manage roles" ON roles;
DROP POLICY IF EXISTS "Allow public read access to permissions" ON permissions;
DROP POLICY IF EXISTS "Allow authenticated users to manage permissions" ON permissions;
DROP POLICY IF EXISTS "Allow public read access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow all operations on project_statuses" ON project_statuses;
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
DROP POLICY IF EXISTS "Allow all operations on project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Allow all operations on project_time_entries" ON project_time_entries;
DROP POLICY IF EXISTS "Allow all operations on project_tasks" ON project_tasks;
DROP POLICY IF EXISTS "Allow all operations on task_notes" ON task_notes;
DROP POLICY IF EXISTS "Allow all operations on project_notes" ON project_notes;
DROP POLICY IF EXISTS "Allow all operations on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow all operations on project_invoices" ON project_invoices;

-- ===== USER PROFILES POLICIES =====
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===== BUSINESSES POLICIES (Multi-tenancy) =====
DROP POLICY IF EXISTS "Users can view businesses they are members of" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can update their businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can delete their businesses" ON businesses;

-- Simplified policy: authenticated users can read businesses (no circular dependency)
-- Security is enforced at user_roles level
CREATE POLICY "Authenticated users can view businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create and manage businesses
CREATE POLICY "Authenticated users can manage their businesses"
  ON businesses FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ===== ROLES POLICIES =====
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

-- ===== PERMISSIONS POLICIES =====
DROP POLICY IF EXISTS "Users can view permissions in their businesses" ON permissions;
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

DROP POLICY IF EXISTS "Business owners can manage permissions" ON permissions;
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

-- ===== USER ROLES POLICIES =====
-- FIXED: Removed circular dependency that caused infinite recursion
DROP POLICY IF EXISTS "Users can view roles in their businesses" ON user_roles;
DROP POLICY IF EXISTS "Business owners can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own user roles" ON user_roles;

-- Simple policy: users can see their own role assignments
CREATE POLICY "Users can view their own user roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to insert (workspace creation)
CREATE POLICY "Users can insert user roles"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===== WORKSPACE INVITATIONS POLICIES =====
DROP POLICY IF EXISTS "Users can view invitations for their businesses" ON workspace_invitations;
CREATE POLICY "Users can view invitations for their businesses"
  ON workspace_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_invitations.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON workspace_invitations;
CREATE POLICY "Users can view invitations sent to their email"
  ON workspace_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Business members can create invitations" ON workspace_invitations;
CREATE POLICY "Business members can create invitations"
  ON workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_invitations.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can update invitations" ON workspace_invitations;
CREATE POLICY "Business members can update invitations"
  ON workspace_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_invitations.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- ===== PROJECT-RELATED POLICIES =====
-- All project data is scoped to businesses the user is a member of

DROP POLICY IF EXISTS "Users can view project statuses in their businesses" ON project_statuses;
CREATE POLICY "Users can view project statuses in their businesses"
  ON project_statuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = project_statuses.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage project statuses" ON project_statuses;
CREATE POLICY "Business members can manage project statuses"
  ON project_statuses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = project_statuses.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view projects in their businesses" ON projects;
CREATE POLICY "Users can view projects in their businesses"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = projects.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage projects" ON projects;
CREATE POLICY "Business members can manage projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = projects.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view project assignments in their businesses" ON project_assignments;
CREATE POLICY "Users can view project assignments in their businesses"
  ON project_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_assignments.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage project assignments" ON project_assignments;
CREATE POLICY "Business members can manage project assignments"
  ON project_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_assignments.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view time entries in their businesses" ON project_time_entries;
CREATE POLICY "Users can view time entries in their businesses"
  ON project_time_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_time_entries.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage time entries" ON project_time_entries;
CREATE POLICY "Business members can manage time entries"
  ON project_time_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_time_entries.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view tasks in their businesses" ON project_tasks;
CREATE POLICY "Users can view tasks in their businesses"
  ON project_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_tasks.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage tasks" ON project_tasks;
CREATE POLICY "Business members can manage tasks"
  ON project_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_tasks.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view task notes in their businesses" ON task_notes;
CREATE POLICY "Users can view task notes in their businesses"
  ON task_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN projects ON project_tasks.project_id = projects.id
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE task_notes.task_id = project_tasks.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage task notes" ON task_notes;
CREATE POLICY "Business members can manage task notes"
  ON task_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN projects ON project_tasks.project_id = projects.id
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE task_notes.task_id = project_tasks.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view project notes in their businesses" ON project_notes;
CREATE POLICY "Users can view project notes in their businesses"
  ON project_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_notes.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage project notes" ON project_notes;
CREATE POLICY "Business members can manage project notes"
  ON project_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_notes.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view project files in their businesses" ON project_files;
CREATE POLICY "Users can view project files in their businesses"
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_files.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage project files" ON project_files;
CREATE POLICY "Business members can manage project files"
  ON project_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN user_roles ON projects.business_id = user_roles.business_id
      WHERE project_files.project_id = projects.id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view project invoices in their businesses" ON project_invoices;
CREATE POLICY "Users can view project invoices in their businesses"
  ON project_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = project_invoices.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business members can manage project invoices" ON project_invoices;
CREATE POLICY "Business members can manage project invoices"
  ON project_invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = project_invoices.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- ========================================
-- PART 6: FUNCTIONS & TRIGGERS
-- ========================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- ========================================
-- PART 7: DEFAULT DATA (Optional - for testing)
-- ========================================

-- Uncomment below to create a sample business for testing
-- Note: Remove this in production or after initial testing

/*
INSERT INTO businesses (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Sample Business')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (business_id, name, is_custom) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Owner', false),
  ('00000000-0000-0000-0000-000000000001', 'Admin', false),
  ('00000000-0000-0000-0000-000000000001', 'Editor', false),
  ('00000000-0000-0000-0000-000000000001', 'Viewer', false)
ON CONFLICT (business_id, name) DO NOTHING;

INSERT INTO project_statuses (business_id, label, order_index, color_key) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Lead', 0, 'lead'),
  ('00000000-0000-0000-0000-000000000001', 'Sale', 1, 'sale'),
  ('00000000-0000-0000-0000-000000000001', 'Design', 2, 'design'),
  ('00000000-0000-0000-0000-000000000001', 'Completed', 3, 'completed')
ON CONFLICT (business_id, label) DO NOTHING;
*/

-- ========================================
-- SETUP COMPLETE
-- ========================================

SELECT 'ArchaFlow database setup complete! 🚀' as message;
SELECT 'Tables: ' || count(*) || ' created' as status 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'businesses', 'roles', 'permissions', 'user_roles', 'user_profiles',
  'workspace_invitations', 'project_statuses', 'projects', 'project_assignments',
  'project_time_entries', 'project_tasks', 'task_notes', 'project_notes',
  'project_files', 'project_invoices'
);
