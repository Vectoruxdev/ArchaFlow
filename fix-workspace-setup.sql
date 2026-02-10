-- ========================================
-- ArchaFlow Workspace Setup Fix
-- ========================================
-- Run this in Supabase SQL Editor if you're stuck on "Loading projects..."
-- ========================================

-- Step 1: Check if you have a business/workspace
SELECT 
  b.id,
  b.name,
  COUNT(ur.id) as user_count
FROM businesses b
LEFT JOIN user_roles ur ON b.id = ur.business_id
GROUP BY b.id, b.name;

-- Step 2: Check if you have user_roles set up
SELECT 
  u.email,
  b.name as business_name,
  r.name as role_name
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN businesses b ON ur.business_id = b.id
JOIN roles r ON ur.role_id = r.id;

-- Step 3: Check if you have project_statuses
SELECT 
  b.name as business_name,
  ps.label,
  ps.order_index,
  ps.color_key
FROM project_statuses ps
JOIN businesses b ON ps.business_id = b.id
ORDER BY b.name, ps.order_index;

-- ========================================
-- IF YOU SEE NO RESULTS ABOVE, RUN THIS FIX:
-- ========================================

-- Get your user ID (replace with your actual email)
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then uncomment and run this with your user ID:
/*
DO $$
DECLARE
  v_user_id UUID := 'YOUR-USER-ID-HERE'; -- REPLACE THIS
  v_business_id UUID;
  v_owner_role_id UUID;
BEGIN
  -- Check if user already has a workspace
  SELECT business_id INTO v_business_id
  FROM user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_business_id IS NULL THEN
    -- Create workspace using the function
    SELECT create_default_workspace(
      v_user_id,
      'My Workspace',
      'User'
    ) INTO v_business_id;

    RAISE NOTICE 'Created workspace with ID: %', v_business_id;
  END IF;

  -- Check if project statuses exist
  IF NOT EXISTS (SELECT 1 FROM project_statuses WHERE business_id = v_business_id) THEN
    -- Create default project statuses
    INSERT INTO project_statuses (business_id, label, order_index, color_key) VALUES
      (v_business_id, 'Lead', 0, 'lead'),
      (v_business_id, 'Sale', 1, 'sale'),
      (v_business_id, 'Design', 2, 'design'),
      (v_business_id, 'Completed', 3, 'completed');

    RAISE NOTICE 'Created default project statuses';
  END IF;

  RAISE NOTICE 'Setup complete!';
END $$;
*/
