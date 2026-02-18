-- ================================================================
-- ArchaFlow: COMPLETE DEV DATABASE MIGRATION
-- ================================================================
-- Run this ENTIRE file in the Supabase SQL Editor for archaflow-dev
-- This combines all migration files in the correct dependency order.
-- ================================================================


-- ================================================================
-- SECTION 1: CORE SCHEMA (Foundation)
-- Source: supabase-setup-complete.sql
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses (Multi-tenant Workspaces)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles (Business-scoped)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Permissions (Role-based access control)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN DEFAULT false,
  visibility_flags JSONB DEFAULT '{}',
  UNIQUE(role_id, feature_type, action)
);

-- User Roles (User-Business-Role relationship)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, business_id)
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- SECTION 2: AUTHENTICATION & USER MANAGEMENT
-- ================================================================

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Invitations
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

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- SECTION 3: PROJECTS & RELATED DATA
-- ================================================================

-- Project Statuses (Dynamic Kanban Columns)
CREATE TABLE IF NOT EXISTS project_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  color_key TEXT NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, label)
);

-- Projects
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

-- Project Assignments (Team Members)
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Project Time Entries
CREATE TABLE IF NOT EXISTS project_time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  notes TEXT,
  date DATE NOT NULL,
  billable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Tasks (Hierarchical Todos)
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

-- Task Notes
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Notes (Comments)
CREATE TABLE IF NOT EXISTS project_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Files
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

-- Project Invoices
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

ALTER TABLE project_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- SECTION 4: INDEXES
-- ================================================================

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


-- ================================================================
-- SECTION 5: FUNCTIONS & TRIGGERS
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ================================================================
-- SECTION 6: RLS POLICIES (Core tables)
-- ================================================================

-- User Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses
DROP POLICY IF EXISTS "Authenticated users can view businesses" ON businesses;
CREATE POLICY "Authenticated users can view businesses"
  ON businesses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage their businesses" ON businesses;
CREATE POLICY "Authenticated users can manage their businesses"
  ON businesses FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Roles
DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage roles in their businesses" ON roles;
CREATE POLICY "Authenticated users can manage roles in their businesses"
  ON roles FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Permissions
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

-- User Roles (initial - will be replaced by teams section below)
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;
CREATE POLICY "Users can view their own user roles"
  ON user_roles FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert user roles" ON user_roles;
CREATE POLICY "Users can insert user roles"
  ON user_roles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Workspace Invitations
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
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

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

-- Project Statuses
DROP POLICY IF EXISTS "Users can view project statuses in their businesses" ON project_statuses;
CREATE POLICY "Users can view project statuses in their businesses"
  ON project_statuses FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = project_statuses.business_id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage project statuses" ON project_statuses;
CREATE POLICY "Business members can manage project statuses"
  ON project_statuses FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = project_statuses.business_id AND user_roles.user_id = auth.uid()));

-- Projects
DROP POLICY IF EXISTS "Users can view projects in their businesses" ON projects;
CREATE POLICY "Users can view projects in their businesses"
  ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = projects.business_id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage projects" ON projects;
CREATE POLICY "Business members can manage projects"
  ON projects FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = projects.business_id AND user_roles.user_id = auth.uid()));

-- Project Assignments
DROP POLICY IF EXISTS "Users can view project assignments in their businesses" ON project_assignments;
CREATE POLICY "Users can view project assignments in their businesses"
  ON project_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_assignments.project_id = projects.id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage project assignments" ON project_assignments;
CREATE POLICY "Business members can manage project assignments"
  ON project_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_assignments.project_id = projects.id AND user_roles.user_id = auth.uid()));

-- Project Time Entries
DROP POLICY IF EXISTS "Users can view time entries in their businesses" ON project_time_entries;
CREATE POLICY "Users can view time entries in their businesses"
  ON project_time_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_time_entries.project_id = projects.id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage time entries" ON project_time_entries;
CREATE POLICY "Business members can manage time entries"
  ON project_time_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_time_entries.project_id = projects.id AND user_roles.user_id = auth.uid()));

-- Project Tasks
DROP POLICY IF EXISTS "Users can view tasks in their businesses" ON project_tasks;
CREATE POLICY "Users can view tasks in their businesses"
  ON project_tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_tasks.project_id = projects.id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage tasks" ON project_tasks;
