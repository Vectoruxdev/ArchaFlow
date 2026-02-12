-- ========================================
-- ArchaFlow Leads: Add City & State Fields
-- ========================================
-- Run this in Supabase SQL Editor.
-- ========================================
-- File: supabase-leads-contact-updates.sql
-- ========================================

-- Add city column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;

-- Add state column (if missing from older schema)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT;
