-- ========================================
-- ArchaFlow Leads: Simplify Fields
-- Consolidate budget, remove industry/company_size/location
-- ========================================
-- Run this in Supabase SQL Editor.
-- ========================================

-- Consolidate budget_min + budget_max into single budget column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2);
UPDATE leads SET budget = COALESCE(budget_min, budget_max);
ALTER TABLE leads DROP COLUMN IF EXISTS budget_min;
ALTER TABLE leads DROP COLUMN IF EXISTS budget_max;

-- Remove unused fields
ALTER TABLE leads DROP COLUMN IF EXISTS industry;
ALTER TABLE leads DROP COLUMN IF EXISTS company_size;
ALTER TABLE leads DROP COLUMN IF EXISTS location;
