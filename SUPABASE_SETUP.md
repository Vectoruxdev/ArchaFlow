# ArchaFlow Supabase Setup Guide

## Architecture Overview

ArchaFlow uses a **multi-tenant workspace architecture** where:
- Each **business/workspace** contains its own projects, roles, and settings
- **Users** can belong to multiple workspaces with different roles
- All operational data is scoped to the business level
- User profiles are global across all workspaces

## Database Setup Order

Run these SQL files in your Supabase SQL Editor in this exact order:

### 1. Core Schema (`supabase-schema.sql`)
Creates the foundation:
- `businesses` table (workspaces/tenants)
- `roles` table (per-business roles)
- `permissions` table (role permissions)
- `user_roles` table (user-business-role relationships)

### 2. Authentication Schema (`supabase-auth-schema.sql`)
Adds user management:
- `user_profiles` table (user personal data)
- `workspace_invitations` table (invite system)
- Proper RLS policies for multi-tenancy
- `create_default_workspace()` function for new users

### 3. Projects Schema (`supabase-projects-schema.sql`)
Adds project management:
- `project_statuses` (custom kanban columns)
- `projects` and all related tables
- Time tracking, tasks, notes, files, invoices

## Data Structure

```
BUSINESS-SCOPED DATA (Multi-tenant)
├── businesses (workspace)
│   ├── roles (Owner, Admin, Editor, Viewer + custom)
│   │   └── permissions (feature-level access control)
│   ├── project_statuses (kanban columns)
│   ├── projects
│   │   ├── project_assignments (team members)
│   │   ├── project_time_entries (time tracking)
│   │   ├── project_tasks (hierarchical todos)
│   │   │   └── task_notes
│   │   ├── project_notes (comments)
│   │   ├── project_files (attachments)
│   │   └── project_invoices
│   └── workspace_invitations (pending invites)

USER-LEVEL DATA (Global)
├── auth.users (Supabase managed)
└── user_profiles (name, avatar)

RELATIONSHIPS
└── user_roles (connects users to businesses with roles)
```

## Key Features

### Multi-Tenancy
- Complete data isolation between businesses
- Users can belong to multiple workspaces
- Business-scoped roles and permissions

### Row Level Security (RLS)
- All tables have RLS enabled
- Users only see data from businesses they belong to
- Proper permission checks for all operations

### Automatic Workspace Creation
When a new user signs up, the `create_default_workspace()` function:
1. Creates a new business/workspace
2. Sets up default roles (Owner, Admin, Editor, Viewer)
3. Assigns the user as Owner
4. Creates their user profile

## Testing the Setup

After running all schema files, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test creating a workspace (replace UUIDs with real values)
SELECT create_default_workspace(
  'YOUR_USER_ID'::uuid,
  'My Company',
  'John Doe'
);
```

## Environment Variables

Make sure your `.env.local` includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Important Notes

1. **Do NOT skip schema files** - they must be run in order
2. **RLS is critical** - never disable it in production
3. **Sample business** in `supabase-schema.sql` is for initial testing only
4. **Remove test policies** before production deployment

## Production Checklist

Before going live:
- [ ] Remove or update sample business data
- [ ] Verify all RLS policies are restrictive
- [ ] Test user permissions thoroughly
- [ ] Set up backups
- [ ] Configure Supabase Auth providers
- [ ] Review and update CORS settings
