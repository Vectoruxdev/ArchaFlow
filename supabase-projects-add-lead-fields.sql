-- ========================================
-- Add Lead-related fields to Projects table
-- So that when a lead converts to a project, no data is lost.
-- ========================================
-- Run this AFTER the leads schema has been applied.
-- ========================================

-- Lead source
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source TEXT;

-- Interest / service
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interest TEXT;

-- Pain points
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pain_points TEXT;

-- General notes (separate from description)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;

-- Budget minimum (projects already have `budget` which serves as max)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_min NUMERIC(12,2);

-- Temperature (cold, warm, hot)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS temperature TEXT
  CHECK (temperature IS NULL OR temperature IN ('cold', 'warm', 'hot'));

-- Lead score (0-100)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_score INTEGER
  CHECK (lead_score IS NULL OR (lead_score >= 0 AND lead_score <= 100));

-- Next action tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_action_date DATE;

-- Company / contact firmographic info
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;

-- Back-reference to originating lead
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Index for lead lookups
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id);
