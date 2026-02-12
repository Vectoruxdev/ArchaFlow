-- ========================================
-- ArchaFlow Leads: Add State Field
-- ========================================
-- Run this in Supabase SQL Editor.
-- ========================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT;