CREATE POLICY "Business members can manage tasks"
  ON project_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_tasks.project_id = projects.id AND user_roles.user_id = auth.uid()));

-- Task Notes
DROP POLICY IF EXISTS "Users can view task notes in their businesses" ON task_notes;
CREATE POLICY "Users can view task notes in their businesses"
  ON task_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_tasks JOIN projects ON project_tasks.project_id = projects.id JOIN user_roles ON projects.business_id = user_roles.business_id WHERE task_notes.task_id = project_tasks.id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage task notes" ON task_notes;
CREATE POLICY "Business members can manage task notes"
  ON task_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM project_tasks JOIN projects ON project_tasks.project_id = projects.id JOIN user_roles ON projects.business_id = user_roles.business_id WHERE task_notes.task_id = project_tasks.id AND user_roles.user_id = auth.uid()));

-- Project Notes
DROP POLICY IF EXISTS "Users can view project notes in their businesses" ON project_notes;
CREATE POLICY "Users can view project notes in their businesses"
  ON project_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_notes.project_id = projects.id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage project notes" ON project_notes;
CREATE POLICY "Business members can manage project notes"
  ON project_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_notes.project_id = projects.id AND user_roles.user_id = auth.uid()));

-- Project Files
DROP POLICY IF EXISTS "Users can view project files in their businesses" ON project_files;
CREATE POLICY "Users can view project files in their businesses"
  ON project_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_files.project_id = projects.id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage project files" ON project_files;
CREATE POLICY "Business members can manage project files"
  ON project_files FOR ALL
  USING (EXISTS (SELECT 1 FROM projects JOIN user_roles ON projects.business_id = user_roles.business_id WHERE project_files.project_id = projects.id AND user_roles.user_id = auth.uid()));

-- Project Invoices
DROP POLICY IF EXISTS "Users can view project invoices in their businesses" ON project_invoices;
CREATE POLICY "Users can view project invoices in their businesses"
  ON project_invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = project_invoices.business_id AND user_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Business members can manage project invoices" ON project_invoices;
CREATE POLICY "Business members can manage project invoices"
  ON project_invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = project_invoices.business_id AND user_roles.user_id = auth.uid()));


-- ================================================================
-- SECTION 7: TEAMS SCHEMA
-- Source: supabase-teams-schema.sql
-- ================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS token UUID DEFAULT uuid_generate_v4() UNIQUE;
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS position TEXT;

-- RLS: Users can view profiles of workspace members
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

-- SECURITY DEFINER helper functions (non-recursive RLS)
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

-- Replace user_roles policies with non-recursive versions
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view roles of workspace members" ON user_roles;
CREATE POLICY "Users can view roles of workspace members"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    business_id IN (SELECT get_user_business_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
CREATE POLICY "Admins can update user roles"
  ON user_roles FOR UPDATE
  USING (is_workspace_admin(auth.uid(), business_id));

DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
CREATE POLICY "Admins can delete user roles"
  ON user_roles FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    is_workspace_admin(auth.uid(), business_id)
  );

-- Allow deleting invitations
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

-- Function: accept_workspace_invitation
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

  SELECT email INTO calling_user_email
  FROM auth.users WHERE id = calling_user_id;

  SELECT * INTO inv
  FROM workspace_invitations
  WHERE token = invitation_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF inv.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation has already been %', inv.status;
  END IF;

  IF inv.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF LOWER(inv.email) != LOWER(calling_user_email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = calling_user_id AND business_id = inv.business_id
  ) THEN
    UPDATE workspace_invitations SET status = 'accepted' WHERE id = inv.id;
    RETURN jsonb_build_object('status', 'already_member', 'business_id', inv.business_id);
  END IF;

  INSERT INTO user_roles (user_id, role_id, business_id, position)
  VALUES (calling_user_id, inv.role_id, inv.business_id, inv.position)
  RETURNING id INTO new_user_role_id;

  UPDATE workspace_invitations SET status = 'accepted' WHERE id = inv.id;

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

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_business_status ON workspace_invitations(business_id, status);


-- ================================================================
-- SECTION 8: CLIENTS SCHEMA
-- Source: supabase-clients-schema.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  description TEXT,
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_business_email
  ON clients(business_id, email) WHERE email IS NOT NULL AND email != '';

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_archived_at ON clients(archived_at);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on client_contacts" ON client_contacts FOR ALL USING (true);

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Client permissions
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'clients', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS action(name)
WHERE r.name IN ('Owner', 'Admin')
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'clients', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit')) AS action(name)
WHERE r.name = 'Editor'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'clients', 'view', true
FROM roles r
WHERE r.name = 'Viewer'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;


