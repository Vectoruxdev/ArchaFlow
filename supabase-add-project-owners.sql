-- Add Primary and Secondary owner columns to projects
-- Run after supabase-projects-schema.sql (or on existing projects table)
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste this file → Run
-- (Or: supabase db execute -f supabase-add-project-owners.sql if using Supabase CLI)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS primary_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS secondary_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_primary_owner_id ON projects(primary_owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_secondary_owner_id ON projects(secondary_owner_id);
