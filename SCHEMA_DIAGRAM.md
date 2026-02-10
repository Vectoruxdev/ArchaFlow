# ArchaFlow Database Schema Diagram

## Visual Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     MULTI-TENANT ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ USER LEVEL (Global)                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐         ┌──────────────────────┐                       │
│  │  auth.users     │────────>│  user_profiles       │                       │
│  │  (Supabase)     │         │  • full_name         │                       │
│  │  • email        │         │  • avatar_url        │                       │
│  │  • password     │         │  • created_at        │                       │
│  └────────┬────────┘         └──────────────────────┘                       │
│           │                                                                  │
└───────────┼──────────────────────────────────────────────────────────────────┘
            │
            │ user_roles (Junction Table)
            │ • Links users to businesses with roles
            │
┌───────────┼──────────────────────────────────────────────────────────────────┐
│           │                                                                   │
│           ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ BUSINESS/WORKSPACE LEVEL (Tenant-Scoped)                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────┐                                                        │
│  │  businesses      │                                                        │
│  │  • name          │                                                        │
│  │  • created_at    │                                                        │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           ├──────────────────────────────────────────────────────────┐      │
│           │                          │                               │      │
│           │                          │                               │      │
│           ▼                          ▼                               ▼      │
│  ┌─────────────────┐      ┌──────────────────┐         ┌──────────────────┐│
│  │ roles           │      │ project_statuses │         │ workspace_       ││
│  │ • name          │      │ • label          │         │ invitations      ││
│  │ • is_custom     │      │ • order_index    │         │ • email          ││
│  └────────┬────────┘      │ • color_key      │         │ • role_id        ││
│           │               └──────────────────┘         │ • invited_by     ││
│           │                                            │ • status         ││
│           ▼                                            │ • expires_at     ││
│  ┌─────────────────┐                                  └──────────────────┘│
│  │ permissions     │                                                        │
│  │ • feature_type  │                                                        │
│  │ • action        │                                                        │
│  │ • allowed       │                                                        │
│  │ • visibility    │                                                        │
│  └─────────────────┘                                                        │
│                                                                              │
│           ┌──────────────────────────────────────────────────┐             │
│           │                                                  │             │
│           ▼                                                  │             │
│  ┌────────────────────────────────────────────────────┐     │             │
│  │ projects                                           │     │             │
│  │ • title                                            │     │             │
│  │ • client_name, client_email, client_phone, address│     │             │
│  │ • status, priority, payment_status                 │     │             │
│  │ • start_date, due_date, expected_completion        │     │             │
│  │ • budget, spent                                    │     │             │
│  │ • description                                      │     │             │
│  └───────┬────────────────────────────────────────────┘     │             │
│          │                                                   │             │
│          ├───────────┬───────────┬──────────┬───────────────┤             │
│          │           │           │          │               │             │
│          ▼           ▼           ▼          ▼               ▼             │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ project_ │ │ project_ │ │project_ │ │ project_ │ │ project_     │    │
│  │ assign-  │ │ time_    │ │tasks    │ │ notes    │ │ invoices     │    │
│  │ ments    │ │ entries  │ │         │ │          │ │              │    │
│  │          │ │          │ │ • parent│ │ • author │ │ • invoice_#  │    │
│  │ • user   │ │ • user   │ │   _task │ │ • content│ │ • amount     │    │
│  │ • role   │ │ • start  │ │ • title │ │          │ │ • status     │    │
│  │          │ │ • end    │ │ • desc  │ └──────────┘ │ • dates      │    │
│  │          │ │ • duration│ │ • done │              │              │    │
│  │          │ │ • billable│ │ • due   │              └──────────────┘    │
│  └──────────┘ └──────────┘ └────┬────┘                                    │
│                                  │                                         │
│                                  ├─────────┬──────────┐                    │
│                                  │         │          │                    │
│                                  ▼         ▼          ▼                    │
│                          ┌─────────┐ ┌─────────┐ ┌──────────┐             │
│                          │ task_   │ │ project_│ │ (parent) │             │
│                          │ notes   │ │ files   │ │ tasks    │             │
│                          │         │ │         │ │ (recurse)│             │
│                          │ • author│ │ • name  │ └──────────┘             │
│                          │ • content│ │ • size │                           │
│                          │         │ │ • type  │                           │
│                          └─────────┘ │ • url   │                           │
│                                      │ • upload│                           │
│                                      └─────────┘                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Relationship Summary

