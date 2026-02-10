-- ========================================
-- FIX FOR SCENARIO A: No Data Exists
-- ========================================
-- Use this script if diagnostic queries showed:
-- - No user_roles exist for your user
-- - Workspaces were "created" but never saved to database
-- ========================================

-- First, get your user ID
SELECT auth.uid() as my_user_id;
-- IMPORTANT: Copy the UUID that's returned
-- If it returns NULL, you need to be logged in to Supabase as your app user

-- ========================================
-- CREATE 4 WORKSPACES WITH ROLES
-- ========================================

DO $$
DECLARE
  user_uuid UUID := auth.uid(); -- Your user ID from Supabase auth
  workspace1_id UUID;
  workspace2_id UUID;
  workspace3_id UUID;
  workspace4_id UUID;
  owner_role_id UUID;
BEGIN
  -- Verify we have a user ID
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'auth.uid() returned NULL - you must be authenticated';
  END IF;

  RAISE NOTICE 'Creating workspaces for user: %', user_uuid;

  -- Create 4 businesses (workspaces)
  INSERT INTO businesses (name) VALUES ('My Workspace') RETURNING id INTO workspace1_id;
  INSERT INTO businesses (name) VALUES ('Client Projects') RETURNING id INTO workspace2_id;
  INSERT INTO businesses (name) VALUES ('Personal Projects') RETURNING id INTO workspace3_id;
  INSERT INTO businesses (name) VALUES ('Agency Work') RETURNING id INTO workspace4_id;

  RAISE NOTICE 'Created 4 businesses';

  -- Create owner roles and link to user for workspace 1
  INSERT INTO roles (business_id, name, is_custom) 
  VALUES (workspace1_id, 'Owner', false) RETURNING id INTO owner_role_id;
  INSERT INTO user_roles (user_id, business_id, role_id) 
  VALUES (user_uuid, workspace1_id, owner_role_id);

  -- Create owner roles and link to user for workspace 2
  INSERT INTO roles (business_id, name, is_custom) 
  VALUES (workspace2_id, 'Owner', false) RETURNING id INTO owner_role_id;
  INSERT INTO user_roles (user_id, business_id, role_id) 
  VALUES (user_uuid, workspace2_id, owner_role_id);

  -- Create owner roles and link to user for workspace 3
  INSERT INTO roles (business_id, name, is_custom) 
  VALUES (workspace3_id, 'Owner', false) RETURNING id INTO owner_role_id;
  INSERT INTO user_roles (user_id, business_id, role_id) 
  VALUES (user_uuid, workspace3_id, owner_role_id);

  -- Create owner roles and link to user for workspace 4
  INSERT INTO roles (business_id, name, is_custom) 
  VALUES (workspace4_id, 'Owner', false) RETURNING id INTO owner_role_id;
  INSERT INTO user_roles (user_id, business_id, role_id) 
  VALUES (user_uuid, workspace4_id, owner_role_id);

  RAISE NOTICE 'Created roles and user_roles';

  -- Create default project statuses for each workspace
  INSERT INTO project_statuses (business_id, label, color_key, order_index)
  VALUES 
    -- Workspace 1 statuses
    (workspace1_id, 'Lead', 'lead', 1),
    (workspace1_id, 'Sale', 'sale', 2),
    (workspace1_id, 'Design', 'design', 3),
    (workspace1_id, 'Completed', 'completed', 4),
    -- Workspace 2 statuses
    (workspace2_id, 'Lead', 'lead', 1),
    (workspace2_id, 'Sale', 'sale', 2),
    (workspace2_id, 'Design', 'design', 3),
    (workspace2_id, 'Completed', 'completed', 4),
    -- Workspace 3 statuses
    (workspace3_id, 'Lead', 'lead', 1),
    (workspace3_id, 'Sale', 'sale', 2),
    (workspace3_id, 'Design', 'design', 3),
    (workspace3_id, 'Completed', 'completed', 4),
    -- Workspace 4 statuses
    (workspace4_id, 'Lead', 'lead', 1),
    (workspace4_id, 'Sale', 'sale', 2),
    (workspace4_id, 'Design', 'design', 3),
    (workspace4_id, 'Completed', 'completed', 4);

  RAISE NOTICE 'Created project statuses';
  RAISE NOTICE 'Successfully created 4 workspaces for user %', user_uuid;
END $$;

-- ========================================
-- VERIFY IT WORKED
-- ========================================

-- This should now return 4 workspaces
SELECT 
  b.name as workspace_name,
  r.name as your_role,
  ur.assigned_at
FROM user_roles ur
JOIN businesses b ON ur.business_id = b.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid()
ORDER BY ur.assigned_at;

-- Count should be 4
SELECT COUNT(*) as my_workspace_count 
FROM user_roles 
WHERE user_id = auth.uid();

-- ========================================
-- NEXT STEPS
-- ========================================
-- 1. Go back to your browser
-- 2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
-- 3. Log out and log back in
-- 4. Your workspaces should now appear!
