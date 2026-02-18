-- ========================================
-- ArchaFlow Workspace Join Requests
-- Allows users to request to join existing workspaces
-- Supports email domain matching and auto-add
-- ========================================
-- Run this AFTER supabase-auth-schema.sql
-- ========================================

-- Add email domain columns to businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS allowed_email_domains JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS auto_add_by_domain BOOLEAN DEFAULT false;

-- Workspace Join Requests Table
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

-- Enable RLS
ALTER TABLE workspace_join_requests ENABLE ROW LEVEL SECURITY;

-- Workspace members (Owner/Admin) can view join requests for their workspace
CREATE POLICY "Workspace members can view join requests"
  ON workspace_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = workspace_join_requests.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- Users can view their own join requests
CREATE POLICY "Users can view their own join requests"
  ON workspace_join_requests FOR SELECT
  USING (user_id = auth.uid());

-- Authenticated users can create join requests for themselves
CREATE POLICY "Users can create join requests"
  ON workspace_join_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Workspace members can update join requests (accept/decline)
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

-- Update workspace_activities CHECK constraint to include join request types
-- NOTE: Run supabase-workspace-activities.sql first if this table doesn't exist yet.
-- Then run this block to update the constraint:
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
      ''member_join_request'',
      ''member_join_request_accepted''
    ))';
  END IF;
END $$;
