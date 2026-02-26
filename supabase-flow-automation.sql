-- Flow Automation Schema
-- Adds flow_rules, flow_run_log, and flow_recipe_templates tables
-- for the Kanban Flow Automation system.

-- ============================================================
-- 1. flow_rules — User-defined automation rules per board
-- ============================================================
CREATE TABLE IF NOT EXISTS flow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'partial', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. flow_run_log — Execution history for each rule run
-- ============================================================
CREATE TABLE IF NOT EXISTS flow_run_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES flow_rules(id) ON DELETE CASCADE,
  board_id UUID NOT NULL,
  card_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  triggered_by UUID REFERENCES auth.users(id),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  actions_total INTEGER,
  actions_succeeded INTEGER,
  actions_failed INTEGER,
  action_results JSONB,
  error_message TEXT,
  duration_ms INTEGER
);

-- ============================================================
-- 3. flow_recipe_templates — Global pre-built automation recipes
-- ============================================================
CREATE TABLE IF NOT EXISTS flow_recipe_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  preview_summary TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_flow_rules_board ON flow_rules(board_id);
CREATE INDEX IF NOT EXISTS idx_flow_rules_active ON flow_rules(board_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_flow_run_log_rule ON flow_run_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_flow_run_log_card ON flow_run_log(card_id);

-- ============================================================
-- 5. Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_flow_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_flow_rules_updated_at ON flow_rules;
CREATE TRIGGER update_flow_rules_updated_at
  BEFORE UPDATE ON flow_rules
  FOR EACH ROW EXECUTE FUNCTION update_flow_rules_updated_at();

-- ============================================================
-- 6. RLS Policies
-- ============================================================
ALTER TABLE flow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_run_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_recipe_templates ENABLE ROW LEVEL SECURITY;

-- flow_rules: users can read/write rules for boards (workspaces) they belong to
DROP POLICY IF EXISTS "Users can view flow rules in their workspace" ON flow_rules;
CREATE POLICY "Users can view flow rules in their workspace"
  ON flow_rules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.business_id = flow_rules.workspace_id
      AND user_roles.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can manage flow rules in their workspace" ON flow_rules;
CREATE POLICY "Users can manage flow rules in their workspace"
  ON flow_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.business_id = flow_rules.workspace_id
      AND user_roles.user_id = auth.uid()
  ));

-- flow_run_log: users can view logs for rules in their workspace
DROP POLICY IF EXISTS "Users can view flow run logs in their workspace" ON flow_run_log;
CREATE POLICY "Users can view flow run logs in their workspace"
  ON flow_run_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM flow_rules
    JOIN user_roles ON user_roles.business_id = flow_rules.workspace_id
    WHERE flow_rules.id = flow_run_log.rule_id
      AND user_roles.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "System can insert flow run logs" ON flow_run_log;
CREATE POLICY "System can insert flow run logs"
  ON flow_run_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM flow_rules
    JOIN user_roles ON user_roles.business_id = flow_rules.workspace_id
    WHERE flow_rules.id = flow_run_log.rule_id
      AND user_roles.user_id = auth.uid()
  ));

-- flow_recipe_templates: readable by all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view recipe templates" ON flow_recipe_templates;
CREATE POLICY "Authenticated users can view recipe templates"
  ON flow_recipe_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);