-- ================================================================
-- SECTION 9: LEADS SCHEMA
-- Source: supabase-leads-schema.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  job_title TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  source TEXT DEFAULT 'other'
    CHECK (source IN ('website_form', 'email_campaign', 'social_media', 'referral', 'cold_call', 'ad', 'trade_show', 'other')),
  interest TEXT,
  pain_points TEXT,
  budget NUMERIC(12,2),
  square_footage NUMERIC(12,2),
  cost_per_sqft NUMERIC(12,2),
  discount_type TEXT CHECK (discount_type IS NULL OR discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(12,2),
  temperature TEXT DEFAULT 'cold'
    CHECK (temperature IN ('cold', 'warm', 'hot')),
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  next_action TEXT,
  next_action_date DATE,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ DEFAULT NULL,
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'status_change')),
  subject TEXT,
  description TEXT,
  call_duration INTEGER,
  call_outcome TEXT
    CHECK (call_outcome IS NULL OR call_outcome IN ('connected', 'voicemail', 'no_answer', 'busy')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON leads(archived_at);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_converted_at ON leads(converted_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all operations on lead_activities" ON lead_activities FOR ALL USING (true);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Lead permissions
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'leads', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS action(name)
WHERE r.name IN ('Owner', 'Admin')
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'leads', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit')) AS action(name)
WHERE r.name = 'Editor'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'leads', 'view', true
FROM roles r
WHERE r.name = 'Viewer'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;


-- ================================================================
-- SECTION 10: BUSINESS POSITIONS
-- Source: supabase-settings-positions.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS business_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, label)
);

CREATE INDEX IF NOT EXISTS idx_business_positions_business_id ON business_positions(business_id);

ALTER TABLE business_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view positions in their businesses" ON business_positions;
CREATE POLICY "Users can view positions in their businesses"
  ON business_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = business_positions.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage positions in their businesses" ON business_positions;
CREATE POLICY "Admins can manage positions in their businesses"
  ON business_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.business_id = business_positions.business_id
      AND ur.user_id = auth.uid()
      AND r.name IN ('Owner', 'Admin')
    )
  );


-- ================================================================
-- SECTION 11: LEAD TYPES
-- Source: supabase-lead-types.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS lead_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, label)
);

CREATE INDEX IF NOT EXISTS idx_lead_types_business_id ON lead_types(business_id);

ALTER TABLE lead_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lead types in their businesses" ON lead_types;
CREATE POLICY "Users can view lead types in their businesses"
  ON lead_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = lead_types.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage lead types in their businesses" ON lead_types;
CREATE POLICY "Admins can manage lead types in their businesses"
  ON lead_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.business_id = lead_types.business_id
      AND ur.user_id = auth.uid()
      AND r.name IN ('Owner', 'Admin')
    )
  );

ALTER TABLE leads ADD COLUMN IF NOT EXISTS unique_customer_identifier TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type_id UUID REFERENCES lead_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_lead_type_id ON leads(lead_type_id);

