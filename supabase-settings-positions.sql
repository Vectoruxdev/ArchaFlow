-- ========================================
-- ArchaFlow Settings: Business Positions (Team Positions CRUD)
-- ========================================
-- Run this in your Supabase SQL Editor
-- Persists Team Positions from Settings → Team Positions
-- ========================================

-- ===== BUSINESS_POSITIONS TABLE =====
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

-- RLS: Workspace members can view positions
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

-- RLS: Admins/owners can manage positions (USING used for WITH CHECK when omitted)
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

-- Seed default positions for existing businesses that have none
INSERT INTO business_positions (business_id, label, order_index)
SELECT b.id, pos.label, pos.ord
FROM businesses b
CROSS JOIN (
  VALUES
    ('Architect', 0),
    ('Manager', 1),
    ('Drafter', 2),
    ('Sales Agent', 3),
    ('Project Manager', 4),
    ('Designer', 5)
) AS pos(label, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM business_positions bp WHERE bp.business_id = b.id
)
ON CONFLICT (business_id, label) DO NOTHING;

-- Update create_default_workspace to seed positions for new businesses
-- (Requires create_default_workspace to exist from supabase-auth-schema.sql)
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

  RETURN new_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
