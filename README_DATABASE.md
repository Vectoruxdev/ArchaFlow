# ArchaFlow Database Documentation

## 📋 Quick Start

Your Supabase database is structured as a **multi-tenant workspace system** where:
- Each business/workspace owns its projects, roles, and data
- Users can belong to multiple workspaces with different roles
- Complete data isolation between businesses

## 🗂️ Documentation Files

| File | Purpose |
|------|---------|
| `SUPABASE_SETUP.md` | Complete setup guide and architecture overview |
| `SCHEMA_DIAGRAM.md` | Visual data model and relationship diagrams |
| `SUPABASE_VERIFICATION.md` | Verification checklist and testing queries |
| `supabase-setup-complete.sql` | **All-in-one** setup script (recommended) |
| `supabase-schema.sql` | Core tables (businesses, roles, permissions) |
| `supabase-auth-schema.sql` | User management and RLS policies |
| `supabase-projects-schema.sql` | Project management features |

## 🚀 Setup Instructions

### Option 1: Quick Setup (Recommended)

1. Open your [Supabase SQL Editor](https://supabase.com/dashboard)
2. Copy and paste the entire `supabase-setup-complete.sql` file
3. Click "Run"
4. Verify using `SUPABASE_VERIFICATION.md`

### Option 2: Step-by-Step Setup

Run these files **in order** in your Supabase SQL Editor:

```bash
1. supabase-schema.sql          # Core foundation
2. supabase-auth-schema.sql     # User management & security
3. supabase-projects-schema.sql # Project features
```

## 📊 Data Architecture Summary

```
USER LEVEL (Global)
├── auth.users (Supabase managed authentication)
└── user_profiles (personal data: name, avatar)

BUSINESS LEVEL (Multi-tenant)
├── businesses (workspaces)
│   ├── roles (Owner, Admin, Editor, Viewer + custom)
│   │   └── permissions (feature-level access control)
│   ├── project_statuses (custom kanban columns)
│   ├── projects
│   │   ├── project_assignments (team members)
│   │   ├── project_time_entries (time tracking)
│   │   ├── project_tasks (hierarchical todos)
│   │   │   └── task_notes
│   │   ├── project_notes (comments)
│   │   ├── project_files (attachments)
│   │   └── project_invoices
│   └── workspace_invitations

RELATIONSHIPS
└── user_roles (connects users ↔ businesses via roles)
```

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ Enabled on all 15 tables
- ✅ Users only see data from businesses they belong to
- ✅ Business owners have elevated permissions
- ✅ Profile data is private to each user

### Multi-Tenancy Enforcement
Every query automatically filters by business membership through RLS policies:

```sql
-- Users can only see projects from their businesses
CREATE POLICY "Users can view projects in their businesses"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.business_id = projects.business_id
      AND user_roles.user_id = auth.uid()
    )
  );
```

## 🎯 Key Features

### 1. Dynamic Role System
- Default roles: Owner, Admin, Editor, Viewer
- Create custom roles per business
- Granular permissions per feature and action

### 2. Hierarchical Tasks
- Tasks can have unlimited subtasks
- Track completion status and assignments
- Due dates and priorities

### 3. Time Tracking
- Start/stop timers
- Manual time entries
- Billable vs non-billable hours
- Link time to projects or specific tasks

### 4. Client Management
- Client info stored with projects
- Track multiple projects per client
- Payment status tracking

### 5. File Management
- Attach files to projects or tasks
- Track versions
- Record uploader and timestamps

### 6. Team Collaboration
- Invite users via email
- Assign team members to projects
- Comment on projects and tasks
- Track who did what and when

## 📈 Performance Optimizations

### Indexes Created
- Business ID indexes for fast tenant filtering
- Project status indexes for kanban queries
- User ID indexes for activity tracking
- Foreign key indexes for joins
- Parent task indexes for hierarchical queries

### Auto-Updated Timestamps
Triggers automatically maintain:
- `businesses.updated_at`
- `user_profiles.updated_at`
- `projects.updated_at`
- `project_tasks.updated_at`

## 🔄 Common Operations

### Creating a New Workspace
```sql
SELECT create_default_workspace(
  user_id::uuid,
  'Company Name',
  'User Full Name'
);
```

This automatically:
1. Creates a new business
2. Sets up default roles (Owner, Admin, Editor, Viewer)
3. Assigns user as Owner
4. Creates user profile

### Adding a User to a Workspace
```sql
-- 1. Create invitation
INSERT INTO workspace_invitations (business_id, email, role_id, invited_by)
VALUES (
  'business-uuid',
  'user@example.com',
  'role-uuid',
  auth.uid()
);

-- 2. After acceptance, add to user_roles
INSERT INTO user_roles (user_id, role_id, business_id)
VALUES ('user-uuid', 'role-uuid', 'business-uuid');
```

### Creating a Project
```sql
INSERT INTO projects (
  business_id,
  title,
  client_name,
  status,
  priority,
  budget
) VALUES (
  'business-uuid',
  'Website Redesign',
  'Acme Corp',
  'design',
  'high',
  5000.00
);
```

## 🧪 Testing Your Setup

After running the schema, verify everything works:

```bash
# Open SUPABASE_VERIFICATION.md and follow the checklist:
✓ Tables created (15 total)
✓ RLS enabled on all tables
✓ Policies created
✓ Functions exist
✓ Triggers working
✓ Indexes created
✓ Multi-tenancy enforced
```

## 🎨 Frontend Integration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Example Query (Next.js)
```typescript
// Get all projects for current user's business
const { data: projects } = await supabase
  .from('projects')
  .select(`
    *,
    project_assignments(
      user_id,
      user_profiles(full_name, avatar_url)
    )
  `)
  .eq('business_id', currentBusinessId)
  .order('created_at', { ascending: false });
```

RLS automatically filters results to only show projects from businesses the user belongs to!

## 📝 Data Model Highlights

### What's Saved to Business
- ✅ All projects and project-related data
- ✅ Custom roles and permissions
- ✅ Team assignments
- ✅ Time entries
- ✅ Files and invoices
- ✅ Custom kanban statuses

### What's Saved to User
- ✅ Personal profile (name, avatar)
- ✅ Authentication credentials
- ❌ NOT projects or business data

### User ↔ Business Connection
- `user_roles` table links users to businesses
- Each connection has a specific role (Owner, Admin, etc.)
- One user can belong to multiple businesses
- RLS policies use this to enforce data access

## 🚨 Important Security Notes

### Before Production:
1. ❌ Remove sample/test businesses with hardcoded UUIDs
2. ✅ Verify all RLS policies are restrictive (no `USING (true)`)
3. ✅ Test that users cannot access other businesses' data
4. ✅ Set up database backups
5. ✅ Configure Supabase Auth providers
6. ✅ Review file upload security (Storage buckets)
7. ✅ Set up monitoring and alerts

### Development Notes:
- Initial schema files contain temporary permissive policies
- These are replaced by secure policies in later steps
- Always run all schema files in order
- The complete setup script has production-ready policies

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenancy Best Practices](https://supabase.com/docs/guides/database/multi-tenancy)

## 🆘 Troubleshooting

See `SUPABASE_VERIFICATION.md` for:
- Common error messages and solutions
- SQL queries to diagnose issues
- Performance optimization tips
- Testing multi-tenancy

## ✅ Schema is Ready!

Your database structure is now set up to support:
- ✅ Multi-tenant workspace architecture
- ✅ Secure data isolation
- ✅ Role-based access control
- ✅ Complete project management
- ✅ Time tracking
- ✅ Team collaboration
- ✅ File management
- ✅ Client and invoice tracking

Next steps: Set up your Next.js application to connect to Supabase and start building features!
