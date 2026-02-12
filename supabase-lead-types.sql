-- ========================================
-- ArchaFlow: Lead Types & Unique Customer ID
-- ========================================
-- Run this in Supabase SQL Editor.
-- Adds user-defined lead types and unique customer identifier to leads.
-- ========================================

-- ===== LEAD_TYPES TABLE =====
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

-- RLS: Workspace members can view lead types
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

-- RLS: Admins/owners can manage lead types
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

-- ===== ADD COLUMNS TO LEADS =====
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unique_customer_identifier TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type_id UUID REFERENCES lead_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_lead_type_id ON leads(lead_type_id);

-- ===== SEED DEFAULT LEAD TYPES FOR EXISTING BUSINESSES =====
INSERT INTO lead_types (business_id, label, order_index)
SELECT b.id, lt.label, lt.ord
FROM businesses b
CROSS JOIN (
  VALUES
    ('Structural Engineering', 0),
    ('Interior Design', 1),
    ('3D', 2),
    ('Solar Permit', 3),
    ('Material List', 4),
    ('Drafting', 5)
) AS lt(label, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM lead_types ltp WHERE ltp.business_id = b.id
)
ON CONFLICT (business_id, label) DO NOTHING;

-- ===== UPDATE create_default_workspace TO SEED LEAD TYPES FOR NEW BUSINESSES =====
-- (Requires create_default_workspace to exist from supabase-auth-schema.sql or supabase-settings-positions.sql)
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

  -- Seed default team positions
  INSERT INTO business_positions (business_id, label, order_index) VALUES
    (new_business_id, 'Architect', 0),
    (new_business_id, 'Manager', 1),
    (new_business_id, 'Drafter', 2),
    (new_business_id, 'Sales Agent', 3),
    (new_business_id, 'Project Manager', 4),
    (new_business_id, 'Designer', 5)
  ON CONFLICT (business_id, label) DO NOTHING;

  -- Seed default lead types
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
