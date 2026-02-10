# ArchaFlow - Supabase Projects Integration Setup Guide

Complete guide to set up and test the Supabase projects integration.

## Prerequisites

- Supabase project created and configured
- `.env.local` file with Supabase credentials
- Main schema (`supabase-schema.sql`) already executed

## Step 1: Run the Projects Schema

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/yhxfkizxrqrqrmnphkny/sql
2. Click **"New Query"**
3. Copy the contents of `supabase-projects-schema.sql`
4. Paste and click **"Run"**
5. Verify all tables were created successfully

## Step 2: Run the Seed Data

1. In the same SQL Editor, click **"New Query"**
2. Copy the contents of `supabase-seed-data.sql`
3. Paste and click **"Run"**
4. You should see: "Sample data inserted successfully!"

## Step 3: Set Up Storage (Optional but Recommended)

Follow the instructions in `SUPABASE_STORAGE_SETUP.md` to:
1. Create the `project-files` bucket
2. Set up storage policies
3. Test file uploads

## Step 4: Verify Database Tables

Check that all tables exist in your Supabase project:

**Projects Tables:**
- ✅ `project_statuses` - Kanban columns
- ✅ `projects` - Main project data
- ✅ `project_assignments` - Team member assignments
- ✅ `project_time_entries` - Time tracking
- ✅ `project_tasks` - Todos and subtasks
- ✅ `task_notes` - Notes on specific tasks
- ✅ `project_notes` - Project-level comments
- ✅ `project_files` - File attachments
- ✅ `project_invoices` - Invoice tracking

## Step 5: Test the Integration

### Dashboard Page

1. Navigate to http://localhost:3002/dashboard
2. You should see:
   - ✅ Loading indicator initially
   - ✅ 9 sample projects loaded from database
   - ✅ Projects organized in Kanban columns (Lead, Sale, Design, Completed)
   - ✅ Drag-and-drop functionality (drag a project to another column)
   - ✅ Stats showing correct counts

### Projects List Page

1. Navigate to http://localhost:3002/projects
2. You should see:
   - ✅ Table with all 9 projects
   - ✅ Search functionality
   - ✅ Filter by status
   - ✅ Click on a project to view details

### Project Detail Page

1. Click on "Kanab Custom Home" project
2. You should see:
   - ✅ Project information loaded
   - ✅ 4 main tasks with subtasks
   - ✅ 3 project notes
   - ✅ 3 invoices
   - ✅ Add new tasks
   - ✅ Mark tasks as complete

## Step 6: Test CRUD Operations

### Create a Project

1. Go to Dashboard
2. Click "+ New Project/Lead" button
3. Fill in project details
4. Click "Create"
5. Verify project appears in the Lead column

### Update Project Status

1. Drag a project from one column to another
2. Refresh the page
3. Verify the project stays in the new column (data persisted)

### Create a Task

1. Go to a project detail page
2. Click "+ New Task"
3. Fill in task details
4. Click "Add Task"
5. Verify task appears in the list

### Complete a Task

1. Click the checkbox next to a task
2. Verify it shows as completed with your name
3. Refresh the page
4. Verify the completion persists

## Step 7: Monitor Database

Open Supabase Table Editor to watch real-time changes:

1. Go to https://supabase.com/dashboard/project/yhxfkizxrqrqrmnphkny/editor
2. Select `projects` table
3. Make changes in the app
4. See them instantly reflected in the database

## Troubleshooting

### Error: "No rows found"

- Check that seed data was inserted successfully
- Verify `business_id` matches in both seed data and app code
- Check RLS policies are set correctly

### Error: "Permission denied"

- Verify RLS policies allow public access (for development)
- Check that all tables have policies enabled
- Ensure storage bucket has correct policies

### Files Not Uploading

- Verify storage bucket was created
- Check storage policies
- Confirm `project-files` bucket name matches in code

### Projects Not Loading

- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Confirm dev server was restarted after adding env vars
- Check Network tab for API request/response

## Next Steps

Once everything is working:

1. **Add Authentication**
   - Implement Supabase Auth
   - Replace mock user IDs with real user data
   - Update RLS policies for user-based access

2. **File Upload Integration**
   - Connect file upload UI to Supabase Storage
   - Test file downloads and deletion
   - Implement file previews

3. **Real-time Updates**
   - Add Supabase Realtime subscriptions
   - Show live updates when team members make changes
   - Implement collaborative features

4. **Production RLS**
   - Replace permissive policies with business-scoped access
   - Implement role-based permissions
   - Add data validation rules

## Files Overview

- `supabase-projects-schema.sql` - Database schema for all project tables
- `supabase-seed-data.sql` - Sample data for testing
- `lib/supabase/storage.ts` - File upload/download helpers
- `SUPABASE_STORAGE_SETUP.md` - Storage bucket setup guide
- `app/dashboard/page.tsx` - Dashboard with Supabase integration
- `app/projects/[id]/page.tsx` - Project detail with Supabase
- `app/projects/page.tsx` - Projects list with Supabase

## Success Criteria

✅ All SQL scripts run without errors
✅ 9 sample projects visible in dashboard
✅ Projects load from database (not mock data)
✅ Drag-and-drop updates database
✅ Tasks can be created and completed
✅ Changes persist after page refresh
✅ No console errors in browser

---

**Need Help?** Check the Supabase docs: https://supabase.com/docs
