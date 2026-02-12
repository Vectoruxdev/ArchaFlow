# Project Detail Page - Documentation

## Overview
The Project Detail page provides a comprehensive view of individual architecture projects with full CRUD capabilities, file management, task tracking, and invoicing.

## Route
```
/projects/[id]
```

## Features

### 📋 **Tabbed Interface**
- **Overview**: Project details, progress tracking, payment summary, AI insights
- **Notes**: Threaded comments with @mentions and timestamps
- **Attachments**: File grid with drag-and-drop upload, version tracking
- **Tasks**: Checklist with subtasks, assignees, due dates, status toggles
- **Invoices**: Invoice table with generation modal

### 🎨 **Design System Compliance**
- ✅ Black/white core palette with high contrast
- ✅ Inter font family throughout
- ✅ Semantic colors:
  - Yellow for Design stage
  - Green for paid/completed status
  - Red for overdue items
  - Blue for AI insights
- ✅ Minimalist cards with ample whitespace
- ✅ Subtle borders and shadows

### 📱 **Responsive Design**
- Desktop: Full layout with right sidebar
- Tablet: Stacked layout with collapsible sidebar
- Mobile: Single column with tabs

### ♿ **Accessibility**
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus states on all controls
- Screen reader friendly

## Components

### Core Components

#### `CommentThread` (`components/project/comment-thread.tsx`)
- Displays threaded comments with avatars
- Add comment form with @mention support
- Timestamps and user attribution

**Props:**
```typescript
interface CommentThreadProps {
  comments: Comment[]
  onAddComment?: (content: string) => void
}
```

#### `FileGrid` (`components/project/file-grid.tsx`)
- Grid display of project files
- Drag-and-drop upload area
- File type icons (PDF, image, document)
- Version badges
- View and download actions

**Props:**
```typescript
interface FileGridProps {
  files: FileItem[]
  onUpload?: (files: FileList) => void
}
```

#### `TaskList` (`components/project/task-list.tsx`)
- Hierarchical task display with subtasks
- Checkbox toggles for completion
- Assignee avatars
- Due date indicators with overdue highlighting
- Priority badges

**Props:**
```typescript
interface TaskListProps {
  tasks: Task[]
  onToggleTask?: (taskId: string) => void
  onToggleSubtask?: (taskId: string, subtaskId: string) => void
}
```

#### `InvoiceTable` (`components/project/invoice-table.tsx`)
- Responsive table of invoices
- Status badges (draft, sent, paid, overdue)
- Generate invoice modal
- View and download actions

**Props:**
```typescript
interface InvoiceTableProps {
  invoices: Invoice[]
  onGenerateInvoice?: (amount: number, dueDate: string) => void
}
```

## Mock Data Structure

### Project
```typescript
{
  id: string
  title: string
  client: {
    name: string
    email: string
    phone: string
    address: string
  }
  status: "lead" | "sale" | "design" | "completed"
  startDate: string
  dueDate: string
  budget: number
  spent: number
  paymentStatus: "pending" | "partial" | "paid"
  progress: number
  description: string
}
```

### Comment
```typescript
{
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  mentions?: string[]
}
```

### File
```typescript
{
  id: string
  name: string
  type: "pdf" | "image" | "document"
  size: string
  uploadedBy: string
  uploadedAt: string
  version?: string
}
```

### Task
```typescript
{
  id: string
  title: string
  completed: boolean
  assignees: { name: string; avatar: string }[]
  dueDate: string
  priority: "low" | "medium" | "high"
  subtasks?: Subtask[]
}
```

### Invoice
```typescript
{
  id: string
  number: string
  date: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue"
  dueDate: string
}
```

## Integration Points

### Ready for Real Data
Replace mock data with API calls to:

1. **Supabase** - Project data, comments, tasks
```typescript
// Example
const { data: project } = await supabase
  .from('projects')
  .select('*')
  .eq('id', params.id)
  .single()
```

2. **Storage** - File uploads (Supabase Storage, AWS S3, Cloudinary)
```typescript
// Example
const { data, error } = await supabase.storage
  .from('project-files')
  .upload(`${projectId}/${file.name}`, file)
```

3. **Stripe** - Invoice generation and payment tracking
```typescript
// Example
const invoice = await stripe.invoices.create({
  customer: customerId,
  amount: amount * 100,
  due_date: dueDate,
})
```

## Usage

### Navigating to Project Detail
From the workflow, click the eye icon on any project card:

```typescript
router.push(`/projects/${project.id}`)
```

### Back Navigation
Click the back arrow in the header to return to workflow:

```typescript
router.push("/workflow")
```

## Customization

### Adding New Tabs
1. Add tab trigger in `TabsList`:
```tsx
<TabsTrigger value="timeline">Timeline</TabsTrigger>
```

2. Add tab content:
```tsx
<TabsContent value="timeline">
  <TimelineComponent />
</TabsContent>
```

### Modifying AI Insights
Update the insights in the Overview tab:
```tsx
<div className="flex items-start gap-2">
  <Icon className="w-4 h-4 text-color mt-0.5" />
  <p>Your custom insight text</p>
</div>
```

### Customizing Status Colors
Edit the color mappings:
```typescript
const statusColors = {
  lead: "bg-blue-500/10 text-blue-600",
  // Add your custom colors
}
```

## Sample Project
The page includes a fully populated sample project:
- **Title**: Kanab Custom Home
- **Client**: Sarah & Michael Thompson
- **Status**: Design
- **3 Comments** with realistic conversation
- **5 Files** with different types
- **5 Tasks** including subtasks
- **3 Invoices** with various statuses

## Testing Checklist
- [ ] Navigate from workflow to project detail
- [ ] Switch between all tabs
- [ ] Add a comment
- [ ] Toggle task completion
- [ ] Expand/collapse subtasks
- [ ] Open generate invoice modal
- [ ] View file cards
- [ ] Test responsive layout on mobile
- [ ] Verify dark mode appearance
- [ ] Check accessibility with keyboard navigation

## Future Enhancements
- [ ] Real-time collaboration (Supabase Realtime)
- [ ] File preview modal
- [ ] Task drag-and-drop reordering
- [ ] Invoice PDF generation
- [ ] Activity timeline
- [ ] Email notifications
- [ ] Team member assignment
- [ ] Project templates
- [ ] Budget tracking charts
- [ ] Gantt chart view

## Performance Considerations
- Components are modular for code splitting
- Mock data is static for fast initial render
- Images should be optimized (Next.js Image component)
- Consider pagination for large file/task lists
- Implement virtual scrolling for 100+ items

## Accessibility Features
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard shortcuts (future enhancement)
- Focus management in modals
- Color contrast meets WCAG AA standards
- Screen reader announcements for status changes
