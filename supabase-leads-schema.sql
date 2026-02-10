-- ========================================
-- ArchaFlow Leads Schema
-- Leads Management Tables & Relations
-- ========================================
-- Run this AFTER the projects and clients schemas have been applied.
-- ========================================

-- Leads Table (scoped per workspace/business)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Contact Basics
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  job_title TEXT,
  address TEXT,

  -- Source and Timing
  source TEXT DEFAULT 'other'
    CHECK (source IN ('website_form', 'email_campaign', 'social_media', 'referral', 'cold_call', 'ad', 'trade_show', 'other')),

  -- Interest Details
  interest TEXT,
  pain_points TEXT,
  budget_min NUMERIC(12,2),
  budget_max NUMERIC(12,2),

  -- Status and Scoring
  temperature TEXT DEFAULT 'cold'
    CHECK (temperature IN ('cold', 'warm', 'hot')),
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  next_action TEXT,
  next_action_date DATE,
  notes TEXT,

  -- Demographics / Firmographic
  industry TEXT,
  company_size TEXT,
  location TEXT,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Conversion
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ DEFAULT NULL,

  -- Lifecycle
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Activities Table (engagement history, call tracking)
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'status_change')),
  subject TEXT,
  description TEXT,
  call_duration INTEGER,  -- seconds, for calls
  call_outcome TEXT
    CHECK (call_outcome IS NULL OR call_outcome IN ('connected', 'voicemail', 'no_answer', 'busy')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON leads(archived_at);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_converted_at ON leads(converted_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Development RLS policies (allow all for authenticated users)
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all operations on lead_activities" ON lead_activities FOR ALL USING (true);

-- Trigger for updated_at on leads
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Default permissions for lead management
-- ========================================

-- Owner & Admin: full access
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'leads', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS action(name)
WHERE r.name IN ('Owner', 'Admin')
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

-- Editor: view, create, edit (no delete)
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'leads', action.name, true
FROM roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit')) AS action(name)
WHERE r.name = 'Editor'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;

-- Viewer: view only
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'leads', 'view', true
FROM roles r
WHERE r.name = 'Viewer'
ON CONFLICT (role_id, feature_type, action) DO NOTHING;
