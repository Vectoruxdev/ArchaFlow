-- ========================================
-- Add Archive Field to Projects Table
-- Migration for Archive/Delete Functionality
-- ========================================

-- Add archived_at field to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for performance when filtering archived projects
CREATE INDEX IF NOT EXISTS idx_projects_archived_at ON projects(archived_at);

-- Add comment for documentation
COMMENT ON COLUMN projects.archived_at IS 'Timestamp when project was archived. NULL indicates active project.';

-- Note: All existing projects will have archived_at = NULL (active by default)
