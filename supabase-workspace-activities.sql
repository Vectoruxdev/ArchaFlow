-- ========================================
-- ArchaFlow Workspace Activities
-- Activity log for recent activity feed (card moves, lead conversions, etc.)
-- Designed for future CRUD/permission filtering by role and position
-- ========================================

-- Workspace Activities Table
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

-- Enable RLS
ALTER TABLE workspace_activities ENABLE ROW LEVEL SECURITY;

-- Members of a workspace can view its activities
CREATE POLICY "Workspace members can view activities"
  ON workspace_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_activities.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- Members of a workspace can insert activities (server/client both use this)
CREATE POLICY "Workspace members can insert activities"
  ON workspace_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_activities.business_id
      AND user_roles.user_id = auth.uid()
    )
  );
