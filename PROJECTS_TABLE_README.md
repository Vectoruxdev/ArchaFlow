# Projects Table Page - Documentation

## Overview
The Projects Table page provides a comprehensive overview of all projects in a sortable, filterable table format with detailed information and quick actions.

## Route
```
/projects
```

## Features

### 📊 **Stats Dashboard**
Four key metric cards at the top:
1. **Total Projects**: Count of all projects (active count)
2. **Total Budget**: Sum of all project budgets
3. **Total Spent**: Sum of all spending across projects
4. **Average Progress**: Mean completion percentage

### 🔍 **Search & Filter**
- **Search Bar**: Filter by project title or client name (real-time)
- **Status Filter**: Dropdown to filter by:
  - All Projects
  - Lead
  - Sale
  - Design
  - Completed

### 📋 **Comprehensive Table**
9 columns displaying:
1. **Project**: Title + Priority badge (low/medium/high)
2. **Client**: Client name
3. **Status**: Stage badge (lead/sale/design/completed)
4. **Budget**: Total budget + amount spent
5. **Progress**: Visual progress bar + percentage
6. **Due Date**: Formatted date
7. **Team**: Stacked assignee avatars
8. **Payment**: Payment status badge (pending/partial/paid)
9. **Actions**: Dropdown menu with options

### ⚡ **Quick Actions**
Each row has a dropdown menu with:
- View Details (navigates to project detail page)
- Edit Project
- Change Status
- Assign Team
- Archive Project (red text)

### 🎯 **Interactive Features**
- **Click Row**: Navigate to project detail page
- **Export Button**: Export projects data (ready for CSV/PDF integration)
- **New Project Button**: Opens modal to create new project
- **Empty State**: Shows when no projects match search

## Design

### Color Coding

**Status Badges:**
- 🔵 Lead: Blue
- 🟡 Sale: Yellow
- 🟡 Design: Yellow
- 🟢 Completed: Green

**Payment Status:**
- 🔴 Pending: Red
- 🟡 Partial: Yellow
- 🟢 Paid: Green

**Priority:**
- Low: Gray
- Medium: Yellow
- High: Red

### Layout
- **Sticky Header**: Stays at top while scrolling
- **Responsive Table**: Horizontal scroll on mobile
- **Hover States**: Row highlights on hover
- **Dark Mode**: Full support

## Data Structure

```typescript
interface Project {
  id: string
  title: string
  client: string
  status: "lead" | "sale" | "design" | "completed"
  paymentStatus: "pending" | "partial" | "paid"
  budget: number
  spent: number
  startDate: string
  dueDate: string
  progress: number
  assignees: { name: string; avatar: string }[]
  priority: "low" | "medium" | "high"
}
```

## Navigation

### From Dashboard
Click "Projects" in the left sidebar navigation

### To Project Detail
- Click any table row
- Click "View Details" in actions dropdown
- Click eye icon on project card (from dashboard)

### Back to Dashboard
Click the back arrow in the header

## Sample Data

All 9 projects from the dashboard are displayed:
1. Modern Villa Design (Lead) - $350k
2. Office Complex Renovation (Lead) - $850k
3. Residential Tower (Sale) - $2.5M
4. Shopping Mall Extension (Sale) - $1.8M
5. Kanab Custom Home (Design) - $450k ⭐
6. Community Center (Design) - $950k
7. Luxury Apartment (Design) - $680k
8. Industrial Warehouse (Completed) - $1.2M
9. Restaurant Interior (Completed) - $280k

**Total Portfolio Value**: $9.06M

## Usage Examples

### Search for a Client
1. Type "Thompson" in search bar
2. Table filters to show "Kanab Custom Home"

### Filter by Status
1. Click "All Status" dropdown
2. Select "Design"
3. Table shows only 3 design-stage projects

### View Project Details
1. Click on "Kanab Custom Home" row
2. Navigates to `/projects/5`
3. Shows full project detail page

### Export Projects
1. Click "Export" button in header
2. Ready for CSV/PDF export integration

### Create New Project
1. Click "New Project" button
2. Fill in modal form
3. Click "Create Project"

## Integration Points

### Real Data Integration

Replace mock data with API calls:

```typescript
// Fetch all projects
const { data: projects } = await supabase
  .from('projects')
  .select(`
    *,
    client:clients(*),
    assignees:project_assignees(user:users(*))
  `)
  .order('created_at', { ascending: false })
```

### Export Functionality

```typescript
// CSV Export
const exportToCSV = () => {
  const csv = projects.map(p => ({
    Title: p.title,
    Client: p.client,
    Status: p.status,
    Budget: p.budget,
    Progress: `${p.progress}%`,
    DueDate: p.dueDate
  }))
  // Convert to CSV and download
}
```

### Pagination

For large datasets, add pagination:

```typescript
const [page, setPage] = useState(1)
const pageSize = 20
const paginatedProjects = filteredProjects.slice(
  (page - 1) * pageSize,
  page * pageSize
)
```

## Responsive Behavior

### Desktop (1024px+)
- Full table with all columns visible
- Stats in 4-column grid
- Comfortable spacing

### Tablet (768px - 1023px)
- Horizontal scroll for table
- Stats in 2-column grid
- Compact spacing

### Mobile (< 768px)
- Horizontal scroll required
- Stats stack vertically
- Consider card view alternative

## Performance Considerations

- **Virtualization**: For 100+ projects, implement virtual scrolling
- **Debounced Search**: Search input already filters in real-time
- **Lazy Loading**: Load assignee avatars on demand
- **Memoization**: Memoize filtered results for large datasets

## Accessibility

- ✅ Keyboard navigation through table
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators on all controls
- ✅ Screen reader friendly table structure
- ✅ High contrast color scheme

## Future Enhancements

- [ ] Column sorting (click headers to sort)
- [ ] Multi-select with bulk actions
- [ ] Advanced filters (date range, budget range)
- [ ] Save filter presets
- [ ] Column visibility toggle
- [ ] Drag columns to reorder
- [ ] Inline editing
- [ ] Keyboard shortcuts
- [ ] Print view
- [ ] Share filtered view (URL params)

## Testing Checklist

- [ ] Search filters correctly
- [ ] Status filter works
- [ ] Click row navigates to detail
- [ ] Actions dropdown works
- [ ] New project modal opens
- [ ] Export button present
- [ ] Stats calculate correctly
- [ ] Empty state shows when no results
- [ ] Responsive on mobile
- [ ] Dark mode looks good
- [ ] All badges display correctly
- [ ] Progress bars render properly

## Tips

1. **Quick Navigation**: Click any row to jump to project details
2. **Keyboard Friendly**: Tab through table, Enter to select
3. **Search Tips**: Search works on both project title and client name
4. **Status Overview**: Use filter to see projects at each stage
5. **Budget Tracking**: Spent amount shown under budget in each row
