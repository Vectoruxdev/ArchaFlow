-- ========================================
-- FIX FOR SCENARIO A: No Data Exists (Manual Version)
-- ========================================
-- This version works in Supabase SQL Editor where auth.uid() returns NULL
-- You need to manually provide your user ID
-- ========================================

-- ========================================
-- STEP 1: Get your user ID from auth.users
-- ========================================

-- Run this query to find your user ID
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Find YOUR email in the results above and copy the "user_id" (UUID)
-- Example: 5b04e732-21d4-432a-bac4-2923a0c477fa

-- ========================================
-- STEP 2: Create workspaces for your user
-- ========================================
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' below with your actual UUID from Step 1
-- ========================================

DO $$
DECLARE
  -- 🔥 REPLACE THIS WITH YOUR ACTUAL USER ID FROM STEP 1 🔥
  user_uuid UUID := '5b04e732-21d4-432a-bac4-2923a0c477fa'; -- Example: '5b04e732-21d4-432a-bac4-2923a0c477fa'
  
  workspace1_id UUID;
  workspace2_id UUID;
  workspace3_id UUID;
  workspace4_id UUID;
  owner_role_id UUID;
BEGIN
  -- User UUID is set correctly
  RAISE NOTICE 'Using user ID: %', user_uuid;

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
  RAISE NOTICE '✅ Successfully created 4 workspaces for user %', user_uuid;
  RAISE NOTICE 'Workspace IDs: %, %, %, %', workspace1_id, workspace2_id, workspace3_id, workspace4_id;
END $$;

-- ========================================
-- STEP 3: Verify it worked
-- ========================================
-- Replace 'YOUR_USER_ID_HERE' with the same UUID you used above

SELECT 
  b.name as workspace_name,
  r.name as your_role,
  ur.assigned_at,
  ur.user_id
FROM user_roles ur
JOIN businesses b ON ur.business_id = b.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '5b04e732-21d4-432a-bac4-2923a0c477fa'
ORDER BY ur.assigned_at;

-- Count should be 4
SELECT COUNT(*) as my_workspace_count 
FROM user_roles 
WHERE user_id = '5b04e732-21d4-432a-bac4-2923a0c477fa'; -- Replace with your UUID

-- ========================================
-- EXAMPLE: If your user ID is 5b04e732-21d4-432a-bac4-2923a0c477fa
-- ========================================
-- Then replace 'YOUR_USER_ID_HERE' with '5b04e732-21d4-432a-bac4-2923a0c477fa'
-- Like this:
--   user_uuid UUID := '5b04e732-21d4-432a-bac4-2923a0c477fa';
-- And in the verification queries:
--   WHERE ur.user_id = '5b04e732-21d4-432a-bac4-2923a0c477fa'

-- ========================================
-- NEXT STEPS
-- ========================================
-- 1. Go back to your browser at http://localhost:3001
-- 2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
-- 3. Log out and log back in
-- 4. Your 4 workspaces should now appear!