-- Final version of create_default_workspace (includes positions + lead types)
CREATE OR REPLACE FUNCTION create_default_workspace(user_id UUID, workspace_name TEXT, user_full_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_business_id UUID;
  owner_role_id UUID;
BEGIN
  INSERT INTO businesses (name)
  VALUES (workspace_name)
  RETURNING id INTO new_business_id;

  INSERT INTO roles (business_id, name, is_custom) VALUES
    (new_business_id, 'Owner', false),
    (new_business_id, 'Admin', false),
    (new_business_id, 'Editor', false),
    (new_business_id, 'Viewer', false);

  SELECT id INTO owner_role_id FROM roles
  WHERE business_id = new_business_id AND name = 'Owner';

  INSERT INTO user_roles (user_id, role_id, business_id)
  VALUES (user_id, owner_role_id, new_business_id);

  INSERT INTO user_profiles (id, full_name)
  VALUES (user_id, user_full_name)
  ON CONFLICT (id) DO UPDATE SET full_name = user_full_name;

  INSERT INTO project_statuses (business_id, label, order_index, color_key) VALUES
    (new_business_id, 'Lead', 0, 'lead'),
    (new_business_id, 'Sale', 1, 'sale'),
    (new_business_id, 'Design', 2, 'design'),
    (new_business_id, 'Completed', 3, 'completed');

  INSERT INTO business_positions (business_id, label, order_index) VALUES
    (new_business_id, 'Architect', 0),
    (new_business_id, 'Manager', 1),
    (new_business_id, 'Drafter', 2),
    (new_business_id, 'Sales Agent', 3),
    (new_business_id, 'Project Manager', 4),
    (new_business_id, 'Designer', 5)
  ON CONFLICT (business_id, label) DO NOTHING;

  INSERT INTO lead_types (business_id, label, order_index) VALUES
    (new_business_id, 'Structural Engineering', 0),
    (new_business_id, 'Interior Design', 1),
    (new_business_id, '3D', 2),
    (new_business_id, 'Solar Permit', 3),
    (new_business_id, 'Material List', 4),
    (new_business_id, 'Drafting', 5)
  ON CONFLICT (business_id, label) DO NOTHING;

  RETURN new_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ================================================================
-- SECTION 12: WORKSPACE ACTIVITIES
-- Source: supabase-workspace-activities.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS workspace_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN (
      'project_moved',
      'lead_converted',
      'member_invited',
      'member_joined',
      'project_created',
      'client_created'
    )),
  entity_type TEXT,
  entity_id UUID,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_activities_business_id ON workspace_activities(business_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activities_created_at ON workspace_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_activities_entity ON workspace_activities(entity_type, entity_id);

ALTER TABLE workspace_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view activities"
  ON workspace_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_activities.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can insert activities"
  ON workspace_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_activities.business_id
      AND user_roles.user_id = auth.uid()
    )
  );


-- ================================================================
-- SECTION 13: INTEGRATIONS (Slack & Discord)
-- Source: supabase-integrations-schema.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('slack', 'discord')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  bot_token TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_metadata JSONB DEFAULT '{}',
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integration_connections_business ON integration_connections(business_id);

CREATE TABLE IF NOT EXISTS integration_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_type TEXT,
  is_selected BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_ts TEXT,
  UNIQUE (connection_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_channels_connection ON integration_channels(connection_id);

CREATE TABLE IF NOT EXISTS message_scan_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'fetching', 'extracting', 'ready', 'imported', 'failed')),
  channel_ids TEXT[] DEFAULT '{}',
  raw_messages JSONB DEFAULT '[]',
  extracted_tasks JSONB DEFAULT '[]',
  imported_task_ids UUID[] DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_scan_sessions_business ON message_scan_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_message_scan_sessions_connection ON message_scan_sessions(connection_id);

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_scan_sessions ENABLE ROW LEVEL SECURITY;

-- integration_connections RLS
CREATE POLICY "Workspace members can view connections"
  ON integration_connections FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = integration_connections.business_id AND user_roles.user_id = auth.uid()));

CREATE POLICY "Workspace members can insert connections"
  ON integration_connections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = integration_connections.business_id AND user_roles.user_id = auth.uid()));

CREATE POLICY "Workspace members can update connections"
  ON integration_connections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = integration_connections.business_id AND user_roles.user_id = auth.uid()));

CREATE POLICY "Workspace members can delete connections"
  ON integration_connections FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = integration_connections.business_id AND user_roles.user_id = auth.uid()));

-- integration_channels RLS
CREATE POLICY "Workspace members can view channels"
  ON integration_channels FOR SELECT
  USING (EXISTS (SELECT 1 FROM integration_connections ic JOIN user_roles ur ON ur.business_id = ic.business_id WHERE ic.id = integration_channels.connection_id AND ur.user_id = auth.uid()));

CREATE POLICY "Workspace members can insert channels"
  ON integration_channels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM integration_connections ic JOIN user_roles ur ON ur.business_id = ic.business_id WHERE ic.id = integration_channels.connection_id AND ur.user_id = auth.uid()));

CREATE POLICY "Workspace members can update channels"
  ON integration_channels FOR UPDATE
  USING (EXISTS (SELECT 1 FROM integration_connections ic JOIN user_roles ur ON ur.business_id = ic.business_id WHERE ic.id = integration_channels.connection_id AND ur.user_id = auth.uid()));

