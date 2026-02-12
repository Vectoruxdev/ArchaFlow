# ArchaFlow - Quick Start Guide

## 🚀 Your App is Live!

Visit: **http://localhost:3001**

## 📍 Navigation Flow

### 1. Login Page (`/`)
- Enter any email and password
- Click "Sign in"
- Redirects to Workflow

### 2. Workflow (`/workflow`)
- View 4 quick stat cards
- See Kanban board with 9 sample projects
- Drag projects between columns
- Click **eye icon** (👁️) on any project card to view details
- Click **+ button** (bottom-right) to create new project

### 3. Project Detail Page (`/projects/[id]`)
- **Overview Tab**: Project details, progress, payment summary, AI insights
- **Notes Tab**: Comment thread with @mentions
- **Attachments Tab**: File grid with drag-and-drop upload
- **Tasks Tab**: Task checklist with subtasks
- **Invoices Tab**: Invoice table with generation

## 🎯 Try These Features

### Workflow
1. **Drag & Drop**: Move "Modern Villa Design" from Lead to Sale
2. **Search**: Use the search bar in the header
3. **Profile Menu**: Click your avatar (top-right)
4. **Activity Feed**: View recent activity (right sidebar on desktop)
5. **New Project**: Click the floating + button

### Project Detail
1. **Navigate**: Click eye icon on "Modern Villa Design" card
2. **Switch Tabs**: Try Overview → Notes → Attachments → Tasks → Invoices
3. **Add Comment**: Scroll to bottom of Notes tab, type and post
4. **Toggle Task**: Check/uncheck tasks in Tasks tab
5. **Generate Invoice**: Click "Generate Invoice" in Invoices tab
6. **View Files**: See file grid in Attachments tab
7. **Back to Workflow**: Click back arrow (top-left)

## 📱 Responsive Testing

### Desktop (1920px+)
- Full layout with sidebars
- Kanban board in 4 columns
- Activity feed visible

### Tablet (768px - 1919px)
- Collapsible sidebar
- Kanban board in 2 columns
- Activity feed hidden

### Mobile (< 768px)
- Hamburger menu
- Kanban board stacks vertically
- Single column layout

## 🎨 Design Features

### Colors
- **Black/White**: Core palette
- **Blue**: Lead stage
- **Yellow**: Sale/Design stages
- **Green**: Completed/Paid
- **Red**: Overdue/Pending

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: 600-700 weight
- **Body**: 400-500 weight

### Dark Mode
- Enabled by default
- Toggle in browser DevTools: `document.documentElement.classList.toggle('dark')`

## 🔧 Development

### File Structure
```
app/
├── page.tsx                    # Login page
├── workflow/page.tsx          # Main workflow
└── projects/[id]/page.tsx      # Project detail

components/
├── ui/                         # shadcn/ui components
└── project/                    # Project-specific components
    ├── comment-thread.tsx
    ├── file-grid.tsx
    ├── task-list.tsx
    └── invoice-table.tsx
```

### Mock Data Locations
- **Workflow**: `app/workflow/page.tsx` (lines 42-100)
- **Project Detail**: `app/projects/[id]/page.tsx` (lines 30-200)

### Adding Real Data
Replace mock data with API calls:

```typescript
// Example: Fetch project
const { data: project } = await supabase
  .from('projects')
  .select('*')
  .eq('id', params.id)
  .single()
```

## 🐛 Troubleshooting

### Server Not Running
```bash
cd /Users/jaredzitting/Documents/Projects/ArchaFlow
npm run dev
```

### Port Already in Use
Server will automatically try port 3001 if 3000 is taken.

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Hot Reload Not Working
Save the file again or restart the server with Ctrl+C then `npm run dev`.

## 📚 Documentation

- **Main README**: `README.md`
- **Project Detail**: `PROJECT_DETAIL_README.md`
- **This Guide**: `QUICK_START.md`

## 🎯 Sample Data

### Projects
1. Modern Villa Design (Lead)
2. Office Complex Renovation (Lead)
3. Residential Tower (Sale)
4. Shopping Mall Extension (Sale)
5. Boutique Hotel (Design) ⭐ **Featured**
6. Community Center (Design)
7. Luxury Apartment (Design)
8. Industrial Warehouse (Completed)
9. Restaurant Interior (Completed)

### Featured Project: "Kanab Custom Home"
- **Client**: Sarah & Michael Thompson
- **Status**: Design (35% complete)
- **Budget**: $450,000
- **3 Comments**: Team discussion about skylight
- **5 Files**: Floor plans, renderings, specifications
- **5 Tasks**: Including subtasks for interior design
- **3 Invoices**: $225k total, $125k paid

## 🚀 Next Steps

1. ✅ Explore the workflow
2. ✅ View project details
3. ✅ Test responsive design
4. ✅ Try all interactive features
5. 🔄 Replace mock data with real API
6. 🔄 Add authentication (Supabase Auth)
7. 🔄 Integrate Stripe for payments
8. 🔄 Add file upload (Supabase Storage)
9. 🔄 Deploy to Vercel

## 💡 Tips

- **Keyboard Navigation**: Tab through interactive elements
- **Dark Mode**: Default theme, looks professional
- **Mobile First**: Test on phone for best UX
- **Data Structure**: All TypeScript interfaces are documented
- **Modular**: Each component is independent and reusable

Enjoy building with ArchaFlow! 🎉
