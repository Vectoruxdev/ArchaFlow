-- ========================================
-- ArchaFlow Clients Schema
-- Client Management Tables & Relations
-- ========================================
-- Run this AFTER the projects schema has been applied.
-- ========================================

-- Clients Table (scoped per workspace/business)
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

-- Unique email per workspace (only when email is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_business_email
  ON clients(business_id, email) WHERE email IS NOT NULL AND email != '';

-- Client Contacts (sub-clients: spouse, GM, project manager, etc.)
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

-- Add client_id foreign key to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_archived_at ON clients(archived_at);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Development RLS policies (allow all for authenticated users)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on client_contacts" ON client_contacts FOR ALL USING (true);

-- Trigger for updated_at on clients
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Default permissions for client management
-- ========================================
-- These insert permissions for all existing roles.
-- feature_type = 'clients', actions = view, create, edit, delete

-- Owner & Admin: full access
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'clients', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS action(name)
WHERE r.name IN ('Owner', 'Admin')
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

-- Editor: view, create, edit (no delete)
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'clients', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit')) AS action(name)
WHERE r.name = 'Editor'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

-- Viewer: view only
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'clients', 'view', true
FROM roles r
WHERE r.name = 'Viewer'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;
