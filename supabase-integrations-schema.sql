-- ========================================
-- ArchaFlow Integration Tables
-- Slack & Discord OAuth connections, channel caching, and message scan sessions
-- ========================================

-- 1. Integration Connections (OAuth tokens per workspace)
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

-- 2. Integration Channels (cached channel lists)
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

-- 3. Message Scan Sessions (scan state + results)
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

-- Enable RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_scan_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Workspace members can read/write (matches workspace_activities pattern)

-- integration_connections
CREATE POLICY "Workspace members can view connections"
  ON integration_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = integration_connections.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can insert connections"
  ON integration_connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = integration_connections.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update connections"
  ON integration_connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = integration_connections.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete connections"
  ON integration_connections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = integration_connections.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- integration_channels (via connection's business_id)
CREATE POLICY "Workspace members can view channels"
  ON integration_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM integration_connections ic
      JOIN user_roles ur ON ur.business_id = ic.business_id
      WHERE ic.id = integration_channels.connection_id
      AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can insert channels"
  ON integration_channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM integration_connections ic
      JOIN user_roles ur ON ur.business_id = ic.business_id
      WHERE ic.id = integration_channels.connection_id
      AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update channels"
  ON integration_channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM integration_connections ic
      JOIN user_roles ur ON ur.business_id = ic.business_id
      WHERE ic.id = integration_channels.connection_id
      AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete channels"
  ON integration_channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM integration_connections ic
      JOIN user_roles ur ON ur.business_id = ic.business_id
      WHERE ic.id = integration_channels.connection_id
      AND ur.user_id = auth.uid()
    )
  );

-- message_scan_sessions
CREATE POLICY "Workspace members can view scan sessions"
  ON message_scan_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = message_scan_sessions.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can insert scan sessions"
  ON message_scan_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = message_scan_sessions.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update scan sessions"
  ON message_scan_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = message_scan_sessions.business_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- Update workspace_activities CHECK constraint to include new activity types
-- (only runs if the table exists — safe to skip if workspace_activities hasn't been created yet)
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
