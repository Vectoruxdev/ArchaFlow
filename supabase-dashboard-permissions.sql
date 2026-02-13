-- ========================================
-- ArchaFlow Dashboard Permissions
-- ========================================
-- Run this in your Supabase SQL Editor
-- Adds dashboard feature to permissions for all default roles
-- ========================================

-- Dashboard: read permission for all roles (Owner, Admin, Editor, Viewer)
INSERT INTO permissions (role_id, feature_type, action, allowed)
SELECT r.id, 'dashboard', 'read', true
FROM roles r
WHERE r.name IN ('Owner', 'Admin', 'Editor', 'Viewer')
ON CONFLICT (role_id, feature_type, action) DO UPDATE SET allowed = true;
