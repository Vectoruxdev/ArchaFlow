-- =============================================
-- Contracts Feature Schema
-- Tables: contract_templates, contracts
-- =============================================

-- ============ CONTRACT TEMPLATES ============

CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('rich_text', 'pdf')) DEFAULT 'rich_text',
  content JSONB DEFAULT '{}',
  pdf_url TEXT,
  variables JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_contract_templates_business ON contract_templates(business_id);
CREATE INDEX idx_contract_templates_created_by ON contract_templates(created_by);

-- RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their workspace"
  ON contract_templates FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates in their workspace"
  ON contract_templates FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates in their workspace"
  ON contract_templates FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates in their workspace"
  ON contract_templates FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );


-- ============ CONTRACTS ============

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rich_text', 'pdf')) DEFAULT 'rich_text',
  content JSONB DEFAULT '{}',
  pdf_url TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired')) DEFAULT 'draft',
  signing_token UUID DEFAULT uuid_generate_v4() UNIQUE,
  token_expires_at TIMESTAMPTZ,
  variable_values JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  signer_name TEXT,
  signer_email TEXT,
  signer_ip TEXT,
  signature_data TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contracts_business ON contracts(business_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_template ON contracts(template_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_signing_token ON contracts(signing_token);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts in their workspace"
  ON contracts FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contracts in their workspace"
  ON contracts FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contracts in their workspace"
  ON contracts FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contracts in their workspace"
  ON contracts FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM user_roles WHERE user_id = auth.uid()
    )
  );


-- ============ ACTIVITY TYPE UPDATE ============
-- Add contract activity types to the workspace_activities check constraint.
-- Run this if the check constraint is strict. If the column has no check, skip.
-- ALTER TABLE workspace_activities DROP CONSTRAINT IF EXISTS workspace_activities_activity_type_check;
-- ALTER TABLE workspace_activities ADD CONSTRAINT workspace_activities_activity_type_check
--   CHECK (activity_type IN (
--     'project_moved', 'lead_converted', 'member_invited', 'member_joined',
--     'project_created', 'client_created', 'integration_connected', 'tasks_imported',
--     'contract_created', 'contract_sent', 'contract_signed', 'contract_voided'
--   ));