CREATE POLICY "Workspace members can delete channels"
  ON integration_channels FOR DELETE
  USING (EXISTS (SELECT 1 FROM integration_connections ic JOIN user_roles ur ON ur.business_id = ic.business_id WHERE ic.id = integration_channels.connection_id AND ur.user_id = auth.uid()));

-- message_scan_sessions RLS
CREATE POLICY "Workspace members can view scan sessions"
  ON message_scan_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = message_scan_sessions.business_id AND user_roles.user_id = auth.uid()));

CREATE POLICY "Workspace members can insert scan sessions"
  ON message_scan_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = message_scan_sessions.business_id AND user_roles.user_id = auth.uid()));

CREATE POLICY "Workspace members can update scan sessions"
  ON message_scan_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.business_id = message_scan_sessions.business_id AND user_roles.user_id = auth.uid()));

-- Update workspace_activities constraint to include integration types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_activities') THEN
    EXECUTE 'ALTER TABLE workspace_activities DROP CONSTRAINT IF EXISTS workspace_activities_activity_type_check';
    EXECUTE 'ALTER TABLE workspace_activities ADD CONSTRAINT workspace_activities_activity_type_check
      CHECK (activity_type IN (
        ''project_moved'',
        ''lead_converted'',
        ''member_invited'',
        ''member_joined'',
        ''project_created'',
        ''client_created'',
        ''integration_connected'',
        ''tasks_imported''
      ))';
  END IF;
END $$;


-- ================================================================
-- SECTION 14: AVATARS STORAGE
-- Source: supabase-avatars-bucket.sql
-- ================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ================================================================
-- SECTION 15: JOIN REQUESTS
-- Source: supabase-join-requests-schema.sql
-- ================================================================

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS allowed_email_domains JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS auto_add_by_domain BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS workspace_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_business_id ON workspace_join_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON workspace_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON workspace_join_requests(status);

ALTER TABLE workspace_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view join requests"
  ON workspace_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_join_requests.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own join requests"
  ON workspace_join_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create join requests"
  ON workspace_join_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workspace members can update join requests"
  ON workspace_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      JOIN roles ON user_roles.role_id = roles.id
      WHERE user_roles.business_id = workspace_join_requests.business_id
      AND user_roles.user_id = auth.uid()
      AND roles.name IN ('Owner', 'Admin')
    )
  );

-- Update workspace_activities constraint to include join request types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_activities') THEN
    EXECUTE 'ALTER TABLE workspace_activities DROP CONSTRAINT IF EXISTS workspace_activities_activity_type_check';
    EXECUTE 'ALTER TABLE workspace_activities ADD CONSTRAINT workspace_activities_activity_type_check CHECK (activity_type IN (
      ''project_moved'',
      ''lead_converted'',
      ''member_invited'',
      ''member_joined'',
      ''project_created'',
      ''client_created'',
      ''integration_connected'',
      ''tasks_imported'',
      ''member_join_request'',
      ''member_join_request_accepted''
    ))';
  END IF;
END $$;


-- ================================================================
-- SECTION 16: PROJECT PATCHES
-- Source: supabase-add-archive-field.sql
--         supabase-add-project-owners.sql
--         supabase-projects-add-lead-fields.sql
-- ================================================================

-- Archive field
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_archived_at ON projects(archived_at);

-- Project owners
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS primary_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS secondary_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_primary_owner_id ON projects(primary_owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_secondary_owner_id ON projects(secondary_owner_id);

-- Lead conversion fields on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interest TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pain_points TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_min NUMERIC(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS temperature TEXT
  CHECK (temperature IS NULL OR temperature IN ('cold', 'warm', 'hot'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_score INTEGER
  CHECK (lead_score IS NULL OR (lead_score >= 0 AND lead_score <= 100));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_action_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id);


-- ================================================================
-- SECTION 17: DASHBOARD PERMISSIONS
-- Source: supabase-dashboard-permissions.sql
-- ================================================================

INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'dashboard', 'read', true
FROM roles r
WHERE r.name IN ('Owner', 'Admin', 'Editor', 'Viewer')
ON CONFLICT (role_id, feature_type, action) DO UPDATE SET allowed = true;


-- ================================================================
-- SECTION 18: USER NOTIFICATION PREFERENCES
-- Source: supabase-user-notification-preferences.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  team_activity BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON user_notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON user_notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON user_notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ================================================================
-- DONE
-- ================================================================
SELECT 'ArchaFlow dev database migration complete!' as message;