### One-to-Many Relationships

| Parent | Child | Description |
|--------|-------|-------------|
| `businesses` | `roles` | Each business has multiple roles |
| `businesses` | `project_statuses` | Each business has custom kanban columns |
| `businesses` | `projects` | Each business has multiple projects |
| `businesses` | `workspace_invitations` | Each business can invite users |
| `roles` | `permissions` | Each role has multiple permissions |
| `projects` | `project_assignments` | Projects have team members |
| `projects` | `project_time_entries` | Projects track time entries |
| `projects` | `project_tasks` | Projects have tasks |
| `projects` | `project_notes` | Projects have comments |
| `projects` | `project_files` | Projects have file attachments |
| `projects` | `project_invoices` | Projects have invoices |
| `project_tasks` | `project_tasks` | Tasks can have subtasks (self-referencing) |
| `project_tasks` | `task_notes` | Tasks can have notes |
| `auth.users` | `user_profiles` | One user, one profile |

### Many-to-Many Relationships

| Entity A | Junction Table | Entity B | Description |
|----------|----------------|----------|-------------|
| `auth.users` | `user_roles` | `businesses` | Users belong to businesses via roles |
| `auth.users` | `project_assignments` | `projects` | Users assigned to projects |

### Foreign Key References (User Actions)

These track "who did what":
- `project_time_entries.user_id` - who logged time
- `project_tasks.assigned_to` - who is responsible
- `project_tasks.completed_by` - who completed it
- `task_notes.author_id` - who wrote the note
- `project_notes.author_id` - who wrote the comment
- `project_files.uploaded_by` - who uploaded the file
- `workspace_invitations.invited_by` - who sent the invite

## Data Isolation Strategy

### Row Level Security (RLS)

All tables enforce multi-tenancy through RLS policies:

1. **Business-scoped data**: Users can only access data from businesses they're members of
2. **User profiles**: Users can only view/edit their own profile
3. **Invitations**: Users see invitations for their businesses OR sent to their email
4. **Ownership**: Only business Owners can modify certain sensitive data

### Example RLS Logic

```sql
-- Users can only view projects in their businesses
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

## Cascading Delete Behavior

| Parent Deleted | What Happens |
|----------------|--------------|
| `businesses` | ALL business data deleted (roles, projects, etc.) |
| `projects` | All project data deleted (tasks, notes, files, etc.) |
| `roles` | User role assignments deleted |
| `auth.users` | User profiles deleted, but business data preserved |
| `project_tasks` | Subtasks and task notes deleted |

## Key Constraints

### Uniqueness
- `(business_id, name)` on `roles` - No duplicate role names per business
- `(business_id, label)` on `project_statuses` - No duplicate status labels
- `(business_id, invoice_number)` on `project_invoices` - Unique invoice numbers
- `(project_id, user_id)` on `project_assignments` - User assigned once per project
- `(business_id, email)` on `workspace_invitations` - One pending invite per email

### Check Constraints
- `priority IN ('low', 'medium', 'high')`
- `payment_status IN ('pending', 'partial', 'paid')`
- `invoice_status IN ('draft', 'sent', 'paid', 'overdue')`
- `invitation_status IN ('pending', 'accepted', 'declined')`

## Performance Indexes

Critical indexes for query performance:
- `idx_projects_business_id` - Fast business-scoped queries
- `idx_projects_status` - Kanban board filtering
- `idx_project_tasks_parent_task_id` - Hierarchical task queries
- `idx_project_time_entries_user_id` - User time tracking reports
- All foreign key columns are automatically indexed

## Auto-Updated Fields

Triggers maintain timestamps:
- `businesses.updated_at`
- `user_profiles.updated_at`
- `projects.updated_at`
- `project_tasks.updated_at`
