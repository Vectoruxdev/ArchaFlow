# Supabase Setup Verification Checklist

Use this checklist to verify your ArchaFlow database is properly configured.

## Step 1: Run Schema Setup

Choose ONE of these options:

### Option A: Run Complete Setup (Recommended)
```sql
-- Copy and run: supabase-setup-complete.sql
-- This includes everything in one file
```

### Option B: Run Individual Files in Order
```sql
-- 1. Run: supabase-schema.sql (Core tables)
-- 2. Run: supabase-auth-schema.sql (User management)
-- 3. Run: supabase-projects-schema.sql (Project features)
```

## Step 2: Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'businesses',
    'roles',
    'permissions',
    'user_roles',
    'user_profiles',
    'workspace_invitations',
    'project_statuses',
    'projects',
    'project_assignments',
    'project_time_entries',
    'project_tasks',
    'task_notes',
    'project_notes',
    'project_files',
    'project_invoices'
  )
ORDER BY table_name;
```

**Expected Result**: Should return 15 tables

## Step 3: Verify RLS Enabled

```sql
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ DISABLED - SECURITY RISK!'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'businesses', 'roles', 'permissions', 'user_roles',
    'user_profiles', 'workspace_invitations', 'project_statuses',
    'projects', 'project_assignments', 'project_time_entries',
    'project_tasks', 'task_notes', 'project_notes',
    'project_files', 'project_invoices'
  )
ORDER BY tablename;
```

**Expected Result**: All tables should show "✅ Enabled"

## Step 4: Verify Policies Exist

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Result**: Each table should have multiple policies

## Step 5: Verify Functions Exist

```sql
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_default_workspace',
    'update_updated_at_column'
  )
ORDER BY routine_name;
```

**Expected Result**: 
- `create_default_workspace` (returns UUID)
- `update_updated_at_column` (returns TRIGGER)

## Step 6: Verify Triggers

```sql
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

**Expected Result**: Triggers on:
- `businesses.updated_at`
- `user_profiles.updated_at`
- `projects.updated_at`
- `project_tasks.updated_at`

## Step 7: Verify Indexes

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected Result**: Multiple performance indexes on foreign keys and frequently queried columns

## Step 8: Test Workspace Creation Function

**IMPORTANT**: Replace `YOUR_USER_ID` with a real UUID from your auth.users table!

```sql
-- First, get a user ID (or create a test user via Supabase Auth UI)
-- Then run:
SELECT create_default_workspace(
  'YOUR_USER_ID'::uuid,
  'Test Workspace',
  'Test User'
);
```

**Expected Result**: Returns a new business UUID

### Verify the workspace was created:

```sql
-- Check business was created
SELECT * FROM businesses WHERE name = 'Test Workspace';

-- Check roles were created (should see 4: Owner, Admin, Editor, Viewer)
SELECT * FROM roles WHERE business_id = (
  SELECT id FROM businesses WHERE name = 'Test Workspace'
);

-- Check user was assigned as Owner
SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID'::uuid;

-- Check user profile was created
SELECT * FROM user_profiles WHERE id = 'YOUR_USER_ID'::uuid;
```

## Step 9: Test Multi-Tenancy (RLS)

### Create a test scenario:

```sql
-- Assuming you have 2 users and 2 businesses
-- User A should NOT see User B's business data

-- As User A (set auth.uid() context)
SET request.jwt.claims TO '{"sub": "USER_A_UUID"}';

-- This should only return businesses User A belongs to
SELECT * FROM businesses;

-- This should only return projects from User A's businesses
SELECT * FROM projects;

-- Reset context
RESET request.jwt.claims;
```

## Step 10: Check for Common Issues

### Issue 1: Missing UUID Extension
```sql
-- Should return: uuid-ossp
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
```

### Issue 2: Auth Schema Access
```sql
-- Should be able to reference auth.users
SELECT count(*) FROM auth.users;
```

### Issue 3: Circular Policy Dependencies
```sql
-- If you see errors about circular dependencies, it means
-- RLS policies reference tables that also have RLS enabled
-- This is expected and handled in the schema
```

## Security Checklist

Before going to production:

- [ ] All 15 tables have RLS enabled
- [ ] No "Allow all" policies exist (check for `USING (true)`)
- [ ] Test that users cannot access other businesses' data
- [ ] Remove any sample/test businesses with hardcoded UUIDs
- [ ] Verify `create_default_workspace` has `SECURITY DEFINER`
- [ ] Review all policies to ensure least-privilege access
- [ ] Set up proper Supabase Auth providers (Google, GitHub, etc.)
- [ ] Configure email templates for invitations
- [ ] Set up database backups
- [ ] Review and set up Supabase Storage buckets for file uploads

## Common SQL Queries for Testing

### Check business membership for a user:
```sql
SELECT 
  b.name as business_name,
  r.name as role_name,
  ur.assigned_at
FROM user_roles ur
JOIN businesses b ON ur.business_id = b.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'YOUR_USER_ID'::uuid;
```

### Check project count per business:
```sql
SELECT 
  b.name as business,
  COUNT(p.id) as project_count
FROM businesses b
LEFT JOIN projects p ON b.id = p.business_id
GROUP BY b.id, b.name;
```

### Check user activity:
```sql
SELECT 
  u.email,
  COUNT(DISTINCT pt.id) as tasks_assigned,
  COUNT(DISTINCT pte.id) as time_entries,
  COUNT(DISTINCT pn.id) as notes_written
FROM auth.users u
LEFT JOIN project_tasks pt ON pt.assigned_to = u.id
LEFT JOIN project_time_entries pte ON pte.user_id = u.id
LEFT JOIN project_notes pn ON pn.author_id = u.id
GROUP BY u.id, u.email;
```

## Troubleshooting

### Problem: "permission denied for table X"
**Solution**: Check that RLS policies allow access. Verify user is member of the business.

### Problem: "function uuid_generate_v4() does not exist"
**Solution**: Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Problem: "insert or update on table violates foreign key constraint"
**Solution**: Ensure parent records exist (e.g., business exists before creating project)

### Problem: "duplicate key value violates unique constraint"
**Solution**: Check UNIQUE constraints - may be trying to create duplicate role name in same business

### Problem: Queries are slow
**Solution**: 
1. Check if indexes are created (Step 7 above)
2. Run `ANALYZE;` to update query statistics
3. Use `EXPLAIN ANALYZE` to identify slow queries

## Next Steps After Verification

1. Set up Supabase Storage buckets for file uploads
2. Configure Auth providers and email templates
3. Set up environment variables in your Next.js app
4. Test the signup/login flow
5. Test creating projects and tasks
6. Verify file uploads work
7. Test invitation system
8. Set up monitoring and backups

---

**✅ Database setup is complete when all checks pass!**
