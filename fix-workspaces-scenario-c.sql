-- ========================================
-- FIX FOR SCENARIO C: User ID Mismatch
-- ========================================
-- Use this script if diagnostic queries showed:
-- - Query 3 shows user_roles with a DIFFERENT user_id than your current auth.uid()
-- - You created workspaces with one account, but logged in with another
-- This means the user_id in user_roles doesn't match your current auth user
-- ========================================

-- ========================================
-- STEP 1: Identify the Mismatch
-- ========================================

-- Check your current auth user ID
SELECT auth.uid() as current_user_id;

-- Find user_roles that DON'T match your current user
SELECT 
  ur.user_id as stored_user_id,
  auth.uid() as current_user_id,
  b.name as workspace_name,
  r.name as role_name,
  ur.assigned_at
FROM user_roles ur
JOIN businesses b ON ur.business_id = b.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id != auth.uid()
  OR auth.uid() IS NULL
ORDER BY ur.assigned_at DESC
LIMIT 20;

-- If these workspaces look like YOURS, note the stored_user_id

-- ========================================
-- STEP 2: Check if These Are Your Workspaces
-- ========================================

-- Look at the workspace names and timestamps
-- Do these match workspaces you created?
-- If YES, proceed to fix
-- If NO, these belong to another user - don't update them!

-- ========================================
-- STEP 3: Update user_id to Match Current User
-- ========================================
-- CAUTION: Only run this if you're CERTAIN these are your workspaces!

-- Option A: Update specific workspace IDs (SAFER)
-- Replace the UUIDs below with the actual IDs from Step 1

-- UPDATE user_roles 
-- SET user_id = auth.uid()
-- WHERE business_id IN (
--   'WORKSPACE_ID_1_HERE',
--   'WORKSPACE_ID_2_HERE',
--   'WORKSPACE_ID_3_HERE',
--   'WORKSPACE_ID_4_HERE'
-- );

-- Option B: Update all user_roles from old user ID to new (RISKIER)
-- Replace 'OLD_USER_ID_HERE' with the stored_user_id from Step 1

-- UPDATE user_roles 
-- SET user_id = auth.uid()
-- WHERE user_id = 'OLD_USER_ID_HERE';

-- ========================================
-- STEP 4: Verify the Fix
-- ========================================

-- After running the UPDATE above, check if it worked:
SELECT 
  b.name as workspace_name,
  r.name as your_role,
  ur.assigned_at,
  ur.user_id
FROM user_roles ur
JOIN businesses b ON ur.business_id = b.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid()
ORDER BY ur.assigned_at;

-- Should now show your workspaces with the correct user_id

-- Count should match number of workspaces you expect
SELECT COUNT(*) as my_workspace_count 
FROM user_roles 
WHERE user_id = auth.uid();

-- ========================================
-- ALTERNATIVE: Create New Workspaces Instead
-- ========================================
-- If you're unsure about updating existing data,
-- it's safer to create fresh workspaces for your current user.
-- Run fix-workspaces-scenario-a.sql instead.

-- ========================================
-- NEXT STEPS
-- ========================================
-- 1. Go back to your browser
-- 2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
-- 3. Log out and log back in
-- 4. Your workspaces should now appear!
-- 5. If still not working, check browser console for errors
